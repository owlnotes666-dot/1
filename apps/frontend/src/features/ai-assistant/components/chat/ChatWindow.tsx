"use client";

import { useState } from "react";

import { useChat } from "../../hooks/useChat";
import type { ChatSource, WebSource } from "../../types";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  webSources?: WebSource[];
}

function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const { sendMessage, isPending, error } = useChat();

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    setMessages((previous) => [...previous, userMessage]);

    try {
      const response = await sendMessage({
        message,
        conversation_id: conversationId,
      });

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.message,
        sources: response.sources,
        webSources: response.web_sources,
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch {
      // The mutation error is displayed below.
    }
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="text-xl font-semibold text-[#172B4D] dark:text-white">
              How can I help you today?
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Ask questions about medical topics, clinical guidelines, or
              healthcare information.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              sources={message.sources}
              webSources={message.webSources}
            />
          ))
        )}

        {isPending && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            AI Assistant is thinking...
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error.message}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-700">
        <ChatInput onSend={handleSendMessage} isPending={isPending} />

        <p className="mt-2 text-center text-xs text-slate-400">
          AI-generated information may not always be accurate. Always verify
          important medical decisions.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
