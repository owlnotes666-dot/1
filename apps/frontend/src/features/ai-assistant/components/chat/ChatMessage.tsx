import type { ChatSource, WebSource } from "../../types";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  webSources?: WebSource[];
}

function ChatMessage({
  role,
  content,
  sources = [],
  webSources = [],
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] space-y-3 rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#0F9D91] text-white"
            : "border border-slate-200 bg-white text-[#1E293B] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-7">{content}</p>

        {!isUser && sources.length > 0 && (
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

        {!isUser && webSources.length > 0 && (
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
