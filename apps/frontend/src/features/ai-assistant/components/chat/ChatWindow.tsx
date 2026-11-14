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
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const { streamMessage } = useChat();

  const handleSendMessage = async (message: string) => {
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: message,
    };

    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
      assistantMessage,
    ]);

    setIsStreaming(true);
    setStreamError(null);

    try {
      await streamMessage(
        {
          message,
          conversation_id: conversationId,
        },
        {
          onMetadata: (metadata) => {
            if (metadata.conversation_id) {
              setConversationId(metadata.conversation_id);
            }

            setMessages((previous) =>
              previous.map((item) =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      sources: metadata.sources,
                      webSources: metadata.web_sources,
                    }
                  : item,
              ),
            );
          },

          onChunk: (content) => {
            setMessages((previous) =>
              previous.map((item) =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      content: item.content + content,
                    }
                  : item,
              ),
            );
          },
        },
      );
    } catch (error) {
      setStreamError(
        error instanceof Error
          ? error.message
          : "Unable to get a response from AI Assistant.",
      );
    } finally {
      setIsStreaming(false);
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

        {isStreaming && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            AI Assistant is responding...
          </div>
        )}

        {streamError && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {streamError}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-700">
        <ChatInput
          onSend={handleSendMessage}
          isPending={isStreaming}
        />

        <p className="mt-2 text-center text-xs text-slate-400">
          AI-generated information may not always be accurate. Always verify
          important medical decisions.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;