import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, ScanText, Upload, X } from "lucide-react";
import { readLabel } from "@/lib/label-reader.functions";
import { fileToDataUrl } from "@/lib/mirror-session";
import { shrinkDataUrl } from "@/lib/image-utils";
import { SAMPLE_LABEL_INGREDIENTS, makeSampleLabel } from "@/lib/sample-label";
import { isLimitError, limitMessage } from "@/lib/limit-messages";
import { GROUPS, classify, splitInci } from "@/lib/knowledge-base";
import { loadProduct, saveProduct } from "@/lib/product";

export const Route = createFileRoute("/product")({
  head: () => ({
    meta: [
      { title: "Read a label - Counter Check" },
      {
        name: "description",
        content: "Photograph the ingredient list of a product. An AI text reader copies it; you can correct it.",
      },
    ],
  }),
  component: ProductPage,
});

type State = "idle" | "reading" | "done" | "error";

function ProductPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<State>("idle");
  const [text, setText] = useState("");
  const [unclear, setUnclear] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [source, setSource] = useState<"photo" | "sample" | "typed">("typed");
  const [limited, setLimited] = useState(false);
  const readLabelFn = useServerFn(readLabel);

  useEffect(() => {
    const saved = loadProduct();
    if (saved) {
      setText(saved.ingredients.join(", "));
      setSource(saved.source);
    }
  }, []);

  const ingredients = useMemo(() => splitInci(text), [text]);
  const hits = useMemo(() => classify(ingredients), [ingredients]);

  const persist = (value: string, src: "photo" | "sample" | "typed") => {
    setText(value);
    setSource(src);
    saveProduct({ ingredients: splitInci(value), source: src });
  };

  const setImage = (dataUrl: string) => {
    setPreview(dataUrl);
    setState("idle");
    setMessage(null);
    setUnclear([]);
  };

  const onFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      setImage(await shrinkDataUrl(await fileToDataUrl(file)));
      setSource("photo");
    } catch {
      setMessage("Could not open that image. Try another photo.");
    }
  };

  const useSample = () => {
    setImage(makeSampleLabel());
    setSource("sample");
  };

  const read = async () => {
    if (!preview) return;
    setState("reading");
    setMessage(null);
    try {
      const r = await readLabelFn({ data: { dataUrl: preview } });
      setUnclear(r.unclear);
      if (!r.found) {
        setState("error");
        setMessage("No ingredient list found in this photo. Try a closer, sharper photo, or type the list below.");
        return;
      }
      persist(r.ingredients.join(", "), source === "sample" ? "sample" : "photo");
      setState("done");
    } catch (err) {
      console.error(err);
      setState("error");
      if (isLimitError(err)) {
        setLimited(true);
        setMessage(`${limitMessage(err, "label reading")} You can type or paste the list below, or use the sample list.`);
        return;
      }
      const detail = err instanceof Error && err.message.startsWith("Label reader:") ? ` (${err.message.slice(0, 160)})` : "";
      setMessage(`The label could not be read just now. You can type or paste the list below.${detail}`);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="font-serif text-lg text-foreground">Counter Check</span>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-8 px-6 pb-24">
        <section>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 3 of 5</p>
          <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">Photo of the label</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Photograph the ingredient list (INCI) on the pack. An AI text reader only copies the words; it
            gives no advice. Always check the copy against the pack, and fix any mistakes.
          </p>
        </section>

        <section>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {!preview ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card px-6 py-12 text-center">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20"
              >
                <Upload className="h-4 w-4" /> Take or choose a label photo
              </button>
              <button type="button" onClick={useSample} className="text-sm font-medium text-primary underline underline-offset-4">
                No product at hand? Try the sample label (a fictional product)
              </button>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
              <img src={preview} alt="The label photo" className="mx-auto max-h-[420px] w-full object-contain" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => {
                  setPreview(null);
                  setState("idle");
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {preview && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={read}
                disabled={state === "reading"}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {state === "reading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
                {state === "reading" ? "Reading the label..." : "Read the ingredient list"}
              </button>
              <p className="text-xs text-muted-foreground">Only this label photo is sent to the AI text reader (Gemini). Never your face photo.</p>
            </div>
          )}
          {message && <p className="mt-4 text-center text-sm text-destructive">{message}</p>}
          {limited && (
            <p className="mt-2 text-center text-sm">
              <button type="button" onClick={() => persist(SAMPLE_LABEL_INGREDIENTS.join(", "), "sample")} className="font-medium text-primary underline underline-offset-4">
                Use the sample list (fictional product)
              </button>
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-5">
          <label htmlFor="inci" className="font-serif text-xl text-foreground">
            Ingredient list {state === "done" ? "(copied from the photo: please check it)" : "(or type or paste it)"}
          </label>
          <textarea
            id="inci"
            value={text}
            onChange={(e) => persist(e.target.value, "typed")}
            rows={6}
            placeholder="Aqua, Glycerin, ..."
            className="mt-3 w-full rounded-2xl border border-input bg-background p-3 text-sm"
          />
          {unclear.length > 0 && (
            <p className="mt-2 text-sm text-amber-700">
              Hard to read, please check: {unclear.join(", ")}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {ingredients.length} ingredients. A label shows the order of ingredients, not the amounts.
          </p>
        </section>

        {hits.length > 0 && (
          <section className="rounded-3xl border border-border bg-accent/40 p-5 text-sm">
            <h2 className="font-serif text-xl text-foreground">What the rules recognise in this list</h2>
            <ul className="mt-3 space-y-1">
              {hits.map((h) => (
                <li key={h.ingredient}>
                  <span className="font-medium text-foreground">{h.ingredient}</span>
                  <span className="text-muted-foreground"> : {h.groups.map((g) => GROUPS[g].label).join("; ")}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              This is only a list of what was recognised. The verdict and the reasons come next.
            </p>
          </section>
        )}
        {ingredients.length > 0 && (
          <div className="flex justify-center">
            <Link
              to="/check"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20"
            >
              Check this product
            </Link>
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground">Not medical advice. Ask your pharmacist or doctor.</p>
      </main>
    </div>
  );
}
