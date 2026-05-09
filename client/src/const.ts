/**
 * client/src/const.ts
 *
 * For local development (VITE_APP_ID="cropguard-local"),
 * getLoginUrl() redirects to the local signup page.
 *
 * When you integrate with a real OAuth provider,
 * replace the body of getLoginUrl() with your provider's URL.
 */

export function getLoginUrl(): string {
  return "/login";
}
export function getSignupUrl(): string {
  return "/signup";
}

export const APP_NAME    = "CropGuard";
export const APP_VERSION = "2.1.0";