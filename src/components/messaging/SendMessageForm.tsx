"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface SendMessageFormProps {
  conversationId: string;
}

export function SendMessageForm({ conversationId }: SendMessageFormProps) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || isPending) return;

    setError(null);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/messaging/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: trimmed }),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message ?? "Failed to send message.");
          setValue(trimmed); // restore draft on failure
          return;
        }
        router.refresh(); // re-fetch server components (ChatWindow)
      } catch {
        setError("Network error. Please try again.");
        setValue(trimmed);
      }
    });
  }

  return (
    <div className="flex-shrink-0 border-t border-[#1A362B]/[0.08] bg-white">
      {error && (
        <div
          role="alert"
          className="mx-5 mt-3 border-l-2 border-red-400 bg-red-50 px-4 py-2 text-xs font-medium text-red-600"
        >
          {error}
        </div>
      )}

      <div className="flex items-end gap-3 px-5 py-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          disabled={isPending}
          aria-label="Message input"
          className="
            flex-1 resize-none bg-transparent
            border-0 border-b border-[#1A362B]/[0.18]
            pb-2 pt-1 text-sm text-[#2D2D2D]
            placeholder:text-[#1A362B]/25
            focus:outline-none focus:border-[#1A362B]
            transition-colors leading-relaxed overflow-hidden
            disabled:opacity-50
          "
          style={{ minHeight: 36, maxHeight: 120, fontFamily: "'Satoshi', sans-serif" }}
        />

        <button
          onClick={submit}
          disabled={!value.trim() || isPending}
          aria-label="Send message"
          className="
            flex-shrink-0 px-5 py-2.5
            bg-[#1A362B] text-[#F9F7F2]
            text-[11px] font-bold uppercase tracking-widest
            transition-opacity duration-200
            hover:opacity-85 active:opacity-70
            disabled:opacity-30 disabled:cursor-not-allowed
          "
        >
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" opacity="0.4" />
                <path d="M6 1a5 5 0 015 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Sending
            </span>
          ) : (
            "Send"
          )}
        </button>
      </div>
    </div>
  );
}