export interface User {
  id: string;
  firstName: string;
  lastName: string;
  pseudo: string;
  email: string;
  birthDate?: string;
  publicKey: string;
  encryptedPrivateKey?: string;
  pinEncryptedPrivateKey?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  pseudo: string;
  publicKey: string;
  lastSeenAt?: string;
}

export interface ConversationListItem {
  id: string;
  otherParticipant: Participant;
  lastMessageAt: string | null;
  createdAt: string;
  unreadCount: number;
}

export interface Conversation {
  id: string;
  participants: Participant[];
  lastMessageAt: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderPseudo: string;
  ciphertext: string;
  encryptedKey: string;
  encryptedKeyForSender: string;
  iv: string;
  sentAt: string;
  readAt: string | null;
  
  // Frontend specific fields (not from API)
  decryptedContent?: string;
}

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

declare global {
  interface Window {
    ENV: {
      API_URL: string;
      SIGNALR_URL: string;
    };
  }
}

