import { createClient } from "@/lib/supabase/client";
import type { ChatRequest, ChatResponse } from "../types";

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
};
