import { Conversation, Message } from "@/db/schema";

// Conversation enriched with other-party name + last message preview
export type ConversationWithParty = Conversation & {
  otherPartyName: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
};

// Message enriched with sender display name
export type MessageWithSender = Message & {
  senderName: string;
};

// Standard API response envelope
export type ApiResponse<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string };