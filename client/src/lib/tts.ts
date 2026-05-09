// client/src/lib/tts.ts

/**
 * Language map for BCP 47 voice tags.
 * Luganda falls back to Swahili as the closest available voice.
 */
const LANG_MAP: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  sw: "sw-KE",
  lg: "sw-KE",   // Luganda → Swahili (closest available)
  hi: "hi-IN",
  es: "es-ES",
};

/**
 * Speak text aloud using the browser's built-in Web Speech API.
 * Works offline – no API keys or internet required.
 *
 * @param text     The text to speak
 * @param language CropGuard language code (en, fr, sw, lg, hi, es)
 */
export function speak(text: string, language: string = "en") {
  // Check browser support
  if (!("speechSynthesis" in window)) {
    console.warn("⚠️ Text-to-speech not supported in this browser");
    return;
  }

  // Cancel any ongoing speech before starting new one
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_MAP[language] || "en-US";
  utterance.rate = 0.9;   // Slightly slower for clarity
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to find a matching voice for better quality
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) => v.lang.startsWith(utterance.lang.split("-")[0])
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any currently playing speech immediately.
 */
export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    // Some browsers need a second cancel to fully stop
    setTimeout(() => window.speechSynthesis.cancel(), 50);
  }
}

/**
 * Check if speech is currently playing.
 */
export function isSpeaking(): boolean {
  return window.speechSynthesis.speaking;
}