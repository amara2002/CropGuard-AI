
import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { users, type NewUser } from "./schema.js";

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getUserByOpenId(openId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return user ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}

export async function getUserById(id: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}

export async function createUser(data: Omit<NewUser, "id">) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function upsertUser(data: Partial<NewUser> & { email: string }) {
  const existing = await getUserByEmail(data.email);
  if (existing) {
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