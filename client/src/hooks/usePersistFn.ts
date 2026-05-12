// usePersistFn.ts - Hook to maintain stable function references
// 
// Purpose: Returns a stable function reference that never changes across re-renders,
//          while always calling the latest version of the provided function.
//          
// Why needed: React's useCallback creates new functions when dependencies change.
//              This hook provides a simpler mental model by always returning the
//              same function reference, reducing unnecessary child re-renders.

import { useRef } from "react";

// Type for any function (using any is acceptable here as it's a utility type)
type noop = (...args: any[]) => any;

/**
 * Returns a stable function reference that never changes, but always calls the latest
 * version of the provided function.
 * 
 * This is similar to useCallback but without the dependency array - the function
 * reference stays the same forever, making it ideal for passing to child components
 * or using in useEffect dependencies.
 * 
 * @param fn - The function to persist
 * @returns Stable function reference
 * 
 * @example
 * // Instead of:
 * const handleClick = useCallback(() => {
 *   doSomething(name);
 * }, [name]); // Recreates when 'name' changes
 * 
 * // Use:
 * const handleClick = usePersistFn(() => {
 *   doSomething(name);
 * }); // Never recreates, always uses latest 'name'
 * 
 * @example
 * // In a chat component with many re-renders:
 * const sendMessage = usePersistFn(() => {
 *   socket.emit('message', inputValue);
 * });
 * 
 * // Can be safely passed to child without causing re-renders
 * return <SendButton onClick={sendMessage} />;
 */
export function usePersistFn<T extends noop>(fn: T) {
  // Store the latest function in a ref (updates on every render)
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  // Create a stable function reference that never changes
  const persistFn = useRef<T>(null);
  if (!persistFn.current) {
    persistFn.current = function (this: unknown, ...args) {
      // Always call the latest version of the function
      return fnRef.current!.apply(this, args);
    } as T;
  }

  return persistFn.current!;
}