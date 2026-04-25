import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  ConversationsTable,
  MessagesTable,
  UsersTable,
} from "@/db/schema";
import { eq, asc, and, or } from "drizzle-orm";

type Params = { params: Promise<{ conversationId: string }> };

// ─── helpers ────────────────────────────────────────────────────────────────

function toInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Verify the caller is a participant; returns the conversation row or null. */
async function getConversationForUser(conversationId: string, userId: string) {
  const [conversation] = await db
    .select()
    .from(ConversationsTable)
    .where(
      and(
        eq(ConversationsTable.id, conversationId),
        or(
          eq(ConversationsTable.investorUserId, userId),
          eq(ConversationsTable.startupUserId, userId)
        )
      )
    )
    .limit(1);

  return conversation ?? null;
}

// ─── GET — fetch messages ────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { conversationId } = await params;

  // Security: caller must be a participant
  const conversation = await getConversationForUser(conversationId, session.user.id);
  if (!conversation) {
    return NextResponse.json(
      { success: false, message: "Not found" },
      { status: 404 }
    );
  }

  // Fetch messages with sender name for display
  const rows = await db
    .select({
      id: MessagesTable.id,
      conversationId: MessagesTable.conversationId,
      senderId: MessagesTable.senderId,
      content: MessagesTable.content,
      createdAt: MessagesTable.createdAt,
      senderName: UsersTable.name,
    })
    .from(MessagesTable)
    .innerJoin(UsersTable, eq(MessagesTable.senderId, UsersTable.id))
    .where(eq(MessagesTable.conversationId, conversationId))
    .orderBy(asc(MessagesTable.createdAt));

  const messages = rows.map((row) => ({
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    senderName: row.senderName,
    senderInitials: toInitials(row.senderName),
  }));

  return NextResponse.json({ success: true, data: messages });
}

// ─── POST — send a message ───────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { conversationId } = await params;

  let content: string;
  try {
    const body = await req.json();
    content = (body.content ?? "").trim();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!content) {
    return NextResponse.json(
      { success: false, message: "Message cannot be empty" },
      { status: 400 }
    );
  }
  if (content.length > 2000) {
    return NextResponse.json(
      { success: false, message: "Message too long (max 2000 chars)" },
      { status: 400 }
    );
  }

  // Security: caller must be a participant
  const conversation = await getConversationForUser(conversationId, session.user.id);
  if (!conversation) {
    return NextResponse.json(
      { success: false, message: "Not found" },
      { status: 404 }
    );
  }

  const [newMessage] = await db
    .insert(MessagesTable)
    .values({
      conversationId,
      senderId: session.user.id,
      content,
    })
    .returning();

  await db
    .update(ConversationsTable)
    .set({ lastMessageAt: new Date() })
    .where(eq(ConversationsTable.id, conversationId));

  return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
}