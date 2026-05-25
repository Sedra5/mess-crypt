interface McDividerProps {
  text?: string;
}

export function McDivider({ text = "ou" }: McDividerProps) {
  return (
    <div className="flex items-center gap-2.5 my-5">
      <div className="flex-1 h-px bg-[#A8CDBF]" />
      <span className="text-xs text-[#7EA898] whitespace-nowrap">{text}</span>
      <div className="flex-1 h-px bg-[#A8CDBF]" />
    </div>
  );
}
