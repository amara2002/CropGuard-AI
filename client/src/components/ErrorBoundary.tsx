// client/src/components/ErrorBoundary.tsx
// CropGuard AI - React Error Boundary
// 
// Purpose: Catch JavaScript errors anywhere in the component tree,
//          display a fallback UI instead of crashing the whole app.
//          Logs errors to console and provides a reload button for recovery.
//
// Uses React's Error Boundaries (only works in class components)
// Catches errors in rendering, lifecycle methods, and constructors

import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

// ============================================================================
// Type Definitions
// ============================================================================

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// Error Boundary Class Component
// ============================================================================

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * React lifecycle method called when an error occurs
   * Updates state to trigger fallback UI rendering
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Optional: Log error reporting service integration
   * Called after error is caught, useful for analytics
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    // Show fallback UI if error occurred
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            {/* Error Icon */}
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            {/* Error Message */}
            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            {/* Error Stack Trace (helpful for debugging) */}
            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            {/* Recovery Button */}
            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    // No error - render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;