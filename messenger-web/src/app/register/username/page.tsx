"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { NavRail } from "@/components/dashboard/NavRail";
import { userService } from "@/services/userService";
import { AtSign, ArrowRight, Loader2 } from "lucide-react";

const PSEUDO_MIN_LENGTH = 3;
const PSEUDO_MAX_LENGTH = 20;
const PSEUDO_REGEX = /^[a-zA-Z0-9_.]+$/;

function validatePseudo(value: string): string {
  if (!value.trim()) return "Le nom d'utilisateur est requis.";
  if (value.length < PSEUDO_MIN_LENGTH) return `Au moins ${PSEUDO_MIN_LENGTH} caractères requis.`;
  if (value.length > PSEUDO_MAX_LENGTH) return `Maximum ${PSEUDO_MAX_LENGTH} caractères.`;
  if (!PSEUDO_REGEX.test(value)) return "Seuls les lettres, chiffres, points et underscores sont autorisés.";
  return "";
}

export default function UsernameSetupPage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const [pseudo, setPseudo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
    } else {
      setPseudo(user.pseudo || "");
    }
  }, [isAuthenticated, user, router]);

  if (!user) return null;

  const validationError = touched ? validatePseudo(pseudo) : "";
  const isFormValid = pseudo.length >= PSEUDO_MIN_LENGTH && !validatePseudo(pseudo);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^a-zA-Z0-9_.]/g, "").toLowerCase();
    setPseudo(sanitized);
    setTouched(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const vError = validatePseudo(pseudo);
    if (vError) {
      setError(vError);
      return;
    }

    setIsLoading(true);
    setError("");

    const res = await userService.updateProfile({ pseudo: pseudo.trim() });
    if (res.success && res.data) {
      const token = useAuthStore.getState().accessToken;
      const refresh = useAuthStore.getState().refreshToken;
      if (token && refresh) {
        setAuth(res.data, token, refresh);
      }
      router.push("/");
    } else {
      setError(res.error || "Erreur lors de la mise à jour du nom d'utilisateur.");
    }
    setIsLoading(false);
  };

  const displayError = error || validationError;

  return (
    <div className="flex h-screen bg-[#EAF6F1] font-[family-name:var(--font-body)] overflow-hidden">
      {/* Disabled NavRail */}
      <div className="pointer-events-none opacity-60">
        <NavRail
          userFirstName={user.firstName}
          userLastName={user.lastName}
          activeItem="messages"
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md bg-white border border-[#D4EAE3] rounded-2xl p-8 shadow-sm animate-[fadeUp_0.3s_ease_both]">
          <div className="w-12 h-12 bg-[#EAF6F1] rounded-xl flex items-center justify-center mb-6">
            <AtSign className="text-[#0F6E56]" size={24} strokeWidth={2} />
          </div>
          
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-[24px] text-[#1A1A1A] mb-2">
            Choisissez un nom d&apos;utilisateur
          </h1>
          <p className="text-[14px] text-[#4A5A54] leading-relaxed mb-8">
            C&apos;est ainsi que vos contacts pourront vous rechercher sur Mess&apos;Crypt.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="pseudo" className="block text-[13px] font-semibold text-[#1A1A1A] mb-2">
                Nom d&apos;utilisateur
              </label>
              <div className="relative flex items-center">
                <AtSign className="absolute left-4 text-[#7EA898]" size={18} strokeWidth={2.5} />
                <input
                  id="pseudo"
                  type="text"
                  value={pseudo}
                  onChange={handleChange}
                  onBlur={() => setTouched(true)}
                  className={`w-full bg-[#EAF6F1] border-[1.5px] rounded-[12px] pl-11 pr-4 py-3.5 text-[15px] font-[family-name:var(--font-body)] text-[#1A1A1A] outline-none transition-colors ${
                    displayError ? "border-[#D85A30] focus:border-[#D85A30] bg-[#FFF4EC]" : "border-transparent focus:border-[#0F6E56] focus:bg-white"
                  }`}
                  placeholder="pseudo.123"
                  autoComplete="off"
                  autoFocus
                />
              </div>
              {displayError && (
                <p className="text-[12px] text-[#D85A30] mt-2 font-medium animate-[fadeUp_0.2s_ease]">{displayError}</p>
              )}
              {!displayError && pseudo.length >= PSEUDO_MIN_LENGTH && (
                <p className="text-[12px] text-[#1A9E78] mt-2 font-medium">✓ Nom d&apos;utilisateur valide</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full mt-2 bg-[#0F6E56] hover:bg-[#0A4A38] text-white rounded-[12px] py-3.5 font-semibold text-[15px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Valider et continuer <ArrowRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
