"use client";

import React from "react";

interface SettingRowProps {
  icon: React.ElementType;
  iconClass: string;
  label: string;
  desc?: string;
  children?: React.ReactNode;
  hoverClass?: string;
  borderClass?: string;
}

export function SettingRow({
  icon: Icon,
  iconClass,
  label,
  desc,
  children,
  hoverClass = "hover:bg-[#FAFEFE]",
  borderClass = "border-[#EAF6F1]",
}: SettingRowProps) {
  return (
    <div
      className={`flex items-center gap-3.5 px-5 py-3.5 border-b ${borderClass} transition-colors ${hoverClass} last:border-b-0`}
    >
      <div
        className={`w-9 h-9 shrink-0 rounded-[10px] flex items-center justify-center ${iconClass}`}
      >
        <Icon size={16} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-[#1A1A1A] mb-0.5">
          {label}
        </div>
        {desc && (
          <div className="text-[12px] text-[#7EA898] leading-[1.5]">
            {desc}
          </div>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2.5">{children}</div>
    </div>
  );
}
