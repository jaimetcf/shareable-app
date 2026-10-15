import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Dashboard } from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { listPages } from "@/lib/pages";
import { getCurrentUser } from "@/lib/session";

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const pages = await listPages(user.id);
  return <Dashboard user={user} pages={pages} />;
}

function DashboardFallback() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </main>
  );
}
