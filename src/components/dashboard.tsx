"use client";

import {
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  FileCode2Icon,
  LinkIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deletePage,
  updateKeypass,
  uploadPage,
  type ActionState,
} from "@/app/actions/pages";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import type { PageSummary } from "@/lib/page-types";
import type { CurrentUser } from "@/lib/user";

async function submitUpload(
  previous: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an .html file." };
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".html") && !name.endsWith(".htm")) {
    return { error: "Only .html files can be hosted." };
  }
  formData.set("html", await file.text());
  formData.set("fileName", file.name);
  formData.delete("file");
  return uploadPage(previous, formData);
}

export function Dashboard({
  user,
  pages,
}: {
  user: CurrentUser;
  pages: PageSummary[];
}) {
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();

  function signOut() {
    startSignOut(async () => {
      await authClient.signOut();
      router.push("/sign-in");
      router.refresh();
    });
  }

  return (
    <div className="relative min-h-full flex-1">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_circle_at_top,oklch(0.84_0.12_85/0.16),transparent_50%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
              S
            </span>
            <div>
              <p className="text-sm font-medium tracking-tight">Shareable</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} disabled={signingOut}>
            Sign out
          </Button>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <UploadCard />
          <section className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h1 className="text-lg font-medium tracking-tight">Your pages</h1>
                <p className="text-sm text-muted-foreground">
                  {pages.length === 0
                    ? "Nothing hosted yet."
                    : `${pages.length} hosted ${pages.length === 1 ? "file" : "files"}`}
                </p>
              </div>
            </div>
            {pages.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-start gap-2 py-8">
                  <FileCode2Icon className="size-5 text-muted-foreground" />
                  <p className="font-medium">Upload an HTML file to get a share link.</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Anyone with the link still needs the keypass before the page renders.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ul className="flex flex-col gap-3">
                {pages.map((page) => (
                  <li key={page.id}>
                    <PageRow page={page} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function UploadCard() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const acknowledged = useRef<ActionState | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, action, pending] = useActionState(submitUpload, undefined);

  useEffect(() => {
    if (!state?.ok || acknowledged.current === state) return;
    acknowledged.current = state;
    formRef.current?.reset();
    setFileName(null);
    toast.success("Page hosted.");
    router.refresh();
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload a page</CardTitle>
        <CardDescription>
          The HTML is stored as-is and served only after the keypass matches.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">HTML file</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".html,.htm,text/html"
              required
              onChange={(event) => {
                setFileName(event.target.files?.[0]?.name ?? null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              {fileName ? fileName : "Max 1.5 MB. .html or .htm"}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="upload-keypass">Keypass</Label>
            <Input
              id="upload-keypass"
              name="keypass"
              type="text"
              autoComplete="off"
              required
              minLength={4}
              maxLength={200}
              placeholder="Shared secret for this page"
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Uploading…" : "Host page"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PageRow({ page }: { page: PageSummary }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [nextKeypass, setNextKeypass] = useState("");
  const [pending, startTransition] = useTransition();

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("Could not copy to the clipboard.");
    }
  }

  function saveKeypass() {
    startTransition(async () => {
      const result = await updateKeypass(page.id, nextKeypass);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setNextKeypass("");
      toast.success("Keypass updated.");
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deletePage(page.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Page removed.");
      router.refresh();
    });
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="truncate font-mono text-sm">{page.fileName}</CardTitle>
        <CardDescription>Added {page.createdLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`keypass-${page.id}`}>Keypass</Label>
          <div className="flex gap-2">
            <Input
              id={`keypass-${page.id}`}
              readOnly
              value={page.keypass}
              type={visible ? "text" : "password"}
              className="font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={visible ? "Hide keypass" : "Show keypass"}
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy keypass"
              onClick={() => copy(page.keypass, "Keypass copied.")}
            >
              <CopyIcon />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label={`New keypass for ${page.fileName}`}
            value={nextKeypass}
            onChange={(event) => setNextKeypass(event.target.value)}
            placeholder="Set a new keypass"
            minLength={4}
            maxLength={200}
            autoComplete="off"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={pending || nextKeypass.trim().length < 4}
            onClick={saveKeypass}
          >
            Set keypass
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              copy(`${window.location.origin}/p/${page.id}`, "Link copied.")
            }
          >
            <LinkIcon />
            Share link
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={pending}>
                <Trash2Icon />
                Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this page?</AlertDialogTitle>
                <AlertDialogDescription>
                  {page.fileName} will be deleted and the share link will stop working.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={remove}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
