// server/routes/googleAuth.ts
// CropGuard AI - Google OAuth Authentication
// 
// Purpose: Implement Google Sign-In using OAuth 2.0.
//          Allows farmers to create accounts and login with their Google credentials.
//          Automatically creates new users or updates existing ones.
//
// OAuth Flow:
// 1. User clicks "Sign in with Google"
// 2. Redirected to Google consent screen
// 3. User approves permissions
// 4. Google redirects back with authorization code
// 5. Backend exchanges code for user info
// 6. User created/updated in database
// 7. JWT token generated and sent to frontend

import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as db from '../db/index.js';
import jwt from 'jsonwebtoken';
import { ENV } from '../_core/env.js';

const router = express.Router();

// ============================================================================
// Configuration Validation
// ============================================================================

// Ensure required OAuth credentials are present
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

// ============================================================================
// Google OAuth Client Setup
// ============================================================================

/**
 * Initialize Google OAuth2 client with credentials
 * 
 * Redirect URI must match exactly what's configured in Google Cloud Console:
 * - Development: http://localhost:3000/api/auth/google/callback
 * - Production: https://cropguard-api.onrender.com/api/auth/google/callback
 */
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/google/callback'  // Must match Google Console
);

// ============================================================================
// OAuth Routes
// ============================================================================

/**
 * GET /api/auth/google - Initiate Google authentication
 * 
 * Redirects user to Google's consent screen where they approve access to:
 * - Email address
 * - Profile information (name, profile picture)
 * 
 * @returns 302 Redirect to Google
 */
router.get('/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',      // Request refresh token
    prompt: 'consent',           // Force consent screen even if user already approved
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });
  res.redirect(authUrl);
});

/**
 * GET /api/auth/google/callback - Handle OAuth callback
 * 
 * Google redirects here after user approves/denies access.
 * 
 * Workflow:
 * 1. Extract authorization code from URL
 * 2. Exchange code for access/refresh tokens
 * 3. Fetch user info from Google API
 * 4. Upsert user in our database
 * 5. Generate our own JWT token
 * 6. Redirect to frontend with token
 * 
 * @query code - Authorization code from Google
 * @returns 302 Redirect to frontend success page
 */
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  
  // Validate authorization code
  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing authorization code');
  }

  try {
    // ------------------------------------------------------------------------
    // Step 1: Exchange code for tokens
    // ------------------------------------------------------------------------
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // ------------------------------------------------------------------------
    // Step 2: Fetch user info from Google
    // ------------------------------------------------------------------------
    const userInfoResponse = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    });
    const userInfo = userInfoResponse.data as {
      id: string;      // Google's unique user ID
      email: string;
      name: string;
      picture?: string;
    };

    if (!userInfo.email) {
      throw new Error('No email returned from Google');
    }

    // ------------------------------------------------------------------------
    // Step 3: Create or update user in our database
    // ------------------------------------------------------------------------
    // - If user exists by email: update their name and last sign-in time
    // - If user doesn't exist: create new account
    const user = await db.upsertUser({
      email: userInfo.email,
      name: userInfo.name,
      lastSignedIn: new Date(),
    });

    // ------------------------------------------------------------------------
    // Step 4: Generate our own JWT token
    // ------------------------------------------------------------------------
    // Contains user ID and email, signed with our secret
    const appToken = jwt.sign(
      { userId: user.id, email: user.email },
      ENV.jwtSecret,
      { expiresIn: '7d' }  // 7-day expiration
    );

    // ------------------------------------------------------------------------
    // Step 5: Redirect to frontend with token
    // ------------------------------------------------------------------------
    // Frontend will extract token from URL and store in localStorage
    // NOTE: Update this URL for production (use environment variable)
    res.redirect(`http://localhost:3000/auth-success?token=${appToken}`);
    
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

/**
 * GET /api/auth/ping - Simple health check for auth routes
 * Used to verify OAuth routes are mounted correctly
 */
router.get('/ping', (req, res) => {
  res.json({ pong: true });
});

export default router;