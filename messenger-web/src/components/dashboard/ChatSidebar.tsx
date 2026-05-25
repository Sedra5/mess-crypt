"use client";

import { McAvatar } from "@/components/ui/McAvatar";
import { McSearchInput } from "@/components/ui/McSearchInput";
import { McTabs } from "@/components/ui/McTabs";
import { ConversationItem } from "@/components/dashboard/ConversationItem";
import { ConversationListItem, User } from "@/lib/types";

interface ChatSidebarProps {
  conversations: ConversationListItem[];
  activeConversationId: string | null;
  searchQuery: string;
  searchResults: User[];
  isSearching: boolean;
  activeTab: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartConversation: (userId: string) => void;
  onOpenConversation: (conversationId: string) => void;
  onTabChange: (tab: string) => void;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  searchQuery,
  searchResults,
  isSearching,
  activeTab,
  onSearch,
  onStartConversation,
  onOpenConversation,
  onTabChange,
}: ChatSidebarProps) {
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === "unread") return c.unreadCount > 0;
    if (activeTab === "archived") return false;
    return true;
  });

  const tabs = [
    { id: "all", label: "Tout" },
    { id: "unread", label: "Non lus", count: unreadTotal },
    { id: "archived", label: "Archivés" },
  ];

  return (
    <aside className="w-[280px] h-screen bg-white border-r border-[#D4EAE3] flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-[18px] pt-5 pb-3.5 border-b border-[#EAF6F1]">
        <div className="font-[family-name:var(--font-heading)] font-extrabold text-[18px] text-[#1A1A1A] mb-3">
          Messages
        </div>
        <McSearchInput
          placeholder="Rechercher une conversation…"
          value={searchQuery}
          onChange={onSearch}
        />
        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="mt-2 bg-white rounded-lg shadow-lg border border-[#D4EAE3] overflow-hidden z-10 relative">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-[#7EA898]">
                Recherche...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((resultUser) => (
                <button
                  key={resultUser.id}
                  onClick={() => onStartConversation(resultUser.id)}
                  className="w-full text-left p-3 hover:bg-[#F4FBF8] flex items-center gap-3 transition-colors bg-transparent border-none cursor-pointer"
                >
                  <McAvatar
                    firstName={resultUser.firstName}
                    lastName={resultUser.lastName}
                    size="sm"
                  />
                  <div>
                    <div className="text-[14px] font-medium text-[#1A1A1A]">
                      {resultUser.pseudo}
                    </div>
                    <div className="text-[12px] text-[#7EA898]">
                      {resultUser.email}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-[#7EA898]">
                Aucun utilisateur trouvé.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <McTabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D4EAE3] [&::-webkit-scrollbar-thumb]:rounded">
        {filteredConversations.map((convo) => (
          <ConversationItem
            key={convo.id}
            conversation={convo}
            isActive={activeConversationId === convo.id}
            onClick={() => onOpenConversation(convo.id)}
          />
        ))}
        {filteredConversations.length === 0 && (
          <div className="p-8 text-center text-[14px] text-[#7EA898]">
            {activeTab === "unread"
              ? "Aucun message non lu."
              : activeTab === "archived"
              ? "Aucune conversation archivée."
              : "Aucune conversation."}
          </div>
        )}
      </div>
    </aside>
  );
}
