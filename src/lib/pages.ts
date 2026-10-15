import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { hostedPage } from "@/db/schema";
import type { PageSummary } from "@/lib/page-types";

export type { PageSummary };

const MAX_HTML_LENGTH = 1_500_000;

const pageIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPageId(value: string) {
  return pageIdPattern.test(value);
}

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function normalizeFileName(name: string) {
  const base = name.split(/[/\\]/).pop()?.trim() ?? "";
  return base.slice(0, 180);
}

export function isHtmlFileName(name: string) {
  const lower = name.toLowerCase();
  return lower.endsWith(".html") || lower.endsWith(".htm");
}

export function validateHtml(html: string) {
  if (!html.trim()) return "That file is empty.";
  if (html.includes("\0")) return "That file contains characters that cannot be stored.";
  if (html.length > MAX_HTML_LENGTH) return "File is too large (max 1.5 MB).";
  return null;
}

export function validateKeypass(keypass: string) {
  const value = keypass.trim();
  if (value.length < 4) return "Keypass must be at least 4 characters.";
  if (value.length > 200) return "Keypass must be 200 characters or fewer.";
  return null;
}

export async function listPages(userId: string): Promise<PageSummary[]> {
  const rows = await getDb()
    .select({
      id: hostedPage.id,
      fileName: hostedPage.fileName,
      keypass: hostedPage.keypass,
      createdAt: hostedPage.createdAt,
    })
    .from(hostedPage)
    .where(eq(hostedPage.userId, userId))
    .orderBy(desc(hostedPage.createdAt));

  return rows.map((row) => ({
    id: row.id,
    fileName: row.fileName,
    keypass: row.keypass,
    createdLabel: `${dateFormat.format(row.createdAt)} UTC`,
  }));
}

export async function getOwnedPage(userId: string, pageId: string) {
  const [owned] = await getDb()
    .select({ id: hostedPage.id })
    .from(hostedPage)
    .where(and(eq(hostedPage.id, pageId), eq(hostedPage.userId, userId)))
    .limit(1);

  return owned ?? null;
}

export async function getPageForAccess(pageId: string) {
  const [row] = await getDb()
    .select({
      id: hostedPage.id,
      fileName: hostedPage.fileName,
      html: hostedPage.html,
      keypass: hostedPage.keypass,
    })
    .from(hostedPage)
    .where(eq(hostedPage.id, pageId))
    .limit(1);

  return row ?? null;
}
