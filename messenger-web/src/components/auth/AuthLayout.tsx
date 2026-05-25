import { McBrand } from "@/components/auth/McBrand";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  /** Custom brand tagline */
  brandTagline?: string;
  /** Show steps instead of badges */
  showSteps?: boolean;
  /** Completely replace the left brand section */
  customBrand?: ReactNode;
}

/**
 * Shared layout for login, register, and recovery pages.
 * Two-column on desktop (brand | form), stacked on mobile.
 */
export function AuthLayout({ children, brandTagline, showSteps, customBrand }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#EAF6F1] flex items-center justify-center font-[family-name:var(--font-body)] px-4 py-8">
      <div className="flex items-center gap-16 max-w-[900px] w-full max-[620px]:flex-col max-[620px]:items-start max-[620px]:gap-8">
        {/* Brand side */}
        {customBrand ? customBrand : <McBrand tagline={brandTagline} showSteps={showSteps} />}

        {/* Form side */}
        <div className="flex-none w-[340px] max-[620px]:w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
