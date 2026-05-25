"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { deriveKeyFromPhrase, encryptPrivateKey } from "@/lib/crypto/recovery";
import { getPrivateKey } from "@/lib/crypto/store";
import { userService } from "@/services/userService";
import { Loader2, ShieldCheck, Lock, KeyRound } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { McButton } from "@/components/ui/McButton";

/** SVG logo icon for the Mess'Crypt brand (exported for reuse if needed, or inline here) */
function McLogoIcon() {
  return (
    <div className="w-[64px] h-[64px] bg-[#0F6E56] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[#0F6E56]/20">
      <svg width="36" height="36" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M15 3C9.477 3 5 7.477 5 13c0 2.9 1.22 5.52 3.18 7.38L7 27l6.12-2.08A10.4 10.4 0 0015 25c5.523 0 10-4.477 10-10S20.523 3 15 3z" fill="white" opacity="0.95" />
        <rect x="9.5" y="12" width="2.8" height="6" rx="1.4" fill="#0F6E56" />
        <rect x="13.6" y="9.5" width="2.8" height="8.5" rx="1.4" fill="#0F6E56" />
        <rect x="17.7" y="13" width="2.8" height="5" rx="1.4" fill="#0F6E56" />
      </svg>
    </div>
  );
}

const CustomPinBrand = () => (
  <div className="flex-[1.2] min-w-0 pt-1.5">
    {/* Logo row */}
    <div className="flex items-center gap-4 mb-5">
      <McLogoIcon />
      <h1 className="font-[family-name:var(--font-heading)] text-[38px] font-extrabold text-[#1A1A1A] leading-none">
        Mess<span className="text-[#0F6E56]">&apos;Crypt</span>
      </h1>
    </div>

    <p className="font-[family-name:var(--font-heading)] text-[18px] font-bold text-[#1A1A1A] mb-2.5">
      Votre PIN, votre verrou
    </p>
    <p className="text-[14px] text-[#4A5A54] leading-relaxed max-w-[270px] mb-6">
      Le PIN chiffre votre clé privée RSA localement. Sans lui, personne — pas même Mess&apos;Crypt — ne peut lire vos messages.
    </p>

    <div className="flex flex-col gap-3.5">
      <div className="flex items-start gap-2.5">
        <div className="w-[30px] h-[30px] shrink-0 rounded-lg bg-[#C8EBE0] flex items-center justify-center">
          <ShieldCheck size={16} strokeWidth={2.2} className="text-[#0F6E56]" />
        </div>
        <div className="text-[13px] text-[#4A5A54] leading-relaxed">
          <strong className="text-[#1A1A1A] font-semibold block mb-0.5">Chiffrement local</strong>
          Votre PIN n&apos;est jamais envoyé au serveur.
        </div>
      </div>
      <div className="flex items-start gap-2.5">
        <div className="w-[30px] h-[30px] shrink-0 rounded-lg bg-[#C8EBE0] flex items-center justify-center">
          <Lock size={16} strokeWidth={2.2} className="text-[#0F6E56]" />
        </div>
        <div className="text-[13px] text-[#4A5A54] leading-relaxed">
          <strong className="text-[#1A1A1A] font-semibold block mb-0.5">Demandé à chaque session</strong>
          Pour déverrouiller vos conversations.
        </div>
      </div>
      <div className="flex items-start gap-2.5">
        <div className="w-[30px] h-[30px] shrink-0 rounded-lg bg-[#C8EBE0] flex items-center justify-center">
          <KeyRound size={16} strokeWidth={2.2} className="text-[#0F6E56]" />
        </div>
        <div className="text-[13px] text-[#4A5A54] leading-relaxed">
          <strong className="text-[#1A1A1A] font-semibold block mb-0.5">Dérivé avec PBKDF2</strong>
          100 000 itérations — résistant au brute-force.
        </div>
      </div>
    </div>
  </div>
);

