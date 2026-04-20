import { auth } from "@/auth";
import { db } from "@/db";
import { ConversationsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const ALLOWED_ROLES = ["INVESTOR", "STARTUP"] as const;
export type AllowedRole = (typeof ALLOWED_ROLES)[number];

export type AuthedUser = {
  id: string;
  role: AllowedRole;
};

// ── Verify session + role only ───────────────────────────────────────────────
export async function requireMessagingUser(): Promise<
  | { user: AuthedUser; errorResponse?: never }
  | { user?: never; errorResponse: NextResponse }
> {
  const session = await auth();

  if (!session?.user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "Unauthorized: not logged in." },
        { status: 401 }
      ),
    };
  }

  const role = session.user.role as string;
  if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "Forbidden: investor or startup role required." },
        { status: 403 }
      ),
    };
  }

  return {
    user: { id: session.user.id as string, role: role as AllowedRole },
  };
}

// ── Verify session + role + conversation membership ──────────────────────────
// Returns 404 on both "not found" and "not your conversation" to prevent
// leaking which conversation IDs exist.
export async function requireParticipant(conversationId: string): Promise<
  | {
      user: AuthedUser;
      conversation: typeof ConversationsTable.$inferSelect;
      errorResponse?: never;
    }
  | { user?: never; conversation?: never; errorResponse: NextResponse }
> {
  const authResult = await requireMessagingUser();
  if (authResult.errorResponse) return { errorResponse: authResult.errorResponse };

  const { user } = authResult;

  const [conversation] = await db
    .select()
    .from(ConversationsTable)
    .where(eq(ConversationsTable.id, conversationId))
    .limit(1);

  if (!conversation) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "Not found." },
        { status: 404 }
      ),
    };
  }

  const isParticipant =
    conversation.investorUserId === user.id ||
    conversation.startupUserId === user.id;

  if (!isParticipant) {
    // 404 not 403 — never confirm the conversation exists to non-participants
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "Not found." },
        { status: 404 }
      ),
    };
  }

  return { user, conversation };
}