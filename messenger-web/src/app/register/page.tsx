"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { generateKeyPair, exportPublicKey } from "@/lib/crypto/keys";
import { deriveKeyFromPhrase, encryptPrivateKey } from "@/lib/crypto/recovery";
import { savePrivateKey } from "@/lib/crypto/store";
import { userService } from "@/services/userService";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { McInput, McSelect } from "@/components/ui/McInput";
import { McButton } from "@/components/ui/McButton";
import { McAlert } from "@/components/ui/McAlert";
import { McPasswordInput } from "@/components/ui/McPasswordInput";
import Link from "next/link";
import { isValidEmail, getDays, getMonths, getYears } from "@/lib/helpers";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    pseudo: "",
    email: "",
    password: "",
    gender: "",
  });

  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [touchedEmail, setTouchedEmail] = useState(false);

  const isFormValid = 
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password.trim() !== "" &&
    formData.password.length >= 8 &&
    formData.gender !== "" &&
    birthDay !== "" &&
    birthMonth !== "" &&
    birthYear !== "" &&
    acceptedTerms;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isAdult = () => {
    if (!birthDay || !birthMonth || !birthYear) return false;
    const today = new Date();
    const bDate = new Date(Number(birthYear), Number(birthMonth) - 1, Number(birthDay));
    let age = today.getFullYear() - bDate.getFullYear();
    const m = today.getMonth() - bDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const days = getDays();
  const months = getMonths();
  const years = getYears();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidEmail(formData.email)) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions d'utilisation.");
      return;
    }
    if (!birthDay || !birthMonth || !birthYear) {
      setError("Veuillez renseigner votre date de naissance complète.");
      return;
    }
    
    if (!isAdult()) {
      setError("Vous devez avoir au moins 18 ans pour créer un compte.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      setStatus("Génération des clés de chiffrement...");
      const keyPair = await generateKeyPair();
      const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);

      setStatus("Création de la phrase de récupération...");
      const phraseResult = await userService.generateRecoveryPhrase();
      if (!phraseResult.success || !phraseResult.data) {
        throw new Error(phraseResult.error || "Impossible de générer la phrase de récupération");
      }
      const phrase = phraseResult.data;
      
      const phraseKey = await deriveKeyFromPhrase(phrase);
      const encryptedPrivKeyBase64 = await encryptPrivateKey(keyPair.privateKey, phraseKey);

      setStatus("Création du compte...");
      const birthDate = `${birthYear}-${birthMonth}-${birthDay.padStart(2, "0")}`;

      const autoPseudo = formData.pseudo || `${formData.firstName}${formData.lastName}${Math.floor(Math.random() * 10000)}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      
      const payload = {
        ...formData,
        pseudo: autoPseudo,
        birthDate,
        publicKey: publicKeyBase64,
        encryptedPrivateKey: encryptedPrivKeyBase64,
      };

      const res = await authService.register(payload);

      if (res.success && res.data) {
        const { user, accessToken, refreshToken } = res.data;
        setStatus("Sécurisation de la clé privée...");
        await savePrivateKey(user.id, keyPair.privateKey);
        setAuth(user, accessToken, refreshToken);
        useAuthStore.getState().setRecoveryPhrase(phrase);
        router.push("/register/pin");
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { errors?: Record<string, string[]>; error?: string } } };
      if (errorObj.response?.data?.errors) {
        const validationErrors = Object.values(errorObj.response.data.errors).flat().join(", ");
        setError(validationErrors);
      } else {
        setError(errorObj.response?.data?.error || "L'inscription a échoué");
      }
    } finally {
      setIsLoading(false);
      setStatus("");
    }
  };



  // ── Registration form ──
  return (
    <AuthLayout 
      brandTagline="Rejoignez des millions d'utilisateurs qui protègent leurs échanges avec Mess'Crypt."
      showSteps={true}
    >
      <div className="mb-4">
        <p className="font-[family-name:var(--font-heading)] text-[17px] font-bold text-[#1A1A1A] mb-1">
          Créer un compte
        </p>
        <p className="text-[13px] text-[#7EA898]">
          C&apos;est rapide et gratuit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <McAlert type="error">{error}</McAlert>}

        {/* First Name / Last Name */}
        <div className="grid grid-cols-2 gap-2.5">
          <McInput
            id="firstName"
            name="firstName"
            label="Prénom"
            placeholder="Jean"
            required
            autoComplete="given-name"
            onChange={handleChange}
          />
          <McInput
            id="lastName"
            name="lastName"
            label="Nom"
            placeholder="Dupont"
            required
            autoComplete="family-name"
            onChange={handleChange}
          />
        </div>



        <McInput
          id="email"
          name="email"
          label="Email ou numéro de téléphone"
          type="email"
          placeholder="jean@exemple.com"
          required
          autoComplete="email"
          onChange={handleChange}
          onBlur={() => setTouchedEmail(true)}
          error={touchedEmail && !isValidEmail(formData.email) ? "Adresse e-mail invalide" : undefined}
        />

        {/* Birth date — 3 selectors */}
        <div>
          <label className="block text-[12px] font-medium text-[#4A5A54] mb-1.5">Date de naissance</label>
          <div className="flex gap-2">
            <McSelect aria-label="Jour" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="flex-1">
              <option value="" disabled>Jour</option>
              {days.map((d) => (
                <option key={d} value={String(d).padStart(2, "0")}>{d}</option>
              ))}
            </McSelect>
            <McSelect aria-label="Mois" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="flex-[1.6]">
              <option value="" disabled>Mois</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </McSelect>
            <McSelect aria-label="Année" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="flex-[1.3]">
              <option value="" disabled>Année</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </McSelect>
          </div>
        </div>

        {/* Gender */}
        <McSelect id="gender" name="gender" label="Genre" value={formData.gender} onChange={handleChange} required>
          <option value="" disabled>Sélectionner</option>
          <option value="homme">Homme</option>
          <option value="femme">Femme</option>
          <option value="autre">Autre</option>
          <option value="non-precise">Préfère ne pas préciser</option>
        </McSelect>

        {/* Password */}
        <McPasswordInput
          id="password"
          name="password"
          label="Mot de passe"
          placeholder="Minimum 8 caractères"
          required
          autoComplete="new-password"
          showStrength={true}
          value={formData.password}
          onChange={handleChange}
        />

        {/* Checkbox */}
        <div className="flex items-start gap-2 mb-4 pt-1">
          <input
            type="checkbox"
            id="cgu"
            className="w-4 h-4 mt-0.5 accent-[#0F6E56] cursor-pointer shrink-0"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <label htmlFor="cgu" className="text-[12px] text-[#4A5A54] leading-relaxed cursor-pointer">
            J&apos;accepte les <Link href="#" className="text-[#0F6E56] hover:underline">conditions d&apos;utilisation</Link> et la <Link href="#" className="text-[#0F6E56] hover:underline">politique de confidentialité</Link> de Mess&apos;Crypt.
          </label>
        </div>

        <McButton type="submit" disabled={isLoading || !isFormValid}>
          {isLoading ? status || "Traitement..." : "Créer mon compte"}
        </McButton>
      </form>

      <div className="mt-4 text-center">
        <p className="text-[13px] text-[#4A5A54]">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-[#0F6E56] hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
