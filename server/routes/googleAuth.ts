import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as db from '../db/index.js';
import jwt from 'jsonwebtoken';
import { ENV } from '../_core/env.js';

const router = express.Router();

// Ensure required environment variables are present
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

// Initialize Google OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/google/callback' // Must match Google Console exactly
);

/**
 * GET /api/auth/google
 * Redirects the user to Google's consent screen.
 */
router.get('/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });
  res.redirect(authUrl);
});

/**
 * GET /api/auth/google/callback
 * Handles the callback from Google after user authentication.
 * Exchanges the authorization code for tokens, fetches user info,
 * upserts the user in the database, and redirects to the frontend with a JWT.
 */
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing authorization code');
  }

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user info from Google's OAuth2 endpoint
    const userInfoResponse = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    });
    const userInfo = userInfoResponse.data as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    if (!userInfo.email) {
      throw new Error('No email returned from Google');
    }

    // Upsert user in our database
    const user = await db.upsertUser({
      email: userInfo.email,
      name: userInfo.name,
      lastSignedIn: new Date(),
    });

    // Generate our application JWT
    const appToken = jwt.sign(
      { userId: user.id, email: user.email },
      ENV.jwtSecret,
      { expiresIn: '7d' }
    );

    // Redirect to frontend success page with token in query string
    // The frontend will capture this token and store it in localStorage
    res.redirect(`http://localhost:3000/auth-success?token=${appToken}`);
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    res.status(500).send('Authentication failed. Please try again.');
  }
});
router.get('/ping', (req, res) => {
  res.json({ pong: true });
});

export default router;