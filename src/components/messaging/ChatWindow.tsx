"use client";

import { useEffect, useRef } from "react";
import { MessageWithSender } from "./types";
import { format, isToday, isYesterday } from "date-fns";

interface ChatWindowProps {
  messages: MessageWithSender[];
  currentUserId: string;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

function formatTime(dateStr: string): string {
  return format(new Date(dateStr), "h:mm a");
}

function groupMessagesByDate(messages: MessageWithSender[]) {
  const groups: { label: string; messages: MessageWithSender[] }[] = [];

  for (const msg of messages) {
    const label = formatDateLabel(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.messages.push(msg);
    } else {
      groups.push({ label, messages: [msg] });
    }
  }
  return groups;
}

export function ChatWindow({ messages, currentUserId }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const groups = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <div
          className="text-base font-medium text-[#1A362B]/40"
          style={{ fontFamily: "'Gambetta', serif" }}
        >
          No messages yet
        </div>
        <p className="text-xs text-[#2D2D2D]/35">
          Send the first message to get the conversation started.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 custom-scrollbar"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-3">
          {/* Date divider */}
          <div className="flex items-center gap-3 my-1" role="separator">
            <div className="flex-1 h-px bg-[#1A362B]/[0.07]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A362B]/25 flex-shrink-0">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-[#1A362B]/[0.07]" />
          </div>

          {/* Messages */}
          {group.messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`flex items-end gap-2.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 border ${
                      isMine
                        ? "bg-[#1A362B] text-[#F9F7F2] border-[#1A362B]"
                        : "bg-[#EFEBE3] text-[#1A362B] border-[#1A362B]/10"
                    }`}
                    aria-hidden="true"
                  >
                    {msg.senderInitials}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed max-w-[min(340px,72%)] border ${
                      isMine
                        ? "bg-[#1A362B] text-[#F9F7F2] border-[#1A362B] rounded-xl rounded-br-sm"
                        : "bg-white text-[#2D2D2D] border-[#1A362B]/[0.09] rounded-xl rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Timestamp */}
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide text-[#1A362B]/25 ${
                    isMine ? "pr-10" : "pl-10"
                  }`}
                >
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      ))}

      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}