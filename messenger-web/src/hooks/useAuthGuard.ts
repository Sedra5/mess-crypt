"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook that waits for Zustand persist to rehydrate from localStorage
 * before checking authentication. Prevents the SSR race condition
 * where useEffect fires before the store has loaded from localStorage,
 * causing an unwanted redirect to /login on page refresh.
 *
 * @returns { isReady, user, isAuthenticated } - isReady is true once hydration is complete
 */
export function useAuthGuard() {
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Wait for Zustand persist rehydration
  useEffect(() => {
    // Zustand persist middleware exposes onFinishHydration
    const unsubFinishHydration = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If already hydrated (e.g. fast reload), set immediately
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  // Redirect only after hydration is complete
  useEffect(() => {
    if (isHydrated && (!isAuthenticated || !user)) {
      router.push("/login");
    }
  }, [isHydrated, isAuthenticated, user, router]);

  return {
    isReady: isHydrated && isAuthenticated && !!user,
    user,
    isAuthenticated,
  };
}
