"use client";

interface SettingToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function SettingToggle({ checked, onChange }: SettingToggleProps) {
  return (
    <label className="relative w-[42px] h-6 cursor-pointer shrink-0">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label="Toggle"
      />
      <div
        className={`absolute inset-0 rounded-full transition-colors duration-200 ease-in-out ${
          checked ? "bg-[#0F6E56]" : "bg-[#D4EAE3]"
        }`}
      />
      <div
        className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-out pointer-events-none ${
          checked ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </label>
  );
}
