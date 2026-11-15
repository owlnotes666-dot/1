"use client";

import { useEffect, useState } from "react";
import type { ChatSource, WebSource } from "../../types";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  webSources?: WebSource[];
  animate?: boolean;
}

function ChatMessage({
  role,
  content,
  sources = [],
  webSources = [],
  animate = false,
}: ChatMessageProps) {
  const isUser = role === "user";

  const [animation, setAnimation] = useState({
    content: "",
    displayed: "",
    complete: false,
  });

  useEffect(() => {
    if (!animate || !content) {
      queueMicrotask(() => {
        setAnimation({
          content,
          displayed: content,
          complete: true,
        });
      });
      return;
    }

    const words = content.match(/\S+\s*/g) ?? [content];
    let currentIndex = 0;

    queueMicrotask(() => {
      setAnimation({
        content,
        displayed: "",
        complete: false,
      });
    });

    const interval = window.setInterval(() => {
      currentIndex += 1;

      const displayed = words.slice(0, currentIndex).join("");
      const complete = currentIndex >= words.length;

      setAnimation({
        content,
        displayed,
        complete,
      });

      if (complete) {
        window.clearInterval(interval);
      }
    }, 25);

    return () => window.clearInterval(interval);
  }, [content, animate]);

  const isAnimationComplete =
    !animate || (animation.content === content && animation.complete);

  const displayedContent = animate
    ? animation.content === content
      ? animation.displayed
      : ""
    : content;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] space-y-3 rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#0F9D91] text-white"
            : "border border-slate-200 bg-white text-[#1E293B] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-7">
          {displayedContent}
        </p>

        {!isUser && isAnimationComplete && sources.length > 0 && (
          <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
            <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Knowledge Base Sources
            </p>

            <ul className="space-y-1">
              {sources.map((source) => (
                <li
                  key={`${source.article_id}-${source.chunk_index}`}
                  className="text-xs text-slate-600 dark:text-slate-300"
                >
                  {source.article_title}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isUser && isAnimationComplete && webSources.length > 0 && (
          <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
            <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Web Sources
            </p>

            <ul className="space-y-2">
              {webSources.map((source, index) => (
                <li key={`${source.url}-${index}`}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0F9D91] underline underline-offset-2 hover:text-[#0c8178]"
                  >
                    {source.title || source.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
