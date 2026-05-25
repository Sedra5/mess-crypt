"use client";

import { Lock, Phone, Info } from "lucide-react";
import { McAvatar } from "@/components/ui/McAvatar";
import { Participant } from "@/lib/types";
import { formatRelativeTime } from "@/lib/helpers";
import { useChatStore } from "@/store/chatStore";

interface ChatHeaderProps {
  participant: Participant;
  onTogglePanel: () => void;
}

export function ChatHeader({ participant, onTogglePanel }: ChatHeaderProps) {
  const status = useChatStore((state) => state.userStatus[participant.id]);
  const isOnline = status?.isOnline;
  const lastSeenAt = status?.lastSeenAt ?? participant.lastSeenAt;

  return (
    <div className="h-16 bg-white border-b border-[#D4EAE3] px-6 flex items-center gap-3.5 shrink-0">
      {/* Clickable avatar + name to toggle RightPanel */}
      <button
        onClick={onTogglePanel}
        className="flex items-center gap-3.5 bg-transparent border-none cursor-pointer p-0 text-left hover:opacity-80 transition-opacity"
      >
        <div className="relative">
          <McAvatar
            firstName={participant.firstName}
            lastName={participant.lastName}
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-[11px] h-[11px] bg-[#3DDBA0] border-2 border-white rounded-full" />
          )}
        </div>
        <div>
          <div className="font-[family-name:var(--font-heading)] font-bold text-[15px] text-[#1A1A1A]">
            {participant.firstName} {participant.lastName}
          </div>
          <div className="text-[12px] text-[#7EA898] flex items-center gap-1.5">
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 bg-[#3DDBA0] rounded-full shadow-[0_0_4px_rgba(61,219,160,0.5)]" />
                En ligne maintenant
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 bg-[#A8CDBF] rounded-full" />
                {formatRelativeTime(lastSeenAt)}
              </>
            )}
          </div>
        </div>
      </button>
      <div className="flex-1" />

      {/* E2E badge */}
      <div className="flex items-center gap-1.5 bg-[#EAF6F1] border border-[#D4EAE3] rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#0F6E56]">
        <Lock size={11} strokeWidth={2.5} />
        Chiffré E2E
      </div>

      {/* Header actions */}
      <div className="flex gap-1">
        <button
          className="w-9 h-9 rounded-[10px] bg-transparent border-none cursor-pointer text-[#7EA898] flex items-center justify-center transition-all hover:bg-[#EAF6F1] hover:text-[#0F6E56]"
          title="Appel"
        >
          <Phone size={18} strokeWidth={2} />
        </button>
        <button
          className="w-9 h-9 rounded-[10px] bg-transparent border-none cursor-pointer text-[#7EA898] flex items-center justify-center transition-all hover:bg-[#EAF6F1] hover:text-[#0F6E56]"
          title="Infos"
        >
          <Info size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
