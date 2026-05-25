"use client";

import React, { useRef } from "react";
import { Send, Smile, Paperclip, Lock } from "lucide-react";

interface ChatInputProps {
  newMessage: string;
  isSending: boolean;
  onMessageChange: (value: string) => void;
  onTyping: () => void;
  onSend: (e: React.FormEvent) => void;
}

export function ChatInput({
  newMessage,
  isSending,
  onMessageChange,
  onTyping,
  onSend,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMessageChange(e.target.value);
    onTyping();
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(e);
    }
  };

  return (
    <div className="px-6 pb-5 pt-3.5 shrink-0">
      <form
        onSubmit={onSend}
        className="flex items-end gap-2.5 bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl px-3 py-2.5 transition-all focus-within:border-[#0F6E56] focus-within:shadow-[0_0_0_3px_rgba(15,110,86,0.08)]"
      >
        {/* Action buttons */}
        <div className="flex gap-0.5">
          <button
            type="button"
            className="w-[34px] h-[34px] rounded-[9px] border-none bg-transparent cursor-pointer text-[#7EA898] flex items-center justify-center transition-all hover:bg-[#EAF6F1] hover:text-[#0F6E56]"
            title="Emoji"
          >
            <Smile size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="w-[34px] h-[34px] rounded-[9px] border-none bg-transparent cursor-pointer text-[#7EA898] flex items-center justify-center transition-all hover:bg-[#EAF6F1] hover:text-[#0F6E56]"
            title="Joindre un fichier"
          >
            <Paperclip size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="flex-1 border-none outline-none resize-none font-[family-name:var(--font-body)] text-[15px] text-[#1A1A1A] bg-transparent leading-relaxed max-h-[120px] min-h-[24px] placeholder-[#7EA898]"
          placeholder="Écrire un message…"
          rows={1}
          value={newMessage}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          aria-label="Écrire un message"
        />

        {/* Send */}
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending}
          className="w-9 h-9 bg-[#0F6E56] border-none rounded-[10px] cursor-pointer flex items-center justify-center text-white shrink-0 transition-all hover:bg-[#0A4A38] active:scale-[0.93] disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Envoyer le message"
        >
          <Send size={16} strokeWidth={2.5} />
        </button>
      </form>
      <div className="text-[11px] text-[#7EA898] text-center mt-2 flex items-center justify-center gap-1.5">
        <Lock size={11} strokeWidth={2.5} className="text-[#1A9E78]" />
        Messages chiffrés de bout en bout
      </div>
    </div>
  );
}
