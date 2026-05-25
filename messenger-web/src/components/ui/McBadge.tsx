import { ReactNode } from "react";

interface McBadgeProps {
  icon?: ReactNode;
  children: ReactNode;
}

export function McBadge({ icon, children }: McBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-[#C8EBE0] text-[#0B5A44] text-xs font-medium px-3 py-1.5 rounded-full">
      {icon}
      {children}
    </div>
  );
}
