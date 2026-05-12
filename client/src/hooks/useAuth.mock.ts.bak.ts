/**
 * client/src/_core/hooks/useAuth.ts
 * 
 * CropGuard AI - Authentication Hook
 * 
 * Purpose: Provide authentication state and functions throughout the app.
 *          Uses the real tRPC client with JWT stored in localStorage.
 *          Token is automatically cleared on logout.
 * 
 * Features:
 * - Automatic token injection into API requests
 * - User session management
 * - Login/logout state tracking
 * - Automatic token cleanup on logout
 */

import { trpc, clearToken } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

/**
 * Main authentication hook for the application
 * 
 * @returns Authentication state and functions
 * 
 * @example
 * const { user, isAuthenticated, loading, logout } = useAuth();
 * 
 * if (loading) return <Spinner />;
 * if (!isAuthenticated) return <LoginPage />;
 * return <Dashboard user={user} />;
 */
export function useAuth() {
  const utils = trpc.useUtils();

  // ============================================================================
  // User Data Query
  // ============================================================================
  
  /**
   * Fetch current authenticated user data from backend
   * - Runs automatically on component mount
   * - Cached for 30 seconds to reduce network requests
   * - No retry on failure (prevents infinite loops)
   * - Doesn't refocus on window focus (improves performance)
   */
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,                    // Don't retry on failure
    refetchOnWindowFocus: false,    // Don't refetch when window regains focus
  });

  // ============================================================================
  // Logout Mutation
  // ============================================================================
  
  /**
   * Handle user logout
   * - Clears JWT token from localStorage
   * - Invalidates cached user data
   * - Resets React Query cache
   */
  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: async () => {
      clearToken();                      // Remove token from storage
      utils.auth.me.setData(undefined, null);  // Clear cached user data
      await utils.auth.me.invalidate(); // Invalidate any pending queries
    },
  });

  /**
   * Logout function that handles both successful and failed logout attempts
   * - Attempts server-side logout via mutation
   * - Falls back to client-side cleanup if mutation fails
   */
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // If server logout fails, still clear client state
      clearToken();
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  // ============================================================================
  // Derived State
  // ============================================================================
  
  /**
   * Memoized authentication state for performance
   * Only recomputed when relevant data changes
   */
  const state = useMemo(() => ({
    user: meQuery.data ?? null,                    // User object or null
    loading: meQuery.isLoading || logoutMutation.isPending, // Loading indicator
    error: meQuery.error ?? logoutMutation.error ?? null,   // Error state
    isAuthenticated: Boolean(meQuery.data),        // Boolean auth flag
  }), [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),  // Manually refresh user data
    logout,                            // Logout function
  };
}