"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { NavRail } from "@/components/dashboard/NavRail";
import { useChatStore } from "@/store/chatStore";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  Palette, Bell, MessageSquare, Database, Lock, MonitorSmartphone, Eye, AlertTriangle,
  Monitor, Droplet, Type, Minimize2, VideoOff, Globe, Calendar, Check, AlertCircle, Volume2,
  Moon, Clock, CheckCircle2, RotateCcw, Trash2, Key, Download, RefreshCw, EyeOff, UserX, ShieldBan, Search
} from "lucide-react";
import { SettingRow, SettingToggle, SettingSelect } from "@/components/settings";

export default function SettingsPage() {
  const router = useRouter();
  const { isReady, user } = useAuthGuard();
  const { clearChatStore } = useChatStore();
  const settings = useSettingsStore();
  const [activePanel, setActivePanel] = useState("apparence");

  if (!isReady || !user) return null;

  const panels = [
    { id: "apparence", label: "Apparence", icon: Palette, group: "Général" },
    { id: "notifications", label: "Notifications", icon: Bell, group: "Général", badge: "3" },
    { id: "messagerie", label: "Messagerie", icon: MessageSquare, group: "Général" },
    { id: "stockage", label: "Stockage", icon: Database, group: "Général" },
    { id: "chiffrement", label: "Chiffrement E2E", icon: Lock, group: "Sécurité" },
    { id: "sessions", label: "Sessions actives", icon: MonitorSmartphone, group: "Sécurité", badgeWarn: "2" },
    { id: "confidentialite", label: "Confidentialité", icon: Eye, group: "Sécurité" },
    { id: "danger", label: "Zone de danger", icon: AlertTriangle, group: "Compte", isDanger: true }
  ];

  const renderSidebarItem = (panel: typeof panels[0]) => {
    const isActive = activePanel === panel.id;
    return (
      <button
        key={panel.id}
        onClick={() => setActivePanel(panel.id)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[10px] cursor-pointer text-left font-[family-name:var(--font-body)] text-[14px] transition-all relative
          ${isActive 
            ? 'bg-[#EAF6F1] text-[#0F6E56] font-semibold' 
            : 'bg-transparent text-[#4A5A54] hover:bg-[#EAF6F1] hover:text-[#1A1A1A]'}
          ${panel.isDanger && !isActive ? '!text-[#D85A30]' : ''}
        `}
      >
        {isActive && !panel.isDanger && (
          <div className="absolute left-0 top-1/5 h-3/5 w-[3px] bg-[#0F6E56] rounded-r-sm" />
        )}
        <div className={`w-8 h-8 shrink-0 rounded-[9px] flex items-center justify-center transition-colors
          ${isActive && !panel.isDanger ? 'bg-[#0F6E56]/10 text-[#0F6E56]' : ''}
          ${!isActive && !panel.isDanger ? 'bg-[#EAF6F1] text-[#7EA898]' : ''}
          ${panel.isDanger ? 'bg-[#FFF3F0] text-[#D85A30]' : ''}
        `}>
          <panel.icon size={16} strokeWidth={2} />
        </div>
        <span className="flex-1">{panel.label}</span>
        {panel.badge && (
          <span className="text-[10px] font-bold bg-[#0F6E56] text-white rounded-full px-[7px] py-[2px]">
            {panel.badge}
          </span>
        )}
        {panel.badgeWarn && (
          <span className="text-[10px] font-bold bg-[#EF9F27] text-white rounded-full px-[7px] py-[2px]">
            {panel.badgeWarn}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#EAF6F1] font-[family-name:var(--font-body)] overflow-hidden">
      
      <NavRail
        userFirstName={user.firstName}
        userLastName={user.lastName}
        activeItem="settings"
      />

      {/* SETTINGS SIDEBAR */}
      <aside className="w-[230px] h-screen bg-white border-r border-[#D4EAE3] flex flex-col shrink-0 overflow-y-auto animate-[slideIn_0.3s_ease_both]">
        <div className="p-6 pb-4.5 border-b border-[#EAF6F1]">
          <div className="font-[family-name:var(--font-heading)] font-extrabold text-[18px] text-[#1A1A1A]">
            Paramètres
          </div>
        </div>

        <div className="p-3.5 px-3 pt-3.5 pb-1.5 flex flex-col gap-1">
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] px-2 mb-1">Général</div>
          {panels.filter(p => p.group === "Général").map(renderSidebarItem)}
        </div>

        <div className="h-px bg-[#EAF6F1] mx-3 my-2" />

        <div className="p-3.5 px-3 pt-1.5 pb-1.5 flex flex-col gap-1">
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] px-2 mb-1">Sécurité</div>
          {panels.filter(p => p.group === "Sécurité").map(renderSidebarItem)}
        </div>

        <div className="h-px bg-[#EAF6F1] mx-3 my-2" />

        <div className="p-3.5 px-3 pt-1.5 pb-1.5 flex flex-col gap-1">
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] px-2 mb-1">Compte</div>
          {panels.filter(p => p.group === "Compte").map(renderSidebarItem)}
        </div>

        <div className="mt-auto p-4 px-5 text-[11px] text-[#7EA898] border-t border-[#EAF6F1]">
          Mess&apos;Crypt v<strong className="text-[#0F6E56]">1.0.0</strong> · <a href="#" className="text-[#0F6E56] no-underline">Notes de version</a>
        </div>
      </aside>

      {/* MAIN PANEL */}
      <main className="flex-1 h-screen overflow-y-auto px-9 py-8 pb-[60px] animate-[fadeUp_0.3s_ease_both] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#D4EAE3] [&::-webkit-scrollbar-thumb]:rounded">
        
        {/* ═══ APPARENCE ═══ */}
        {activePanel === "apparence" && (
          <div className="animate-[fadeUp_0.25s_ease_both]">
            <div className="mb-7">
              <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] mb-1.5">Général</div>
              <h2 className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-[#1A1A1A] mb-1.5">Apparence</h2>
              <div className="text-[14px] text-[#7EA898] leading-[1.6]">Personnalisez l&apos;interface selon vos préférences visuelles.</div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <Monitor size={15} className="text-[#0F6E56]" strokeWidth={2} />
                  Thème
                </div>
              </div>
              <div className="py-1.5">
                <SettingRow icon={Monitor} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Mode d'affichage" desc="Choisissez entre clair, sombre ou automatique.">
                  <SettingSelect options={["Clair", "Sombre", "Automatique"]} value={settings.displayMode} onChange={settings.setDisplayMode} />
                </SettingRow>
                <SettingRow icon={Droplet} iconClass="bg-[#F4EEFF] text-[#7B52C4]" label="Couleur d'accent" desc="Personnalisez la couleur principale de l'interface.">
                  <div className="flex gap-2">
                    {["#0F6E56", "#4A72C4", "#7B52C4", "#C4524A", "#B8860B"].map((color) => (
                      <button key={color} onClick={() => settings.setAccentColor(color)} className={`w-[26px] h-[26px] rounded-full border-[2.5px] transition-transform hover:scale-110 relative ${settings.accentColor === color ? "border-[#1A1A1A]" : "border-transparent"}`} style={{ backgroundColor: color }}>
                        {settings.accentColor === color && <div className="absolute inset-[1px] border-2 border-white/80 rounded-full" />}
                      </button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow icon={Type} iconClass="bg-[#F2F4F7] text-[#5A6A7A]" label="Taille du texte" desc="Ajustez la taille des messages et de l'interface.">
                  <input type="range" title="Taille du texte" className="w-[110px] h-1 bg-[#D4EAE3] rounded-[2px] outline-none cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#0F6E56] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(15,110,86,0.3)]" min="12" max="20" value={settings.fontSize} onChange={e => settings.setFontSize(Number(e.target.value))} />
                  <span className="text-[13px] text-[#4A5A54] font-medium ml-2.5">{settings.fontSize}px</span>
                </SettingRow>
                <SettingRow icon={Minimize2} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Mode compact" desc="Réduit l'espacement entre les messages et les éléments.">
                  <SettingToggle checked={settings.compactMode} onChange={settings.setCompactMode} />
                </SettingRow>
                <SettingRow icon={VideoOff} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Réduire les animations" desc="Pour les personnes sensibles aux mouvements à l'écran.">
                  <SettingToggle checked={settings.reduceAnimations} onChange={settings.setReduceAnimations} />
                </SettingRow>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <Globe size={15} className="text-[#0F6E56]" strokeWidth={2} />
                  Langue & région
                </div>
              </div>
              <div className="py-1.5">
                <SettingRow icon={Globe} iconClass="bg-[#EEF4FF] text-[#4A72C4]" label="Langue" desc="Langue de l'interface.">
                  <SettingSelect options={["Français", "English", "Español", "Deutsch"]} value={settings.language} onChange={settings.setLanguage} />
                </SettingRow>
                <SettingRow icon={Calendar} iconClass="bg-[#F2F4F7] text-[#5A6A7A]" label="Format de date">
                  <SettingSelect options={["JJ/MM/AAAA", "MM/DD/YYYY", "AAAA-MM-JJ"]} value={settings.dateFormat} onChange={settings.setDateFormat} />
                </SettingRow>
              </div>
            </div>
          </div>
        )}

        {/* ═══ NOTIFICATIONS ═══ */}
        {activePanel === "notifications" && (
          <div className="animate-[fadeUp_0.25s_ease_both]">
            <div className="mb-7">
              <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] mb-1.5">Général</div>
              <h2 className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-[#1A1A1A] mb-1.5">Notifications</h2>
              <div className="text-[14px] text-[#7EA898] leading-[1.6]">Choisissez ce qui mérite votre attention et comment vous en êtes informé.</div>
            </div>

            <div className="flex items-center gap-3 bg-[#EAF6F1] border border-[#D4EAE3] rounded-xl px-3.5 py-3 mx-5 mb-3.5">
              <div className="w-2.5 h-2.5 bg-[#0F6E56] rounded-full shrink-0" />
              <div className="text-[13px] text-[#4A5A54]"><strong className="text-[#1A1A1A]">Sophie Lambert</strong> : Aperçu de la notification avec vos paramètres actuels.</div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <Bell size={15} className="text-[#0F6E56]" strokeWidth={2} />
                  Alertes
                </div>
              </div>
              <div className="py-1.5">
                <SettingRow icon={MessageSquare} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Nouveaux messages" desc="Notification à chaque message reçu.">
                  <SettingToggle checked={settings.notifNewMessages} onChange={settings.setNotifNewMessages} />
                </SettingRow>
                <SettingRow icon={Type} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Indicateur de frappe" desc="Notifie quand un contact commence à écrire.">
                  <SettingToggle checked={settings.notifTypingIndicator} onChange={settings.setNotifTypingIndicator} />
                </SettingRow>
                <SettingRow icon={AlertCircle} iconClass="bg-[#FFF8ED] text-[#B8860B]" label="Rappel nettoyage 24h" desc="Prévient avant la suppression automatique du chat.">
                  <SettingToggle checked={settings.notifCleanupReminder} onChange={settings.setNotifCleanupReminder} />
                </SettingRow>
                <SettingRow icon={Volume2} iconClass="bg-[#F2F4F7] text-[#5A6A7A]" label="Son des notifications" desc="Joue un son à chaque message reçu.">
                  <SettingToggle checked={settings.notifSound} onChange={settings.setNotifSound} />
                </SettingRow>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <Moon size={15} className="text-[#0F6E56]" strokeWidth={2} />
                  Ne pas déranger
                </div>
              </div>
              <div className="py-1.5">
                <SettingRow icon={Moon} iconClass="bg-[#F2F4F7] text-[#5A6A7A]" label="Mode Ne pas déranger" desc="Silence toutes les notifications temporairement.">
                  <SettingToggle checked={settings.doNotDisturb} onChange={settings.setDoNotDisturb} />
                </SettingRow>
                <SettingRow icon={Clock} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Plage horaire silencieuse" desc="Aucune notification entre 22h00 et 08h00.">
                  <SettingToggle checked={settings.quietHours} onChange={settings.setQuietHours} />
                </SettingRow>
              </div>
            </div>
          </div>
        )}

        {/* ═══ MESSAGERIE ═══ */}
        {activePanel === "messagerie" && (
          <div className="animate-[fadeUp_0.25s_ease_both]">
            <div className="mb-7">
              <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] mb-1.5">Général</div>
              <h2 className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-[#1A1A1A] mb-1.5">Messagerie</h2>
              <div className="text-[14px] text-[#7EA898] leading-[1.6]">Configurez le comportement de vos conversations.</div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <MessageSquare size={15} className="text-[#0F6E56]" strokeWidth={2} />
                  Comportement
                </div>
              </div>
              <div className="py-1.5">
                <SettingRow icon={CheckCircle2} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Accusés de réception" desc="Affiche les statuts envoyé / lu pour vos messages.">
                  <SettingToggle checked={settings.readReceipts} onChange={settings.setReadReceipts} />
                </SettingRow>
                <SettingRow icon={Check} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Entrée pour envoyer" desc="Envoyer avec ↵, retour à la ligne avec Maj+↵.">
                  <SettingToggle checked={settings.enterToSend} onChange={settings.setEnterToSend} />
                </SettingRow>
                <SettingRow icon={Type} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Indicateur de frappe visible" desc="Votre interlocuteur voit que vous écrivez en temps réel.">
                  <SettingToggle checked={settings.typingVisible} onChange={settings.setTypingVisible} />
                </SettingRow>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <Trash2 size={15} className="text-[#0F6E56]" strokeWidth={2} />
                  Nettoyage automatique
                </div>
              </div>
              <div className="py-1.5">
                <SettingRow icon={Clock} iconClass="bg-[#FFF8ED] text-[#B8860B]" label="Fréquence du nettoyage UI" desc="L'affichage est vidé toutes les 24h. Les messages restent en base chiffrée.">
                  <SettingSelect options={["6 heures", "12 heures", "24 heures", "48 heures"]} value={settings.cleanupFrequency} onChange={settings.setCleanupFrequency} />
                </SettingRow>
                <SettingRow icon={RotateCcw} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Restauration automatique au login" desc="Recharge automatiquement les messages chiffrés après connexion.">
                  <SettingToggle checked={settings.autoRestoreOnLogin} onChange={settings.setAutoRestoreOnLogin} />
                </SettingRow>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STOCKAGE ═══ */}
        {activePanel === "stockage" && (
          <div className="animate-[fadeUp_0.25s_ease_both]">
            <div className="mb-7">
              <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] mb-1.5">Général</div>
              <h2 className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-[#1A1A1A] mb-1.5">Stockage</h2>
              <div className="text-[14px] text-[#7EA898] leading-[1.6]">Gérez l&apos;espace utilisé par Mess&apos;Crypt sur cet appareil.</div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <Database size={15} className="text-[#0F6E56]" strokeWidth={2} />
                  Espace utilisé
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="flex justify-between text-[12px] text-[#4A5A54] mb-2">
                  <span>Clés chiffrées &amp; cache local</span>
                  <strong className="text-[#0F6E56]">2,3 Mo / 6 Mo</strong>
                </div>
                <div className="h-1.5 bg-[#EAF6F1] border border-[#D4EAE3] rounded-[3px] overflow-hidden">
                  <div className="h-full w-[38%] bg-gradient-to-r from-[#0F6E56] to-[#1A9E78] rounded-[3px]" />
                </div>
                <div className="text-[11px] text-[#7EA898] mt-1.5">Les messages ne sont jamais stockés en clair sur cet appareil.</div>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <Trash2 size={15} className="text-[#0F6E56]" strokeWidth={2} />
                  Nettoyage
                </div>
              </div>
              <div className="py-1.5">
                <SettingRow icon={MessageSquare} iconClass="bg-[#F2F4F7] text-[#5A6A7A]" label="Cache des conversations" desc="1,4 Mo — Aperçus et métadonnées locaux.">
                  <button onClick={() => { clearChatStore(); alert("Cache vidé !"); }} className="px-4 py-1.5 rounded-[9px] border-[1.5px] border-[#D4EAE3] bg-white font-[family-name:var(--font-body)] text-[13px] font-medium text-[#4A5A54] cursor-pointer transition-all hover:border-[#0F6E56] hover:text-[#0F6E56] hover:bg-[#EAF6F1]">Vider</button>
                </SettingRow>
                <SettingRow icon={Key} iconClass="bg-[#F2F4F7] text-[#5A6A7A]" label="IndexedDB (clés RSA)" desc="0,9 Mo — Vos clés privées chiffrées localement.">
                  <span className="text-[12px] font-medium text-[#0F6E56]">🔒 Protégé</span>
                </SettingRow>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CHIFFREMENT ═══ */}
        {activePanel === "chiffrement" && (
          <div className="animate-[fadeUp_0.25s_ease_both]">
            <div className="mb-7">
              <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] mb-1.5">Sécurité</div>
              <h2 className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-[#1A1A1A] mb-1.5">Chiffrement E2E</h2>
              <div className="text-[14px] text-[#7EA898] leading-[1.6]">Visualisez et gérez les paramètres cryptographiques de vos échanges.</div>
            </div>

            <div className="flex items-start gap-3 bg-[#EAF6F1] border border-[#D4EAE3] rounded-xl px-4 py-3.5 mb-4">
              <ShieldBan size={16} className="text-[#0F6E56] shrink-0 mt-[1px]" strokeWidth={2} />
              <div className="text-[13px] text-[#4A5A54] leading-[1.6]">
                <strong className="text-[#0F6E56] font-semibold">Zéro connaissance serveur.</strong> Le serveur ne stocke que des données chiffrées. Même en cas de fuite de la base de données, vos messages restent illisibles.
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <Key size={15} className="text-[#0F6E56]" strokeWidth={2} />
                  Clés cryptographiques
                </div>
              </div>
              <div className="py-1.5">
                <SettingRow icon={RefreshCw} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Algorithme asymétrique" desc="Échange de clé de session par message.">
                  <span className="text-[13px] font-medium text-[#4A5A54]">RSA-OAEP 2048 bits</span>
                </SettingRow>
                <SettingRow icon={Lock} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Algorithme symétrique" desc="Chiffrement du contenu de chaque message.">
                  <span className="text-[13px] font-medium text-[#4A5A54]">AES-256-GCM</span>
                </SettingRow>
                <SettingRow icon={ShieldBan} iconClass="bg-[#FFF8ED] text-[#B8860B]" label="Dérivation de clé (PIN)" desc="Dérive la clé de déchiffrement depuis le PIN.">
                  <span className="text-[13px] font-medium text-[#4A5A54]">PBKDF2 · 100 000 iter.</span>
                </SettingRow>
                <SettingRow icon={Globe} iconClass="bg-[#EEF4FF] text-[#4A72C4]" label="Clé publique RSA active" desc="Empreinte de votre clé publique enregistrée sur le serveur.">
                  <span className="text-[11px] font-mono text-[#0F6E56]">3A:F2:9C:…:B1</span>
                </SettingRow>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <AlertTriangle size={15} className="text-[#0F6E56]" strokeWidth={2} />
                  Actions
                </div>
              </div>
              <div className="py-1.5">
                <SettingRow icon={RefreshCw} iconClass="bg-[#FFF8ED] text-[#B8860B]" label="Régénérer la paire de clés RSA" desc="⚠️ Les anciens messages ne pourront plus être déchiffrés.">
                  <button className="px-4 py-1.5 rounded-[9px] border-[1.5px] border-[#FBDDD3] bg-white font-[family-name:var(--font-body)] text-[13px] font-medium text-[#D85A30] cursor-pointer transition-all hover:border-[#F4B8A3] hover:bg-[#FFF5F2]">Régénérer</button>
                </SettingRow>
                <SettingRow icon={Download} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Exporter la clé publique" desc="Téléchargez votre clé publique au format PEM.">
                  <button className="px-4 py-1.5 rounded-[9px] border-[1.5px] border-[#D4EAE3] bg-white font-[family-name:var(--font-body)] text-[13px] font-medium text-[#4A5A54] cursor-pointer transition-all hover:border-[#0F6E56] hover:text-[#0F6E56] hover:bg-[#EAF6F1]">Exporter</button>
                </SettingRow>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SESSIONS ═══ */}
        {activePanel === "sessions" && (
          <div className="animate-[fadeUp_0.25s_ease_both]">
            <div className="mb-7">
              <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] mb-1.5">Sécurité</div>
              <h2 className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-[#1A1A1A] mb-1.5">Sessions actives</h2>
              <div className="text-[14px] text-[#7EA898] leading-[1.6]">Tous les appareils connectés à votre compte en ce moment.</div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <MonitorSmartphone size={15} className="text-[#1A1A1A]" strokeWidth={2} />
                  Appareils connectés
                </div>
                <button className="px-3 py-1.5 rounded-[9px] border-[1.5px] border-[#FBDDD3] bg-white font-[family-name:var(--font-body)] text-[12px] font-medium text-[#D85A30] cursor-pointer transition-all hover:border-[#F4B8A3] hover:bg-[#FFF5F2]">Révoquer tout</button>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3.5 p-3.5 px-5 border-b border-[#EAF6F1]">
                  <div className="w-10 h-10 shrink-0 rounded-[10px] bg-[#EAF6F1] text-[#0F6E56] flex items-center justify-center"><MonitorSmartphone size={18} strokeWidth={2} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-[#1A1A1A] mb-0.5">Chrome · macOS Sequoia</div>
                    <div className="text-[12px] text-[#7EA898]">Paris, France · Maintenant</div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#3DDBA0]/10 text-[#1A9E78] border border-[#3DDBA0]/30">Session actuelle</span>
                </div>
                <div className="flex items-center gap-3.5 p-3.5 px-5 border-b border-[#EAF6F1]">
                  <div className="w-10 h-10 shrink-0 rounded-[10px] bg-[#EAF6F1] text-[#0F6E56] flex items-center justify-center"><MonitorSmartphone size={18} strokeWidth={2} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-[#1A1A1A] mb-0.5">Safari · iPhone 16 Pro</div>
                    <div className="text-[12px] text-[#7EA898]">Paris, France · Il y a 2 heures</div>
                  </div>
                  <button className="px-3 py-1.5 rounded-[9px] border-[1.5px] border-[#FBDDD3] bg-white font-[family-name:var(--font-body)] text-[12px] font-medium text-[#D85A30] cursor-pointer transition-all hover:border-[#F4B8A3] hover:bg-[#FFF5F2]">Révoquer</button>
                </div>
                <div className="flex items-center gap-3.5 p-3.5 px-5">
                  <div className="w-10 h-10 shrink-0 rounded-[10px] bg-[#FFF8ED] text-[#B8860B] flex items-center justify-center"><MonitorSmartphone size={18} strokeWidth={2} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-[#1A1A1A] mb-0.5">Firefox · Windows 11</div>
                    <div className="text-[12px] text-[#7EA898]">Lyon, France · Il y a 3 jours</div>
                  </div>
                  <button className="px-3 py-1.5 rounded-[9px] border-[1.5px] border-[#FBDDD3] bg-white font-[family-name:var(--font-body)] text-[12px] font-medium text-[#D85A30] cursor-pointer transition-all hover:border-[#F4B8A3] hover:bg-[#FFF5F2]">Révoquer</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CONFIDENTIALITÉ ═══ */}
        {activePanel === "confidentialite" && (
          <div className="animate-[fadeUp_0.25s_ease_both]">
            <div className="mb-7">
              <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] mb-1.5">Sécurité</div>
              <h2 className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-[#1A1A1A] mb-1.5">Confidentialité</h2>
              <div className="text-[14px] text-[#7EA898] leading-[1.6]">Contrôlez ce que les autres utilisateurs peuvent voir de vous.</div>
            </div>

            <div className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl mb-4 overflow-hidden">
              <div className="px-5 py-4 pb-3.5 border-b border-[#EAF6F1] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#1A1A1A] flex items-center gap-2">
                  <Eye size={15} className="text-[#1A1A1A]" strokeWidth={2} />
                  Visibilité du profil
                </div>
              </div>
              <div className="py-1.5">
                <SettingRow icon={Eye} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Afficher mon statut en ligne" desc="Les autres voient si vous êtes connecté.">
                  <SettingToggle checked={settings.showOnlineStatus} onChange={settings.setShowOnlineStatus} />
                </SettingRow>
                <SettingRow icon={CheckCircle2} iconClass="bg-[#EAF6F1] text-[#0F6E56]" label="Confirmer la réception des messages" desc="L'expéditeur voit quand vous avez lu son message.">
                  <SettingToggle checked={settings.confirmReadReceipts} onChange={settings.setConfirmReadReceipts} />
                </SettingRow>
                <SettingRow icon={UserX} iconClass="bg-[#F2F4F7] text-[#5A6A7A]" label="Qui peut me contacter" desc="Contrôle qui peut initier une conversation.">
                  <SettingSelect options={["Tout le monde", "Contacts uniquement", "Personne"]} value={settings.whoCanContact} onChange={settings.setWhoCanContact} />
                </SettingRow>
                <SettingRow icon={Search} iconClass="bg-[#EEF4FF] text-[#4A72C4]" label="Trouvable par" desc="Définit si on peut vous trouver via email ou pseudo.">
                  <SettingSelect options={["Email & pseudo", "Pseudo uniquement", "Non trouvable"]} value={settings.findableBy} onChange={settings.setFindableBy} />
                </SettingRow>
              </div>
            </div>
          </div>
        )}

        {/* ═══ DANGER ═══ */}
        {activePanel === "danger" && (
          <div className="animate-[fadeUp_0.25s_ease_both]">
            <div className="mb-7">
              <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] mb-1.5">Compte</div>
              <h2 className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-[#D85A30] mb-1.5">Zone de danger</h2>
              <div className="text-[14px] text-[#7EA898] leading-[1.6]">Ces actions sont irréversibles. Procédez avec la plus grande prudence.</div>
            </div>

            <div className="bg-white border-[1.5px] border-[#FBDDD3] rounded-2xl mb-4 overflow-hidden group">
              <div className="px-5 py-4 pb-3.5 border-b border-[#FBDDD3] flex items-center justify-between">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[14px] text-[#D85A30] flex items-center gap-2">
                  <AlertTriangle size={15} strokeWidth={2} />
                  Actions irréversibles
                </div>
              </div>
              <div className="py-1.5">
                <SettingRow icon={RotateCcw} iconClass="bg-[#FFF3F0] text-[#D85A30]" label="Réinitialiser toutes les clés" desc="Supprime toutes vos clés RSA. Tous vos messages deviendront illisibles." hoverClass="hover:bg-[#FFFAF9]" borderClass="border-[#FBDDD3]">
                  <button className="px-4 py-1.5 rounded-[9px] border-[1.5px] border-[#FBDDD3] bg-white font-[family-name:var(--font-body)] text-[13px] font-medium text-[#D85A30] cursor-pointer transition-all hover:border-[#F4B8A3] hover:bg-[#FFF5F2]">Réinitialiser</button>
                </SettingRow>
                <SettingRow icon={Trash2} iconClass="bg-[#FFF3F0] text-[#D85A30]" label="Supprimer l'historique chiffré" desc="Efface tous vos messages de la base de données serveur." hoverClass="hover:bg-[#FFFAF9]" borderClass="border-[#FBDDD3]">
                  <button className="px-4 py-1.5 rounded-[9px] border-[1.5px] border-[#FBDDD3] bg-white font-[family-name:var(--font-body)] text-[13px] font-medium text-[#D85A30] cursor-pointer transition-all hover:border-[#F4B8A3] hover:bg-[#FFF5F2]">Supprimer</button>
                </SettingRow>
                <SettingRow icon={UserX} iconClass="bg-[#FFF3F0] text-[#D85A30]" label="Supprimer mon compte" desc="Suppression définitive de votre compte et de toutes vos données." hoverClass="hover:bg-[#FFFAF9]" borderClass="border-[#FBDDD3]">
                  <button className="px-4 py-1.5 rounded-[9px] border-[1.5px] border-[#FBDDD3] bg-white font-[family-name:var(--font-body)] text-[13px] font-medium text-[#D85A30] cursor-pointer transition-all hover:border-[#F4B8A3] hover:bg-[#FFF5F2]">Supprimer mon compte</button>
                </SettingRow>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

