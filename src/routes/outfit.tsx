import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Upload,
  X,
  Briefcase,
  Coffee,
  GlassWater,
  Palette,
  Shirt,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  fileToDataUrl,
  loadFace,
  loadTryOn,
  saveOutfit,
  saveTryOn,
  type MirrorFace,
  type MirrorTryOn,
} from "@/lib/mirror-session";
import { tryOnCloth } from "@/lib/cloth-tryon.functions";

type GarmentCategory = "auto" | "full_body" | "upper_body" | "lower_body" | "shoes";

const CATEGORIES: { id: GarmentCategory; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "upper_body", label: "Upper" },
  { id: "lower_body", label: "Lower" },
  { id: "full_body", label: "Full body" },
  { id: "shoes", label: "Shoes" },
];


export const Route = createFileRoute("/outfit")({
  validateSearch: (search: Record<string, unknown>) => ({
    event: typeof search.event === "string" ? search.event : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Outfit — Mirror Session" },
      {
        name: "description",
        content:
          "Upload your outfit or pick a preset category, then see how it sits next to you before you head out.",
      },
      { property: "og:title", content: "Outfit — Mirror Session" },
      {
        property: "og:description",
        content:
          "Pair your look with your face in a warm, honest side-by-side preview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OutfitScreen,
});

type Preset = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
};

const PRESETS: Preset[] = [
  {
    id: "business",
    label: "Business",
    description: "Tailored blazer, crisp neutrals, polished shoes.",
    icon: <Briefcase className="h-5 w-5" />,
    gradient: "from-[#3a3a3a] to-[#6b6b6b]",
  },
  {
    id: "casual",
    label: "Casual",
    description: "Soft knits, denim, easy layered basics.",
    icon: <Coffee className="h-5 w-5" />,
    gradient: "from-[#c68e5a] to-[#e6b892]",
  },
  {
    id: "formal",
    label: "Formal",
    description: "Elegant lines, deeper tones, refined details.",
    icon: <GlassWater className="h-5 w-5" />,
    gradient: "from-[#2b2540] to-[#5a4b7a]",
  },
  {
    id: "creative",
    label: "Creative",
    description: "Playful color, texture, a signature piece.",
    icon: <Palette className="h-5 w-5" />,
    gradient: "from-[#a8654a] to-[#d99a6c]",
  },
];

function OutfitScreen() {
  const { event } = Route.useSearch();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setSelectedPreset(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreviewDataUrl(dataUrl);
    } catch {
      setPreviewDataUrl(null);
    }
  };

  const clearPhoto = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPreviewDataUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const chosenPreset = PRESETS.find((p) => p.id === selectedPreset);
  const hasOutfit = Boolean(preview || selectedPreset);

  const handleSeeFullPicture = () => {
    if (!hasOutfit) return;
    if (previewDataUrl) {
      saveOutfit({ kind: "photo", dataUrl: previewDataUrl });
    } else if (chosenPreset) {
      saveOutfit({ kind: "preset", id: chosenPreset.id, label: chosenPreset.label });
    }
    navigate({ to: "/result", search: { event } });
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link
          to="/skin"
          search={{ event }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="font-serif text-lg text-foreground">Mirror Session</span>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 pb-24">
        <section className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 3</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
            What are you wearing?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Upload a photo of your outfit, or pick a category to try on the vibe.
          </p>
        </section>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <section>
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
                className={`flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50 hover:bg-accent/30"
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-4 font-serif text-xl text-foreground">
                  Upload a photo of your outfit
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag & drop, or click to browse.
                </p>
              </button>
            ) : (
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
                <img
                  src={preview}
                  alt="Your outfit"
                  className="mx-auto max-h-[420px] w-full object-contain"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
                  aria-label="Remove outfit photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="mt-8">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  or pick a category
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {PRESETS.map((preset) => {
                  const active = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        if (preview) clearPhoto();
                      }}
                      className={`group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {preset.icon}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-serif text-lg text-foreground">{preset.label}</span>
                        <span className="mt-0.5 text-sm text-muted-foreground">
                          {preset.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section>
            <div className="sticky top-6">
              <h2 className="font-serif text-2xl text-foreground">Side by side</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A quick preview of you next to your look.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <PreviewTile label="You">
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/60 to-secondary/40 text-muted-foreground">
                    <span className="text-xs uppercase tracking-[0.18em]">Your photo</span>
                  </div>
                </PreviewTile>

                <PreviewTile label="Outfit">
                  {preview ? (
                    <img src={preview} alt="Outfit preview" className="h-full w-full object-cover" />
                  ) : chosenPreset ? (
                    <div
                      className={`flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${chosenPreset.gradient} text-white`}
                    >
                      <Shirt className="h-8 w-8" />
                      <span className="font-serif text-lg">{chosenPreset.label}</span>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted/50 text-muted-foreground">
                      <span className="text-xs uppercase tracking-[0.18em]">Nothing yet</span>
                    </div>
                  )}
                </PreviewTile>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                {hasOutfit
                  ? event
                    ? `Looking good for your ${event.toLowerCase()}. Ready to see it all together?`
                    : "Looking good. Ready to see it all together?"
                  : "Pick an outfit or upload a photo to preview it here."}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSeeFullPicture}
                  disabled={!hasOutfit}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  See Full Picture
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function PreviewTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="aspect-[3/4] w-full">{children}</div>
    </div>
  );
}
