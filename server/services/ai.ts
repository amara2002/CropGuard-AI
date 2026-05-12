// server/services/ai.ts
// CropGuard AI - Google Gemini AI Integration
// 
// Purpose: Generate intelligent crop disease recommendations using Google's Gemini AI.
//          Provides farmers with:
//          - Disease descriptions
//          - Treatment recommendations (step-by-step)
//          - Fertilizer suggestions (with NPK ratios)
//          - Prevention measures
//
// Why Gemini?
// - Multilingual support (English, French, Swahili, Luganda)
// - Structured JSON output
// - Context-aware responses
// - Free tier available for development

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../_core/env.js";

// ============================================================================
// Gemini API Initialization
// ============================================================================

// Initialize Google Gemini AI client with API key from environment
const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Structure of AI-generated recommendations
 * Matches the JSON format expected by the frontend
 */
export interface SmartRecommendations {
  description: string;                    // Disease overview and impact
  treatments: Array<{                     // Step-by-step treatment plan
    name: string;                         // Treatment name
    description: string;                  // How to apply
    duration?: string;                    // How long to continue
  }>;
  prevention: Array<{                     // Long-term prevention strategies
    name: string;                         // Prevention method name
    description: string;                  // Implementation details
  }>;
  fertilizer: Array<{                     // Nutrient recommendations
    name: string;                         // Fertilizer type
    npkRatio?: string;                    // NPK ratio (e.g., "17:17:17")
    applicationRate?: string;             // How much to apply
  }>;
}

// ============================================================================
// Main AI Recommendation Function
// ============================================================================

/**
 * Generate smart agricultural recommendations using Gemini AI
 * 
 * Workflow:
 * 1. Format disease name (replace underscores with spaces)
 * 2. Map language code to full language name
 * 3. Construct prompt for Gemini (with JSON format requirement)
 * 4. Call Gemini API with retry logic (max 2 attempts)
 * 5. Parse JSON response
 * 6. Return structured recommendations
 * 7. Fallback to static responses if API fails
 * 
 * @param diseaseName - Detected disease from MobileNet model
 * @param cropType - Type of crop (Bean, Cassava, Corn, Potato, Tomato)
 * @param language - User's preferred language (en, fr, sw, lg)
 * @returns Promise<SmartRecommendations> Structured recommendations
 * 
 * @example
 * const recommendations = await getSmartRecommendations(
 *   "Cassava_Mosaic_Disease",
 *   "Cassava",
 *   "en"
 * );
 * // Returns JSON with treatment plans, fertilizer suggestions, etc.
 */
export async function getSmartRecommendations(
  diseaseName: string,
  cropType: string,
  language?: string,
): Promise<SmartRecommendations> {
  // Clean disease name for better AI comprehension
  // Example: "Cassava_Mosaic_Disease" -> "Cassava Mosaic Disease"
  const cleanName = diseaseName.replace(/_/g, " ");

  // Map CropGuard language codes to full language names for AI prompt
  const languageMap: Record<string, string> = {
    en: "English",
    fr: "French",
    sw: "Swahili",
    lg: "Luganda",
  };

  const langName = languageMap[language || "en"] || "English";

  // Configure Gemini model for JSON output
  // Using gemini-3-flash-preview (fast, good for structured output)
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",  // Force JSON output
      temperature: 0.4,                     // Lower = more consistent, less creative
    },
  });

  // Construct prompt with clear JSON structure requirements
  const prompt = `
You are an expert Agronomist specializing in African smallholder agriculture. 
A trained AI model has detected "${cleanName}" in a "${cropType}" crop.

**CRITICAL INSTRUCTION: Write your ENTIRE response in ${langName}. All text must be in ${langName}.**

Respond with a valid JSON object.
JSON Structure:
{
  "description": "Professional overview of the disease written in ${langName}",
  "treatments": [{ "name": "...", "description": "...", "duration": "..." }],
  "prevention": [{ "name": "...", "description": "..." }],
  "fertilizer": [{ "name": "...", "npkRatio": "...", "applicationRate": "..." }]
}

Rules:
- treatments: 3-5 steps available to African farmers (organic and accessible chemical options)
- prevention: 3-5 long-term measures (crop rotation, soil health, sanitation)
- fertilizer: 2-3 nutrient suggestions to boost recovery
- Keep language professional but accessible.
- Write ALL text fields in ${langName}.
`;

  // Retry logic - Gemini API can occasionally fail
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }

      console.log("✅ Gemini dynamic advice generated successfully");
      return JSON.parse(responseText.trim()) as SmartRecommendations;
      
    } catch (err: any) {
      console.error(`❌ Gemini attempt ${attempt + 1} failed:`, err.message);
      
      // Wait 2 seconds before retry (helps with rate limiting)
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // ==========================================================================
  // Fallback Recommendations - Used when Gemini API is unavailable
  // ==========================================================================
  // Provides basic recommendations in user's language
  // Prevents complete failure if AI service is down
  
  console.log("⚠️ Using fallback recommendations");
  
  const fallbackTexts: Record<string, any> = {
    English: {
      description: `Analysis for ${cleanName} on ${cropType} is complete. Detailed AI advice is temporarily unavailable.`,
      treatments: [
        { name: "Isolate Plants", description: "Remove heavily infected leaves to prevent spread.", duration: "Immediate" },
        { name: "Consult Local Expert", description: "Contact your local agricultural extension officer." }
      ],
      prevention: [
        { name: "Field Hygiene", description: "Clear weeds and burn infected debris." },
        { name: "Water Management", description: "Avoid overhead watering which spreads spores." }
      ],
      fertilizer: [
        { name: "General NPK", npkRatio: "17:17:17", applicationRate: "Apply as per local soil test results." }
      ],
    },
    French: {
      description: `L'analyse pour ${cleanName} sur ${cropType} est terminée. Les conseils détaillés de l'IA sont temporairement indisponibles.`,
      treatments: [
        { name: "Isoler les plantes", description: "Retirez les feuilles fortement infectées pour empêcher la propagation.", duration: "Immédiat" },
        { name: "Consulter un expert local", description: "Contactez votre agent de vulgarisation agricole local." }
      ],
      prevention: [
        { name: "Hygiène du champ", description: "Désherbez et brûlez les débris infectés." },
        { name: "Gestion de l'eau", description: "Évitez l'arrosage par aspersion qui propage les spores." }
      ],
      fertilizer: [
        { name: "NPK Général", npkRatio: "17:17:17", applicationRate: "Appliquer selon les résultats d'analyse du sol local." }
      ],
    },
    Swahili: {
      description: `Uchambuzi wa ${cleanName} kwenye ${cropType} umekamilika. Ushauri wa kina wa AI haupatikani kwa muda.`,
      treatments: [
        { name: "Tenga mimea", description: "Ondoa majani yaliyoambukizwa sana ili kuzuia kuenea.", duration: "Mara moja" },
        { name: "Wasiliana na mtaalam wa ndani", description: "Wasiliana na afisa wako wa ugani wa kilimo." }
      ],
      prevention: [
        { name: "Usafi wa shamba", description: "Ondoa magugu na uchome uchafu ulioambukizwa." },
        { name: "Usimamizi wa maji", description: "Epuka kumwagilia kwa juu kunakoeneza spores." }
      ],
      fertilizer: [
        { name: "NPK ya Jumla", npkRatio: "17:17:17", applicationRate: "Tumia kulingana na matokeo ya uchunguzi wa udongo wa eneo lako." }
      ],
    },
  };

  return fallbackTexts[langName] || fallbackTexts.English;
}