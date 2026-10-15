"use client";

import { useActionState } from "react";

import { unlockPage, type ActionState } from "@/app/actions/pages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function KeypassGate({
  pageId,
  fileName,
}: {
  pageId: string;
  fileName: string;
}) {
  const [state, action, pending] = useActionState<ActionState | undefined, FormData>(
    unlockPage,
    undefined,
  );

  return (
    <main className="relative flex min-h-full flex-1 items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_center,oklch(0.84_0.12_85/0.14),transparent_60%)]" />
      <Dialog open>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>This page is locked</DialogTitle>
            <DialogDescription>
              Enter the keypass to open{" "}
              <span className="font-medium text-foreground">{fileName}</span>.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="flex flex-col gap-4">
            <input type="hidden" name="pageId" value={pageId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="keypass">Keypass</Label>
              <Input
                id="keypass"
                name="keypass"
                type="password"
                autoComplete="off"
                autoFocus
                required
                minLength={4}
                aria-invalid={state?.error ? true : undefined}
              />
            </div>
            {state?.error ? (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Checking…" : "Open page"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
