import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { db } from "../db/db.js";
import { getUserById } from "../db/index.js";
import type { User } from "../db/schema.js";
import { ENV } from "./env.js";
import jwt from "jsonwebtoken";

export type TrpcContext = {
  req:  CreateExpressContextOptions["req"];
  res:  CreateExpressContextOptions["res"];
  user: User | null;
  db:   typeof db;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const authHeader = opts.req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (token) {
      const payload = jwt.verify(token, ENV.jwtSecret) as { userId: number };
      if (payload?.userId) {
        user = await getUserById(payload.userId);
      }
    }
  } catch {
    // Invalid token – treat as unauthenticated
  }

  return { req: opts.req, res: opts.res, user, db };
}