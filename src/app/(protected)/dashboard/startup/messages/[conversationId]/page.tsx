import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { ApiResponse, MessageWithSender } from "@/components/messaging/types";
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const cookieStore = await cookies();

  let messages: MessageWithSender[] = [];

  try {
    const res = await fetch(
      `${baseUrl}/api/messaging/conversations/${conversationId}/messages`,
      {
        headers: { cookie: cookieStore.toString() },
        cache: "no-store",
      }
    );

    if (res.status === 404) notFound();

    const data: ApiResponse<MessageWithSender[]> = await res.json();
    if (!data.success) notFound();

    messages = data.data;
  } catch {
    notFound();
  }

  return (
    <main className="flex h-screen flex-col bg-[#F9F7F2]">
      <header className="flex items-center gap-4 border-b border-[#1A362B]/10 bg-white px-4 py-4 sm:px-6">
        <Link
          href="/dashboard/startup/messages"
          className="text-sm font-semibold uppercase tracking-widest text-[#1A362B]/60 hover:text-[#1A362B]"
          aria-label="Back to messages"
        >
          ← Back
        </Link>
        <h1 className="font-serif text-lg font-medium text-[#1A362B]">
          Conversation
        </h1>
      </header>

      <ChatWindow messages={messages} currentUserId={userId} />
      <SendMessageForm conversationId={conversationId} />
    </main>
  );
}