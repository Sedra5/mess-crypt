"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { deriveKeyFromPhrase, decryptPrivateKey } from "@/lib/crypto/recovery";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { McTextarea } from "@/components/ui/McInput";
import { McButton } from "@/components/ui/McButton";
import { McAlert } from "@/components/ui/McAlert";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function RecoveryPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.encryptedPrivateKey) {
      setError("Aucune clé privée chiffrée trouvée pour cet utilisateur.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const variations = [
        // 1. Raw phrase (just in case they typed it perfectly space-separated and we shouldn't touch it)
        phrase.trim(),
        // 2. Cleaned NFC (Standard)
        phrase.toLowerCase().normalize("NFC").replace(/[\d.]+/g, " ").trim().split(/\s+/).join(" "),
        // 3. Cleaned NFKD (BIP39 Standard)
        phrase.toLowerCase().normalize("NFKD").replace(/[\d.]+/g, " ").trim().split(/\s+/).join(" "),
        // 4. Cleaned NFD (Mac OS paste)
        phrase.toLowerCase().normalize("NFD").replace(/[\d.]+/g, " ").trim().split(/\s+/).join(" "),
      ];

      let privateKey: CryptoKey | null = null;
      let lastErr: any;

      for (const variant of variations) {
        try {
          const phraseKey = await deriveKeyFromPhrase(variant, user.id);
          privateKey = await decryptPrivateKey(user.encryptedPrivateKey, phraseKey);
          break; // Success!
        } catch (e) {
          lastErr = e;
          // Continue to next variation
        }
      }

      if (!privateKey) {
        throw lastErr || new Error("Failed to decrypt with all phrase variations");
      }

      useAuthStore.getState().setPrivateKey(privateKey);
      router.push("/");
    } catch (err) {
      console.error("Recovery failed:", err);
      setError("Phrase de récupération invalide ou échec du déchiffrement.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AuthLayout brandTagline="Un nouvel appareil a été détecté. Restaurez votre clé privée pour accéder à vos messages chiffrés.">
      <p className="font-[family-name:var(--font-heading)] text-[17px] font-bold text-[#1A1A1A] mb-2">
        Nouvel appareil détecté
      </p>
      <p className="text-[13px] text-[#4A5A54] mb-4 leading-relaxed">
        Entrez vos 12 mots de récupération pour restaurer l&apos;accès à vos messages.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <McAlert type="error">{error}</McAlert>}

        <div>
          <label htmlFor="phrase" className="block text-[11px] font-medium text-[#4A5A54] mb-1.5">
            Phrase de récupération
          </label>
          <McTextarea
            id="phrase"
            required
            rows={3}
            placeholder="mot1 mot2 mot3 mot4 ..."
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
          />
        </div>

        <McButton type="submit" disabled={isLoading || !phrase.trim()}>
          {isLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Restaurer l'accès"}
        </McButton>
      </form>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-[13px] font-semibold text-[#0F6E56] hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </AuthLayout>
  );
}
