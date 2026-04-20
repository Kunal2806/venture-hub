import { requireParticipant } from "@/components/messaging/guard";
import { MessageWithSender } from "@/components/messaging/types";
import { db } from "@/db";
import { ConversationsTable, MessagesTable, UsersTable } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

// ============================================================
// GET /api/messaging/conversations/[conversationId]/messages
// Returns all messages for the conversation.
// User must be a participant — validated on every request.
// ============================================================
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { conversationId } = await params;

  const authResult = await requireParticipant(conversationId);
  if (authResult.errorResponse) return authResult.errorResponse;

  try {
    const rows = await db
      .select({
        message: MessagesTable,
        senderName: UsersTable.name,
      })
      .from(MessagesTable)
      .innerJoin(UsersTable, eq(UsersTable.id, MessagesTable.senderId))
      .where(eq(MessagesTable.conversationId, conversationId))
      .orderBy(asc(MessagesTable.createdAt));

    const messages: MessageWithSender[] = rows.map(({ message, senderName }) => ({
      ...message,
      senderName,
    }));

    return NextResponse.json({ success: true, data: messages }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/messaging/conversations/[id]/messages]", err);
    return NextResponse.json(
      { success: false, message: "Failed to load messages." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/messaging/conversations/[conversationId]/messages
// Body: { content: string }
// Validates access, inserts message, updates lastMessageAt.
// ============================================================
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { conversationId } = await params;

  // Access re-validated on every POST — never trust the client
  const authResult = await requireParticipant(conversationId);
  if (authResult.errorResponse) return authResult.errorResponse;

  const { user } = authResult;

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { success: false, message: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const raw = body as Record<string, unknown>;
  const content =
    typeof raw.content === "string" ? raw.content.trim() : "";

  // Validation
  if (!content) {
    return NextResponse.json(
      { success: false, message: "Message cannot be empty." },
      { status: 422 }
    );
  }

  if (content.length > 5000) {
    return NextResponse.json(
      { success: false, message: "Message is too long (max 5000 characters)." },
      { status: 422 }
    );
  }

  // Insert message + update lastMessageAt atomically
  try {
    const [inserted] = await db.transaction(async (tx) => {
      const [msg] = await tx
        .insert(MessagesTable)
        .values({
          conversationId,
          senderId: user.id,
          content,
        })
        .returning();

      await tx
        .update(ConversationsTable)
        .set({ lastMessageAt: new Date() })
        .where(eq(ConversationsTable.id, conversationId));

      return [msg];
    });

    return NextResponse.json(
      { success: true, message: "Message sent.", data: inserted },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/messaging/conversations/[id]/messages]", err);
    return NextResponse.json(
      { success: false, message: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}