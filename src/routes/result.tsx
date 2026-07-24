import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  Shirt,
  User,
  Bookmark,
  RefreshCw,
  Check,
  Droplets,
  Waves,
  Target,
  Lightbulb,
} from "lucide-react";
import {
  loadFace,
  loadOutfit,
  loadSkin,
  loadTryOn,
  type MirrorFace,
  type MirrorOutfit,
  type MirrorSkin,
  type MirrorTryOn,
} from "@/lib/mirror-session";

export const Route = createFileRoute("/result")({
  validateSearch: (search: Record<string, unknown>) => ({
    event: typeof search.event === "string" ? search.event : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your Mirror Session — Full Picture" },
      {
        name: "description",
        content:
          "See your skin read and outfit side by side, with a coherence score and gentle recommendations for your event.",
      },
      { property: "og:title", content: "Your Mirror Session — Full Picture" },
      {
        property: "og:description",
        content:
          "The full picture: skin, outfit, and a coherence score aligned to your event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultScreen,
});

const PRESET_GRADIENTS: Record<string, string> = {
  business: "from-[#3a3a3a] to-[#6b6b6b]",
  casual: "from-[#c68e5a] to-[#e6b892]",
  formal: "from-[#2b2540] to-[#5a4b7a]",
  creative: "from-[#a8654a] to-[#d99a6c]",
};

type Coherence = { score: number; label: string; blurb: string };

function computeCoherence(event: string | undefined, outfit: MirrorOutfit | null): Coherence {
  // Simple, transparent affinity between event type and outfit category.
  const affinity: Record<string, Record<string, number>> = {
    "Job Interview": { business: 10, formal: 8, creative: 6, casual: 4 },
    "Professional Photoshoot": { creative: 10, formal: 8, business: 7, casual: 6 },
    "Date Night": { creative: 9, formal: 9, casual: 7, business: 5 },
    "Family Event": { casual: 9, creative: 8, formal: 7, business: 6 },
    Other: { casual: 8, creative: 8, formal: 7, business: 7 },
  };

  const e = event ?? "Other";
  const base = affinity[e] ?? affinity.Other;

  let score = 8;
  if (outfit?.kind === "preset") {
    score = base[outfit.id] ?? 7;
  } else if (outfit?.kind === "photo") {
    // With an uploaded photo we can't classify — give a warm baseline.
    score = 8;
  }

  const label =
    score >= 9 ? "Beautifully aligned" : score >= 7 ? "Nicely matched" : "Room to refine";
  const blurb =
    score >= 9
      ? "Your look and readiness sit gracefully with the moment."
      : score >= 7
        ? "A confident pairing — a couple of small touches can make it sing."
        : "A little adjustment will bring the whole picture together.";
  return { score, label, blurb };
}

function buildRecommendations(
  event: string | undefined,
  outfit: MirrorOutfit | null,
  skin: MirrorSkin | null,
): string[] {
  const recs: string[] = [];
  const kind = outfit?.kind === "preset" ? outfit.id : "photo";

  if (kind === "business" || event === "Job Interview") {
    recs.push("Add subtle highlighter on the cheekbones to soften the structured blazer.");
    recs.push("Keep the lip in a warm nude — polished, not distracting.");
  } else if (kind === "formal" || event === "Date Night") {
    recs.push("Consider a softer lip tone for this evening look — berry cream reads romantic on camera.");
    recs.push("A light setting spray will keep your glow through dinner.");
  } else if (kind === "creative" || event === "Professional Photoshoot") {
    recs.push("Play with a defined brow to anchor the creative palette.");
    recs.push("A hint of gloss on the lids will catch the studio light beautifully.");
  } else if (kind === "casual" || event === "Family Event") {
    recs.push("Tinted balm and a cream blush will keep things effortless and warm.");
    recs.push("Skip powder on the high points — your natural glow suits the setting.");
  } else {
    recs.push("A touch of cream blush on the apples of the cheeks will echo your outfit's warmth.");
    recs.push("Hydrating concealer under the eyes, patted in, will refresh the whole look.");
  }

  if (skin?.focus?.toLowerCase().includes("under-eye")) {
    recs.push("Follow the under-eye tip from your skin read before the final mirror check.");
  }

  return recs.slice(0, 3);
}

function ResultScreen() {
  const { event } = Route.useSearch();
  const navigate = useNavigate();
  const [face, setFace] = useState<MirrorFace | null>(null);
  const [outfit, setOutfit] = useState<MirrorOutfit | null>(null);
  const [skin, setSkin] = useState<MirrorSkin | null>(null);
  const [tryOn, setTryOn] = useState<MirrorTryOn | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFace(loadFace());
    setOutfit(loadOutfit());
    setSkin(loadSkin());
    setTryOn(loadTryOn());
  }, []);

  const coherence = useMemo(() => computeCoherence(event, outfit), [event, outfit]);
  const recs = useMemo(() => buildRecommendations(event, outfit, skin), [event, outfit, skin]);

  const handleSave = () => {
    try {
      const record = {
        savedAt: new Date().toISOString(),
        event: event ?? null,
        score: coherence.score,
        outfit,
        skin,
      };
      const key = "ms:saved";
      const existing = JSON.parse(sessionStorage.getItem(key) ?? "[]");
      existing.push(record);
      sessionStorage.setItem(key, JSON.stringify(existing));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleTryAnother = () => {
    navigate({ to: "/outfit", search: { event } });
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link
          to="/outfit"
          search={{ event }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="font-serif text-lg text-foreground">Mirror Session</span>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">The Full Picture</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
            {event ? `Ready for your ${event.toLowerCase()}` : "Your look, all together"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            A quiet look at your skin and outfit as one — with a gentle score and a few small ideas.
          </p>
        </section>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            {tryOn ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  You in this outfit
                </div>
                <img
                  src={tryOn.imageUrl}
                  alt="You wearing the outfit"
                  className="mx-auto max-h-[520px] w-full object-contain"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <FigureTile label="You" icon={<User className="h-3.5 w-3.5" />}>
                  {face?.dataUrl ? (
                    <img src={face.dataUrl} alt="Your photo" className="h-full w-full object-cover" />
                  ) : (
                    <EmptyTile text="No photo yet" />
                  )}
                </FigureTile>

                <FigureTile label="Outfit" icon={<Shirt className="h-3.5 w-3.5" />}>
                  {outfit?.kind === "photo" ? (
                    <img src={outfit.dataUrl} alt="Your outfit" className="h-full w-full object-cover" />
                  ) : outfit?.kind === "preset" ? (
                    <div
                      className={`flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${
                        PRESET_GRADIENTS[outfit.id] ?? "from-primary/60 to-primary"
                      } text-white`}
                    >
                      <Shirt className="h-9 w-9" />
                      <span className="font-serif text-xl">{outfit.label}</span>
                    </div>
                  ) : (
                    <EmptyTile text="No outfit yet" />
                  )}
                </FigureTile>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-border bg-accent/30 p-5">

              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Skin Analysis Summary
              </div>
              {skin ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MiniSkin icon={<Droplets className="h-4 w-4" />} label="Hydration" value={skin.hydration} />
                  <MiniSkin icon={<Waves className="h-4 w-4" />} label="Texture" value={skin.texture} />
                  <MiniSkin icon={<Target className="h-4 w-4" />} label="Focus" value={skin.focus} />
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No skin reading yet.{" "}
                  <Link to="/skin" search={{ event }} className="underline underline-offset-2">
                    Take a moment for a quick read
                  </Link>
                  .
                </p>
              )}
              {skin?.tip && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-background/70 p-3 text-sm text-foreground/90">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{skin.tip}</span>
                </div>
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Coherence Score
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-6xl leading-none text-foreground">
                  {coherence.score}
                </span>
                <span className="font-serif text-2xl text-muted-foreground">/10</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${coherence.score * 10}%` }}
                />
              </div>
              <p className="mt-4 font-serif text-lg text-foreground">{coherence.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{coherence.blurb}</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                A few small ideas
              </div>
              <ul className="mt-4 space-y-3">
                {recs.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-background/60 p-3 text-sm leading-relaxed text-foreground/90"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {i + 1}
                    </span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleTryAnother}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-input bg-background px-6 text-base font-medium text-foreground transition-colors hover:bg-accent"
              >
                <RefreshCw className="h-4 w-4" />
                Try Another Outfit
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function FigureTile({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="aspect-[3/4] w-full">{children}</div>
    </div>
  );
}

function EmptyTile({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-muted/40 text-muted-foreground">
      <span className="text-xs uppercase tracking-[0.18em]">{text}</span>
    </div>
  );
}

function MiniSkin({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background/70 p-3">
      <div className="flex items-center gap-1.5 text-primary">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 font-serif text-base text-foreground">{value}</p>
    </div>
  );
}
