import { getInitials, getAvatarColor } from "@/lib/helpers";

interface McAvatarProps {
  firstName: string;
  lastName: string;
  /** Show online dot */
  online?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  className?: string;
}

export function McAvatar({ firstName, lastName, online, size = "md", className = "" }: McAvatarProps) {
  const initials = getInitials(firstName, lastName);
  const { bg, color } = getAvatarColor(firstName + lastName);

  const sizeClasses = size === "sm"
    ? "w-9 h-9 text-[13px]"
    : "w-11 h-11 text-[15px]";

  return (
    <div
      className={`relative rounded-full flex-shrink-0 flex items-center justify-center font-semibold ${sizeClasses} ${className}`}
      style={{ backgroundColor: bg, color }}
    >
      {initials}
      {online && (
        <span className="absolute bottom-[1px] right-[1px] w-2.5 h-2.5 bg-[#1D9E75] rounded-full border-2 border-white" />
      )}
    </div>
  );
}
