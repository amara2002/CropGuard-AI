// client/src/components/ProtectedRoute.tsx
// CropGuard AI - Protected Route Component
// 
// Purpose: Guard routes that require authentication.
//          Redirects unauthenticated users to login page.
//          Checks if user has completed onboarding (farmLocation) before allowing access.
//
// Usage: Wrap protected pages with this component:
//   <ProtectedRoute>
//     <Dashboard />
//   </ProtectedRoute>

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const [, setLocation] = useLocation();

  // ==========================================================================
  // Authentication Check
  // ==========================================================================
  
  useEffect(() => {
    if (!loading) {
      // Case 1: Not authenticated - redirect to login
      if (!isAuthenticated) {
        window.location.href = getLoginUrl();
      } 
      // Case 2: Authenticated but hasn't completed onboarding
      // Redirect to signup to complete farm location and crop selection
      else if (!user?.farmLocation) {
        setLocation("/signup");
      }
    }
  }, [isAuthenticated, loading, user?.farmLocation, setLocation]);

  // ==========================================================================
  // Loading State
  // ==========================================================================
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Redirect if not authenticated (fallback)
  // ==========================================================================
  
  if (!isAuthenticated) {
    setLocation(getLoginUrl(), { replace: true });
    return null;
  }

  // ==========================================================================
  // Render protected content
  // ==========================================================================
  
  return <>{children}</>;
}