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

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/auth-success" component={AuthSuccess} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/guest-result" component={GuestScanResult} />

      {/* Protected Routes */}
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/profile-settings">
        {() => (
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/account-settings">
        {() => (
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/scan/:scanId">
        {params => <ScanDetail scanId={parseInt(params.scanId)} />}
      </Route>

      <Route path="/scans">
        {() => (
          <ProtectedRoute>
            <Scans />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/analytics">
        {() => (
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;