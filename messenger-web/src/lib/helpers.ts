/**
 * Utility helpers for Mess'Crypt UI.
 */

/** Generate avatar initials from first + last name */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** Pick a deterministic pastel background color from a string seed */
const AVATAR_COLORS = [
  { bg: "#C8EBE0", color: "#0B5A44" },
  { bg: "#B5D4F4", color: "#0C447C" },
  { bg: "#F4C0D1", color: "#72243E" },
  { bg: "#FAC775", color: "#633806" },
  { bg: "#C0DD97", color: "#27500A" },
  { bg: "#CECBF6", color: "#3C3489" },
  { bg: "#FFCBA4", color: "#6B3A0E" },
  { bg: "#A8E6CF", color: "#0B5941" },
];

export function getAvatarColor(seed: string): { bg: string; color: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Format a date string to a short time or day label */
export function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 2 * oneDay) return "Hier";

  const days = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
  if (diff < 7 * oneDay) return days[date.getDay()];

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

/** Validate email format using a regular expression */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format a relative time string for offline users
 */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Hors ligne";
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Actif à l'instant";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Actif il y a ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Actif il y a ${diffInHours} h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Actif hier";
  if (diffInDays < 7) return `Actif il y a ${diffInDays} jours`;
  
  return `Actif le ${date.toLocaleDateString("fr-FR")}`;
}

/** Generate an array of days from 1 to 31 */
export function getDays(): number[] {
  return Array.from({ length: 31 }, (_, i) => i + 1);
}

/** Generate an array of months */
export function getMonths(): { value: string; label: string }[] {
  return [
    { value: "01", label: "Janvier" },
    { value: "02", label: "Février" },
    { value: "03", label: "Mars" },
    { value: "04", label: "Avril" },
    { value: "05", label: "Mai" },
    { value: "06", label: "Juin" },
    { value: "07", label: "Juillet" },
    { value: "08", label: "Août" },
    { value: "09", label: "Septembre" },
    { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" },
    { value: "12", label: "Décembre" }
  ];
}

/** Generate an array of years from current year backwards */
export function getYears(count: number = 100): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => currentYear - i);
}
