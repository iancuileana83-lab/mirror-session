import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Upload, Sparkles, Droplets, Waves, Target, Lightbulb, X, Loader2 } from "lucide-react";
import { fileToDataUrl, saveFace, saveSkin, clearFace } from "@/lib/mirror-session";
import { analyzeSkin } from "@/lib/skin-analysis.functions";


export const Route = createFileRoute("/skin")({
  validateSearch: (search: Record<string, unknown>) => ({
    event: typeof search.event === "string" ? search.event : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Skin Analysis — Mirror Session" },
      {
        name: "description",
        content:
          "Upload a clear, well-lit photo of your face for a gentle, reassuring skin read before your big moment.",
      },
      { property: "og:title", content: "Skin Analysis — Mirror Session" },
      {
        property: "og:description",
        content:
          "A calm, non-clinical skin check to help you feel confident before you leave the house.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SkinAnalysis,
});

type AnalysisState = "idle" | "analyzing" | "done";

function SkinAnalysis() {
  const { event } = Route.useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<AnalysisState>("idle");


  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setState("idle");
    try {
      const dataUrl = await fileToDataUrl(file);
      saveFace({ dataUrl });
    } catch {
      // ignore
    }
  };

  const clearPhoto = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setState("idle");
    clearFace();
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyze = () => {
    if (!preview) return;
    setState("analyzing");
    setTimeout(() => {
      setState("done");
      saveSkin({
        hydration: "Comfortably hydrated",
        texture: "Soft & even",
        focus: "Under-eye area",
        tip: "You're already looking great. Warm your cheeks with a cream blush and take a breath — the mirror agrees with you.",
      });
    }, 1600);
  };


  const results =
    state === "done"
      ? {
          hydration: "Comfortably hydrated",
          hydrationNote: "Your skin looks balanced — a light mist before you head out will keep that glow.",
          texture: "Soft & even",
          textureNote: "A gentle, smooth surface. A little translucent powder will help with camera flash.",
          focus: "Under-eye area",
          focusNote: "A touch of hydrating concealer, patted (not swiped), will brighten you right up.",
          tip: "You're already looking great. Warm your cheeks with a cream blush and take a breath — the mirror agrees with you.",
        }
      : null;

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link
          to="/prepare"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="font-serif text-lg text-foreground">Mirror Session</span>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 pb-24">
        <section className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 2</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
            Let's take a gentle look at your skin
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Upload a clear, well-lit photo of your face. No judgment, no diagnoses — just a
            friendly read to help you feel your best.
          </p>
        </section>

        <section className="mt-10">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {!preview ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/30"
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <p className="mt-4 font-serif text-xl text-foreground">
                Upload a clear, well-lit photo of your face
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Drag & drop, or click to browse. Natural light works best.
              </p>
            </button>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
              <img
                src={preview}
                alt="Your uploaded photo"
                className="mx-auto max-h-[480px] w-full object-contain"
              />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={analyze}
              disabled={!preview || state === "analyzing"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {state === "analyzing" ? "Reading your glow…" : "Analyze Skin"}
            </button>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl text-foreground">Your reading</h2>
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {state === "done" ? "Ready" : state === "analyzing" ? "Reading…" : "Awaiting photo"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <ResultCard
              icon={<Droplets className="h-5 w-5" />}
              label="Hydration Level"
              value={results?.hydration}
              note={results?.hydrationNote}
              state={state}
            />
            <ResultCard
              icon={<Waves className="h-5 w-5" />}
              label="Texture"
              value={results?.texture}
              note={results?.textureNote}
              state={state}
            />
            <ResultCard
              icon={<Target className="h-5 w-5" />}
              label="Recommended Focus"
              value={results?.focus}
              note={results?.focusNote}
              state={state}
            />
          </div>

          <div className="mt-4 rounded-3xl border border-border bg-accent/40 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lightbulb className="h-4 w-4 text-primary" />
              A little tip for tonight
            </div>
            <p className="mt-3 min-h-[3rem] text-base leading-relaxed text-foreground/90">
              {results?.tip ??
                (state === "analyzing"
                  ? "Warming up a thoughtful suggestion just for you…"
                  : "Once you've uploaded a photo, we'll leave you a gentle, encouraging note here.")}
            </p>
          </div>
        </section>

        <div className="mt-12 flex justify-center">
          <Link
            to="/outfit"
            search={{ event }}

            className="inline-flex h-11 items-center justify-center rounded-full border border-input bg-background px-8 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Continue to outfit
          </Link>
        </div>

      </main>
    </div>
  );
}

function ResultCard({
  icon,
  label,
  value,
  note,
  state,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  note?: string;
  state: AnalysisState;
}) {
  const isLoading = state === "analyzing";
  const isEmpty = state === "idle";

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
      </div>
      {value ? (
        <>
          <p className="mt-3 font-serif text-xl text-foreground">{value}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note}</p>
        </>
      ) : (
        <>
          <div
            className={`mt-3 h-5 w-3/4 rounded-full bg-muted ${isLoading ? "animate-pulse" : ""}`}
          />
          <div
            className={`mt-2 h-3 w-full rounded-full bg-muted/70 ${isLoading ? "animate-pulse" : ""}`}
          />
          <div
            className={`mt-2 h-3 w-5/6 rounded-full bg-muted/70 ${isLoading ? "animate-pulse" : ""}`}
          />
          {isEmpty && (
            <p className="mt-4 text-xs text-muted-foreground/70">Waiting for your photo</p>
          )}
        </>
      )}
    </div>
  );
}
