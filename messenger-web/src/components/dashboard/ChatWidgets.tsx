"use client";

import { Smile } from "lucide-react";
import { McAvatar } from "@/components/ui/McAvatar";
import { Participant } from "@/lib/types";

interface TypingIndicatorProps {
  participant: Participant;
}

export function TypingIndicator({ participant }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <McAvatar
        firstName={participant.firstName}
        lastName={participant.lastName}
        size="sm"
        className="!w-7 !h-7 !text-[10px]"
      />
      <div className="bg-white rounded-[18px] rounded-bl-[5px] px-3.5 py-2.5 flex gap-1 items-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <span className="w-[7px] h-[7px] rounded-full bg-[#A8CDBF] typing-dot-anim" />
        <span className="w-[7px] h-[7px] rounded-full bg-[#A8CDBF] typing-dot-anim [animation-delay:0.2s]" />
        <span className="w-[7px] h-[7px] rounded-full bg-[#A8CDBF] typing-dot-anim [animation-delay:0.4s]" />
      </div>
    </div>
  );
}

interface NewConversationSuggestionsProps {
  participant: Participant;
  onSuggestionClick: (text: string) => void;
}

export function NewConversationSuggestions({
  participant,
  onSuggestionClick,
}: NewConversationSuggestionsProps) {
  const suggestions = [
    `Salut ${participant.firstName} ! 👋`,
    `Hello @${participant.pseudo} !`,
    "Comment vas-tu ? 😊",
    "Ravi de te connaître !",
  ];

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-8 text-center animate-[fadeUp_0.3s_ease_both]">
      <div className="w-14 h-14 rounded-2xl bg-[#EAF6F1] flex items-center justify-center mb-4">
        <Smile size={24} className="text-[#0F6E56]" />
      </div>
      <div className="font-[family-name:var(--font-heading)] font-bold text-[16px] text-[#1A1A1A] mb-1">
        Nouvelle conversation
      </div>
      <div className="text-[13px] text-[#7EA898] mb-5 max-w-[280px]">
        Dites bonjour à {participant.firstName} !
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-w-[400px]">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-3.5 py-2 rounded-full bg-white border-[1.5px] border-[#D4EAE3] text-[13px] font-medium text-[#4A5A54] cursor-pointer transition-all hover:border-[#0F6E56] hover:text-[#0F6E56] hover:bg-[#EAF6F1] active:scale-[0.97]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
