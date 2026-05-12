/**
 * client/src/const.ts
 * 
 * CropGuard AI - Application Constants
 * 
 * Purpose: Central location for all application-wide constants including URLs,
 *          API endpoints, app metadata, and configuration values.
 *          This makes it easy to update values without searching through the entire codebase.
 */

// ============================================================================
// AUTHENTICATION URLS
// ============================================================================
// These functions determine where users are redirected for authentication flows.
// Currently configured for local development (internal routing).
// For production with a real OAuth provider (Google, Auth0, etc.), update these
// to point to your actual OAuth authorization endpoints.

/**
 * Returns the URL for user login
 * 
 * For local development: Uses internal routing to our login page
 * For production with OAuth: Would return something like:
 *   "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
 * 
 * @returns {string} The login URL
 */
export function getLoginUrl(): string {
  return "/login";
}

/**
 * Returns the URL for user registration/signup
 * 
 * For local development: Uses internal routing to our signup page
 * For production with OAuth: Would return the OAuth signup URL
 * 
 * @returns {string} The signup URL
 */
export function getSignupUrl(): string {
  return "/signup";
}

// ============================================================================
// APPLICATION METADATA
// ============================================================================
// These constants are used throughout the app for branding and version display

/**
 * The name of the application
 * Used in:
 * - Browser tab titles
 * - Page headers
 * - Footer copyright notices
 * - Meta tags for SEO
 */
export const APP_NAME = "CropGuard";

/**
 * Current application version (Semantic Versioning)
 * Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes
 * - MINOR: New features (backwards compatible)
 * - PATCH: Bug fixes and small improvements
 * 
 * Used for:
 * - Display in footer
 * - API version headers
 * - Debug logging
 * - Feature flags
 */
export const APP_VERSION = "2.1.0";

// ============================================================================
// API CONFIGURATION (Future Expansion)
// ============================================================================
// The following constants are commented out but kept as examples for future needs

/**
 * Example: API base URL for different environments
 * Would be set based on NODE_ENV or Vite environment variables
 */
// export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Example: Feature flags for gradual rollouts
 * Enable/disable features without redeploying
 */
// export const FEATURES = {
//   ENABLE_ANALYTICS: true,
//   ENABLE_PDF_REPORTS: true,
//   ENABLE_SOCIAL_SHARING: false,
// };

/**
 * Example: Pagination defaults
 */
// export const PAGINATION = {
//   DEFAULT_PAGE_SIZE: 10,
//   MAX_PAGE_SIZE: 100,
// };