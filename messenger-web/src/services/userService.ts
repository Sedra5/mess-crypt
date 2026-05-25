import { api } from "@/lib/api";
import { User, Result } from "@/lib/types";
import { AxiosError } from "axios";

interface ApiErrorResponse {
  error?: string;
  errors?: Record<string, string[]>;
}

class UserService {
  /**
   * Search users by query (pseudo or email)
   */
  async searchUsers(query: string): Promise<Result<User[]>> {
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error searching users:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de la recherche",
      };
    }
  }

  /**
   * Update the current user's profile
   */
  async updateProfile(data: Partial<Pick<User, "firstName" | "lastName" | "pseudo">>): Promise<Result<User>> {
    try {
      const res = await api.put("/users/profile", data);
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error updating profile:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de la mise à jour du profil",
      };
    }
  }

  /**
   * Update the user's password
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<Result<void>> {
    try {
      const res = await api.put("/users/password", { currentPassword, newPassword });
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error updating password:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de la mise à jour du mot de passe",
      };
    }
  }

  /**
   * Store the PIN-encrypted private key backup
   */
  async storePinBackup(encryptedPrivateKey: string, salt: string): Promise<Result<void>> {
    try {
      const res = await api.post("/auth/pin", { encryptedPrivateKey, salt });
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error storing PIN backup:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de la sauvegarde du PIN",
      };
    }
  }

  /**
   * Generates a 12-word recovery phrase from the backend.
   */
  async generateRecoveryPhrase(): Promise<Result<string>> {
    try {
      const res = await api.get("/auth/generate-recovery-phrase");
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Error generating recovery phrase:", err);
      return {
        success: false,
        error: axiosErr.response?.data?.error || "Erreur lors de la génération de la phrase",
      };
    }
  }
}

export const userService = new UserService();
