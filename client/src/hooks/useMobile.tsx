// useIsMobile.ts - Responsive design hook for mobile detection
// 
// Purpose: Detect if the user is on a mobile device based on viewport width.
//          Used throughout the app to conditionally render mobile-optimized layouts.
//          Updates automatically when window is resized.

import * as React from "react";

// Standard mobile breakpoint (768px is tablet/mobile boundary)
const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the current viewport is mobile-sized
 * 
 * Features:
 * - Reacts to window resize events
 * - Cleanup on component unmount
 * - Server-side rendering safe (returns false initially)
 * 
 * @returns boolean - True if viewport width < 768px
 * 
 * @example
 * const isMobile = useIsMobile();
 * 
 * return (
 *   <div>
 *     {isMobile ? (
 *       <MobileNavigation />
 *     ) : (
 *       <DesktopNavigation />
 *     )}
 *   </div>
 * );
 * 
 * @example
 * // Responsive styling
 * <div className={cn(
 *   "p-4",
 *   isMobile ? "p-2" : "p-6"
 * )}>
 *   Content adjusts based on screen size
 * </div>
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    // Use matchMedia for better performance (hardware-accelerated)
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Listen for resize events
    mql.addEventListener("change", onChange);
    
    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // Cleanup listener on unmount
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Return boolean (coerces undefined to false)
  return !!isMobile;
}