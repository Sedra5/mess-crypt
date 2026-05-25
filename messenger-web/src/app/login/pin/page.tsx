"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { deriveKeyFromPhrase, decryptPrivateKey } from "@/lib/crypto/recovery";
import { Loader2, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { McButton } from "@/components/ui/McButton";
import Link from "next/link";

export default function LoginPinPage() {
  const router = useRouter();
  const PIN_LENGTH = 4;
  
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handlePinChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= PIN_LENGTH) {
      setError(false);
      setPin(val);
      if (val.length === PIN_LENGTH) {
        await processPin(val);
      }
    }
  };

  const processPin = async (enteredPin: string) => {
    if (!user?.pinEncryptedPrivateKey) {
      setError(true);
      return;
    }
    
    setIsProcessing(true);
    try {
      // 1. Derive phraseKey from PIN using user.id as salt
      const phraseKey = await deriveKeyFromPhrase(enteredPin, user.id);

      // 2. Decrypt private key
      const privateKey = await decryptPrivateKey(user.pinEncryptedPrivateKey, phraseKey);

      // 3. Save to in-memory Zustand store instead of IndexedDB
      useAuthStore.getState().setPrivateKey(privateKey);

      router.push("/");
    } catch (err) {
      console.error("Error unlocking with PIN:", err);
      setError(true);
      setTimeout(() => {
        setPin("");
        inputRef.current?.focus();
      }, 600);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderDots = () => {
    return (
      <div className="flex justify-center gap-3 mb-6 relative" onClick={() => inputRef.current?.focus()}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const isFilled = i < pin.length;
          const isActive = i === pin.length;
          
          let classes = "w-[50px] h-[60px] bg-white border-[2px] border-[#A8CDBF] rounded-xl flex items-center justify-center transition-all duration-150 cursor-text relative ";
          
          if (error) {
            classes = "w-[50px] h-[60px] bg-[#FFF4EC] border-[2px] border-[#D85A30] rounded-xl flex items-center justify-center transition-all duration-150 relative animate-[shake_0.35s_ease-in-out] ";
          } else if (isFilled) {
            classes += "border-[#0F6E56] bg-[#F4FBF8] ";
          } else if (isActive) {
            classes += "border-[#0F6E56] ring-[3px] ring-[#0F6E56]/10 ";
          }
          
          return (
            <div key={i} className={classes}>
              {isFilled && (
                <div className={`w-3.5 h-3.5 rounded-full ${error ? "bg-[#D85A30]" : "bg-[#0F6E56]"}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!user) return null;

  return (
    <AuthLayout brandTagline="Saisissez votre PIN pour déverrouiller vos conversations de manière sécurisée.">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      <div className="text-center mb-8">
        <div className="w-[48px] h-[48px] mx-auto bg-[#C8EBE0] rounded-full flex items-center justify-center mb-4">
          <ShieldCheck size={24} className="text-[#0F6E56]" />
        </div>
        <p className="font-[family-name:var(--font-heading)] text-[22px] font-extrabold text-[#1A1A1A] mb-2">
          Entrez votre PIN
        </p>
        <p className="text-[14px] text-[#4A5A54] leading-relaxed max-w-[280px] mx-auto">
          Pour des raisons de sécurité, veuillez déverrouiller votre session
        </p>
      </div>

      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        maxLength={PIN_LENGTH}
        value={pin}
        onChange={handlePinChange}
        className="opacity-0 absolute w-0 h-0 -z-10"
        aria-hidden="true"
        disabled={isProcessing}
      />

      <div className="mb-4">
        {renderDots()}
        <div className={`text-center text-[13px] min-h-[20px] ${error ? "text-[#D85A30] font-medium" : "text-[#A8CDBF]"}`}>
          {error ? "PIN incorrect" : ""}
        </div>
      </div>

      <div className="flex justify-center mt-2 mb-6 min-h-[44px]">
        {isProcessing && (
          <div className="flex items-center gap-2 text-[#0F6E56] font-medium text-[14px]">
            <Loader2 className="animate-spin h-5 w-5" />
            Déchiffrement en cours...
          </div>
        )}
      </div>

      <div className="text-center pt-4 border-t border-[#E8F3EF]">
        <Link href="/login/recovery" className="text-[13px] font-medium text-[#0F6E56] hover:underline">
          PIN oublié ? Utiliser les 12 mots
        </Link>
      </div>
    </AuthLayout>
  );
}
