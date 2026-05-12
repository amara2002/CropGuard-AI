// server/db/index.ts
// CropGuard AI - Database Operations
// 
// Purpose: Provide reusable database operations for user management.
//          Includes password hashing, user lookup, create/update operations.
//          This abstraction layer keeps routes clean and focused.

import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { users, type NewUser } from "./schema.js";
import bcrypt from "bcryptjs";

// ============================================================================
// Password Security
// ============================================================================

/**
 * Number of salt rounds for bcrypt password hashing
 * 10 rounds provides good security without significant performance impact
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * 
 * @param password - Plain text password from user
 * @returns Hashed password for storage
 * 
 * @example
 * const hashedPassword = await hashPassword("userPassword123");
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plain text password against a stored hash
 * 
 * @param password - Plain text password from login attempt
 * @param hash - Stored password hash from database
 * @returns True if password matches, false otherwise
 * 
 * @example
 * const isValid = await verifyPassword("userPassword123", storedHash);
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// User Lookup Functions
// ============================================================================

/**
 * Find user by Google OAuth ID
 * 
 * @param openId - Google's unique user identifier
 * @returns User object or null if not found
 */
export async function getUserByOpenId(openId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return user ?? null;
}

/**
 * Find user by email address (primary lookup method)
 * 
 * @param email - User's email address
 * @returns User object or null if not found
 */
export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}

/**
 * Find user by database ID (primary key)
 * 
 * @param id - User's database ID
 * @returns User object or null if not found
 */
export async function getUserById(id: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}

// ============================================================================
// User Creation & Updates
// ============================================================================

/**
 * Create a new user in the database
 * 
 * @param data - User data (all fields except auto-generated id)
 * @returns Newly created user with generated ID
 */
export async function createUser(data: Omit<NewUser, "id">) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

/**
 * Create or update user (used by Google OAuth)
 * 
 * If user exists by email, update name and lastSignedIn
 * If user doesn't exist, create new record
 * 
 * @param data - Partial user data (must include email)
 * @returns User after upsert operation
 */
export async function upsertUser(data: Partial<NewUser> & { email: string }) {
  // Check if user already exists
  const existing = await getUserByEmail(data.email);
  
  if (existing) {
    // Update existing user
    const [updated] = await db
      .update(users)
      .set({
        name: data.name ?? existing.name,
        lastSignedIn: data.lastSignedIn ?? new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }
  
  // Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      email: data.email,
      name: data.name,
      lastSignedIn: data.lastSignedIn ?? new Date(),
    })
    .returning();
  return newUser;
}