import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { getDb } from "@/db";
import { authSchema } from "@/db/schema";

function createAuth() {
  const url = baseURL();
  return betterAuth({
    appName: "Shareable",
    baseURL: url,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: (request) => {
      const origins = new Set([url, "http://localhost:3000"]);
      const origin = request?.headers.get("origin");
      if (!origin) return [...origins];
      try {
        const parsed = new URL(origin);
        const localDev =
          process.env.NODE_ENV !== "production" &&
          (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
        if (localDev || parsed.origin === url) origins.add(parsed.origin);
      } catch {
        return [...origins];
      }
      return [...origins];
    },
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
    },
    plugins: [nextCookies()],
  });
}

let auth: ReturnType<typeof createAuth> | null = null;

function baseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getAuth() {
  if (!auth) auth = createAuth();
  return auth;
}
