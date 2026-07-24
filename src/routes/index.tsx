import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mirror Session — See yourself before the moment matters" },
      {
        name: "description",
        content:
          "Mirror Session helps you check your skin, outfit, and overall look before important events like job interviews, photoshoots, and dates.",
      },
      { property: "og:title", content: "Mirror Session — See yourself before the moment matters" },
      {
        property: "og:description",
        content:
          "Mirror Session helps you check your skin, outfit, and overall look before important events like job interviews, photoshoots, and dates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      {/* Soft warm ambient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 60%), radial-gradient(circle at 80% 80%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 45%)",
        }}
      />

      <div className="max-w-xl text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          For interviews, photoshoots, dates & more
        </span>

        <h1 className="font-heading text-5xl leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Mirror Session
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
          See yourself clearly before the moment matters. A quick, private check of your skin, outfit, and overall look — so you can step out with confidence.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/prepare"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Start New Session
          </Link>

          <Link
            to="/session"
            className="inline-flex h-12 items-center justify-center rounded-full border border-input bg-background px-8 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Try a quick look
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Camera access is optional and stays on your device. No videos are uploaded.
        </p>
      </div>
    </main>
  );
}
