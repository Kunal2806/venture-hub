"use client";

import { useRef, useState } from "react";
import { ApiResponse } from "./types";

type SendMessageFormProps = {
  conversationId: string;
};

export function SendMessageForm({ conversationId }: SendMessageFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmed = content.trim();
    if (!trimmed) {
      setError("Message cannot be empty.");
      return;
    }
    if (trimmed.length > 5000) {
      setError("Message is too long (max 5000 characters).");
      return;
    }

    setIsPending(true);

    try {
      const res = await fetch(
        `/api/messaging/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        }
      );

      const data: ApiResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message ?? "Failed to send. Please try again.");
        return;
      }

      setContent("");
      textareaRef.current?.focus();

      // Re-fetch the server component to show the new message
      window.location.reload();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsPending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl/Cmd + Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-[#1A362B]/10 bg-white p-4 sm:p-6"
      aria-label="Send a message"
    >
      {error && (
        <p role="alert" className="mb-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Ctrl+Enter to send)"
          rows={2}
          maxLength={5000}
          disabled={isPending}
          aria-label="Message content"
          className={[
            "flex-1 resize-none border-b bg-transparent py-2 text-sm text-[#2D2D2D]",
            "placeholder:text-[#1A362B]/30 transition-colors duration-200",
            "focus:border-[#1A362B] focus:outline-none",
            "disabled:opacity-50 border-[#1A362B]/20",
          ].join(" ")}
        />

        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className={[
            "shrink-0 bg-[#1A362B] px-5 py-2.5 text-sm font-semibold uppercase",
            "tracking-widest text-[#F9F7F2] transition-opacity duration-200",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            "focus-visible:outline-[#1A362B]",
          ].join(" ")}
        >
          {isPending ? (
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#F9F7F2] border-t-transparent"
              aria-hidden="true"
            />
          ) : (
            "Send"
          )}
        </button>
      </div>

      <p className="mt-1 text-right text-xs text-[#1A362B]/30">
        {content.length} / 5000
      </p>
    </form>
  );
}