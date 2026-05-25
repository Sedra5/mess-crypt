import { api } from "@/lib/api";
import { User, Result } from "@/lib/types";
import { AxiosError } from "axios";

interface ApiErrorResponse {
  error?: string;
  errors?: Record<string, string[]>;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

class AuthService {
  /**
   * Login a user
   */
  async login(payload: any): Promise<Result<AuthResponse>> {
    try {
      const res = await api.post("/auth/login", payload);
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error logging in:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur de connexion",
      };
    }
  }

  /**
   * Register a user
   */
  async register(payload: any): Promise<Result<AuthResponse>> {
    try {
      const res = await api.post("/auth/register", payload);
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error registering:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de l'inscription",
      };
    }
  }

  /**
   * Logout a user
   */
  async logout(refreshToken: string): Promise<Result<void>> {
    try {
      const res = await api.post("/auth/logout", { refreshToken });
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error logging out:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de la déconnexion",
      };
    }
  }
  /**
   * Get connected devices
   */
  async getDevices(): Promise<Result<any[]>> {
    try {
      const res = await api.get("/auth/devices");
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error fetching devices:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de la récupération des appareils",
      };
    }
  }

  /**
   * Revoke a device
   */
  async revokeDevice(deviceId: string): Promise<Result<void>> {
    try {
      const res = await api.post("/auth/devices/revoke", { deviceId });
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error revoking device:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de la révocation de l'appareil",
      };
    }
  }
}

export const authService = new AuthService();
