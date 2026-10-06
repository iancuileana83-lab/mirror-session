import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Sparkles, Upload } from "lucide-react";
import { makeupTryOn, type TryOnKind } from "@/lib/makeup-tryon.functions";
import { fileToDataUrl, loadFace, saveFace } from "@/lib/mirror-session";
import { shrinkDataUrl } from "@/lib/image-utils";
import { SAMPLE_FACE_LABEL, loadSampleFace } from "@/lib/sample-face";
import { isLimitError, limitMessage } from "@/lib/limit-messages";

export const Route = createFileRoute("/tryon")({
  head: () => ({
    meta: [
      { title: "Try it on - Counter Check" },
      {
        name: "description",
        content: "Preview a lipstick or foundation shade on your own photo before you buy it.",
      },
    ],
  }),
  component: TryOnPage,
});

type Shade = { id: string; name: string; color: string };

// Fictional shade names: no brands.
const SHADES: Record<TryOnKind, { label: string; shades: Shade[] }> = {
  lipstick: {
    label: "Lipstick",
    shades: [
      { id: "rosewood", name: "Rosewood", color: "#b5524f" },
      { id: "coral", name: "Coral", color: "#e0674f" },
      { id: "berry", name: "Berry", color: "#8e2a52" },
      { id: "nude", name: "Soft nude", color: "#c98a7b" },
    ],
  },
  foundation: {
    label: "Foundation",
    shades: [
      { id: "light", name: "Light", color: "#f1d3bd" },
      { id: "medium", name: "Medium", color: "#d9a98b" },
      { id: "deep", name: "Deep", color: "#9a6a4b" },
    ],
  },
};

function TryOnPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [face, setFace] = useState<string | null>(null);
  const [kind, setKind] = useState<TryOnKind>("lipstick");
  const [shade, setShade] = useState<Shade>(SHADES.lipstick.shades[0]);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** True when a limit was hit and a saved example (fictional face) is shown instead. */
  const [exampleFace, setExampleFace] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const tryOnFn = useServerFn(makeupTryOn);

  useEffect(() => {
    setFace(loadFace()?.dataUrl ?? null);
  }, []);

  const chooseKind = (k: TryOnKind) => {
    setKind(k);
    setShade(SHADES[k].shades[0]);
    setResult(null);
    setExampleFace(null);
    setMessage(null);
  };

  const setNewFace = (dataUrl: string) => {
    setFace(dataUrl);
    saveFace({ dataUrl });
    setResult(null);
    setExampleFace(null);
    setMessage(null);
  };

  const onFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      setNewFace(await fileToDataUrl(file));
    } catch {
      setMessage("Could not open that image. Try another photo.");
    }
  };

  const run = async () => {
    if (!face) return;
    setBusy(true);
    setMessage(null);
    try {
      const small = await shrinkDataUrl(face, 1280, 0.9);
      const r = await tryOnFn({ data: { faceDataUrl: small, kind, color: shade.color } });
      setResult(r.imageUrl);
    } catch (err) {
      console.error(err);
      if (isLimitError(err)) {
        // Never dead-end: show a saved example (fictional face, not the visitor).
        setMessage(`${limitMessage(err, "try-ons")} Below is a saved example result instead.`);
        void loadSampleFace().then(setExampleFace).catch(() => setExampleFace(null));
        setResult(null);
        return;
      }
      const detail = err instanceof Error && err.message.startsWith("Try-on:") ? ` (${err.message.slice(0, 160)})` : "";
      setMessage(`The try-on could not finish just now. Try again, or try another photo.${detail}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/check" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to the check
        </Link>
        <span className="font-serif text-lg text-foreground">Counter Check</span>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-8 px-6 pb-24">
        <section>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 5 of 5</p>
          <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">Try it on</h1>
          <p className="mt-3 text-base text-muted-foreground">
            For coloured products: preview a shade on your own photo before you buy. A preview is an
            approximation; real colour depends on your skin, the light and the product.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5">
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-input bg-background px-5 text-sm font-medium hover:bg-accent"
            >
              <Upload className="h-4 w-4" /> {face ? "Use another photo" : "Choose a face photo"}
            </button>
            <button
              type="button"
              onClick={() => void loadSampleFace().then(setNewFace).catch(() => setMessage("Could not load the sample face."))}
              className="text-sm font-medium text-primary underline underline-offset-4"
            >
              Use the sample (AI-generated face, not a real person)
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Your face photo is sent to YouCam to apply the shade. It is not stored on our side.
          </p>
        </section>

        <section className="space-y-4">
          <div role="tablist" className="flex gap-2">
            {(Object.keys(SHADES) as TryOnKind[]).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                onClick={() => chooseKind(k)}
                className={`h-10 rounded-full px-6 text-sm font-medium ${
                  kind === k ? "bg-primary text-primary-foreground" : "border border-input bg-background hover:bg-accent"
                }`}
              >
                {SHADES[k].label}
              </button>
            ))}
          </div>
          <ul className="flex flex-wrap gap-3">
            {SHADES[kind].shades.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setShade(s);
                    setResult(null);
                  }}
                  aria-pressed={shade.id === s.id}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                    shade.id === s.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent/40"
                  }`}
                >
                  <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: s.color }} aria-hidden="true" />
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={run}
            disabled={!face || busy}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Applying the shade..." : `Try ${SHADES[kind].shades.length ? shade.name : ""}`}
          </button>
          {!face && <p className="text-xs text-muted-foreground">Choose a face photo or use the sample first.</p>}
          {message && <p className="max-w-md text-center text-sm text-destructive">{message}</p>}
        </div>

        {(face || exampleFace) && (
          <section className="grid gap-4 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-3xl border border-border bg-card">
              <img src={exampleFace ?? face ?? ""} alt={exampleFace ? `Example: ${SAMPLE_FACE_LABEL}` : "Your photo"} className="w-full object-contain" />
              <figcaption className="p-3 text-center text-xs text-muted-foreground">{exampleFace ? `Before (example: ${SAMPLE_FACE_LABEL}; not your photo)` : "Before"}</figcaption>
            </figure>
            <figure className="overflow-hidden rounded-3xl border border-border bg-card">
              {exampleFace ? (
                <img src="/examples/tryon-example.jpg" alt="Example result: lipstick Rosewood on an AI-generated face" className="w-full object-contain" />
              ) : result ? (
                <img src={result} alt={`Your photo with ${shade.name}`} className="w-full object-contain" />
              ) : (
                <div className="flex h-full min-h-48 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  Your preview appears here
                </div>
              )}
              <figcaption className="p-3 text-center text-xs text-muted-foreground">
                {exampleFace ? "Example result: lipstick Rosewood on an AI-generated face, not a real person" : result ? `After: ${SHADES[kind].label.toLowerCase()} ${shade.name}` : "After"}
              </figcaption>
            </figure>
          </section>
        )}
        <p className="text-center text-xs text-muted-foreground">Shade names are fictional. Not medical advice.</p>
      </main>
    </div>
  );
}
