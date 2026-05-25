import { MessageSquare, Search, Plus, Settings } from "lucide-react";
import { getInitials } from "@/lib/helpers";
import Link from "next/link";

interface NavRailProps {
  userFirstName: string;
  userLastName: string;
  hasUnread?: boolean;
  activeItem?: "messages" | "search" | "settings";
}

export function NavRail({ userFirstName, userLastName, hasUnread, activeItem = "messages" }: NavRailProps) {
  const initials = getInitials(userFirstName, userLastName);

  return (
    <nav className="w-16 h-screen bg-[#0A4A38] flex flex-col items-center py-5 shrink-0 z-10" aria-label="Navigation principale">
      {/* Logo */}
      <div className="w-10 h-10 bg-[#0F6E56] rounded-xl flex items-center justify-center mb-8 shrink-0">
        <svg width="24" height="24" viewBox="0 0 30 30" fill="none" aria-hidden="true">
          <path d="M15 3C9.477 3 5 7.477 5 13c0 2.9 1.22 5.52 3.18 7.38L7 27l6.12-2.08A10.4 10.4 0 0015 25c5.523 0 10-4.477 10-10S20.523 3 15 3z" fill="white" opacity="0.9"/>
          <rect x="9.5" y="12" width="2.5" height="5.5" rx="1.25" fill="#0F6E56"/>
          <rect x="13.3" y="9.5" width="2.5" height="8" rx="1.25" fill="#0F6E56"/>
          <rect x="17.1" y="13" width="2.5" height="4.5" rx="1.25" fill="#0F6E56"/>
        </svg>
      </div>

      {/* Nav items */}
      <div className="flex flex-col items-center gap-1 flex-1">
        <Link href="/">
          <button className={`nav-rail-btn relative ${activeItem === "messages" ? "active" : ""}`} title="Messages" aria-label="Messages">
            <MessageSquare size={20} strokeWidth={2} />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#3DDBA0] rounded-full border-[1.5px] border-[#0A4A38]" />
            )}
          </button>
        </Link>
        <Link href="/search">
          <button className={`nav-rail-btn ${activeItem === "search" ? "active" : ""}`} title="Recherche" aria-label="Recherche">
            <Search size={20} strokeWidth={2} />
          </button>
        </Link>
        <Link href="/search">
          <button className="nav-rail-btn" title="Nouveau message" aria-label="Nouveau message">
            <Plus size={20} strokeWidth={2} />
          </button>
        </Link>
      </div>

      {/* Bottom */}
      <div className="mt-auto flex flex-col items-center gap-2.5">
        <Link href="/settings">
          <button className={`nav-rail-btn ${activeItem === "settings" ? "active" : ""}`} title="Paramètres" aria-label="Paramètres">
            <Settings size={20} strokeWidth={2} />
          </button>
        </Link>
        <Link href="/profile" className="w-9 h-9 rounded-full bg-[#0F6E56] flex items-center justify-center font-[family-name:var(--font-heading)] font-bold text-[13px] text-white cursor-pointer border-2 border-white/20 hover:border-white/50 transition-colors" title="Mon profil">
          {initials}
        </Link>
      </div>
    </nav>
  );
}
