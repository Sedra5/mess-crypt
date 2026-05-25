import * as signalR from "@microsoft/signalr";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useTypingStore } from "@/store/typingStore";
import { Message, ConversationListItem } from "@/lib/types";

const getSignalRUrl = () => {
  if (typeof window !== "undefined" && window.ENV && window.ENV.SIGNALR_URL) {
    return window.ENV.SIGNALR_URL;
  }
  return process.env.NEXT_PUBLIC_SIGNALR_URL || "http://localhost:5156/hubs/chat";
};

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;

  async connect() {
    const token = useAuthStore.getState().accessToken;
    if (!token || this.connection || this.isConnecting) return;

    this.isConnecting = true;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(getSignalRUrl(), {
        accessTokenFactory: () => useAuthStore.getState().accessToken || "",
      })
      // Rely entirely on withAutomaticReconnect for reconnection logic
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    // Handle complete disconnections when automatic reconnects fail
    this.connection.onclose((error) => {
      this.connection = null;
      this.isConnecting = false;
      // Do not use setTimeout here, let the user manually refresh or trigger a reconnect on focus if needed
    });

    this.connection.onreconnecting(() => {
      // UI could show a subtle "reconnecting" indicator here if needed
      useChatStore.getState(); // keep state reference alive
    });

    this.connection.onreconnected(async () => {
      // Re-join all active conversations after reconnection
      const convos = useChatStore.getState().conversations;
      for (const c of convos) {
        try {
          await this.connection?.invoke("JoinConversation", c.id);
        } catch {
          // Silently skip if join fails for a specific conversation
        }
      }

      // Sync online users
      try {
        const onlineUsers = await this.connection?.invoke<{ id: string }[]>("GetOnlineUsers");
        if (onlineUsers) {
          const statusMap: Record<string, { isOnline: boolean }> = {};
          onlineUsers.forEach(u => statusMap[u.id] = { isOnline: true });
          useChatStore.getState().setUserStatus(statusMap);
        }
      } catch {}
    });

    this.setupListeners();

    try {
      await this.connection.start();

      // Sync online users on initial connect
      try {
        const onlineUsers = await this.connection.invoke<{ id: string }[]>("GetOnlineUsers");
        if (onlineUsers) {
          const statusMap: Record<string, { isOnline: boolean }> = {};
          onlineUsers.forEach(u => statusMap[u.id] = { isOnline: true });
          useChatStore.getState().setUserStatus(statusMap);
        }
      } catch {}

    } catch (err) {
      // If 401, try refreshing the token and reconnecting once
      if (String(err).includes("401")) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          try {
            await this.connection.start();
          } catch {
            this.connection = null;
          }
        } else {
          this.connection = null;
        }
      } else {
        this.connection = null;
      }
    } finally {
      this.isConnecting = false;
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    const { accessToken, refreshToken, setTokens, logout } = useAuthStore.getState();
    if (!refreshToken) { logout(); return false; }
    try {
      const getApiUrl = () => {
        if (typeof window !== "undefined" && window.ENV && window.ENV.API_URL) return window.ENV.API_URL;
        return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5156/api";
      };
      const res = await fetch(`${getApiUrl()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTokens(data.data.accessToken, data.data.refreshToken);
          return true;
        }
      }
      logout();
      return false;
    } catch {
      logout();
      return false;
    }
  }

  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // Silently handle disconnect errors
      }
      this.connection = null;
    }
  }

  private setupListeners() {
    if (!this.connection) return;

    this.connection.on("ReceiveMessage", (message: Message) => {
      useChatStore.getState().addMessage(message);
    });

    this.connection.on("NewConversation", (conversation: ConversationListItem) => {
      const { conversations, setConversations } = useChatStore.getState();
      // Only add if not already in list
      if (!conversations.find(c => c.id === conversation.id)) {
        setConversations([conversation, ...conversations]);
        this.joinConversation(conversation.id);
      }
    });

    this.connection.on("MessageRead", (data: { conversationId: string, messageId: string, readAt: string, readBy: string }) => {
      useChatStore.getState().markAsRead(data.conversationId, data.messageId);
    });

    this.connection.on("UserTyping", (data: { conversationId: string, userId: string, pseudo: string }) => {
      useTypingStore.getState().setTyping(data.conversationId, data.userId, data.pseudo);
    });

    this.connection.on("UserStoppedTyping", (data: { conversationId: string, userId: string }) => {
      useTypingStore.getState().clearTyping(data.conversationId, data.userId);
    });

    this.connection.on("UserOnline", (userId: string) => {
      useChatStore.getState().setUserOnline(userId);
    });

    this.connection.on("UserOffline", (userId: string, lastSeenAt: string) => {
      useChatStore.getState().setUserOffline(userId, lastSeenAt);
    });
  }

  async joinConversation(conversationId: string) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("JoinConversation", conversationId);
    }
  }

  async leaveConversation(conversationId: string) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("LeaveConversation", conversationId);
    }
  }

  async sendMessage(conversationId: string, ciphertext: string, encryptedKey: string, encryptedKeyForSender: string, iv: string): Promise<Message | undefined> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return await this.connection.invoke<Message>("SendMessage", conversationId, ciphertext, encryptedKey, encryptedKeyForSender, iv);
    }
    return undefined;
  }

  async markAsRead(conversationId: string, messageId: string) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("MarkAsRead", conversationId, messageId);
    }
  }

  async typing(conversationId: string) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("Typing", conversationId);
    }
  }

  async stopTyping(conversationId: string) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("StopTyping", conversationId);
    }
  }

  async syncOnlineUsers() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        const onlineUsers = await this.connection.invoke<{ id: string }[]>("GetOnlineUsers");
        if (onlineUsers) {
          const statusMap: Record<string, { isOnline: boolean }> = {};
          onlineUsers.forEach(u => statusMap[u.id] = { isOnline: true });
          useChatStore.getState().setUserStatus(statusMap);
        }
      } catch (err) {
        console.error("Failed to sync online users", err);
      }
    }
  }
}

export const signalRService = new SignalRService();
