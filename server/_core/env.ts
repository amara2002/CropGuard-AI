import 'dotenv/config'; 

export const ENV = {
  // Database & Core
  databaseUrl:   process.env.DATABASE_URL           ?? "",
  geminiApiKey:  process.env.GEMINI_API_KEY         ?? "",
  supabaseUrl:   process.env.SUPABASE_URL           ?? "",
  supabaseKey:   process.env.SUPABASE_ANON_KEY      ?? "",
  fastapiUrl:    process.env.FASTAPI_URL            ?? "http://127.0.0.1:8000/predict",
  jwtSecret:     process.env.JWT_SECRET             ?? "cropguard-dev-secret-change-in-production",
  port:          3001,
  nodeEnv:       process.env.NODE_ENV               ?? "development",

  // OAuth / Manus SDK
  appId:         process.env.VITE_APP_ID            ?? "cropguard-local",
  appUrl:        process.env.APP_URL                ?? "http://localhost:3000",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL      ?? "https://auth.manus.computer",
  cookieSecret:  process.env.COOKIE_SECRET          ?? "dev-cookie-secret-change-me",
};