/**
 * client/src/_core/hooks/useAuth.ts
 *
 * Uses the real tRPC client with JWT stored in localStorage.
 * Token is cleared on logout.
 */

import { trpc, clearToken } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  // me query — runs on mount, cached 30s
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry:               false,
    refetchOnWindowFocus: false,
  });

  // logout mutation
  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: async () => {
      clearToken();
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Already logged out — still clear state
      clearToken();
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => ({
    user:            meQuery.data ?? null,
    loading:         meQuery.isLoading || logoutMutation.isPending,
    error:           meQuery.error   ?? logoutMutation.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
  }), [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}