export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string };

export interface ConversationWithParty {
  id: string;
  lastMessageAt: string | null;
  otherPartyName: string;   // startup name (for investor view) or investor name (for startup view)
  otherPartyInitials: string;
  lastMessagePreview: string | null;
  hasUnread: boolean;
}

export interface MessageWithSender {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  senderName: string;
  senderInitials: string;
}