"use client";

import { Check, CheckCheck } from "lucide-react";
import { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div className={`flex flex-col mb-2 ${isMine ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[68%] px-3.5 py-2.5 text-[14px] leading-relaxed break-words msg-bubble-anim ${
          isMine
            ? "bg-[#0F6E56] text-white rounded-[18px] rounded-br-[5px]"
            : "bg-white text-[#1A1A1A] rounded-[18px] rounded-bl-[5px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        }`}
      >
        {message.decryptedContent || "Déchiffrement..."}
      </div>
      <div
        className={`text-[10px] px-1 mt-0.5 flex items-center gap-1 ${
          isMine ? "text-[#7EA898] flex-row-reverse" : "text-[#7EA898]"
        }`}
      >
        <span>
          {new Date(message.sentAt).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {isMine &&
          (message.readAt ? (
            <CheckCheck size={14} className="text-[#3DDBA0]" />
          ) : (
            <Check size={14} className="text-[#A8CDBF]" />
          ))}
      </div>
    </div>
  );
}
