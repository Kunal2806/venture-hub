import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { ApiResponse, ConversationWithParty } from "@/components/messaging/types";
import { ConversationList } from "@/components/messaging/ConversationList";

export const metadata = { title: "Messages | Investor Dashboard" };

export default async function InvestorMessagesPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "INVESTOR") redirect("/dashboard");

  const userId = session.user.id as string;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cookieStore = await cookies();

  let conversations: ConversationWithParty[] = [];
  let errorMsg: string | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/messaging/conversations`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });

    const data: ApiResponse<ConversationWithParty[]> = await res.json();

    if (data.success) {
      conversations = data.data;
    } else {
      errorMsg = data.message;
    }
  } catch {
    errorMsg = "Failed to load conversations.";
  }

  return (
    <main className="min-h-screen bg-[#F9F7F2]">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="border-b border-[#1A362B]/[0.08] px-5 py-9 sm:px-7">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A362B]/35">
            Investor Dashboard
          </p>
          <h1
            className="text-3xl font-medium text-[#1A362B]"
            style={{ fontFamily: "'Gambetta', serif" }}
          >
            Messages
          </h1>
          <p className="mt-1.5 text-sm text-[#2D2D2D]/45 leading-relaxed">
            Conversations with startups where your EOI was accepted.
          </p>
        </header>

        {/* Error */}
        {errorMsg && (
          <div
            role="alert"
            className="mx-5 mt-4 border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMsg}
          </div>
        )}

        {/* List */}
        <ConversationList
          conversations={conversations}
          role="investor"
          currentUserId={userId}
        />
      </div>
    </main>
  );
}