// client/src/lib/tts.ts
// CropGuard AI - Text-to-Speech (TTS) Utilities

/**
 * Purpose: Provide accessible text-to-speech functionality for farmers.
 *          Uses browser's built-in Web Speech API - works offline, no API keys required.
 *          Supports multiple languages to help farmers who prefer listening over reading.
 * 
 * Features:
 * - Multi-language support (English, French, Swahili, Luganda, Hindi, Spanish)
 * - Automatic voice selection for best quality
 * - Ability to stop playback
 * - Progress monitoring
 */

// ============================================================================
// Language Voice Mapping
// ============================================================================

/**
 * Map CropGuard language codes to BCP 47 voice tags for speech synthesis
 * 
 * Note: Luganda doesn't have native TTS support, so we use Swahili as the closest available voice
 * 
 * Supported languages:
 * - English → English (US)
 * - French → French (France)
 * - Swahili → Swahili (Kenya)
 * - Luganda → Swahili (Kenya) - fallback
 * - Hindi → Hindi (India)
 * - Spanish → Spanish (Spain)
 */
const LANG_MAP: Record<string, string> = {
  en: "en-US",      // English (United States)
  fr: "fr-FR",      // French (France)
  sw: "sw-KE",      // Swahili (Kenya)
  lg: "sw-KE",      // Luganda → Swahili (closest available)
  hi: "hi-IN",      // Hindi (India)
  es: "es-ES",      // Spanish (Spain)
};

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Speak text aloud using the browser's built-in Web Speech API
 * 
 * Features:
 * - Works offline - no API keys or internet connection required
 * - Automatically cancels previous speech before starting new one
 * - Attempts to find the best matching voice for the language
 * - Adjusts speech rate for clarity (slightly slower than default)
 * 
 * @param text - The text to speak aloud
 * @param language - CropGuard language code (en, fr, sw, lg, hi, es)
 * 
 * @example
 * speak("Your crop has cassava mosaic disease", "en");
 * speak("Votre culture a la mosaïque du manioc", "fr");
 */
export function speak(text: string, language: string = "en") {
  // Check if browser supports speech synthesis
  if (!("speechSynthesis" in window)) {
    console.warn("⚠️ Text-to-speech not supported in this browser");
    return;
  }

  // Cancel any ongoing speech before starting new one
  // This prevents overlapping speech and improves responsiveness
  window.speechSynthesis.cancel();

  // Create speech utterance with text and language settings
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_MAP[language] || "en-US";
  utterance.rate = 0.9;   // Slightly slower than default for better clarity
  utterance.pitch = 1.0;  // Normal pitch
  utterance.volume = 1.0; // Maximum volume

  // Try to find a matching voice for better pronunciation quality
  // Some browsers have multiple voices per language - we pick the best match
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) => v.lang.startsWith(utterance.lang.split("-")[0])
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Start speaking
  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any currently playing speech immediately
 * 
 * Useful for:
 * - User clicking "Stop" button
 * - Navigation away from page
 * - Component unmounting
 * 
 * Note: Some browsers need a second cancel call to fully stop,
 *       so we add a brief timeout for reliability.
 */
export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    // Second cancel helps with some browsers that don't stop immediately
    setTimeout(() => window.speechSynthesis.cancel(), 50);
  }
}

/**
 * Check if speech is currently playing
 * 
 * @returns True if speech synthesis is active, false otherwise
 * 
 * @example
 * if (isSpeaking()) {
 *   console.log("Audio is playing");
 * }
 */
export function isSpeaking(): boolean {
  return window.speechSynthesis.speaking;
}