// ThemeContext.tsx - Dark/Light mode theme management for CropGuard AI
// 
// Purpose: Provide theme switching functionality (light/dark mode) across the entire app.
//          Supports both fixed themes (not switchable) and user-selectable themes with
//          localStorage persistence.
//
// How it works:
// - Light mode: normal styling with light backgrounds
// - Dark mode: adds "dark" class to html element, Tailwind applies dark variants
// - User preference saved to localStorage for persistence across sessions

import React, { createContext, useContext, useEffect, useState } from "react";

// ============================================================================
// Type Definitions
// ============================================================================

/** Available theme options */
type Theme = "light" | "dark";

/** Context value structure for theme state and controls */
interface ThemeContextType {
  theme: Theme;                    // Current active theme
  toggleTheme?: () => void;       // Function to switch themes (undefined if not switchable)
  switchable: boolean;            // Whether theme switching is enabled
}

// ============================================================================
// Context Creation
// ============================================================================

/** React context for theme state - undefined initially until provider is mounted */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Props for the ThemeProvider component */
interface ThemeProviderProps {
  children: React.ReactNode;      // Child components to be wrapped
  defaultTheme?: Theme;           // Default theme if no saved preference (default: "light")
  switchable?: boolean;           // Whether users can change themes (default: false)
}

// ============================================================================
// Theme Provider Component
// ============================================================================

/**
 * ThemeProvider component that wraps the application to provide theme capabilities
 * 
 * Features:
 * - Applies theme class to HTML element
 * - Persists user preference to localStorage (if switchable)
 * - Supports both fixed and user-selectable themes
 * 
 * @example
 * // App.tsx - Fixed light theme (not switchable)
 * <ThemeProvider defaultTheme="light">
 *   <App />
 * </ThemeProvider>
 * 
 * @example
 * // App.tsx - Switchable theme with dark mode support
 * <ThemeProvider defaultTheme="light" switchable>
 *   <App />
 * </ThemeProvider>
 * 
 * @example
 * // Inside a component
 * const { theme, toggleTheme } = useTheme();
 * return (
 *   <button onClick={toggleTheme}>
 *     Switch to {theme === "light" ? "dark" : "light"} mode
 *   </button>
 * );
 */
export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  /**
   * Initialize theme state
   * - If switchable: check localStorage first, fallback to defaultTheme
   * - If not switchable: always use defaultTheme
   */
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  /**
   * Apply theme to document root and persist to localStorage (if switchable)
   * Effect runs whenever theme or switchable changes
   */
  useEffect(() => {
    const root = document.documentElement;
    
    // Add/remove "dark" class on html element
    // Tailwind's dark mode uses this class to apply dark variants
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Persist user preference only if theme switching is enabled
    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  /**
   * Toggle function - only provided if theme switching is enabled
   * Switches between "light" and "dark"
   */
  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// Custom Hook for Theme Access
// ============================================================================

/**
 * Custom hook to access theme context throughout the app
 * 
 * @returns ThemeContextType - Current theme state and controls
 * @throws Error if used outside of ThemeProvider
 * 
 * @example
 * // Basic usage
 * const { theme } = useTheme();
 * console.log(`Current theme: ${theme}`);
 * 
 * @example
 * // With toggle functionality
 * const { theme, toggleTheme, switchable } = useTheme();
 * 
 * return (
 *   <div>
 *     <p>Current theme: {theme}</p>
 *     {switchable && (
 *       <button onClick={toggleTheme}>
 *         Switch to {theme === "light" ? "dark" : "light"}
 *       </button>
 *     )}
 *   </div>
 * );
 * 
 * @example
 * // Conditional styling based on theme
 * const { theme } = useTheme();
 * return (
 *   <div className={theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}>
 *     Content adapts to theme
 *   </div>
 * );
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  // Ensure hook is used within ThemeProvider
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  
  return context;
}