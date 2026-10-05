import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  ALWAYS_ESCALATE,
  AZELAIC_NOTE,
  PAUSED_NOTE,
  WARNING_SIGNS,
  COMBO_WARNINGS,
  GENERAL_SAFETY,
  INGREDIENTS,
  MAX_ACTIVES,
  PATCH_TEST,
  PREGNANCY_NOTE,
  RULES,
  SENSITIVE_NOTE,
} from "@/lib/routine-rules";
import { CONCERNS } from "@/lib/skin-concerns";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "How the rules work - Mirror Session" },
      {
        name: "description",
        content: "Every ingredient, trigger, reason and safety rule used to build a routine, in one place.",
      },
    ],
  }),
  component: RulesPage,
});

const label = (id: string) => CONCERNS.find((c) => c.id === id)?.label ?? id;

function RulesPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <span className="font-serif text-lg text-foreground">Mirror Session</span>
      </header>
      <main className="mx-auto w-full max-w-3xl space-y-8 px-6 pb-24 text-sm leading-relaxed text-foreground/90">
        <div>
          <h1 className="font-serif text-4xl text-foreground">How the rules work</h1>
          <p className="mt-3 text-muted-foreground">
            The routine is not written by an AI. It follows the fixed rules below, so the same scan always gives
            the same routine. Scores are 1-100 from YouCam Skin Analysis, higher means healthier-looking skin. At
            most {MAX_ACTIVES} active ingredients are suggested at the start.
          </p>
        </div>

        <section>
          <h2 className="font-serif text-2xl text-foreground">Rules: scan result to ingredient</h2>
          <ul className="mt-3 space-y-2">
            {RULES.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-medium text-foreground">
                  If {label(r.concern)} is below {r.below}: {INGREDIENTS[r.ingredient].name}
                  {INGREDIENTS[r.ingredient].active ? " (active)" : ""}
                </p>
                <p className="mt-1 text-muted-foreground">{r.reason}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-foreground">Ingredients</h2>
          <ul className="mt-3 space-y-2">
            {Object.values(INGREDIENTS).map((i) => (
              <li key={i.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-medium text-foreground">
                  {i.name} {i.active ? "(active)" : ""}
                </p>
                <p className="text-muted-foreground">
                  {i.look_for} Start: {i.start}. {i.frequency}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-foreground">Safety rules</h2>
          <p className="mt-2">{PATCH_TEST}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {GENERAL_SAFETY.map((s) => (
              <li key={s}>{s}</li>
            ))}
            {COMBO_WARNINGS.map((w) => (
              <li key={w.id}>{w.advice}</li>
            ))}
          </ul>
          <p className="mt-3">{AZELAIC_NOTE}</p>
          <p className="mt-3">
            Warning signs you can report (these pause all actives and show a basic routine only):
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {WARNING_SIGNS.map((w) => (
              <li key={w.key}>{w.label}</li>
            ))}
          </ul>
          <p className="mt-2">{PAUSED_NOTE}</p>
          <p className="mt-2">
            Scan scores are not clinically validated, so they only add a soft hint and never pause the routine.
          </p>
          <p className="mt-3">{PREGNANCY_NOTE}</p>
          <p className="mt-2">{SENSITIVE_NOTE}</p>
          <p className="mt-3 font-medium text-foreground">{ALWAYS_ESCALATE}</p>
        </section>
      </main>
    </div>
  );
}
