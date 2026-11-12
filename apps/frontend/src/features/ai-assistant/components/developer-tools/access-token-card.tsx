
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SessionStatus = "checking" | "active" | "inactive";

export default function AccessTokenCard() {
  const [status, setStatus] = useState<SessionStatus>("checking");
  const [isCopying, setIsCopying] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      setStatus(!error && session?.access_token ? "active" : "inactive");
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session?.access_token ? "active" : "inactive");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleCopyToken = async () => {
    setIsCopying(true);
    setFeedback("");

    try {
      const supabase = createClient();

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.access_token) {
        setStatus("inactive");
        setFeedback("No active session found. Please sign in again.");
        return;
      }

      await navigator.clipboard.writeText(session.access_token);

      setStatus("active");
      setFeedback("Access token copied successfully.");
    } catch {
      setFeedback("Unable to copy token. Check clipboard permissions.");
    } finally {
      setIsCopying(false);
    }
  };

  // Never render developer tools in production.
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Developer Tools
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your local API authentication token for Swagger testing.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "active"
                  ? "bg-emerald-500"
                  : status === "inactive"
                    ? "bg-red-500"
                    : "bg-amber-500"
              }`}
            />

            <span className="text-xs text-slate-600 dark:text-slate-300">
              Session:{" "}
              {status === "active"
                ? "Active"
                : status === "inactive"
                  ? "Inactive"
                  : "Checking..."}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyToken}
          disabled={status !== "active" || isCopying}
          className="rounded-lg bg-[#0F9D91] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0c877d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCopying ? "Copying..." : "Copy Access Token"}
        </button>
      </div>

      {feedback && (
        <p
          role="status"
          className={`mt-4 text-sm ${
            feedback.includes("successfully")
              ? "text-emerald-600"
              : "text-red-500"
          }`}
        >
          {feedback}
        </p>
      )}

      <p className="mt-3 text-xs text-slate-400">
        Available only in development. Never share your access token.
      </p>
    </section>
  );
}