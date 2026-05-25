import { McAvatar } from "@/components/ui/McAvatar";
import { formatTime } from "@/lib/helpers";
import { Lock } from "lucide-react";
import { ConversationListItem } from "@/lib/types";

import { useChatStore } from "@/store/chatStore";

interface ConversationItemProps {
  conversation: ConversationListItem;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const { otherParticipant, lastMessageAt, unreadCount } = conversation;
  const hasUnread = unreadCount > 0;
  const status = useChatStore((state) => state.userStatus[otherParticipant.id]);
  const isOnline = status?.isOnline;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-100 relative text-left border-none bg-transparent ${
        isActive
          ? "bg-[#EAF6F1]"
          : "hover:bg-[#F4FBF8]"
      }`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0F6E56] rounded-r" />
      )}

      <div className="relative shrink-0">
        <McAvatar
          firstName={otherParticipant.firstName}
          lastName={otherParticipant.lastName}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-[11px] h-[11px] bg-[#3DDBA0] border-2 border-white rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-[3px]">
          <span className="text-[14px] font-semibold text-[#1A1A1A] truncate">
            {otherParticipant.firstName} {otherParticipant.lastName}
          </span>
          <span className={`text-[11px] shrink-0 ml-1.5 ${hasUnread ? "text-[#0F6E56] font-semibold" : "text-[#7EA898]"}`}>
            {formatTime(lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock size={12} className="text-[#7EA898] shrink-0" />
          <span className={`text-[13px] truncate flex-1 ${hasUnread ? "text-[#4A5A54] font-medium" : "text-[#7EA898]"}`}>
            Message chiffré
          </span>
          {hasUnread && (
            <span className="min-w-[18px] h-[18px] bg-[#0F6E56] text-white text-[11px] font-semibold rounded-[9px] flex items-center justify-center px-1.5 shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
