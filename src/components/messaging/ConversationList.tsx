"use client";

import Link from "next/link";
import { ConversationWithParty } from "./types";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  conversations: ConversationWithParty[];
  role: "investor" | "startup";
  currentUserId: string;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

export function ConversationList({
  conversations,
  role,
}: ConversationListProps) {
  const basePath = `/dashboard/${role}/messages`;

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
        <div className="w-12 h-12 border border-[#1A362B]/10 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="opacity-30"
          >
            <path
              d="M18 10c0 4.418-3.582 8-8 8a7.96 7.96 0 01-4.343-1.283L2 18l1.283-3.657A7.96 7.96 0 012 10C2 5.582 5.582 2 10 2s8 3.582 8 8z"
              stroke="#1A362B"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p
          className="text-lg font-medium text-[#1A362B]/50"
          style={{ fontFamily: "'Gambetta', serif" }}
        >
          No conversations yet
        </p>
        <p className="text-sm text-[#2D2D2D]/40 max-w-xs">
          Conversations appear here once your EOI is accepted.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[#1A362B]/[0.05]" role="list">
      {conversations.map((convo) => (
        <li key={convo.id}>
          <Link
            href={`${basePath}/${convo.id}`}
            className="flex items-start gap-3 px-5 py-4 hover:bg-[#1A362B]/[0.03] transition-colors duration-150 group"
          >
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full bg-[#EFEBE3] border border-[#1A362B]/10 flex items-center justify-center text-[10px] font-bold text-[#1A362B] flex-shrink-0 mt-0.5"
              aria-hidden="true"
            >
              {convo.otherPartyInitials}
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-sm font-semibold text-[#1A362B] truncate">
                  {convo.otherPartyName}
                </span>
                {convo.lastMessageAt && (
                  <span className="text-[10px] font-semibold text-[#1A362B]/30 flex-shrink-0 uppercase tracking-wide">
                    {timeAgo(convo.lastMessageAt)}
                  </span>
                )}
              </div>
              {convo.lastMessagePreview && (
                <p className="text-xs text-[#2D2D2D]/45 truncate leading-relaxed">
                  {convo.lastMessagePreview}
                </p>
              )}
            </div>

            {/* Unread dot */}
            {convo.hasUnread && (
              <div
                className="w-2 h-2 rounded-full bg-[#1A362B] flex-shrink-0 mt-2"
                aria-label="Unread messages"
              />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}