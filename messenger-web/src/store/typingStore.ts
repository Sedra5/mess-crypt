import { create } from "zustand";

interface TypingEntry {
  pseudo: string;
  timeout: ReturnType<typeof setTimeout>;
}

interface TypingState {
  // key = `${conversationId}::${userId}`
  typingUsers: Record<string, TypingEntry>;

  setTyping: (conversationId: string, userId: string, pseudo: string) => void;
  clearTyping: (conversationId: string, userId: string) => void;
  getTypingText: (conversationId: string) => string | null;
}

const TYPING_TIMEOUT_MS = 3500; // 3.5s auto-clear

export const useTypingStore = create<TypingState>((set, get) => ({
  typingUsers: {},

  setTyping: (conversationId, userId, pseudo) => {
    const key = `${conversationId}::${userId}`;
    const current = get().typingUsers[key];

    // Clear existing timeout if any
    if (current?.timeout) {
      clearTimeout(current.timeout);
    }

    // Set a new timeout to auto-clear after 3.5s of silence
    const timeout = setTimeout(() => {
      get().clearTyping(conversationId, userId);
    }, TYPING_TIMEOUT_MS);

    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [key]: { pseudo, timeout },
      },
    }));
  },

  clearTyping: (conversationId, userId) => {
    const key = `${conversationId}::${userId}`;
    const current = get().typingUsers[key];

    if (current?.timeout) {
      clearTimeout(current.timeout);
    }

    set((state) => {
      const newTypingUsers = { ...state.typingUsers };
      delete newTypingUsers[key];
      return { typingUsers: newTypingUsers };
    });
  },

  getTypingText: (conversationId) => {
    const entries = Object.entries(get().typingUsers)
      .filter(([key]) => key.startsWith(`${conversationId}::`))
      .map(([, entry]) => entry.pseudo);

    if (entries.length === 0) return null;
    if (entries.length === 1) return `${entries[0]} is typing`;
    return `${entries.join(", ")} are typing`;
  },
}));
