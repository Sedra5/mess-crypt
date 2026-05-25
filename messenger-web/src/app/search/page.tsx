"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { NavRail } from "@/components/dashboard/NavRail";
import { Search, X, CircleDot, Mail, AtSign, Clock, Shield, MessageSquare, User as UserIcon, Loader2 } from "lucide-react";
import { userService } from "@/services/userService";
import { User } from "@/lib/types";
import { formatRelativeTime } from "@/lib/helpers";
import { useChatStore } from "@/store/chatStore";

const INITIAL_RECENT = [
  { query: 'sophie.lambert', time: 'Il y a 2h' },
  { query: 'marc.antoine@mail.com', time: 'Hier' },
  { query: 'chloe', time: 'Lundi' },
];

export default function SearchPage() {
  const router = useRouter();
  const { isReady, user } = useAuthGuard();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "email" | "pseudo">("all");
  const [recent, setRecent] = useState(INITIAL_RECENT);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  
  const userStatus = useChatStore((state) => state.userStatus);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400); // Increased debounce for API calls
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setUsers([]);
        return;
      }
      setIsSearchingApi(true);
      const res = await userService.searchUsers(debouncedQuery);
      if (res.success && res.data) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
      setIsSearchingApi(false);
    };
    fetchUsers();
  }, [debouncedQuery]);

  if (!isReady || !user) return null;

  const handleClearRecent = () => setRecent([]);
  const handleRemoveRecent = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecent(prev => prev.filter((_, i) => i !== idx));
  };
  const handleRecentClick = (q: string) => {
    setQuery(q);
    if (inputRef.current) inputRef.current.focus();
  };

  const getFilteredResults = () => {
    if (!debouncedQuery) return [];
    const lowerQ = debouncedQuery.toLowerCase();
    
    return users.filter(u => {
      const isOnline = userStatus[u.id]?.isOnline;
      
      // Apply type filter
      if (filter === "online" && !isOnline) return false;
      
      // Text match
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const matchName = fullName.includes(lowerQ);
      const matchPseudo = (u.pseudo || "").toLowerCase().includes(lowerQ);
      const matchEmail = (u.email || "").toLowerCase().includes(lowerQ);

      if (filter === "email") return matchEmail;
      if (filter === "pseudo") return matchPseudo;
      return matchName || matchPseudo || matchEmail;
    });
  };

  const results = getFilteredResults();
  const isSearching = debouncedQuery.length > 0;

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <mark key={i} className="bg-[#0F6E56]/10 text-[#0F6E56] rounded-[3px] px-[1px]">{part}</mark>
            : <span key={i}>{part}</span>
        )}
      </>
    );
  };

  return (
    <div className="flex h-screen bg-[#EAF6F1] font-[family-name:var(--font-body)] overflow-hidden">
      <NavRail
        userFirstName={user.firstName}
        userLastName={user.lastName}
        activeItem="search"
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HERO */}
        <div className="bg-white border-b border-[#D4EAE3] px-10 pt-8 pb-7 shrink-0 animate-[fadeDown_0.3s_ease_both]">
          <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#7EA898] mb-2">Recherche</div>
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-[26px] text-[#1A1A1A] mb-5.5">
            Trouver un <span className="text-[#0F6E56]">utilisateur</span>
          </h1>

          {/* Big Search Input */}
          <div className="flex items-center gap-3 bg-[#EAF6F1] border-2 border-[#D4EAE3] rounded-[14px] px-4.5 py-3.5 max-w-[600px] transition-all duration-200 focus-within:border-[#0F6E56] focus-within:shadow-[0_0_0_4px_rgba(15,110,86,0.08)] focus-within:bg-white group">
            <Search size={20} strokeWidth={2.5} className="text-[#7EA898] shrink-0 transition-colors group-focus-within:text-[#0F6E56]" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-none outline-none font-[family-name:var(--font-body)] text-[16px] text-[#1A1A1A] placeholder:text-[#7EA898]"
              placeholder="Email ou pseudo…"
              autoComplete="off"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setDebouncedQuery(query.trim());
                }
              }}
            />
            {!query ? (
              <div className="flex items-center gap-1 shrink-0">
                <kbd className="px-1.5 py-0.5 bg-[#D4EAE3] rounded-[5px] font-[family-name:var(--font-body)] text-[11px] text-[#4A5A54] border border-[#A8CDBF]">↵</kbd>
                <span className="text-[11px] text-[#7EA898] ml-0.5">Rechercher</span>
              </div>
            ) : (
              <button 
                onClick={() => { setQuery(""); setDebouncedQuery(""); inputRef.current?.focus(); }}
                className="bg-transparent border-none cursor-pointer text-[#7EA898] hover:text-[#1A1A1A] flex items-center justify-center transition-colors"
                title="Effacer"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-3.5">
            <button 
              onClick={() => setFilter("all")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] font-[family-name:var(--font-body)] text-[13px] font-medium cursor-pointer transition-all
                ${filter === "all" ? 'border-[#0F6E56] bg-[#EAF6F1] text-[#0F6E56] font-semibold' : 'border-[#D4EAE3] bg-white text-[#4A5A54] hover:border-[#A8CDBF] hover:text-[#1A1A1A]'}`}
            >
              <UserIcon size={13} strokeWidth={2.5} />
              Tous
            </button>
            <button 
              onClick={() => setFilter("online")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] font-[family-name:var(--font-body)] text-[13px] font-medium cursor-pointer transition-all
                ${filter === "online" ? 'border-[#0F6E56] bg-[#EAF6F1] text-[#0F6E56] font-semibold' : 'border-[#D4EAE3] bg-white text-[#4A5A54] hover:border-[#A8CDBF] hover:text-[#1A1A1A]'}`}
            >
              <CircleDot size={13} strokeWidth={2.5} />
              En ligne
            </button>
            <button 
              onClick={() => setFilter("email")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] font-[family-name:var(--font-body)] text-[13px] font-medium cursor-pointer transition-all
                ${filter === "email" ? 'border-[#0F6E56] bg-[#EAF6F1] text-[#0F6E56] font-semibold' : 'border-[#D4EAE3] bg-white text-[#4A5A54] hover:border-[#A8CDBF] hover:text-[#1A1A1A]'}`}
            >
              <Mail size={13} strokeWidth={2.5} />
              Par email
            </button>
            <button 
              onClick={() => setFilter("pseudo")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] font-[family-name:var(--font-body)] text-[13px] font-medium cursor-pointer transition-all
                ${filter === "pseudo" ? 'border-[#0F6E56] bg-[#EAF6F1] text-[#0F6E56] font-semibold' : 'border-[#D4EAE3] bg-white text-[#4A5A54] hover:border-[#A8CDBF] hover:text-[#1A1A1A]'}`}
            >
              <AtSign size={13} strokeWidth={2.5} />
              Par pseudo
            </button>
          </div>
        </div>

        {/* RESULTS AREA */}
        <div className="flex-1 overflow-y-auto px-10 py-7 pb-10 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#D4EAE3] [&::-webkit-scrollbar-thumb]:rounded">
          
          {/* STATE: Default (Recent) */}
          {!isSearching && (
            <div className="animate-[fadeUp_0.3s_ease_both]">
              <div className="flex items-center justify-between mb-3.5">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[13px] text-[#1A1A1A]">
                  Recherches récentes
                </div>
                {recent.length > 0 && (
                  <button onClick={handleClearRecent} className="bg-transparent border-none text-[13px] text-[#0F6E56] font-medium cursor-pointer hover:opacity-75 transition-opacity">
                    Tout effacer
                  </button>
                )}
              </div>
              
              <div className="flex flex-col gap-0.5 animate-[fadeUp_0.3s_ease_0.05s_both]">
                {recent.length === 0 ? (
                  <div className="text-[13px] text-[#7EA898] py-2">Aucune recherche récente.</div>
                ) : (
                  recent.map((r, i) => (
                    <div key={i} onClick={() => handleRecentClick(r.query)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-[#0F6E56]/5 group">
                      <div className="w-9 h-9 shrink-0 rounded-[10px] bg-[#EAF6F1] flex items-center justify-center text-[#7EA898]">
                        <Search size={16} strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[14px] text-[#1A1A1A] font-medium">{r.query}</div>
                        <div className="text-[12px] text-[#7EA898]">{r.time}</div>
                      </div>
                      <button 
                        onClick={(e) => handleRemoveRecent(i, e)}
                        className="bg-transparent border-none cursor-pointer text-[#7EA898] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:text-[#1A1A1A] hover:bg-[#D4EAE3]"
                        title="Supprimer"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STATE: Loading */}
          {isSearchingApi && (
            <div className="flex flex-col items-center justify-center py-15 text-[#0F6E56]">
              <Loader2 size={32} className="animate-spin mb-4" />
              <div className="font-semibold text-[14px]">Recherche en cours...</div>
            </div>
          )}

          {/* STATE: Results */}
          {isSearching && !isSearchingApi && results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="font-[family-name:var(--font-heading)] font-bold text-[13px] text-[#1A1A1A] flex items-center gap-2">
                  Résultats
                  <span className="text-[11px] font-semibold bg-[#D4EAE3] text-[#0F6E56] rounded-full px-2.5 py-0.5">
                    {results.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5 mb-8 animate-[fadeUp_0.3s_ease_both]">
                {results.map((u, i) => {
                  const status = userStatus[u.id];
                  const isOnline = status?.isOnline;
                  const lastSeenAt = status?.lastSeenAt; // Or from u.lastSeenAt if we expose it in User type
                  
                  const fullName = `${u.firstName} ${u.lastName}`;
                  const initials = `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
                  const avColor = ["bg-[#0F6E56] text-white", "bg-[#C6F0E3] text-[#0A7A5A]", "bg-[#D8EDE8] text-[#3B7A6A]"][u.id.charCodeAt(0) % 3];
                  
                  return (
                    <div key={u.id} className="bg-white border-[1.5px] border-[#D4EAE3] rounded-2xl p-4.5 pb-4 flex flex-col gap-3.5 transition-all cursor-default hover:border-[#A8CDBF] hover:shadow-[0_4px_16px_rgba(15,110,86,0.08)] hover:-translate-y-0.5" style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both', animationName: 'fadeUp', animationDuration: '0.25s' }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-[family-name:var(--font-heading)] font-bold text-[16px] relative ${avColor}`}>
                          {initials}
                          {isOnline && (
                            <div className="absolute bottom-[1px] right-[1px] w-[11px] h-[11px] bg-[#3DDBA0] rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-[family-name:var(--font-heading)] font-bold text-[15px] text-[#1A1A1A] whitespace-nowrap overflow-hidden text-ellipsis mb-0.5">
                            {highlightText(fullName, debouncedQuery)}
                          </div>
                          <div className="text-[13px] text-[#7EA898]">
                            @{highlightText(u.pseudo || "anonyme", debouncedQuery)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {isOnline ? (
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[#3DDBA0]/30 bg-[#3DDBA0]/10 text-[#1A9E78]">
                            <span className="w-1.5 h-1.5 bg-[#3DDBA0] rounded-full" />
                            En ligne
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[#D4EAE3] bg-[#EAF6F1] text-[#7EA898]">
                            {formatRelativeTime(lastSeenAt)}
                          </div>
                        )}
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[#D4EAE3] bg-[#EAF6F1] text-[#7EA898]">
                          <Shield size={11} strokeWidth={2.5} />
                          Chiffré E2E
                        </div>
                      </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => router.push(`/?userId=${u.id}`)}
                        className="flex-1 py-2 rounded-[10px] bg-[#0F6E56] border-none font-[family-name:var(--font-body)] text-[13px] font-semibold text-white cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:bg-[#0A4A38] active:scale-[0.97]"
                      >
                        <MessageSquare size={14} strokeWidth={2.5} />
                        Envoyer un message
                      </button>
                      <button className="px-3.5 py-2 rounded-[10px] bg-transparent border-[1.5px] border-[#D4EAE3] font-[family-name:var(--font-body)] text-[13px] font-medium text-[#4A5A54] cursor-pointer flex items-center justify-center transition-all hover:border-[#A8CDBF] hover:bg-[#EAF6F1] hover:text-[#1A1A1A]" title="Voir le profil">
                        <UserIcon size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* STATE: Empty Results */}
          {isSearching && results.length === 0 && !isSearchingApi && (
            <div className="flex flex-col items-center justify-center py-15 text-center animate-[fadeUp_0.35s_ease_both]">
              <div className="w-[72px] h-[72px] rounded-[22px] bg-[#EAF6F1] border-[1.5px] border-[#D4EAE3] flex items-center justify-center text-[#A8CDBF] mb-4.5">
                <Search size={32} strokeWidth={1.5} />
              </div>
              <div className="font-[family-name:var(--font-heading)] font-bold text-[17px] text-[#1A1A1A] mb-2">
                Aucun résultat trouvé
              </div>
              <div className="text-[14px] text-[#7EA898] max-w-[280px] leading-[1.6]">
                Personne ne correspond à &quot;<span className="font-semibold">{debouncedQuery}</span>&quot;. Vérifiez l&apos;orthographe ou essayez un email complet.
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-4.5">
                <button onClick={() => { setQuery("@"); inputRef.current?.focus(); }} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border-[1.5px] border-[#D4EAE3] font-[family-name:var(--font-body)] text-[13px] font-medium text-[#4A5A54] cursor-pointer transition-colors hover:border-[#0F6E56] hover:text-[#0F6E56]">
                  <AtSign size={12} strokeWidth={2.5} />
                  Chercher par pseudo
                </button>
                <button onClick={() => { setFilter("email"); inputRef.current?.focus(); }} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border-[1.5px] border-[#D4EAE3] font-[family-name:var(--font-body)] text-[13px] font-medium text-[#4A5A54] cursor-pointer transition-colors hover:border-[#0F6E56] hover:text-[#0F6E56]">
                  <Mail size={12} strokeWidth={2.5} />
                  Chercher par email
                </button>
                <button onClick={() => { setQuery(""); setDebouncedQuery(""); inputRef.current?.focus(); }} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border-[1.5px] border-[#D4EAE3] font-[family-name:var(--font-body)] text-[13px] font-medium text-[#4A5A54] cursor-pointer transition-colors hover:border-[#0F6E56] hover:text-[#0F6E56]">
                  <X size={12} strokeWidth={2.5} />
                  Réinitialiser
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
