// App.tsx - Root component for CropGuard AI application
// Purpose: Set up the application with all required providers (tRPC, React Query,
//          Error Boundary, Theme, Tooltips) and configure routing for all pages.
//          This file acts as the central hub for the entire application.

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, createTRPCClient } from "@/lib/trpc";
import Login from "@/pages/Login";
import AuthSuccess from "@/pages/AuthSuccess";
import GuestScanResult from "@/pages/GuestScanResult";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Analytics from "@/pages/Analytics";
import Dashboard from "./pages/Dashboard";
import ScanDetail from "./pages/ScanDetail";
import Signup from "./pages/Signup";
import ProfileSettings from "./pages/ProfileSettings";
import AccountSettings from "./pages/AccountSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import Scanner from "@/pages/scanner";
import Scans from "@/pages/Scans";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

// Router Component - Defines all application routes and their corresponding components
// Uses wouter for lightweight routing (similar to React Router but smaller bundle size)
function Router() {
  return (
    <Switch>
      {/* ==================== PUBLIC ROUTES ==================== */}
      {/* Anyone can access these pages without authentication */}
      
      {/* Marketing landing page */}
      <Route path="/" component={Home} />
      
      {/* Authentication pages */}
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      
      {/* OAuth callback handler - receives token from Google */}
      <Route path="/auth-success" component={AuthSuccess} />
      
      {/* Quick scan tools - accessible to both guests and authenticated users */}
      <Route path="/scanner" component={Scanner} />
      <Route path="/guest-result" component={GuestScanResult} />
      
      {/* Password recovery pages */}
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* ==================== PROTECTED ROUTES ==================== */}
      {/* These require user to be logged in - wrapped with ProtectedRoute component */}
      
      {/* Main dashboard after login */}
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>

      {/* User profile management */}
      <Route path="/profile-settings">
        {() => (
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        )}
      </Route>

      {/* Account preferences (language, notifications) */}
      <Route path="/account-settings">
        {() => (
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        )}
      </Route>

      {/* Disease scan results - dynamic route with scanId parameter */}
      <Route path="/scan/:scanId">
        {params => <ScanDetail scanId={parseInt(params.scanId)} />}
      </Route>

      {/* Scan history page - list all previous scans */}
      <Route path="/scans">
        {() => (
          <ProtectedRoute>
            <Scans />
          </ProtectedRoute>
        )}
      </Route>

      {/* Analytics dashboard - statistics and insights */}
      <Route path="/analytics">
        {() => (
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        )}
      </Route>

      {/* ==================== FALLBACK ROUTES ==================== */}
      {/* 404 page for any unmatched routes */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Main App Component - Sets up all providers for the application
// Providers wrap the entire app to make services available everywhere
function App() {
  // Initialize React Query client for server state management
  // useState ensures only one instance is created
  const [queryClient] = useState(() => new QueryClient());
  
  // Initialize tRPC client for type-safe API calls
  // Configured to connect to the backend server
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    // tRPC Provider - Enables type-safe API calls throughout the app
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      
      {/* React Query Provider - Manages caching and data fetching */}
      <QueryClientProvider client={queryClient}>
        
        {/* Error Boundary - Catches and displays errors gracefully */}
        <ErrorBoundary>
          
          {/* Theme Provider - Manages light/dark mode preferences */}
          <ThemeProvider defaultTheme="light">
            
            {/* Tooltip Provider - Enables tooltip functionality across the app */}
            <TooltipProvider>
              
              {/* Toast Notifications - For user feedback messages */}
              <Toaster />
              
              {/* Main Router - Handles all page navigation */}
              <Router />
              
            </TooltipProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;