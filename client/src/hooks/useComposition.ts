// useComposition.ts - Handle IME composition events for input fields
// 
// Purpose: Handle Input Method Editor (IME) composition events like Chinese, Japanese,
//          and Korean text input. Prevents Enter key from submitting forms while
//          the user is still composing text.
//
// Why needed: In languages like Chinese, users type multiple characters that are
//             "composed" before final selection. Without this hook, pressing Enter
//             would submit the form prematurely.

import { useRef } from "react";
import { usePersistFn } from "./usePersistFn";

// ============================================================================
// Type Definitions
// ============================================================================

export interface UseCompositionReturn<
  T extends HTMLInputElement | HTMLTextAreaElement,
> {
  onCompositionStart: React.CompositionEventHandler<T>;
  onCompositionEnd: React.CompositionEventHandler<T>;
  onKeyDown: React.KeyboardEventHandler<T>;
  isComposing: () => boolean;
}

export interface UseCompositionOptions<
  T extends HTMLInputElement | HTMLTextAreaElement,
> {
  onKeyDown?: React.KeyboardEventHandler<T>;
  onCompositionStart?: React.CompositionEventHandler<T>;
  onCompositionEnd?: React.CompositionEventHandler<T>;
}

type TimerResponse = ReturnType<typeof setTimeout>;

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for handling IME composition events (Chinese, Japanese, Korean text input)
 * 
 * @param options - Optional event handlers
 * @returns Event handlers and composition state checker
 * 
 * @example
 * // In a chat input component:
 * const { onCompositionStart, onCompositionEnd, onKeyDown } = useComposition({
 *   onKeyDown: (e) => {
 *     if (e.key === "Enter" && !e.shiftKey) {
 *       sendMessage();
 *     }
 *   }
 * });
 * 
 * return (
 *   <input
 *     onCompositionStart={onCompositionStart}
 *     onCompositionEnd={onCompositionEnd}
 *     onKeyDown={onKeyDown}
 *   />
 * );
 */
export function useComposition<
  T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement,
>(options: UseCompositionOptions<T> = {}): UseCompositionReturn<T> {
  const {
    onKeyDown: originalOnKeyDown,
    onCompositionStart: originalOnCompositionStart,
    onCompositionEnd: originalOnCompositionEnd,
  } = options;

  // Track if composition is currently active
  const isComposingRef = useRef(false);
  const timer = useRef<TimerResponse | null>(null);
  const timer2 = useRef<TimerResponse | null>(null);

  /**
   * Called when composition starts (user begins typing IME text)
   */
  const onCompositionStart = usePersistFn((e: React.CompositionEvent<T>) => {
    // Clear any pending timers
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (timer2.current) {
      clearTimeout(timer2.current);
      timer2.current = null;
    }
    isComposingRef.current = true;
    originalOnCompositionStart?.(e);
  });

  /**
   * Called when composition ends (user selects final text)
   * Uses double setTimeout to handle Safari browser quirk where compositionEnd
   * fires before onKeyDown
   */
  const onCompositionEnd = usePersistFn((e: React.CompositionEvent<T>) => {
    // Safari workaround: double timeout ensures composition state is cleared
    // after all related events have fired
    timer.current = setTimeout(() => {
      timer2.current = setTimeout(() => {
        isComposingRef.current = false;
      });
    });
    originalOnCompositionEnd?.(e);
  });

  /**
   * Modified onKeyDown handler that prevents Enter/Esc during composition
   */
  const onKeyDown = usePersistFn((e: React.KeyboardEvent<T>) => {
    // Block Enter (without Shift) and Escape keys while composing text
    // This prevents form submission or modal closure during IME input
    if (
      isComposingRef.current &&
      (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey))
    ) {
      e.stopPropagation();
      return;
    }
    originalOnKeyDown?.(e);
  });

  /**
   * Check if composition is currently active
   * Useful for conditional UI behavior
   */
  const isComposing = usePersistFn(() => {
    return isComposingRef.current;
  });

  return {
    onCompositionStart,
    onCompositionEnd,
    onKeyDown,
    isComposing,
  };
}