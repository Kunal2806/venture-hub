import Link from "next/link";
import { ConversationWithParty } from "./types";

type ConversationListProps = {
  conversations: ConversationWithParty[];
  role: "investor" | "startup";
  currentUserId: string;
};

export function ConversationList({ conversations, role }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-[#1A362B]/30">
          No conversations yet
        </p>
        <p className="mt-2 text-sm text-[#2D2D2D]/50">
          Conversations open once an EOI is accepted.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[#1A362B]/10" role="list">
      {conversations.map((conv) => (
        <li key={conv.id}>
          <Link
            href={`/dashboard/${role}/messages/${conv.id}`}
            className="flex flex-col gap-1 px-4 py-4 transition-colors duration-150 hover:bg-[#EFEBE3] sm:px-6"
          >
            {/* Other party name */}
            <span className="text-sm font-semibold text-[#1A362B]">
              {conv.otherPartyName}
            </span>

            {/* Last message preview */}
            <span className="truncate text-sm text-[#2D2D2D]/60">
              {conv.lastMessage ?? (
                <span className="italic">No messages yet</span>
              )}
            </span>

            {/* Timestamp */}
            {conv.lastMessageAt && (
              <span className="text-xs text-[#1A362B]/40">
                {new Date(conv.lastMessageAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}