export default function PinPage() {
  const router = useRouter();
  const PIN_LENGTH = 4;

  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [activeField, setActiveField] = useState<1 | 2>(1);
  const [error, setError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const user = useAuthStore((state) => state.user);

  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeField === 1) input1Ref.current?.focus();
    else input2Ref.current?.focus();
  }, [activeField]);

  const handlePin1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= PIN_LENGTH) {
      setPin1(val);
      if (val.length === PIN_LENGTH) {
        setTimeout(() => setActiveField(2), 150);
      }
    }
  };

  const handlePin2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= PIN_LENGTH) {
      setError(false);
      setPin2(val);
      if (val.length === PIN_LENGTH) {
        if (pin1 !== val) {
          setError(true);
          setTimeout(() => {
            setPin2("");
            input2Ref.current?.focus();
          }, 600);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (pin1 === pin2 && pin1.length === PIN_LENGTH && user) {
      setIsProcessing(true);
      try {
        // 1. Get private key from IndexedDB store
        const privateKey = await getPrivateKey(user.id);
        if (!privateKey) throw new Error("Clé privée introuvable");

        // 2. Derive phraseKey from PIN using user.id as salt
        const phraseKey = await deriveKeyFromPhrase(pin1, user.id);

        // 3. Encrypt private key
        const encryptedPrivKeyBase64 = await encryptPrivateKey(privateKey, phraseKey);

        // 4. Send to backend
        const res = await userService.storePinBackup(encryptedPrivKeyBase64, "messenger-recovery-salt-v1");

        if (res.success) {
          console.log("PIN successfully created and backed up.");
          router.push("/register/recovery");
        } else {
          console.error("Failed to store PIN backup:", res.error);
          // Show error toast in real app
          setError(true);
        }
      } catch (err) {
        console.error("Error setting up PIN:", err);
        setError(true);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const renderDots = (value: string, field: 1 | 2) => {
    const isError = field === 2 && error;
    const isSuccess = field === 2 && value.length === PIN_LENGTH && value === pin1;

    return (
      <div className="flex gap-2.5 mb-2 relative" onClick={() => field === 1 ? input1Ref.current?.focus() : input2Ref.current?.focus()}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const isFilled = i < value.length;
          const isActive = i === value.length && activeField === field;

          let classes = "w-[44px] h-[52px] bg-white border-[1.5px] border-[#A8CDBF] rounded-[10px] flex items-center justify-center transition-all duration-150 cursor-text relative ";

          if (isError) {
            classes = "w-[44px] h-[52px] bg-[#FFF4EC] border-[1.5px] border-[#D85A30] rounded-[10px] flex items-center justify-center transition-all duration-150 relative animate-[shake_0.35s_ease-in-out] ";
          } else if (isSuccess) {
            classes = "w-[44px] h-[52px] bg-[#C8EBE0] border-[1.5px] border-[#0F6E56] rounded-[10px] flex items-center justify-center transition-all duration-150 relative ";
          } else if (isFilled) {
            classes += "border-[#0F6E56] bg-[#F4FBF8] ";
          } else if (isActive) {
            classes += "border-[#0F6E56] ring-[3px] ring-[#0F6E56]/10 ";
          }

          return (
            <div key={i} className={classes}>
              {isFilled && (
                <div className={`w-3 h-3 rounded-full ${isError ? "bg-[#D85A30]" : "bg-[#0F6E56]"}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AuthLayout customBrand={<CustomPinBrand />}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      <p className="text-[11px] font-semibold tracking-[0.08em] text-[#0F6E56] uppercase mb-1.5">
        Étape 2 sur 3
      </p>
      <p className="font-[family-name:var(--font-heading)] text-[20px] font-extrabold text-[#1A1A1A] mb-1">
        Créer votre PIN
      </p>
      <p className="text-[13px] text-[#7EA898] mb-7 leading-relaxed">
        Choisissez un PIN de {PIN_LENGTH} chiffres pour sécuriser vos messages.
      </p>

      {/* Invisible inputs for native keyboard handling */}
      <input
        ref={input1Ref}
        type="password"
        inputMode="numeric"
        maxLength={PIN_LENGTH}
        value={pin1}
        onChange={handlePin1Change}
        className="opacity-0 absolute w-0 h-0 -z-10"
      />
      <input
        ref={input2Ref}
        type="password"
        inputMode="numeric"
        maxLength={PIN_LENGTH}
        value={pin2}
        onChange={handlePin2Change}
        className="opacity-0 absolute w-0 h-0 -z-10"
      />

      {/* PIN entry 1 */}
      <div className={`mb-5 transition-opacity ${activeField === 2 && pin1.length === PIN_LENGTH ? "opacity-50" : "opacity-100"}`}>
        <div className="text-[12px] font-medium text-[#4A5A54] mb-3 flex items-center gap-1.5">
          <ShieldCheck size={13} strokeWidth={2.2} />
          Saisir le PIN
        </div>
        {renderDots(pin1, 1)}
        <div className={`text-[11px] min-h-[16px] ${pin1.length === PIN_LENGTH ? "text-[#0F6E56]" : "text-[#A8CDBF]"}`}>
          {pin1.length === PIN_LENGTH ? "PIN saisi ✓" : "Saisissez 4 chiffres"}
        </div>
      </div>

      {/* PIN entry 2 (Confirm) */}
      <div className={`mb-7 transition-opacity ${activeField === 1 ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
        <div className="text-[12px] font-medium text-[#4A5A54] mb-3 flex items-center gap-1.5">
          <Lock size={13} strokeWidth={2.2} />
          Confirmer le PIN
        </div>
        {renderDots(pin2, 2)}
        <div className={`text-[11px] min-h-[16px] ${error ? "text-[#D85A30]" : pin2.length === PIN_LENGTH && pin1 === pin2 ? "text-[#0F6E56]" : "text-[#A8CDBF]"}`}>
          {error ? "Les PIN ne correspondent pas" : pin2.length === PIN_LENGTH && pin1 === pin2 ? "PIN confirmé ✓" : "Resaisissez le même PIN"}
        </div>
        <McButton
          className="mt-8"
          onClick={handleSubmit}
          disabled={pin1.length !== PIN_LENGTH || pin2.length !== PIN_LENGTH || error || isProcessing}
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : "Confirmer le PIN"}
        </McButton>
      </div>
    </AuthLayout>
  );
}
