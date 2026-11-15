"use client";

import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onFilesSelected: (files: File[]) => void;
  isPending?: boolean;
  isAdmin?: boolean;
  isUploading?: boolean;
  uploadedFiles?: string[];
}

const ACCEPTED_FILES = ".pdf,.docx,.txt,.md,.csv,.json,.xlsx,.pptx";

function ChatInput({
  onSend,
  onFilesSelected,
  isPending = false,
  isAdmin = false,
  isUploading = false,
  uploadedFiles = [],
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isPending || isUploading) return;

    onSend(trimmedMessage);
    setMessage("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      onFilesSelected(files);
    }

    event.target.value = "";
  };

  return (
    <div className="space-y-3">
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploadedFiles.map((filename, index) => (
            <span
              key={`${filename}-${index}`}
              className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs text-teal-800 dark:bg-teal-950/40 dark:text-teal-300"
            >
              📎 {filename}
            </span>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        {isAdmin && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILES}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending || isUploading}
              title="Attach files"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-lg text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              📎
            </button>
          </>
        )}

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your medical assistant..."
          rows={1}
          maxLength={8000}
          disabled={isPending || isUploading}
          className="max-h-36 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-[#1E293B] outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
        />

        <button
          type="submit"
          disabled={!message.trim() || isPending || isUploading}
          className="rounded-xl bg-[#0F9D91] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0c8178] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Sending..." : isUploading ? "Uploading..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default ChatInput;
