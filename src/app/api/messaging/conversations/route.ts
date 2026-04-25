import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  ConversationsTable,
  MessagesTable,
  UsersTable,
} from "@/db/schema";
import { eq, desc, and, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

function toInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const role = session.user.role; // "INVESTOR" | "STARTUP"

  // Alias UsersTable so we can join it twice (once per participant)
  const InvestorUser = alias(UsersTable, "investor_user");
  const StartupUser = alias(UsersTable, "startup_user");

  // Subquery A: last message content per conversation
  // Uses DISTINCT ON (conversation_id) ordered by created_at DESC —
  // the most efficient single-pass approach in Postgres.
  const lastMessageSq = db
    .selectDistinctOn([MessagesTable.conversationId], {
      conversationId: MessagesTable.conversationId,
      content: MessagesTable.content,
    })
    .from(MessagesTable)
    .orderBy(MessagesTable.conversationId, desc(MessagesTable.createdAt))
    .as("last_msg");

  // Subquery B: unread count per conversation for the current user.
  // "Unread" = message sent by the OTHER party that hasn't been read yet.
  const unreadSq = db
    .select({
      conversationId: MessagesTable.conversationId,
      unreadCount: sql<number>`cast(count(*) as int)`.as("unread_count"),
    })
    .from(MessagesTable)
    .where(
      and(
        eq(MessagesTable.isRead, false),
        ne(MessagesTable.senderId, userId)
      )
    )
    .groupBy(MessagesTable.conversationId)
    .as("unread_cnt");

  const rows = await db
    .select({
      id: ConversationsTable.id,
      lastMessageAt: ConversationsTable.lastMessageAt,
      investorName: InvestorUser.name,
      startupName: StartupUser.name,
      lastMessagePreview: lastMessageSq.content,
      unreadCount: unreadSq.unreadCount,
    })
    .from(ConversationsTable)
    .innerJoin(
      InvestorUser,
      eq(ConversationsTable.investorUserId, InvestorUser.id)
    )
    .innerJoin(
      StartupUser,
      eq(ConversationsTable.startupUserId, StartupUser.id)
    )
    .leftJoin(
      lastMessageSq,
      eq(ConversationsTable.id, lastMessageSq.conversationId)
    )
    .leftJoin(
      unreadSq,
      eq(ConversationsTable.id, unreadSq.conversationId)
    )
    .where(
      role === "INVESTOR"
        ? eq(ConversationsTable.investorUserId, userId)
        : eq(ConversationsTable.startupUserId, userId)
    )
    .orderBy(desc(ConversationsTable.lastMessageAt));

  const conversations = rows.map((row) => {
    const otherPartyName =
      role === "INVESTOR" ? row.startupName : row.investorName;

    return {
      id: row.id,
      lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
      otherPartyName,
      otherPartyInitials: toInitials(otherPartyName),
      // Truncate preview so the response stays lean
      lastMessagePreview: row.lastMessagePreview
        ? row.lastMessagePreview.slice(0, 80)
        : null,
      hasUnread: (row.unreadCount ?? 0) > 0,
    };
  });

  return NextResponse.json({ success: true, data: conversations });
}