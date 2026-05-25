"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useTypingStore } from "@/store/typingStore";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { userService } from "@/services/userService";
import { authService } from "@/services/authService";
import { signalRService } from "@/lib/signalr";
import { Loader2 } from "lucide-react";
import { User } from "@/lib/types";
import { getPrivateKey } from "@/lib/crypto/store";
import { Suspense } from "react";

// Extracted components
import { NavRail } from "@/components/dashboard/NavRail";
import { ChatSidebar } from "@/components/dashboard/ChatSidebar";
import { ChatHeader } from "@/components/dashboard/ChatHeader";
import { ChatInput } from "@/components/dashboard/ChatInput";
import { MessageBubble } from "@/components/dashboard/MessageBubble";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RightPanel } from "@/components/dashboard/RightPanel";
import { TypingIndicator, NewConversationSuggestions } from "@/components/dashboard/ChatWidgets";

// Extracted hook
import { useChatActions } from "@/hooks/useChatActions";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isReady, user } = useAuthGuard();
  const { isAuthenticated, logout, privateKey, setPrivateKey } = useAuthStore();

  const {
    conversations,
    activeConversationId,
    messages,
    cleanupOldMessages,
    fetchConversations,
    openConversation,
    startOrOpenConversation,
    sendMessage,
    handleTyping,
  } = useChatActions();

  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [isOpeningConversation, setIsOpeningConversation] = useState(!!searchParams.get("userId"));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingText = useTypingStore((s) =>
    activeConversationId ? s.getTypingText(activeConversationId) : null
  );

  // Auth guard handled by useAuthGuard hook

  // Restore privateKey from IDB if missing (on page reload)
  useEffect(() => {
    if (isAuthenticated && user && !privateKey) {
      getPrivateKey(user.id).then((key) => {
        if (key) {
          setPrivateKey(key);
        } else {
          router.replace(user.pinEncryptedPrivateKey ? "/login/pin" : "/login/recovery");
        }
      }).catch((err) => {
        console.error("Failed to load private key from IDB", err);
        router.replace(user.pinEncryptedPrivateKey ? "/login/pin" : "/login/recovery");
      });
    }
  }, [isAuthenticated, user, privateKey, setPrivateKey, router]);

  // Connect & fetch
  useEffect(() => {
    if (isAuthenticated) {
      signalRService.connect();
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  // Cleanup cron
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => cleanupOldMessages(), 60 * 1000);
    cleanupOldMessages();
    return () => clearInterval(interval);
  }, [isAuthenticated, cleanupOldMessages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversationId]);

  // Deep-link: open conversation from query param
  const deepLinkUserId = searchParams.get("userId");
  useEffect(() => {
    if (deepLinkUserId) {
      const open = async () => {
        setIsOpeningConversation(true);
        await startOrOpenConversation(deepLinkUserId);
        setIsOpeningConversation(false);
        router.replace("/");
      };
      open();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkUserId]);

  // Search handler (debounced)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.length < 2) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await userService.searchUsers(query);
        if (res.success && res.data) setSearchResults(res.data);
      } catch (err) { console.error(err); }
      finally { setIsSearching(false); }
    }, 400);
  };

  const handleStartConversation = async (userId: string) => {
    await startOrOpenConversation(userId);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    setIsSending(true);
    const success = await sendMessage(newMessage);
    if (success) setNewMessage("");
    setIsSending(false);
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) await authService.logout(refreshToken);
    } catch (err) { console.error("Logout API failed", err); }
    signalRService.disconnect();
    useChatStore.getState().clearChatStore();
    logout();
  };

  if (!isReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAF6F1]">
        <Loader2 className="animate-spin text-[#0F6E56]" />
      </div>
    );
  }

  const activeConvoDetails = conversations.find((c) => c.id === activeConversationId);
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex h-screen overflow-hidden font-[family-name:var(--font-body)]">
      {/* ═══ NAV RAIL ═══ */}
      <NavRail
        userFirstName={user.firstName}
        userLastName={user.lastName}
        hasUnread={unreadTotal > 0}
      />

      {/* ═══ SIDEBAR ═══ */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        activeTab={activeTab}
        onSearch={handleSearch}
        onStartConversation={handleStartConversation}
        onOpenConversation={openConversation}
        onTabChange={setActiveTab}
      />

      {/* ═══ CHAT MAIN ═══ */}
      {isOpeningConversation ? (
        <main className="flex-1 h-screen flex flex-col items-center justify-center bg-[#EAF6F1]">
          <Loader2 className="animate-spin text-[#0F6E56] mb-3" size={32} />
          <p className="text-[#7EA898] text-sm">Ouverture de la conversation…</p>
        </main>
      ) : activeConversationId && activeConvoDetails ? (
        <>
          <main className="flex-1 h-screen flex flex-col bg-[#EAF6F1] min-w-0">
            {/* Chat Header */}
            <ChatHeader
              participant={activeConvoDetails.otherParticipant}
              onTogglePanel={() => setShowRightPanel((v) => !v)}
            />

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-6 pt-6 pb-4 flex flex-col gap-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D4EAE3] [&::-webkit-scrollbar-thumb]:rounded"
              role="log"
              aria-live="polite"
            >
              {messages[activeConversationId]?.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.senderId === user.id}
                />
              ))}

              {/* Typing indicator */}
              {typingText && (
                <TypingIndicator participant={activeConvoDetails.otherParticipant} />
              )}

              {/* Suggestions for new conversation */}
              {(!messages[activeConversationId] ||
                messages[activeConversationId].length === 0) && (
                <NewConversationSuggestions
                  participant={activeConvoDetails.otherParticipant}
                  onSuggestionClick={setNewMessage}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <ChatInput
              newMessage={newMessage}
              isSending={isSending}
              onMessageChange={setNewMessage}
              onTyping={handleTyping}
              onSend={handleSendMessage}
            />
          </main>

          {/* ═══ RIGHT PANEL ═══ */}
          {showRightPanel && (
            <RightPanel participant={activeConvoDetails.otherParticipant} />
          )}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#EAF6F1]">
          <Loader2 className="animate-spin text-[#0F6E56]" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
