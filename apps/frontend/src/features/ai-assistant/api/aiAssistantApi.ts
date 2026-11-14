import { createClient } from "@/lib/supabase/client";
import type { ChatRequest, ChatResponse } from "../types";

type ChatStreamMetadata = Omit<ChatResponse, "message">;

interface ChatStreamCallbacks {
  onMetadata: (metadata: ChatStreamMetadata) => void;
  onChunk: (content: string) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const supabase = createClient();

export const aiAssistantApi = {
  async sendMessage(payload: ChatRequest): Promise<ChatResponse> {
    if (!API_BASE_URL) {
      throw new Error("Backend API URL is not configured.");
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/ai-assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      throw new Error(
        errorData?.detail || "Unable to get a response from AI Assistant.",
      );
    }

    return response.json() as Promise<ChatResponse>;
  },

  async streamMessage(
    payload: ChatRequest,
    callbacks: ChatStreamCallbacks,
  ): Promise<void> {
    if (!API_BASE_URL) {
      throw new Error("Backend API URL is not configured.");
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/ai-assistant/chat/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || "Unable to get a response from AI Assistant.",
      );
    }

    if (!response.body) {
      throw new Error("Streaming response is not available.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const processEvent = (rawEvent: string) => {
      const lines = rawEvent.split(/\r?\n/);
      let eventType = "";
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (!eventType || dataLines.length === 0) return;

      const data = JSON.parse(dataLines.join("\n"));

      if (eventType === "metadata") {
        callbacks.onMetadata(data as ChatStreamMetadata);
      } else if (eventType === "chunk") {
        callbacks.onChunk(data.content);
      } else if (eventType === "error") {
        throw new Error(data.message || "AI Assistant request failed.");
      }
    };

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";

      for (const event of events) {
        processEvent(event);
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      processEvent(buffer);
    }
  },
};
