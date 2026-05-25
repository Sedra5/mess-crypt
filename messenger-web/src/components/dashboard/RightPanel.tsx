import { McAvatar } from "@/components/ui/McAvatar";
import { Mail, Calendar, Shield } from "lucide-react";
import { Participant } from "@/lib/types";

import { useChatStore } from "@/store/chatStore";
import { formatRelativeTime } from "@/lib/helpers";

interface RightPanelProps {
  participant: Participant;
}

export function RightPanel({ participant }: RightPanelProps) {
  const status = useChatStore((state) => state.userStatus[participant.id]);
  const isOnline = status?.isOnline;
  
  // If not tracked yet, use the participant's initial lastSeenAt from the backend
  const lastSeenAt = status?.lastSeenAt ?? participant.lastSeenAt;

  return (
    <aside className="w-[260px] h-screen bg-white border-l border-[#D4EAE3] flex flex-col overflow-y-auto shrink-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#D4EAE3] [&::-webkit-scrollbar-thumb]:rounded" aria-label="Informations du contact">
      {/* Header */}
      <div className="px-5 py-5 text-center border-b border-[#EAF6F1]">
        <div className="mx-auto mb-2.5">
          <McAvatar firstName={participant.firstName} lastName={participant.lastName} size="md" className="!w-16 !h-16 !text-[22px] mx-auto" />
        </div>
        <div className="font-[family-name:var(--font-heading)] font-bold text-[15px] text-[#1A1A1A] mb-1">
          {participant.firstName} {participant.lastName}
        </div>
        <div className="text-[13px] text-[#7EA898] mb-2.5">@{participant.pseudo}</div>
        
        {isOnline ? (
          <div className="inline-flex items-center gap-1.5 bg-[#3DDBA0]/10 border border-[#3DDBA0]/30 rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#1A9E78]">
            <span className="w-1.5 h-1.5 bg-[#3DDBA0] rounded-full shadow-[0_0_4px_rgba(61,219,160,0.5)]" />
            En ligne
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-[#F4FBF8] border border-[#D4EAE3] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#7EA898]">
            <span className="w-1.5 h-1.5 bg-[#B8D8CC] rounded-full" />
            {formatRelativeTime(lastSeenAt)}
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="px-5 py-3.5 border-b border-[#EAF6F1]">
        <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#7EA898] mb-2.5">Infos</div>
        <div className="flex items-center gap-2.5 mb-2">
          <Mail size={14} className="text-[#7EA898] shrink-0" />
          <span className="text-[13px] text-[#4A5A54]">Membre Mess&apos;Crypt</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Calendar size={14} className="text-[#7EA898] shrink-0" />
          <span className="text-[13px] text-[#4A5A54]">Inscrit récemment</span>
        </div>
      </div>

      {/* Sécurité */}
      <div className="px-5 py-3.5 border-b border-[#EAF6F1]">
        <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#7EA898] mb-2.5">Sécurité</div>
        <div className="bg-[#EAF6F1] border border-[#D4EAE3] rounded-[10px] p-3 flex items-start gap-2.5">
          <Shield size={15} className="text-[#0F6E56] shrink-0 mt-[1px]" />
          <div className="text-[12px] text-[#4A5A54] leading-relaxed">
            <strong className="text-[#0F6E56] font-semibold">Chiffrement RSA-OAEP + AES-256-GCM</strong><br/>
            Le serveur ne peut pas lire vos messages.
          </div>
        </div>
      </div>

      {/* Nettoyage automatique */}
      <div className="px-5 py-3.5">
        <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#7EA898] mb-2.5">Nettoyage automatique</div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[12px] text-[#4A5A54]">Dernier nettoyage</span>
          <strong className="text-[12px] text-[#0F6E56] font-semibold">Auto (24h)</strong>
        </div>
        <div className="h-1 bg-[#D4EAE3] rounded overflow-hidden">
          <div className="h-full w-[62%] bg-gradient-to-r from-[#0F6E56] to-[#1A9E78] rounded" />
        </div>
        <div className="text-[11px] text-[#7EA898] mt-1.5">
          Messages nettoyés automatiquement après 24h
        </div>
      </div>
    </aside>
  );
}
