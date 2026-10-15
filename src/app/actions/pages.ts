"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { hostedPage } from "@/db/schema";
import {
  PAGE_ACCESS_COOKIE,
  keypassMatches,
  signPageAccess,
} from "@/lib/access";
import {
  getOwnedPage,
  getPageForAccess,
  isHtmlFileName,
  isPageId,
  normalizeFileName,
  validateHtml,
  validateKeypass,
} from "@/lib/pages";
import { getCurrentUser } from "@/lib/session";

export type ActionState = { error?: string; ok?: boolean };

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function uploadPage(
  _previous: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const fileName = normalizeFileName(String(formData.get("fileName") ?? ""));
  const html = String(formData.get("html") ?? "");
  const keypass = String(formData.get("keypass") ?? "").trim();

  if (!fileName || !isHtmlFileName(fileName)) {
    return { error: "Choose an .html file." };
  }

  const htmlError = validateHtml(html);
  if (htmlError) return { error: htmlError };

  const keypassError = validateKeypass(keypass);
  if (keypassError) return { error: keypassError };

  await getDb().insert(hostedPage).values({
    id: crypto.randomUUID(),
    userId: user.id,
    fileName,
    html,
    keypass,
  });

  revalidatePath("/");
  return { ok: true };
}

export async function deletePage(pageId: string): Promise<ActionState> {
  const user = await requireUser();
  if (!isPageId(pageId)) return { error: "That page was not found." };

  const owned = await getOwnedPage(user.id, pageId);
  if (!owned) return { error: "That page was not found." };

  await getDb()
    .delete(hostedPage)
    .where(and(eq(hostedPage.id, pageId), eq(hostedPage.userId, user.id)));

  revalidatePath("/");
  return { ok: true };
}

export async function updateKeypass(
  pageId: string,
  keypass: string,
): Promise<ActionState> {
  const user = await requireUser();
  if (!isPageId(pageId)) return { error: "That page was not found." };

  const nextKeypass = keypass.trim();
  const keypassError = validateKeypass(nextKeypass);
  if (keypassError) return { error: keypassError };

  const owned = await getOwnedPage(user.id, pageId);
  if (!owned) return { error: "That page was not found." };

  await getDb()
    .update(hostedPage)
    .set({ keypass: nextKeypass, updatedAt: new Date() })
    .where(and(eq(hostedPage.id, pageId), eq(hostedPage.userId, user.id)));

  revalidatePath("/");
  return { ok: true };
}

export async function unlockPage(
  _previous: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const pageId = String(formData.get("pageId") ?? "");
  const keypass = String(formData.get("keypass") ?? "").trim();

  if (!isPageId(pageId)) {
    return { error: "That page was not found." };
  }

  const page = await getPageForAccess(pageId);
  if (!page || !keypassMatches(page.keypass, keypass)) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { error: "That keypass does not match this page." };
  }

  const jar = await cookies();
  jar.set(PAGE_ACCESS_COOKIE, signPageAccess(page.id, page.keypass), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/p/${page.id}`,
    maxAge: 60 * 60 * 12,
  });

  redirect(`/p/${page.id}/view`);
}
