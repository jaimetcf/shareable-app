import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { PAGE_ACCESS_COOKIE, verifyPageAccess } from "@/lib/access";
import { getPageForAccess, isPageId } from "@/lib/pages";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isPageId(id)) notFound();

  const page = await getPageForAccess(id);
  if (!page) notFound();

  const jar = await cookies();
  if (!verifyPageAccess(id, jar.get(PAGE_ACCESS_COOKIE)?.value, page.keypass)) {
    return NextResponse.redirect(new URL(`/p/${id}`, request.url));
  }

  return new Response(page.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline",
      "Content-Security-Policy":
        "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads",
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
