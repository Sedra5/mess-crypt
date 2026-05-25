/**
 * Mess'Crypt Design System — Theme Tokens
 * Colors, fonts, and reusable style constants.
 */

export const theme = {
  colors: {
    // Primary greens
    primary: "#0F6E56",
    primaryHover: "#0B5A44",
    primaryLight: "#C8EBE0",
    primaryBg: "#EAF6F1",

    // Text
    textDark: "#1A1A1A",
    textMuted: "#4A5A54",
    textPlaceholder: "#7EA898",

    // Borders & surfaces
    border: "#A8CDBF",
    surface: "#FFFFFF",
    inputBg: "#FFFFFF",

    // Semantic
    error: "#D93025",
    errorBg: "#FEF2F2",
    errorBorder: "#FECACA",
    success: "#0F6E56",
    successBg: "#ECFDF5",
  },

  fonts: {
    heading: "'Sora', sans-serif",
    body: "'DM Sans', sans-serif",
  },

  radius: {
    sm: "8px",
    md: "10px",
    lg: "16px",
  },
} as const;

/** Tailwind-compatible class strings derived from our theme */
export const tw = {
  input:
    "w-full px-3.5 py-3 text-[15px] rounded-[10px] border-[1.5px] border-[#A8CDBF] bg-white text-[#1A1A1A] placeholder-[#7EA898] outline-none transition-all duration-150 focus:border-[#0F6E56] focus:ring-[3px] focus:ring-[#0F6E56]/10 font-[family-name:var(--font-body)]",

  btnPrimary:
    "w-full py-3 text-base font-semibold rounded-[10px] bg-[#0F6E56] text-white border-none cursor-pointer transition-all duration-150 hover:bg-[#0B5A44] active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-body)]",

  btnOutline:
    "w-full py-3 text-[15px] font-semibold rounded-[10px] bg-transparent text-[#0F6E56] border-[1.5px] border-[#0F6E56] cursor-pointer transition-all duration-150 hover:bg-[#0F6E56]/[0.07] font-[family-name:var(--font-body)]",

  select:
    "w-full px-3 py-3 text-[15px] rounded-[10px] border-[1.5px] border-[#A8CDBF] bg-white text-[#1A1A1A] outline-none transition-all duration-150 focus:border-[#0F6E56] focus:ring-[3px] focus:ring-[#0F6E56]/10 appearance-none cursor-pointer font-[family-name:var(--font-body)] mc-select-icon",
} as const;
