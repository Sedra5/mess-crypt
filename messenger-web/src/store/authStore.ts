import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  recoveryPhrase: string | null; 
  privateKey: CryptoKey | null;
  isAuthenticated: boolean;
  
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setRecoveryPhrase: (phrase: string | null) => void;
  setPrivateKey: (key: CryptoKey | null) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      recoveryPhrase: null,
      privateKey: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      setRecoveryPhrase: (phrase) => set({ recoveryPhrase: phrase }),
      
      setPrivateKey: (key) => set({ privateKey: key }),

      updateUser: (user) => set({ user }),

      logout: async () => {
        set({ user: null, accessToken: null, refreshToken: null, recoveryPhrase: null, privateKey: null, isAuthenticated: false });
        // Optionally trigger a full reload to clear other states
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },
    }),
    {
      name: "messenger-auth-storage", // name of the item in the storage (must be unique)
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken, 
        isAuthenticated: state.isAuthenticated 
        // privateKey and recoveryPhrase are excluded, so they only exist in memory!
      }),
    }
  )
);
