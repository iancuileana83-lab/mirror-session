import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Upload, Sparkles, X, Loader2 } from "lucide-react";
import { fileToDataUrl, saveFace, saveSkin, clearFace } from "@/lib/mirror-session";
import { analyzeSkin } from "@/lib/skin-analysis.functions";
import { makeSampleFace } from "@/lib/sample-face";
import { addScan } from "@/lib/history";
import { BAND_LABEL, CONCERNS, bandOf, rankConcerns, type Scores } from "@/lib/skin-concerns";

const bandLabel = (s?: number) => (typeof s === "number" ? BAND_LABEL[bandOf(s)] : "");


export const Route = createFileRoute("/skin")({
  head: () => ({
    meta: [
      { title: "Scan your skin - Counter Check" },
      {
        name: "description",
        content:
          "Upload a clear, well-lit photo of your face for a plain-words skin reading. Not a diagnosis.",
      },
      { property: "og:title", content: "Scan your skin - Counter Check" },
      {
        property: "og:description",
        content: "A cosmetic skin reading of one photo, explained in plain words.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SkinAnalysis,
});

type AnalysisState = "idle" | "analyzing" | "done" | "error";

type Results = { scores: Scores; saved: boolean };

function SkinAnalysis() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<AnalysisState>("idle");
  const [usedSample, setUsedSample] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const analyzeSkinFn = useServerFn(analyzeSkin);


  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUsedSample(false);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setState("idle");
    setResults(null);
    setErrorMsg(null);
    try {
      const url = await fileToDataUrl(file);
      setDataUrl(url);
      saveFace({ dataUrl: url });
    } catch {
      // ignore
    }
  };

  /** Judge sample mode: a drawn, fictional face (no real person). */
  const useSampleFace = () => {
    const url = makeSampleFace();
    setUsedSample(true);
    setPreview(url);
    setDataUrl(url);
    setState("idle");
    setResults(null);
    setErrorMsg(null);
    saveFace({ dataUrl: url });
  };

  const clearPhoto = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setDataUrl(null);
    setState("idle");
    setResults(null);
    setErrorMsg(null);
    clearFace();
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyze = async () => {
    if (!preview || !dataUrl) return;
    setState("analyzing");
    setErrorMsg(null);
    try {
      const scores = await analyzeSkinFn({ data: { dataUrl } });
      const ranked = rankConcerns(scores);
      const lowest = ranked[0];
      setResults({ scores, saved: true });
      setState("done");
      addScan(scores, usedSample ? "sample" : "photo");
      saveSkin({
        hydration: bandLabel(scores.moisture),
        texture: bandLabel(scores.texture),
        focus: lowest ? lowest.concern.label : "",
        tip: "",
        scores: scores as Record<string, number>,
      });    } catch (err) {
      console.error(err);
      setState("error");
      const detail = err instanceof Error && err.message.startsWith("YouCam:") ? ` (${err.message.slice(0, 200)})` : "";
      setErrorMsg(
        `We couldn't finish reading your skin just now. Try another photo, or give it another moment.${detail}`,
      );
    }
  };


  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="font-serif text-lg text-foreground">Counter Check</span>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 pb-24">
        <section className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 1 of 5</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
            Scan your skin
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Upload a clear, well-lit photo of your face: front-facing, no makeup, even light, face
            filling most of the frame. This is a cosmetic reading, not a diagnosis.
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

          <div className="mt-8 flex flex-col items-center gap-3">
            {!preview && (
              <button
                type="button"
                onClick={useSampleFace}
                className="text-sm font-medium text-primary underline underline-offset-4"
              >
                No photo? Try the sample (a drawn face, not a real person)
              </button>
            )}
            <button
              type="button"
              onClick={analyze}
              disabled={!preview || state === "analyzing"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {state === "analyzing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {state === "analyzing" ? "Reading your glow…" : "Analyze Skin"}
            </button>
            {errorMsg && (
              <p className="max-w-md text-center text-sm text-destructive">{errorMsg}</p>
            )}
          </div>
        </section>


        <section className="mt-16">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl text-foreground">Your reading</h2>
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {state === "done" ? "Ready" : state === "analyzing" ? "Reading..." : state === "error" ? "Try again" : "Awaiting photo"}
            </span>
          </div>

          {results ? (
            <>
              <p className="mt-3 text-sm text-muted-foreground">
                Scores run from 1 to 100; higher means the skin looks healthier in this photo. Shown
                from the most visible signs to the least.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {rankConcerns(results.scores).map(({ concern, score }) => (
                  <ConcernCard key={concern.id} id={concern.id} score={score} />
                ))}
              </div>
              <p className="mt-6 rounded-2xl border border-border bg-accent/40 p-4 text-sm text-foreground/90">
                This is a cosmetic reading of one photo, not a diagnosis or medical advice. Light,
                angle and makeup change the result. If something worries you, ask a pharmacist or a
                dermatologist.
              </p>
            </>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl border border-border bg-card p-5">
                  <div className={`h-5 w-1/2 rounded-full bg-muted ${state === "analyzing" ? "animate-pulse" : ""}`} />
                  <div className={`mt-3 h-3 w-full rounded-full bg-muted/70 ${state === "analyzing" ? "animate-pulse" : ""}`} />
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {results && (
            <Link
              to="/profile"
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              Next: about you
            </Link>
          )}
          {results && (
            <Link
              to="/routine"
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              See my routine
            </Link>
          )}
          {results && (
            <Link to="/progress" className="inline-flex h-11 items-center justify-center rounded-full border border-input bg-background px-8 text-sm font-medium text-foreground transition-colors hover:bg-accent">
              Is it working?
            </Link>
          )}
        </div>

      </main>
    </div>
  );
}

function ConcernCard({ id, score }: { id: string; score: number }) {
  const concern = CONCERNS.find((c) => c.id === id)!;
  const band = bandOf(score);
  const color =
    band === "good" ? "bg-emerald-600" : band === "some" ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-xl text-foreground">{concern.label}</h3>
        <span className="text-sm font-medium text-foreground">{Math.round(score)}</span>
      </div>
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${concern.label}: ${Math.round(score)} out of 100`}
      >
        <div className={`h-full ${color}`} style={{ width: `${Math.max(4, Math.min(100, score))}%` }} />
      </div>
      <p className="mt-2 text-sm font-medium text-foreground/90">{BAND_LABEL[band]}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{concern.meaning}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
        Not: {concern.notMeaning}
      </p>
    </div>
  );
}

