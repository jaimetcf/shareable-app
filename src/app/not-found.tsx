import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-full flex-1 place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That share link does not match a hosted page.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
