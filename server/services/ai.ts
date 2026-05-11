import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../_core/env.js";

// Initialize the API with your key from the .env
const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);

export interface SmartRecommendations {
  description: string;
  treatments: Array<{ name: string; description: string; duration?: string }>;
  prevention: Array<{ name: string; description: string }>;
  fertilizer: Array<{ name: string; npkRatio?: string; applicationRate?: string }>;
}

export async function getSmartRecommendations(
  diseaseName: string,
  cropType: string,
  language?: string,
): Promise<SmartRecommendations> {
  const cleanName = diseaseName.replace(/_/g, " ");

  // Language mapping
  const languageMap: Record<string, string> = {
    en: "English",
    fr: "French",
    sw: "Swahili",
    lg: "Luganda",
  };

  const langName = languageMap[language || "en"] || "English";

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

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
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Fallback only if all retries fail
  console.log("⚠️ Using fallback recommendations");
  
  // Map fallback text based on language
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