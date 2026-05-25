import { create } from "zustand";
import { ConversationListItem, Message } from "@/lib/types";

interface ChatState {
  conversations: ConversationListItem[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // conversationId -> messages[]
  userStatus: Record<string, { isOnline: boolean; lastSeenAt?: string }>;

  setConversations: (conversations: ConversationListItem[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  markAsRead: (conversationId: string, messageId: string) => void;
  cleanupOldMessages: () => void;
  clearChatStore: () => void;

  setUserStatus: (statuses: Record<string, { isOnline: boolean; lastSeenAt?: string }>) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string, lastSeenAt: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  userStatus: {},

  setConversations: (conversations) => set((state) => {
    // Merge and deduplicate by otherParticipant.id to prevent duplicate chat rooms with the same user
    const merged = new Map<string, ConversationListItem>();
    
    const addOrUpdate = (c: ConversationListItem) => {
      const key = c.otherParticipant.id;
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, c);
      } else {
        // Keep the one with the most recent activity or creation date
        const dateNew = new Date(c.lastMessageAt || c.createdAt).getTime();
        const dateOld = new Date(existing.lastMessageAt || existing.createdAt).getTime();
        if (dateNew > dateOld) {
          merged.set(key, c);
        }
      }
    };

    state.conversations.forEach(addOrUpdate);
    conversations.forEach(addOrUpdate);

    return { conversations: Array.from(merged.values()) };
  }),
  
  setActiveConversation: (id) => set({ activeConversationId: id }),
  
  setMessages: (conversationId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: messages
    }
  })),
  
  addMessage: (message) => set((state) => {
    const convoMessages = state.messages[message.conversationId] || [];
    
    // Check for duplicates (SignalR vs REST)
    if (convoMessages.some(m => m.id === message.id)) {
      return state;
    }

    return {
      messages: {
        ...state.messages,
        [message.conversationId]: [...convoMessages, message]
      },
      conversations: state.conversations.map(c => {
        if (c.id === message.conversationId) {
          const isFromOther = message.senderId === c.otherParticipant.id;
          return { 
            ...c, 
            lastMessageAt: message.sentAt,
            unreadCount: isFromOther && !message.readAt ? c.unreadCount + 1 : c.unreadCount
          };
        }
        return c;
      }).sort((a, b) => {
        // re-sort by last message
        const dateA = new Date(a.lastMessageAt || a.createdAt).getTime();
        const dateB = new Date(b.lastMessageAt || b.createdAt).getTime();
        return dateB - dateA;
      })
    };
  }),

  markAsRead: (conversationId, messageId) => set((state) => {
    const convoMessages = state.messages[conversationId] || [];
    let wasUnread = false;

    const newMessages = convoMessages.map(m => {
      if (m.id === messageId) {
        if (!m.readAt) wasUnread = true;
        return { ...m, readAt: new Date().toISOString() };
      }
      return m;
    });

    return {
      messages: {
        ...state.messages,
        [conversationId]: newMessages
      },
      conversations: state.conversations.map(c => 
        (c.id === conversationId && wasUnread)
          ? { ...c, unreadCount: Math.max(0, c.unreadCount - 1) }
          : c
      )
    };
  }),

  // US-16: Cron côté front — nettoyage UI à 24h
  cleanupOldMessages: () => set((state) => {
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    
    const newMessages: Record<string, Message[]> = {};
    let hasChanges = false;

    Object.keys(state.messages).forEach(convId => {
      const originalCount = state.messages[convId].length;
      const filtered = state.messages[convId].filter(msg => {
        const sentAt = new Date(msg.sentAt).getTime();
        return (now - sentAt) < TWENTY_FOUR_HOURS_MS;
      });
      
      if (filtered.length !== originalCount) {
        hasChanges = true;
      }
      newMessages[convId] = filtered;
    });

    if (!hasChanges) return state;
    
    return { messages: newMessages };
  }),

  clearChatStore: () => set({
    conversations: [],
    activeConversationId: null,
    messages: {},
    userStatus: {}
  }),

  setUserStatus: (statuses) => set((state) => {
    return { userStatus: { ...state.userStatus, ...statuses } };
  }),

  setUserOnline: (userId) => set((state) => {
    return { userStatus: { ...state.userStatus, [userId]: { isOnline: true } } };
  }),

  setUserOffline: (userId, lastSeenAt) => set((state) => {
    return { userStatus: { ...state.userStatus, [userId]: { isOnline: false, lastSeenAt } } };
  }),
}));
