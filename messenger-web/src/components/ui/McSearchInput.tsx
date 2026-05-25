import { Search } from "lucide-react";

interface McSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function McSearchInput({ className = "", ...props }: McSearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7EA898] pointer-events-none">
        <Search size={15} strokeWidth={2.2} />
      </div>
      <input
        type="text"
        className="w-full py-2.5 pl-9 pr-3 text-[14px] font-[family-name:var(--font-body)] bg-[#EAF6F1] border-[1.5px] border-[#D4EAE3] rounded-lg outline-none text-[#1A1A1A] placeholder-[#7EA898] transition-all duration-150 focus:border-[#0F6E56] focus:bg-white"
        {...props}
      />
    </div>
  );
}
