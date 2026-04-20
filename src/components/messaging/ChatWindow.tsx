import { MessageWithSender } from "./types";

type ChatWindowProps = {
  messages: MessageWithSender[];
  currentUserId: string;
};

export function ChatWindow({ messages, currentUserId }: ChatWindowProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-[#1A362B]/30">
          No messages yet. Say hello!
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-6"
      aria-label="Message thread"
      aria-live="polite"
    >
      {messages.map((msg) => {
        const isMine = msg.senderId === currentUserId;

        return (
          <div
            key={msg.id}
            className={[
              "flex flex-col gap-1",
              isMine ? "items-end" : "items-start",
            ].join(" ")}
          >
            {/* Sender name — shown only for the other party */}
            {!isMine && (
              <span className="px-1 text-xs font-semibold uppercase tracking-wider text-[#1A362B]/50">
                {msg.senderName}
              </span>
            )}

            {/* Bubble */}
            <div
              className={[
                "max-w-xs rounded px-4 py-2.5 text-sm leading-relaxed sm:max-w-md",
                isMine
                  ? "bg-[#1A362B] text-[#F9F7F2]"
                  : "bg-[#EFEBE3] text-[#2D2D2D]",
              ].join(" ")}
            >
              {msg.content}
            </div>

            {/* Timestamp */}
            <span className="px-1 text-xs text-[#1A362B]/30">
              {new Date(msg.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}