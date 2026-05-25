import { ReactNode } from "react";

interface McIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export function McIconButton({ children, className = "", ...props }: McIconButtonProps) {
  return (
    <button
      className={`w-[34px] h-[34px] rounded-lg bg-transparent border-none flex items-center justify-center cursor-pointer text-[#7EA898] transition-all duration-150 hover:bg-[#EAF6F1] hover:text-[#0F6E56] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
