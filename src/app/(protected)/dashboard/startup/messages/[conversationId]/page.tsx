import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import {
  ApiResponse,
  ConversationWithParty,
  MessageWithSender,
} from "@/components/messaging/types";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { SendMessageForm } from "@/components/messaging/SendMessageForm";

export const metadata = { title: "Chat | Startup Dashboard" };

type PageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function StartupChatPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "STARTUP") redirect("/dashboard");

  const userId = session.user.id as string;
  const { conversationId } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cookieStore = await cookies();

  let messages: MessageWithSender[] = [];
  let conversationMeta: ConversationWithParty | null = null;

  try {
    // Fetch conversation list to resolve the other party's name for the header
    const convRes = await fetch(`${baseUrl}/api/messaging/conversations`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
    const convData: ApiResponse<ConversationWithParty[]> = await convRes.json();
    if (convData.success) {
      conversationMeta =
        convData.data.find((c) => c.id === conversationId) ?? null;
    }

    // Fetch messages for this conversation
    const msgRes = await fetch(
      `${baseUrl}/api/messaging/conversations/${conversationId}/messages`,
      {
        headers: { cookie: cookieStore.toString() },
        cache: "no-store",
      }
    );

    if (msgRes.status === 404) notFound();

    const msgData: ApiResponse<MessageWithSender[]> = await msgRes.json();
    if (!msgData.success) notFound();

    messages = msgData.data;
  } catch (e) {
    console.error("[StartupChatPage] error:", e);
    notFound();
  }

  const otherPartyName = conversationMeta?.otherPartyName ?? "Conversation";
  const otherPartyInitials = conversationMeta?.otherPartyInitials ?? "—";

  return (
    <main className="flex h-screen flex-col bg-[#F9F7F2]">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-[#1A362B]/[0.08] bg-white px-5 py-4 sm:px-7 flex-shrink-0">
        <Link
          href="/dashboard/startup/messages"
          className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1A362B]/40 hover:text-[#1A362B] transition-colors"
          aria-label="Back to messages"
        >
          ← Back
        </Link>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full bg-[#EFEBE3] border border-[#1A362B]/10 flex items-center justify-center text-[10px] font-bold text-[#1A362B] flex-shrink-0"
          aria-hidden="true"
        >
          {otherPartyInitials}
        </div>

        {/* Name & status */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-base font-medium text-[#1A362B] truncate"
            style={{ fontFamily: "'Gambetta', serif" }}
          >
            {otherPartyName}
          </h1>
          <p className="text-[11px] text-[#1A362B]/35 font-medium">
            EOI accepted · Active conversation
          </p>
        </div>

        {/* EOI badge */}
        <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-[0.1em] text-[#1A362B] border border-[#1A362B]/15 bg-[#1A362B]/[0.04] px-3 py-1.5 flex-shrink-0">
          EOI Accepted
        </span>
      </header>

      {/* Messages */}
      <ChatWindow messages={messages} currentUserId={userId} />

      {/* Input */}
      <SendMessageForm conversationId={conversationId} />
    </main>
  );
}