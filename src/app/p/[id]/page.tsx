import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { KeypassGate } from "@/components/keypass-gate";
import { PAGE_ACCESS_COOKIE, verifyPageAccess } from "@/lib/access";
import { getPageForAccess, isPageId } from "@/lib/pages";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Locked page",
  robots: { index: false, follow: false },
};

export default function LockedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-full flex-1 place-items-center">
          <Skeleton className="h-48 w-full max-w-md" />
        </main>
      }
    >
      <LockedPageContent params={params} />
    </Suspense>
  );
}

async function LockedPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isPageId(id)) notFound();

  const page = await getPageForAccess(id);
  if (!page) notFound();

  const jar = await cookies();
  if (verifyPageAccess(id, jar.get(PAGE_ACCESS_COOKIE)?.value, page.keypass)) {
    redirect(`/p/${id}/view`);
  }

  return <KeypassGate pageId={page.id} fileName={page.fileName} />;
}
