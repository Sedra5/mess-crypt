"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useChatStore } from "@/store/chatStore";
import { userService } from "@/services/userService";
import { authService } from "@/services/authService";
import { NavRail } from "@/components/dashboard/NavRail";
import { McAvatar } from "@/components/ui/McAvatar";
import { McInput, McTextarea } from "@/components/ui/McInput";
import { McPasswordInput } from "@/components/ui/McPasswordInput";
import { ArrowLeft, MessageSquare, Calendar, Shield, LogOut, Edit2, Key, Lock, Trash2, Check, AlertCircle, Loader2, X } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { isReady, user } = useAuthGuard();
  const { logout, refreshToken, setAuth, recoveryPhrase } = useAuthStore();
  const { conversations } = useChatStore();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    pseudo: user?.pseudo || "",
    bio: "Développeur full-stack passionné de sécurité informatique." // Mock for now
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Password modal state
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  // Auth guard handled by useAuthGuard hook
  if (!isReady || !user) return null;

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = "Le prénom est requis.";
    if (!formData.lastName.trim()) errors.lastName = "Le nom est requis.";
    if (!formData.pseudo.trim()) errors.pseudo = "Le pseudo est requis.";
    else if (formData.pseudo.length < 3) errors.pseudo = "Minimum 3 caractères.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    setSaveStatus("idle");

    const res = await userService.updateProfile({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      pseudo: formData.pseudo.trim(),
    });

    if (res.success && res.data) {
      setAuth(res.data, useAuthStore.getState().accessToken!, refreshToken!);
      setSaveStatus("success");
      setSaveMessage("Profil mis à jour avec succès !");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setSaveStatus("error");
      setSaveMessage(res.error || "Échec de la mise à jour du profil.");
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (err) {
      console.error("Logout API failed", err);
    }
    logout();
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPwd || newPwd.length < 8) {
      setPwdError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setIsUpdatingPwd(true);
    const res = await userService.updatePassword(currentPwd, newPwd);
    setIsUpdatingPwd(false);

    if (res.success) {
      setPwdSuccess("Mot de passe mis à jour avec succès.");
      setTimeout(() => {
        setShowPwdModal(false);
        setCurrentPwd("");
        setNewPwd("");
        setPwdSuccess("");
      }, 2000);
    } else {
      setPwdError(res.error || "Erreur lors de la mise à jour du mot de passe.");
    }
  };

  if (!user) return null;

  const memberSince = "Janvier 2024";
  
  let formattedBirthDate = "N/A";
  if (user.birthDate) {
      const bDate = new Date(user.birthDate);
      formattedBirthDate = `${bDate.getDate().toString().padStart(2, '0')} / ${(bDate.getMonth() + 1).toString().padStart(2, '0')} / ${bDate.getFullYear()}`;
  }

  // Active conversations count
  const activeConversations = conversations.length;

  return (
    <div className="flex h-screen bg-[#EAF6F1] font-[family-name:var(--font-body)] overflow-hidden">
      
      <NavRail
        userFirstName={user.firstName}
        userLastName={user.lastName}
        activeItem="settings"
      />

      {/* PAGE WRAP */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-8 py-10 pb-[60px] gap-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#D4EAE3] [&::-webkit-scrollbar-thumb]:rounded">
        
        {/* HEADER */}
        <div className="w-full max-w-[760px] flex items-center justify-between animate-[fadeUp_0.3s_ease_both]">
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-[#1A1A1A]">Mon profil</h1>
          <button 
            onClick={() => router.push("/")}
            className="flex items-center gap-[7px] px-4 py-2 rounded-[10px] border-[1.5px] border-[#D4EAE3] bg-white font-[family-name:var(--font-body)] text-[14px] font-medium text-[#4A5A54] cursor-pointer transition-all hover:border-[#A8CDBF] hover:bg-[#EAF6F1]"
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Retour
          </button>
        </div>

        {/* GRID */}
        <div className="w-full max-w-[760px] grid grid-cols-[240px_1fr] grid-rows-[auto_auto] gap-5 animate-[fadeUp_0.35s_ease_0.05s_both]">
          
          {/* AVATAR CARD */}
          <div className="row-span-2 flex flex-col items-center bg-white rounded-2xl border border-[#D4EAE3] p-7 pt-7 pb-6 animate-[fadeUp_0.35s_ease_0.08s_both]">
            
            <div className="relative mb-3.5">
              <McAvatar 
                firstName={user.firstName} 
                lastName={user.lastName} 
                className="!w-[100px] !h-[100px] !text-[32px] !border-[4px] !border-[#EAF6F1]" 
              />
              <button 
                className="absolute bottom-[2px] right-[2px] w-7 h-7 rounded-full bg-[#0F6E56] border-[2.5px] border-white flex items-center justify-center text-white cursor-pointer transition-colors hover:bg-[#0A4A38]"
                title="Changer la photo"
              >
                <Edit2 size={13} strokeWidth={2.5} />
              </button>
            </div>

            <div className="font-[family-name:var(--font-heading)] font-extrabold text-[18px] text-[#1A1A1A] text-center mb-1">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-[13px] text-[#7EA898] mb-3.5">@{user.pseudo}</div>
            
            <div className="inline-flex items-center gap-[5px] bg-[#3DDBA0]/10 border border-[#3DDBA0]/30 rounded-full px-3 py-1 text-[11px] font-semibold text-[#1A9E78] mb-5">
              <span className="w-1.5 h-1.5 bg-[#3DDBA0] rounded-full" />
              En ligne
            </div>

            <div className="w-full h-px bg-[#EAF6F1] my-1 mb-[18px]" />

            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[9px] bg-[#EAF6F1] flex items-center justify-center text-[#0F6E56] shrink-0">
                  <MessageSquare size={15} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] text-[#7EA898]">Conversations</div>
                  <div className="text-[14px] font-semibold text-[#1A1A1A]">{activeConversations} actives</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[9px] bg-[#EAF6F1] flex items-center justify-center text-[#0F6E56] shrink-0">
                  <Calendar size={15} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] text-[#7EA898]">Membre depuis</div>
                  <div className="text-[14px] font-semibold text-[#1A1A1A] capitalize">{memberSince}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[9px] bg-[#EAF6F1] flex items-center justify-center text-[#0F6E56] shrink-0">
                  <Shield size={15} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] text-[#7EA898]">Chiffrement</div>
                  <div className="text-[14px] font-semibold text-[#1A1A1A]">RSA-OAEP actif</div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-[#EAF6F1] mt-[18px] mb-3.5" />

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-[10px] bg-transparent border-[1.5px] border-[#FBDDD3] font-[family-name:var(--font-body)] text-[14px] font-medium text-[#D85A30] cursor-pointer transition-colors hover:bg-[#FFF5F2]"
            >
              <LogOut size={15} strokeWidth={2} />
              Se déconnecter
            </button>
          </div>

          {/* INFO CARD */}
          <div className="bg-white rounded-2xl border border-[#D4EAE3] p-6 animate-[fadeUp_0.35s_ease_0.12s_both]">
            <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] mb-[18px] flex items-center justify-between">
              Informations personnelles
            </div>

            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-2 gap-3.5">
                <McInput 
                  label="Prénom"
                  placeholder="Votre prénom"
                  value={formData.firstName}
                  onChange={(e) => { setFormData({...formData, firstName: e.target.value}); setFormErrors({...formErrors, firstName: ""}); }}
                  error={formErrors.firstName}
                />
                <McInput 
                  label="Nom"
                  placeholder="Votre nom"
                  value={formData.lastName}
                  onChange={(e) => { setFormData({...formData, lastName: e.target.value}); setFormErrors({...formErrors, lastName: ""}); }}
                  error={formErrors.lastName}
                />
                <div className="relative pt-[22px]">
                  <label className="absolute top-0 left-0 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#7EA898]">Pseudo</label>
                  <span className="absolute left-[13px] top-[calc(50%+11px)] -translate-y-1/2 text-[14px] text-[#7EA898] pointer-events-none z-10">@</span>
                  <McInput 
                    className="pl-6"
                    placeholder="mon.pseudo"
                    value={formData.pseudo}
                    onChange={(e) => { setFormData({...formData, pseudo: e.target.value}); setFormErrors({...formErrors, pseudo: ""}); }}
                    error={formErrors.pseudo}
                  />
                </div>
                <div className="flex flex-col gap-[5px]">
                  <McInput 
                    label="Date de naissance"
                    value={formattedBirthDate}
                    disabled
                    className="bg-[#EAF6F1] cursor-not-allowed"
                  />
                  <span className="text-[11px] text-[#7EA898]">Non modifiable après inscription.</span>
                </div>
                <div className="col-span-2">
                  <McInput 
                    label="Email"
                    type="email" 
                    value={user.email}
                    disabled
                    className="bg-[#EAF6F1] cursor-not-allowed"
                  />
                </div>
                <div className="col-span-2">
                  <McTextarea 
                    label="Bio"
                    rows={2} 
                    className="w-full resize-none leading-relaxed placeholder:text-[#7EA898]"
                    placeholder="Parlez-nous de vous…"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
                </div>
              </div>

              {saveStatus !== "idle" && (
                <div className={`flex items-center gap-2 text-[13px] font-medium ${
                  saveStatus === "success" ? "text-[#1A9E78]" : "text-[#D85A30]"
                }`}>
                  {saveStatus === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                  {saveMessage}
                </div>
              )}

              <div className="flex justify-end gap-2.5 mt-5 pt-4 border-t border-[#EAF6F1]">
                <button 
                  type="button" 
                  onClick={() => {
                    setFormData({
                      firstName: user.firstName,
                      lastName: user.lastName,
                      pseudo: user.pseudo,
                      bio: formData.bio,
                    });
                    setFormErrors({});
                  }}
                  className="px-4 py-2 rounded-[10px] border-[1.5px] border-[#D4EAE3] bg-white font-[family-name:var(--font-body)] text-[14px] font-medium text-[#4A5A54] cursor-pointer transition-colors hover:border-[#A8CDBF] hover:bg-[#EAF6F1]"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex items-center gap-[7px] px-5 py-2 rounded-[10px] border-none bg-[#0F6E56] font-[family-name:var(--font-body)] text-[14px] font-semibold text-white cursor-pointer transition-all hover:bg-[#0A4A38] active:scale-[0.97] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>

          {/* SECURITY CARD */}
          <div className="bg-white rounded-2xl border border-[#D4EAE3] p-6 col-start-2 animate-[fadeUp_0.35s_ease_0.16s_both]">
            <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] mb-[18px]">
              Sécurité & confidentialité
            </div>

            <div className="flex flex-col gap-3">
              
              {/* Mot de passe */}
              <div className="flex items-center gap-3.5 p-3.5 border-[1.5px] border-[#D4EAE3] rounded-xl transition-colors hover:border-[#A8CDBF] hover:bg-[#EAF6F1]">
                <div className="w-10 h-10 shrink-0 rounded-[11px] bg-[#EAF6F1] text-[#0F6E56] flex items-center justify-center">
                  <Lock size={18} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#1A1A1A] mb-[2px]">Mot de passe</div>
                  <div className="text-[12px] text-[#7EA898]">Dernière modification il y a 3 mois.</div>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#3DDBA0]/10 text-[#1A9E78] border border-[#3DDBA0]/30">Actif</span>
                <button 
                  onClick={() => setShowPwdModal(true)}
                  className="shrink-0 px-3.5 py-1.5 rounded-lg font-[family-name:var(--font-body)] text-[13px] font-medium border-[1.5px] border-[#D4EAE3] bg-white text-[#4A5A54] cursor-pointer transition-all hover:border-[#0F6E56] hover:text-[#0F6E56] hover:bg-[#EAF6F1]">
                  Modifier
                </button>
              </div>

              {/* PIN */}
              <div className="flex items-center gap-3.5 p-3.5 border-[1.5px] border-[#D4EAE3] rounded-xl transition-colors hover:border-[#A8CDBF] hover:bg-[#EAF6F1]">
                <div className="w-10 h-10 shrink-0 rounded-[11px] bg-[#EAF6F1] text-[#0F6E56] flex items-center justify-center">
                  <Shield size={18} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#1A1A1A] mb-[2px]">PIN de restauration</div>
                  <div className="text-[12px] text-[#7EA898]">Permet de déchiffrer vos messages après un nettoyage.</div>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#3DDBA0]/10 text-[#1A9E78] border border-[#3DDBA0]/30">Configuré</span>
                <button className="shrink-0 px-3.5 py-1.5 rounded-lg font-[family-name:var(--font-body)] text-[13px] font-medium border-[1.5px] border-[#D4EAE3] bg-white text-[#4A5A54] cursor-pointer transition-all hover:border-[#0F6E56] hover:text-[#0F6E56] hover:bg-[#EAF6F1]">
                  Changer
                </button>
              </div>

              {/* Recovery Key */}
              <div className="flex flex-col p-3.5 border-[1.5px] border-[#D4EAE3] rounded-xl transition-colors hover:border-[#A8CDBF] hover:bg-[#EAF6F1]">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 shrink-0 rounded-[11px] bg-[#FFF8ED] text-[#B8860B] flex items-center justify-center">
                    <Key size={18} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#1A1A1A] mb-[2px]">Clé de récupération</div>
                    <div className="text-[12px] text-[#7EA898]">Phrase de 12 mots — filet de sécurité ultime.</div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFF8ED] text-[#B8860B] border border-[#FBDCAD]">À conserver</span>
                  <button 
                    onClick={() => setShowRecoveryKey(!showRecoveryKey)}
                    className="shrink-0 px-3.5 py-1.5 rounded-lg font-[family-name:var(--font-body)] text-[13px] font-medium border-[1.5px] border-[#D4EAE3] bg-white text-[#4A5A54] cursor-pointer transition-all hover:border-[#0F6E56] hover:text-[#0F6E56] hover:bg-[#EAF6F1] w-[88px] text-center"
                  >
                    {showRecoveryKey ? "Masquer" : "Afficher"}
                  </button>
                </div>
                
                {/* Recovery box */}
                {showRecoveryKey && (
                  <div className="bg-[#EAF6F1] border-[1.5px] border-dashed border-[#A8CDBF] rounded-xl p-4 mt-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#0F6E56] mb-2.5">
                      <AlertCircle size={12} strokeWidth={2.5} />
                      Votre clé de récupération
                    </div>
                    {recoveryPhrase ? (
                      <div className="flex flex-wrap gap-1.5">
                        {recoveryPhrase.split(" ").map((word, i) => (
                          <span key={i} className="flex items-center gap-1.5 bg-white border border-[#D4EAE3] rounded-[7px] px-2.5 py-1 text-[13px] text-[#1A1A1A]">
                            <span className="text-[10px] font-medium text-[#7EA898]">{i + 1}</span>
                            {word}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[13px] text-[#4A5A54]">
                        La clé n&apos;est pas disponible en session actuellement.
                      </div>
                    )}
                    <div className="text-[11px] text-[#7EA898] mt-2.5">
                      ⚠️ Notez ces mots hors ligne et ne les partagez jamais. Ils permettent de restaurer votre clé privée RSA.
                    </div>
                  </div>
                )}
              </div>

              {/* Delete Account */}
              <div className="flex items-center gap-3.5 p-3.5 border-[1.5px] border-[#D4EAE3] rounded-xl transition-colors hover:border-[#A8CDBF] hover:bg-[#EAF6F1]">
                <div className="w-10 h-10 shrink-0 rounded-[11px] bg-[#FFF3F0] text-[#D85A30] flex items-center justify-center">
                  <Trash2 size={18} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#1A1A1A] mb-[2px]">Supprimer mon compte</div>
                  <div className="text-[12px] text-[#7EA898]">Action irréversible — toutes vos données seront effacées.</div>
                </div>
                <button className="shrink-0 px-3.5 py-1.5 rounded-lg font-[family-name:var(--font-body)] text-[13px] font-medium border-[1.5px] border-[#FBDDD3] bg-white text-[#D85A30] cursor-pointer transition-all hover:bg-[#FFF5F2]">
                  Supprimer
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* MODAL: CHANGER DE MOT DE PASSE */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-[scaleUp_0.3s_ease_both]">
            <div className="px-6 py-4 border-b border-[#EAF6F1] flex items-center justify-between">
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-[16px] text-[#1A1A1A]">
                Changer de mot de passe
              </h3>
              <button 
                aria-label="Fermer"
                title="Fermer"
                onClick={() => { setShowPwdModal(false); setPwdError(""); setPwdSuccess(""); setCurrentPwd(""); setNewPwd(""); }}
                className="w-8 h-8 rounded-full bg-[#EAF6F1] flex items-center justify-center text-[#7EA898] hover:text-[#0F6E56] hover:bg-[#D4EAE3] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handlePasswordUpdate} className="p-6">
              {pwdError && (
                <div className="mb-4 p-3 bg-[#FFF3F0] border border-[#FBDDD3] rounded-[10px] flex items-center gap-2 text-[13px] text-[#D85A30]">
                  <AlertCircle size={16} className="shrink-0" />
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div className="mb-4 p-3 bg-[#F4FBF8] border border-[#D4EAE3] rounded-[10px] flex items-center gap-2 text-[13px] text-[#0F6E56]">
                  <Check size={16} className="shrink-0" />
                  {pwdSuccess}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#4A5A54] mb-1.5 block">Mot de passe actuel</label>
                  <McPasswordInput 
                    id="currentPwd"
                    name="currentPwd"
                    placeholder="Saisissez votre mot de passe"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#4A5A54] mb-1.5 block">Nouveau mot de passe</label>
                  <McPasswordInput 
                    id="newPwd"
                    name="newPwd"
                    placeholder="Minimum 8 caractères"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    showStrength={true}
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowPwdModal(false)}
                  className="flex-1 py-2.5 rounded-[10px] border border-[#D4EAE3] text-[14px] font-medium text-[#4A5A54] hover:bg-[#EAF6F1] transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingPwd || !currentPwd || newPwd.length < 8}
                  className="flex-1 py-2.5 rounded-[10px] bg-[#0F6E56] text-[14px] font-semibold text-white flex items-center justify-center gap-2 hover:bg-[#0A4A38] transition-colors disabled:opacity-50"
                >
                  {isUpdatingPwd ? <Loader2 size={16} className="animate-spin" /> : "Mettre à jour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
