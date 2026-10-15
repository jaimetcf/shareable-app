"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSignUp = mode === "sign-up";
  const fieldId = (name: string) => `${mode}-${name}`;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setError(null);

    startTransition(async () => {
      const result = isSignUp
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Something went wrong. Try again.");
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <main className="relative flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_top,oklch(0.84_0.12_85/0.18),transparent_55%)]" />
      <Card className="relative w-full max-w-md shadow-xl shadow-black/10">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              S
            </span>
            Shareable
          </div>
          <CardTitle className="text-xl">
            {isSignUp ? "Create your account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Host HTML files and share each one with a keypass."
              : "Sign in with your email to manage hosted pages."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" method="post" onSubmit={onSubmit}>
            {isSignUp ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor={fieldId("name")}>Name</Label>
                <Input
                  id={fieldId("name")}
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor={fieldId("email")}>Email</Label>
              <Input
                id={fieldId("email")}
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={fieldId("password")}>Password</Label>
              <Input
                id={fieldId("password")}
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={8}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "New here?"}{" "}
            <a
              className="font-medium text-foreground underline-offset-4 hover:underline"
              href={isSignUp ? "/sign-in" : "/sign-up"}
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
