import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { McInput } from "./McInput";

interface McPasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
  label?: string;
}

export function McPasswordInput({ showStrength, ...props }: McPasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Evaluate strength based on the design logic
  const value = String(props.value || "");
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  const getStrengthData = () => {
    if (!value) return { text: "", color: "" };
    if (score <= 1) return { text: "Très faible", color: "text-[#D85A30]" };
    if (score === 2) return { text: "Moyen", color: "text-[#EF9F27]" };
    return { text: score === 3 ? "Fort" : "Très fort", color: "text-[#0F6E56]" };
  };

  const getBarColor = (index: number) => {
    if (!value || index >= score) return "bg-[#D4EAE3]";
    if (score <= 1) return "bg-[#D85A30]";
    if (score === 2) return "bg-[#EF9F27]";
    return "bg-[#0F6E56]";
  };

  const strengthData = getStrengthData();

  return (
    <div>
      <div className="relative">
        <McInput
          {...props}
          type={showPassword ? "text" : "password"}
          className={`pr-10 ${props.className || ""}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7EA898] hover:text-[#0F6E56] transition-colors focus:outline-none"
          aria-label="Afficher/masquer le mot de passe"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrength && (
        <div className="mt-[7px]">
          <div className="flex gap-1 h-[3px]">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 rounded-[2px] transition-colors duration-300 ${getBarColor(i)}`}
              />
            ))}
          </div>
          <div className={`text-[11px] mt-1 min-h-[14px] ${strengthData.color}`}>
            {strengthData.text}
          </div>
        </div>
      )}
    </div>
  );
}
