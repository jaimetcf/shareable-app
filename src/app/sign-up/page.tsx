import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthScreen } from "@/components/auth-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "Create account",
};

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-full flex-1 place-items-center">
          <Skeleton className="h-96 w-full max-w-md" />
        </main>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}

async function SignUpContent() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return <AuthScreen mode="sign-up" />;
}
