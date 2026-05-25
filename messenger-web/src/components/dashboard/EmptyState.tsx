import { MessageSquare, Plus, Lock } from "lucide-react";

interface EmptyStateProps {
  onNewMessage?: () => void;
}

export function EmptyState({ onNewMessage }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#EAF6F1] relative">
      <div className="flex flex-col items-center text-center max-w-[320px]">
        {/* Illustration */}
        <div className="w-[88px] h-[88px] bg-[#C8EBE0] rounded-full flex items-center justify-center mb-6">
          <MessageSquare size={44} strokeWidth={1.6} className="text-[#0F6E56]" />
        </div>

        <p className="font-[family-name:var(--font-heading)] text-[20px] font-bold text-[#1A1A1A] mb-2">
          Vos messages vous attendent
        </p>
        <p className="text-[14px] text-[#7EA898] leading-relaxed mb-6">
          Sélectionnez une conversation à gauche ou démarrez un nouveau chat chiffré.
        </p>

        <button
          onClick={onNewMessage}
          className="flex items-center gap-2 px-5 py-3 bg-[#0F6E56] text-white border-none rounded-[10px] text-[14px] font-semibold font-[family-name:var(--font-body)] cursor-pointer transition-all duration-150 hover:bg-[#0B5A44] active:scale-[0.97]"
        >
          <Plus size={16} strokeWidth={2.2} />
          Nouveau message
        </button>
      </div>

      {/* E2E notice at the bottom */}
      <div className="absolute bottom-5 flex items-center gap-1.5 text-[12px] text-[#7EA898]">
        <Lock size={13} strokeWidth={2.2} />
        Tous vos messages sont chiffrés de bout en bout
      </div>
    </div>
  );
}
