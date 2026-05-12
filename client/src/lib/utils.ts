// utils.ts - CSS Class Name Utilities for CropGuard AI
// Purpose: Utility function for merging Tailwind CSS classes conditionally.
//          Combines clsx for conditional classes and tailwind-merge for deduplication.
//          This ensures clean, conflict-free class names on components.

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge and deduplicate Tailwind CSS class names
 * 
 * Features:
 * - Conditionally apply classes using clsx syntax
 * - Automatically merges conflicting Tailwind classes (last one wins)
 * - Removes duplicates
 * - Handles arrays, objects, strings, and nested structures
 * 
 * @param inputs - Array of class values (strings, objects, arrays, or falsy values)
 * @returns Merged and deduplicated class string
 * 
 * @example
 * // Basic usage
 * cn("px-2 py-1", "bg-red-500")
 * // Returns: "px-2 py-1 bg-red-500"
 * 
 * @example
 * // Conditional classes
 * cn("base-class", { "active": isActive, "disabled": isDisabled })
 * // Returns: "base-class active" if isActive is true
 * 
 * @example
 * // Conflict resolution (last class wins)
 * cn("p-4", "p-2")
 * // Returns: "p-2" (not "p-4 p-2")
 * 
 * @example
 * // Used in component
 * <div className={cn(
 *   "fixed inset-0 z-50",
 *   isOpen ? "visible opacity-100" : "invisible opacity-0",
 *   className
 * )} />
 */
export function cn(...inputs: ClassValue[]) {
  // clsx handles conditional logic, arrays, objects
  // twMerge handles Tailwind class conflicts and deduplication
  return twMerge(clsx(...inputs));
}