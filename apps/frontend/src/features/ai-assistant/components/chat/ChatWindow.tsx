"use client";

import { useState } from "react";
import { MessageSquarePlus, AlertCircle, Loader2 } from "lucide-react";

import { useChat } from "../../hooks/useChat";
import { useUploadFile } from "../../hooks/useUploadFile";
import {
  useConversations,
  useDeleteConversation,
} from "../../hooks/useConversations";
import { useIsAdmin } from "@/features/auth/hooks/useIsAdmin";
import { aiAssistantApi } from "../../api/aiAssistantApi";

import type { ChatSource, WebSource } from "../../types";

import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ConversationHistory from "./ConversationHistory";

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
  const [requestError, setRequestError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const { data: isAdmin = false } = useIsAdmin();

  const { sendMessage, isPending } = useChat();
  const { uploadFile, isUploading, resetUpload } = useUploadFile();

  const {
    conversations,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useConversations(isAdmin);

  const { deleteConversation, isDeleting } = useDeleteConversation();

  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const getOrCreateConversationId = () => {
    if (conversationId) return conversationId;

    const newConversationId = crypto.randomUUID();
    setConversationId(newConversationId);

    return newConversationId;
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setRequestError(null);
    setUploadError(null);
    setUploadedFiles([]);
    resetUpload();
  };

  const handleSelectConversation = async (id: string) => {
    if (id === conversationId || isLoadingConversation) return;

    setIsLoadingConversation(true);
    setRequestError(null);
    setUploadError(null);
    setUploadedFiles([]);
    setMessages([]);
    setConversationId(id);
    resetUpload();

    try {
      const history = await aiAssistantApi.getConversation(id);

      setMessages(
        history.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          sources: message.sources ?? [],
          webSources: message.web_sources ?? [],
        })),
      );
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to retrieve conversation.",
      );
      setConversationId(null);
    } finally {
      setIsLoadingConversation(false);
    }
  };
  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);

      if (id === conversationId) {
        handleNewConversation();
      }
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to delete conversation.",
      );
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    setUploadError(null);

    if (uploadedFiles.length + files.length > 5) {
      setUploadError("You can upload a maximum of 5 files per conversation.");
      return;
    }

    const currentConversationId = getOrCreateConversationId();
    const successfulUploads: string[] = [];

    for (const file of files) {
      try {
        const response = await uploadFile({
          conversationId: currentConversationId,
          file,
        });

        successfulUploads.push(response.filename);
      } catch (error) {
        setUploadError(
          error instanceof Error
            ? error.message
            : `Unable to upload ${file.name}.`,
        );
        break;
      }
    }

    if (successfulUploads.length > 0) {
      setUploadedFiles((previous) => [...previous, ...successfulUploads]);
    }
  };

  const handleSendMessage = async (message: string) => {
    setRequestError(null);

    const currentConversationId = getOrCreateConversationId();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    const history = messages.slice(-20).map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((previous) => [...previous, userMessage]);

    try {
      const response = await sendMessage({
        message,
        conversation_id: currentConversationId,
        history,
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

      if (isAdmin) {
        await refetchConversations();
      }
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to get a response from AI Assistant.",
      );
    }
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[520px] flex-col gap-4 lg:flex-row">
      {/* Admin conversation history */}
      {isAdmin && (
        <div className="h-56 shrink-0 lg:h-full lg:w-72">
          <ConversationHistory
            conversations={conversations}
            activeConversationId={conversationId}
            isLoading={isLoadingConversations}
            isDeleting={isDeleting}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
          />
        </div>
      )}

      {/* Chat panel */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900">
        {/* Messages area */}
        <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
          {isLoadingConversation ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
                <MessageSquarePlus className="h-8 w-8" strokeWidth={1.5} />
              </div>

              <h2 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100 sm:text-xl">
                How can I help you today?
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
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
                animate={message.role === "assistant"}
              />
            ))
          )}

          {isPending && (
            <div className="flex items-center gap-2.5 px-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
              </span>
              AI Assistant is thinking...
            </div>
          )}

          {requestError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{requestError}</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200/80 bg-slate-50/50 px-3 py-3 dark:border-slate-700/80 dark:bg-slate-900/80 sm:px-4 sm:py-4">
          <ChatInput
            onSend={handleSendMessage}
            onFilesSelected={handleFilesSelected}
            isPending={isPending || isLoadingConversation}
            isAdmin={isAdmin}
            isUploading={isUploading}
            uploadedFiles={uploadedFiles}
          />

          <p className="mt-2.5 text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500 sm:text-xs">
            AI-generated information may not always be accurate. Always verify
            important medical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
