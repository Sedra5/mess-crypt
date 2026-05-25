import { McBadge } from "@/components/ui/McBadge";
import { Lock, ShieldCheck } from "lucide-react";

/** SVG logo icon for the Mess'Crypt brand */
function McLogoIcon() {
  return (
    <div className="w-[64px] h-[64px] bg-[#0F6E56] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[#0F6E56]/20">
      <svg width="36" height="36" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M15 3C9.477 3 5 7.477 5 13c0 2.9 1.22 5.52 3.18 7.38L7 27l6.12-2.08A10.4 10.4 0 0015 25c5.523 0 10-4.477 10-10S20.523 3 15 3z" fill="white" opacity="0.95"/>
        <rect x="9.5" y="12" width="2.8" height="6" rx="1.4" fill="#0F6E56"/>
        <rect x="13.6" y="9.5" width="2.8" height="8.5" rx="1.4" fill="#0F6E56"/>
        <rect x="17.7" y="13" width="2.8" height="5" rx="1.4" fill="#0F6E56"/>
      </svg>
    </div>
  );
}

interface McBrandProps {
  /** Optional tagline override */
  tagline?: string;
  /** Whether to show the 3 steps instead of badges (for register page) */
  showSteps?: boolean;
}

export function McBrand({ tagline, showSteps }: McBrandProps) {
  return (
    <div className="flex-[1.2] min-w-0">
      {/* Logo row */}
      <div className="flex items-center gap-4 mb-5">
        <McLogoIcon />
        <h1 className="font-[family-name:var(--font-heading)] text-[38px] font-extrabold text-[#1A1A1A] leading-none">
          Mess<span className="text-[#0F6E56]">&apos;Crypt</span>
        </h1>
      </div>

      {/* Tagline */}
      <p className="text-[16px] text-[#4A5A54] leading-relaxed max-w-[320px] mb-6">
        {tagline || "Vos conversations privées, chiffrées de bout en bout. Personne d'autre ne peut les lire."}
      </p>

      {showSteps ? (
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 flex-shrink-0 bg-[#0F6E56] text-white rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">1</div>
            <div className="text-[13px] text-[#4A5A54] leading-relaxed">
              <strong className="text-[#1A1A1A] font-semibold block mb-0.5">Créez votre compte</strong>
              Quelques secondes suffisent.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 flex-shrink-0 bg-[#0F6E56] text-white rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">2</div>
            <div className="text-[13px] text-[#4A5A54] leading-relaxed">
              <strong className="text-[#1A1A1A] font-semibold block mb-0.5">Vérifiez votre identité</strong>
              Sécurisation du compte.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 flex-shrink-0 bg-[#0F6E56] text-white rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">3</div>
            <div className="text-[13px] text-[#4A5A54] leading-relaxed">
              <strong className="text-[#1A1A1A] font-semibold block mb-0.5">Commencez à chatter</strong>
              Tous vos messages sont chiffrés dès le départ.
            </div>
          </div>
        </div>
      ) : (
        /* Badges */
        <div className="flex gap-3 flex-wrap">
          <McBadge icon={<Lock size={14} strokeWidth={2.2} />}>
            Chiffrement E2E
          </McBadge>
          <McBadge icon={<ShieldCheck size={14} strokeWidth={2.2} />}>
            Zéro traçage
          </McBadge>
        </div>
      )}
    </div>
  );
}
