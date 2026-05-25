"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { Monitor, Smartphone, Globe, AlertCircle, ShieldAlert, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { McButton } from "@/components/ui/McButton";
import { McAlert } from "@/components/ui/McAlert";

interface Device {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  isCurrentDevice: boolean;
}

export default function DevicesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDevices = async () => {
    setIsLoading(true);
    const res = await authService.getDevices();
    if (res.success && res.data) {
      setDevices(res.data);
    } else {
      setError("Erreur lors de la récupération des appareils");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchDevices();
  }, [user, router]);

  const handleRevoke = async (deviceId: string) => {
    if (!confirm("Voulez-vous vraiment déconnecter cet appareil ? Il devra se reconnecter.")) return;
    
    const res = await authService.revokeDevice(deviceId);
    if (res.success) {
      // Remove from list
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } else {
      alert("Échec de la déconnexion de l'appareil.");
    }
  };

  const getDeviceIcon = (info: string) => {
    const lowerInfo = info.toLowerCase();
    if (lowerInfo.includes("mobile") || lowerInfo.includes("android") || lowerInfo.includes("iphone")) {
      return <Smartphone className="text-[#0F6E56] w-6 h-6" />;
    }
    if (lowerInfo.includes("windows") || lowerInfo.includes("mac") || lowerInfo.includes("linux")) {
      return <Monitor className="text-[#0F6E56] w-6 h-6" />;
    }
    return <Globe className="text-[#0F6E56] w-6 h-6" />;
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8 px-6">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#1A1A1A] mb-2 flex items-center gap-2">
          <ShieldAlert className="text-[#0F6E56]" /> Appareils connectés
        </h1>
        <p className="text-[#4A5A54] text-sm mb-8">
          Consultez et gérez les appareils qui ont actuellement accès à votre compte Mess'Crypt.
        </p>

        {error && <McAlert type="error" className="mb-6">{error}</McAlert>}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F6E56]"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div 
                key={device.id} 
                className={`flex items-center justify-between p-5 bg-white border rounded-xl shadow-sm transition-all ${
                  device.isCurrentDevice ? "border-[#0F6E56] ring-1 ring-[#0F6E56]/20" : "border-[#E8F3EF]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${device.isCurrentDevice ? "bg-[#E6F4EF]" : "bg-[#F4FBF8]"}`}>
                    {getDeviceIcon(device.deviceInfo)}
                  </div>
                  <div>
                    <h3 className="text-[#1A1A1A] font-semibold flex items-center gap-2">
                      {device.deviceInfo || "Appareil Inconnu"}
                      {device.isCurrentDevice && (
                        <span className="text-[10px] uppercase font-bold bg-[#0F6E56] text-white px-2 py-0.5 rounded-full tracking-wider">
                          Cet appareil
                        </span>
                      )}
                    </h3>
                    <div className="text-[13px] text-[#7EA898] mt-1 space-y-0.5">
                      <p>Adresse IP : <span className="text-[#4A5A54]">{device.ipAddress}</span></p>
                      <p>Connecté le : <span className="text-[#4A5A54]">{new Date(device.createdAt).toLocaleDateString()}</span></p>
                    </div>
                  </div>
                </div>

                {!device.isCurrentDevice && (
                  <button
                    onClick={() => handleRevoke(device.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-[#D85A30] bg-[#FFF4EC] hover:bg-[#FCE6DB] transition-colors rounded-lg"
                    title="Déconnecter cet appareil"
                  >
                    <X size={16} strokeWidth={2.5} />
                    Déconnecter
                  </button>
                )}
              </div>
            ))}

            {devices.length === 0 && !isLoading && (
              <div className="text-center py-12 bg-[#F4FBF8] rounded-xl border border-[#E8F3EF]">
                <AlertCircle className="mx-auto text-[#A8CDBF] w-12 h-12 mb-3" />
                <p className="text-[#4A5A54] font-medium">Aucun appareil connecté trouvé.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
