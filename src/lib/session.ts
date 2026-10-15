import "server-only";

import { headers } from "next/headers";

import { getAuth } from "@/lib/auth";
import type { CurrentUser } from "@/lib/user";

export type { CurrentUser };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
}
