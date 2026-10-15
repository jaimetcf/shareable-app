import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const PAGE_ACCESS_COOKIE = "shareable_pass";
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function secret() {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET is not set.");
  return value;
}

export function keypassMatches(stored: string, provided: string) {
  const left = createHash("sha256").update(stored).digest();
  const right = createHash("sha256").update(provided).digest();
  return timingSafeEqual(left, right);
}

export function signPageAccess(pageId: string, keypass: string) {
  const exp = Date.now() + TWELVE_HOURS_MS;
  const digest = createHash("sha256").update(keypass).digest("base64url");
  const payload = `${exp}.${digest}`;
  const signature = createHmac("sha256", secret())
    .update(`${pageId}.${payload}`)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyPageAccess(
  pageId: string,
  token: string | undefined,
  keypass: string,
) {
  if (!token) return false;
  const [exp, digest, signature] = token.split(".");
  if (!exp || !digest || !signature) return false;

  const expected = createHmac("sha256", secret())
    .update(`${pageId}.${exp}.${digest}`)
    .digest("base64url");
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return false;
  }

  if (Number(exp) < Date.now()) return false;

  const current = createHash("sha256").update(keypass).digest("base64url");
  const givenDigest = Buffer.from(digest);
  const currentDigest = Buffer.from(current);
  return (
    givenDigest.length === currentDigest.length &&
    timingSafeEqual(givenDigest, currentDigest)
  );
}
