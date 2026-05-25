import { tw } from "@/lib/theme";

type ButtonVariant = "primary" | "outline";

interface McButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  className?: string;
}

export function McButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: McButtonProps) {
  const base = variant === "outline" ? tw.btnOutline : tw.btnPrimary;
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}
