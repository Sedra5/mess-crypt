import { api } from "@/lib/api";
import { ConversationListItem, Conversation, Message, Result } from "@/lib/types";
import { AxiosError } from "axios";

interface ApiErrorResponse {
  error?: string;
  errors?: Record<string, string[]>;
}

class ChatService {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Result<ConversationListItem[]>> {
    try {
      const res = await api.get("/conversations");
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error getting conversations:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de la récupération des conversations",
      };
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getMessages(conversationId: string): Promise<Result<Message[]>> {
    try {
      const res = await api.get(`/conversations/${conversationId}/messages`);
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error getting messages:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de la récupération des messages",
      };
    }
  }

  /**
   * Create or open a conversation with a specific user
   */
  async startOrOpenConversation(targetUserId: string): Promise<Result<Conversation>> {
    try {
      const res = await api.post("/conversations", { targetUserId });
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error starting conversation:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de la création de la conversation",
      };
    }
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId: string, ciphertext: string, encryptedKey: string, encryptedKeyForSender: string, iv: string): Promise<Result<Message>> {
    try {
      const res = await api.post(`/conversations/${conversationId}/messages`, {
        ciphertext,
        encryptedKey,
        encryptedKeyForSender,
        iv,
      });
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error sending message:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de l'envoi du message",
      };
    }
  }

  /**
   * Delete all messages in a conversation
   */
  async clearMessages(conversationId: string): Promise<Result<void>> {
    try {
      const res = await api.delete(`/conversations/${conversationId}/messages`);
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error clearing messages:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de l'effacement des messages",
      };
    }
  }
}

export const chatService = new ChatService();
