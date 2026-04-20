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
        <header className="border-b border-[#1A362B]/10 px-4 py-8 sm:px-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#1A362B]/40">
            Investor Dashboard
          </p>
          <h1 className="font-serif text-3xl font-medium text-[#1A362B]">
            Messages
          </h1>
          <p className="mt-1 text-sm text-[#2D2D2D]/50">
            Conversations with startups where your EOI was accepted.
          </p>
        </header>

        {errorMsg && (
          <div
            role="alert"
            className="m-4 border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMsg}
          </div>
        )}

        <ConversationList
          conversations={conversations}
          role="investor"
          currentUserId={userId}
        />
      </div>
    </main>
  );
}