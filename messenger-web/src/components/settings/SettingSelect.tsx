"use client";

interface SettingSelectProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export function SettingSelect({ options, value, onChange }: SettingSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="Sélection"
      className="pl-3 pr-7 py-[7px] border-[1.5px] border-[#D4EAE3] rounded-[9px] bg-white font-[family-name:var(--font-body)] text-[13px] text-[#1A1A1A] outline-none cursor-pointer appearance-none transition-colors focus:border-[#0F6E56]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237EA898' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      {options.map((opt) => (
        <option key={opt}>{opt}</option>
      ))}
    </select>
  );
}
