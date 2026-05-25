"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { McInput } from "@/components/ui/McInput";
import { McPasswordInput } from "@/components/ui/McPasswordInput";
import { McButton } from "@/components/ui/McButton";
import { McDivider } from "@/components/ui/McDivider";
import { McAlert } from "@/components/ui/McAlert";
import { isValidEmail } from "@/lib/helpers";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await authService.login({ email, password });

      if (res.success && res.data) {
        const { user, accessToken, refreshToken } = res.data;
        setAuth(user, accessToken, refreshToken);

        if (user.pinEncryptedPrivateKey) {
          router.push("/login/pin");
        } else {
          router.push("/login/recovery");
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(errorObj.response?.data?.error || "Identifiants invalides");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <p className="font-[family-name:var(--font-heading)] text-[17px] font-bold text-[#1A1A1A] mb-4">
        Se connecter
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <McAlert type="error">{error}</McAlert>}

        <McInput
          id="email"
          label="Adresse e-mail"
          type="email"
          placeholder="jean@exemple.com"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouchedEmail(true)}
          error={touchedEmail && !isValidEmail(email) ? "Adresse e-mail invalide" : undefined}
        />

        <McPasswordInput
          id="password"
          label="Mot de passe"
          placeholder="Votre mot de passe"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <McButton type="submit" disabled={isLoading || !isFormValid}>
          {isLoading ? "Connexion..." : "Se connecter"}
        </McButton>
      </form>

      <Link href="#" className="block text-center mt-3 text-[13px] text-[#0F6E56] hover:underline">
        Mot de passe oublié ?
      </Link>

      <McDivider />

      <Link href="/register">
        <McButton variant="outline" type="button">
          Créer un nouveau compte
        </McButton>
      </Link>

      <p className="text-center mt-3.5 text-[11px] text-[#7EA898]">
        En continuant, vous acceptez nos conditions d&apos;utilisation.
      </p>
    </AuthLayout>
  );
}
