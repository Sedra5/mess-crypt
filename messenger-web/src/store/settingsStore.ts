import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SettingsState {
  // Apparence
  displayMode: string;
  accentColor: string;
  fontSize: number;
  compactMode: boolean;
  reduceAnimations: boolean;
  language: string;
  dateFormat: string;

  // Notifications
  notifNewMessages: boolean;
  notifTypingIndicator: boolean;
  notifCleanupReminder: boolean;
  notifSound: boolean;
  doNotDisturb: boolean;
  quietHours: boolean;

  // Messagerie
  readReceipts: boolean;
  enterToSend: boolean;
  typingVisible: boolean;
  cleanupFrequency: string;
  autoRestoreOnLogin: boolean;

  // Confidentialité
  showOnlineStatus: boolean;
  confirmReadReceipts: boolean;
  whoCanContact: string;
  findableBy: string;

  // Actions
  setDisplayMode: (v: string) => void;
  setAccentColor: (v: string) => void;
  setFontSize: (v: number) => void;
  setCompactMode: (v: boolean) => void;
  setReduceAnimations: (v: boolean) => void;
  setLanguage: (v: string) => void;
  setDateFormat: (v: string) => void;

  setNotifNewMessages: (v: boolean) => void;
  setNotifTypingIndicator: (v: boolean) => void;
  setNotifCleanupReminder: (v: boolean) => void;
  setNotifSound: (v: boolean) => void;
  setDoNotDisturb: (v: boolean) => void;
  setQuietHours: (v: boolean) => void;

  setReadReceipts: (v: boolean) => void;
  setEnterToSend: (v: boolean) => void;
  setTypingVisible: (v: boolean) => void;
  setCleanupFrequency: (v: string) => void;
  setAutoRestoreOnLogin: (v: boolean) => void;

  setShowOnlineStatus: (v: boolean) => void;
  setConfirmReadReceipts: (v: boolean) => void;
  setWhoCanContact: (v: string) => void;
  setFindableBy: (v: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      displayMode: "Automatique",
      accentColor: "#0F6E56",
      fontSize: 15,
      compactMode: false,
      reduceAnimations: false,
      language: "Français",
      dateFormat: "JJ/MM/AAAA",

      notifNewMessages: true,
      notifTypingIndicator: true,
      notifCleanupReminder: true,
      notifSound: true,
      doNotDisturb: false,
      quietHours: true,

      readReceipts: true,
      enterToSend: true,
      typingVisible: true,
      cleanupFrequency: "24 heures",
      autoRestoreOnLogin: false,

      showOnlineStatus: true,
      confirmReadReceipts: true,
      whoCanContact: "Tout le monde",
      findableBy: "Email & pseudo",

      // Setters
      setDisplayMode: (v) => set({ displayMode: v }),
      setAccentColor: (v) => set({ accentColor: v }),
      setFontSize: (v) => set({ fontSize: v }),
      setCompactMode: (v) => set({ compactMode: v }),
      setReduceAnimations: (v) => set({ reduceAnimations: v }),
      setLanguage: (v) => set({ language: v }),
      setDateFormat: (v) => set({ dateFormat: v }),

      setNotifNewMessages: (v) => set({ notifNewMessages: v }),
      setNotifTypingIndicator: (v) => set({ notifTypingIndicator: v }),
      setNotifCleanupReminder: (v) => set({ notifCleanupReminder: v }),
      setNotifSound: (v) => set({ notifSound: v }),
      setDoNotDisturb: (v) => set({ doNotDisturb: v }),
      setQuietHours: (v) => set({ quietHours: v }),

      setReadReceipts: (v) => set({ readReceipts: v }),
      setEnterToSend: (v) => set({ enterToSend: v }),
      setTypingVisible: (v) => set({ typingVisible: v }),
      setCleanupFrequency: (v) => set({ cleanupFrequency: v }),
      setAutoRestoreOnLogin: (v) => set({ autoRestoreOnLogin: v }),

      setShowOnlineStatus: (v) => set({ showOnlineStatus: v }),
      setConfirmReadReceipts: (v) => set({ confirmReadReceipts: v }),
      setWhoCanContact: (v) => set({ whoCanContact: v }),
      setFindableBy: (v) => set({ findableBy: v }),
    }),
    {
      name: "messcrypt-settings",
    }
  )
);
