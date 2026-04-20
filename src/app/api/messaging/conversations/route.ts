

// ============================================================
// GET /api/messaging/conversations
// Returns all conversations the authenticated user participates
// in, enriched with the other party's name and last message.

import { requireMessagingUser } from "@/components/messaging/guard";
import { ConversationWithParty } from "@/components/messaging/types";
import { db } from "@/db";
import { ConversationsTable, MessagesTable, UsersTable } from "@/db/schema";
import { desc, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

// ============================================================
export async function GET() {
  const authResult = await requireMessagingUser();
  if (authResult.errorResponse) return authResult.errorResponse;

  const { user } = authResult;

  try {
    const rows = await db
      .select({ conversation: ConversationsTable })
      .from(ConversationsTable)
      .where(
        or(
          eq(ConversationsTable.investorUserId, user.id),
          eq(ConversationsTable.startupUserId, user.id)
        )
      )
      .orderBy(desc(ConversationsTable.lastMessageAt));

    const enriched: ConversationWithParty[] = await Promise.all(
      rows.map(async ({ conversation }) => {
        // Determine the other participant's user ID
        const otherUserId =
          conversation.investorUserId === user.id
            ? conversation.startupUserId
            : conversation.investorUserId;

        const [otherUser] = await db
          .select({ name: UsersTable.name })
          .from(UsersTable)
          .where(eq(UsersTable.id, otherUserId))
          .limit(1);

        // Fetch the most recent message for the preview
        const [lastMsg] = await db
          .select({
            content: MessagesTable.content,
            createdAt: MessagesTable.createdAt,
          })
          .from(MessagesTable)
          .where(eq(MessagesTable.conversationId, conversation.id))
          .orderBy(desc(MessagesTable.createdAt))
          .limit(1);

        return {
          ...conversation,
          otherPartyName: otherUser?.name ?? "Unknown",
          lastMessage: lastMsg?.content ?? null,
          lastMessageAt: lastMsg?.createdAt ?? null,
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/messaging/conversations]", err);
    return NextResponse.json(
      { success: false, message: "Failed to load conversations." },
      { status: 500 }
    );
  }
}