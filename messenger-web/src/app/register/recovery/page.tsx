"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { McButton } from "@/components/ui/McButton";
import { Copy, Check, FileText, Lock, ShieldAlert, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

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

const CustomRecoveryBrand = () => (
  <div className="flex-[1.2] min-w-0 pt-1.5">
    {/* Logo row */}
    <div className="flex items-center gap-4 mb-5">
      <McLogoIcon />
      <h1 className="font-[family-name:var(--font-heading)] text-[38px] font-extrabold text-[#1A1A1A] leading-none">
        Mess<span className="text-[#0F6E56]">&apos;Crypt</span>
      </h1>
    </div>

    <p className="font-[family-name:var(--font-heading)] text-[18px] font-bold text-[#1A1A1A] mb-2.5">
      Votre filet de sécurité ultime
    </p>
    <p className="text-[14px] text-[#4A5A54] leading-relaxed max-w-[270px] mb-6">
      Cette clé est la seule façon de récupérer vos messages si vous perdez accès à votre appareil ou oubliez votre PIN.
    </p>

    <div className="flex flex-col gap-3.5">
      <div className="flex items-start gap-2.5">
        <div className="w-[30px] h-[30px] shrink-0 rounded-lg bg-[#C8EBE0] flex items-center justify-center">
          <FileText size={16} strokeWidth={2.2} className="text-[#0F6E56]" />
        </div>
        <div className="text-[13px] text-[#4A5A54] leading-relaxed">
          <strong className="text-[#1A1A1A] font-semibold block mb-0.5">Notez-la hors ligne</strong>
          Écrivez les 12 mots sur papier, dans l&apos;ordre.
        </div>
      </div>
      <div className="flex items-start gap-2.5">
        <div className="w-[30px] h-[30px] shrink-0 rounded-lg bg-[#C8EBE0] flex items-center justify-center">
          <Lock size={16} strokeWidth={2.2} className="text-[#0F6E56]" />
        </div>
        <div className="text-[13px] text-[#4A5A54] leading-relaxed">
          <strong className="text-[#1A1A1A] font-semibold block mb-0.5">Gardez-la en lieu sûr</strong>
          Rangez-la séparément de votre appareil.
        </div>
      </div>
      <div className="flex items-start gap-2.5">
        <div className="w-[30px] h-[30px] shrink-0 rounded-lg bg-[#FAC77533] flex items-center justify-center">
          <ShieldAlert size={16} strokeWidth={2.2} className="text-[#BA7517]" />
        </div>
        <div className="text-[13px] text-[#4A5A54] leading-relaxed">
          <strong className="text-[#1A1A1A] font-semibold block mb-0.5">Ne la partagez jamais</strong>
          Ni à Mess&apos;Crypt, ni à personne d&apos;autre.
        </div>
      </div>
      <div className="flex items-start gap-2.5">
        <div className="w-[30px] h-[30px] shrink-0 rounded-lg bg-[#F5C4B333] flex items-center justify-center">
          <AlertTriangle size={16} strokeWidth={2.2} className="text-[#993C1D]" />
        </div>
        <div className="text-[13px] text-[#4A5A54] leading-relaxed">
          <strong className="text-[#1A1A1A] font-semibold block mb-0.5">Irrécupérable si perdue</strong>
          Mess&apos;Crypt ne peut pas la régénérer pour vous.
        </div>
      </div>
    </div>
  </div>
);

export default function RecoveryKeyPage() {
  const router = useRouter();
  
  // Try to get phrase from auth store, fallback to placeholder if accessed directly
  const storePhrase = useAuthStore((state) => state.recoveryPhrase);
  
  // Compute words directly during render
  const words = storePhrase 
    ? storePhrase.split(" ")
    : [
        "abeille", "calcaire", "drapeau", "éclipse",
        "faucon", "girolle", "horizon", "ivoire",
        "jardin", "kayak", "lumière", "mosaïque"
      ];

  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = () => {
    const text = words.map((w, i) => `${i + 1}. ${w}`).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleContinue = () => {
    // Clear phrase from memory for security
    useAuthStore.getState().setRecoveryPhrase(null);
    router.push("/");
  };

  return (
    <AuthLayout customBrand={<CustomRecoveryBrand />}>
      <p className="text-[11px] font-semibold tracking-[0.08em] text-[#0F6E56] uppercase mb-1.5">
        Étape 3 sur 3
      </p>
      <p className="font-[family-name:var(--font-heading)] text-[20px] font-extrabold text-[#1A1A1A] mb-1">
        Clé de récupération
      </p>
      <p className="text-[13px] text-[#7EA898] mb-5 leading-relaxed">
        Affiché une seule fois. Notez ces 12 mots dans l&apos;ordre exact.
      </p>

      {/* Alert banner */}
      <div className="flex items-start gap-2.5 bg-[#FFF4EC] border-[1.5px] border-[#F5C4B3] rounded-[10px] p-3 mb-5">
        <AlertTriangle size={16} strokeWidth={2.2} className="text-[#D85A30] shrink-0 mt-[1px]" />
        <div className="text-[12px] text-[#7A3A1A] leading-relaxed">
          <strong className="font-semibold block mb-0.5 text-[#5A2A0E]">
            Cette page ne s&apos;affichera plus jamais
          </strong>
          Une fois fermée, votre clé ne pourra être vue nulle part dans l&apos;application.
        </div>
      </div>

      {/* Words Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[12px] font-medium text-[#4A5A54]">
          12 mots — phrase mnémotechnique
        </span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 border rounded-md px-2.5 py-1 text-[12px] font-[family-name:var(--font-body)] transition-all duration-150 ${
            copied
              ? "bg-[#C8EBE0] border-[#0F6E56] text-[#0B5A44]"
              : "bg-transparent border-[#A8CDBF] text-[#0F6E56] hover:bg-[#C8EBE0] hover:border-[#0F6E56]"
          }`}
        >
          {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2.2} />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>

      {/* Words Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {words.map((word, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 bg-white border-[1.5px] border-[#A8CDBF] rounded-lg px-2 py-2 transition-colors hover:border-[#0F6E56]"
          >
            <span className="text-[10px] font-semibold text-[#A8CDBF] min-w-[14px] font-mono">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[13px] font-medium text-[#1A1A1A] font-mono tracking-[0.01em]">
              {word}
            </span>
          </div>
        ))}
      </div>

      {/* Checkbox */}
      <div className="flex items-start gap-2.5 mb-4 pt-1">
        <input
          type="checkbox"
          id="confirm"
          className="w-4 h-4 mt-[3px] accent-[#0F6E56] cursor-pointer shrink-0"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <label htmlFor="confirm" className="text-[13px] text-[#4A5A54] leading-relaxed cursor-pointer">
          J&apos;ai noté ma clé de récupération dans un endroit sûr et je comprends qu&apos;elle ne sera plus affichée.
        </label>
      </div>

      <McButton onClick={handleContinue} disabled={!confirmed}>
        Accéder à Mess&apos;Crypt
      </McButton>

      <div className="mt-3.5 text-center">
        <Link href="/register/username" onClick={() => useAuthStore.getState().setRecoveryPhrase(null)} className="text-[12px] text-[#7EA898] hover:text-[#4A5A54] hover:underline">
          Je l&apos;ai déjà notée, continuer sans recopier
        </Link>
      </div>
    </AuthLayout>
  );
}
