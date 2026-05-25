import axios from "axios";
import { useAuthStore } from "@/store/authStore";

// Get API URL from runtime config or fallback to build time / localhost
const getApiUrl = () => {
  if (typeof window !== "undefined" && window.ENV && window.ENV.API_URL) {
    return window.ENV.API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5156/api";
};

export const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void, reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor to add access token to requests
api.interceptors.request.use((config) => {
  // Always ensure baseURL is correct (in case it wasn't available at module load)
  config.baseURL = getApiUrl();
  
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, logout, setTokens } = useAuthStore.getState();

      if (refreshToken) {
        try {
          // Attempt refresh using a clean axios instance to avoid interceptor loops
          const res = await axios.post(`${getApiUrl()}/auth/refresh`, {
            accessToken: useAuthStore.getState().accessToken,
            refreshToken: refreshToken,
          });

          if (res.data.success) {
            const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
            setTokens(newAccess, newRefresh);
            
            // Process queue
            processQueue(null, newAccess);

            // Update original request auth header
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return api(originalRequest);
          } else {
             // success was false
             processQueue(new Error("Refresh failed"));
             logout();
             return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError);
          logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        isRefreshing = false;
        logout();
      }
    }

    return Promise.reject(error);
  }
);
