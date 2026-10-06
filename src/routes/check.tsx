import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CircleAlert, CircleCheck, CircleHelp, CircleX } from "lucide-react";
import { loadProduct, type Product } from "@/lib/product";
import { EMPTY_PROFILE, SAMPLE_PROFILE, loadProfile, saveProfile, type Profile } from "@/lib/profile";
import { loadSkin } from "@/lib/mirror-session";
import { runCheck, type Category, type Verdict } from "@/lib/pharmacist-check";
import type { Scores } from "@/lib/skin-concerns";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Pharmacist check - Counter Check" },
      {
        name: "description",
        content: "Does this product fit your skin, your medicines and your allergies? Fixed rules, with the reasons.",
      },
    ],
  }),
  component: CheckPage,
});

const CATEGORY_LABEL: Record<Category, string> = {
  allergy: "Allergy or intolerance",
  preference: "Your preference",
  medicine: "Your medicines",
  pregnancy: "Pregnancy or breastfeeding",
  sensitive: "Sensitive skin or listed allergy",
  skin: "Your skin results",
  routine: "Your routine",
};

const STYLE: Record<Verdict, { box: string; Icon: typeof CircleCheck }> = {
  match: { box: "border-emerald-300 bg-emerald-50 text-emerald-950", Icon: CircleCheck },
  ask: { box: "border-amber-300 bg-amber-50 text-amber-950", Icon: CircleAlert },
  skip: { box: "border-rose-300 bg-rose-50 text-rose-950", Icon: CircleX },
  unmatched: { box: "border-border bg-card text-foreground", Icon: CircleHelp },
};

function CheckPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [scores, setScores] = useState<Scores | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProduct(loadProduct());
    setProfile(loadProfile());
    setScores((loadSkin()?.scores as Scores | undefined) ?? null);
    setReady(true);
  }, []);

  const result = useMemo(
    () => (product ? runCheck(product.ingredients, profile, scores) : null),
    [product, profile, scores],
  );

  const useSampleProfile = () => {
    saveProfile(SAMPLE_PROFILE);
    setProfile(SAMPLE_PROFILE);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/product" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to the label
        </Link>
        <span className="font-serif text-lg text-foreground">Counter Check</span>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 pb-24">
        <section>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 4 of 5</p>
          <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">Pharmacist check</h1>
        </section>

        {ready && !product && (
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <p className="text-foreground">No ingredient list yet.</p>
            <Link to="/product" className="mt-4 inline-flex h-11 items-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground">
              Read a label first
            </Link>
          </div>
        )}

        {result && product && (
          <>
            {(() => {
              const { box, Icon } = STYLE[result.verdict];
              return (
                <section className={`rounded-3xl border-2 p-6 ${box}`} aria-live="polite">
                  <div className="flex items-center gap-3">
                    <Icon className="h-8 w-8 shrink-0" aria-hidden="true" />
                    <h2 className="font-serif text-3xl">{result.headline}</h2>
                  </div>
                  <p className="mt-3 text-base">{result.summary}</p>
                </section>
              );
            })()}

            {result.reasons.length > 0 && (
              <section className="rounded-3xl border border-border bg-card p-5">
                <h2 className="font-serif text-xl text-foreground">Why</h2>
                <ul className="mt-3 space-y-3">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${r.level === "skip" ? "bg-rose-100 text-rose-900" : "bg-amber-100 text-amber-900"}`}>
                        {r.level === "skip" ? "Better to skip" : "Check first"}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {r.categories.map((c) => CATEGORY_LABEL[c]).join(" + ")}
                      </span>
                      <p className="mt-1 text-foreground">{r.text}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {result.fits.length > 0 && (
              <section className="rounded-3xl border border-border bg-card p-5">
                <h2 className="font-serif text-xl text-foreground">Fits your skin results</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {result.fits.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </section>
            )}

            {(result.notes.length > 0 || result.soft.length > 0) && (
              <section className="rounded-3xl border border-border bg-accent/40 p-5">
                <h2 className="font-serif text-xl text-foreground">Good to know</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {[...result.notes, ...result.soft].map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </section>
            )}

            {result.unrecognised.length > 0 && (
              <section className="rounded-3xl border border-border bg-card p-5 text-sm">
                <h2 className="font-serif text-xl text-foreground">Not recognised by the rules</h2>
                <p className="mt-2 text-muted-foreground">
                  {result.unrecognised.join(", ")}. These carry no rule, so they do not change the verdict. If a
                  word is a typing mistake, correct it on the label page.
                </p>
              </section>
            )}

            <section className="flex flex-col items-center gap-3 pt-2 text-sm sm:flex-row sm:justify-between">
              <div className="flex gap-4">
                <Link to="/product" className="underline underline-offset-4">Change the label</Link>
                <Link to="/profile" className="underline underline-offset-4">Update my profile</Link>
                <Link to="/tryon" className="underline underline-offset-4">Try it on (coloured products)</Link>
                <Link to="/compare" className="underline underline-offset-4">Compare products</Link>
                <Link to="/rules" className="underline underline-offset-4">How this works</Link>
              </div>
              <button type="button" onClick={useSampleProfile} className="text-muted-foreground underline underline-offset-4">
                Demo: use a sample profile (fictional)
              </button>
            </section>
            <p className="text-center text-xs text-muted-foreground">
              Based on the ingredient names only; a label does not show amounts. Not medical advice.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
