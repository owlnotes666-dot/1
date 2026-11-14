"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isPending?: boolean;
}

function ChatInput({ onSend, isPending = false }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isPending) return;

    onSend(trimmedMessage);
    setMessage("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask your medical assistant..."
        rows={1}
        maxLength={8000}
        disabled={isPending}
        className="max-h-36 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-[#1E293B] outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
      />

      <button
        type="submit"
        disabled={!message.trim() || isPending}
        className="rounded-xl bg-[#0F9D91] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0c8178] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

export default ChatInput;
