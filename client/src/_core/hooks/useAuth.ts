import { trpc, clearToken } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

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
      clearToken();
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
    // Redirect to login after a tiny delay to allow toast to show
    setTimeout(() => {
      window.location.href = "/login";
    }, 400);
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const isAuthenticated = meQuery.isSuccess && !!meQuery.data;
    const loading = meQuery.isLoading || logoutMutation.isPending;
    const error = meQuery.error ?? logoutMutation.error ?? null;
    const user = meQuery.data ?? null;
    return { user, loading, error, isAuthenticated };
  }, [meQuery.data, meQuery.error, meQuery.isLoading, meQuery.isSuccess, logoutMutation.error, logoutMutation.isPending]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}