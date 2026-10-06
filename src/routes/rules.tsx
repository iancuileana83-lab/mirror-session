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
import {
  EFFECTS,
  GROUPS,
  MEDICINES,
  PREGNANCY_FLAGS,
  PREGNANCY_OK_NOTE,
  SENSITIVE_SKIN_FLAGS,
  ALLERGY_PROFILE_FLAGS,
  type GroupId,
} from "@/lib/knowledge-base";

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

        <section>
          <h2 className="font-serif text-2xl text-foreground">Product check: ingredient groups</h2>
          <p className="mt-2 text-muted-foreground">
            A label gives the order of ingredients but not their amounts, so the check can only say an
            ingredient is present. Groups are matched by their INCI names.
          </p>
          <ul className="mt-3 space-y-2">
            {Object.values(GROUPS).map((g) => (
              <li key={g.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-medium text-foreground">{g.label}</p>
                <p className="text-muted-foreground">{g.about}</p>
                {g.message && <p className="mt-1">Wording: {g.message}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  Matches: {g.terms.join(", ")}
                  {g.also ? ` (only when the name also contains "${g.also}")` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-foreground">Product check: medicines</h2>
          <ul className="mt-3 space-y-2">
            {MEDICINES.map((m) => (
              <li key={m.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-medium text-foreground">
                  {m.label} <span className="font-normal text-muted-foreground">({m.note})</span>
                </p>
                <p className="text-muted-foreground">{m.tags.map((t) => EFFECTS[t].label).join("; ")}</p>
              </li>
            ))}
          </ul>
          <h3 className="mt-5 font-serif text-xl text-foreground">What each effect does to the check</h3>
          <ul className="mt-2 space-y-2">
            {Object.values(EFFECTS).map((e) => (
              <li key={e.label} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-medium text-foreground">{e.label}</p>
                <p className="text-muted-foreground">{e.summary}</p>
                {e.spf && <p className="mt-1">Reminder: daily sunscreen.</p>}
                <ul className="mt-1 list-disc pl-5">
                  {e.flags.map((f) => (
                    <li key={f.group}>
                      {f.group === "strong_exfoliants" ? "Exfoliating acids" : GROUPS[f.group].label}:{" "}
                      {f.level === "skip" ? "better to skip" : "ask your pharmacist or doctor"} ({f.why})
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-foreground">Product check: pregnancy and breastfeeding</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {PREGNANCY_FLAGS.map((f) => (
              <li key={f.group}>
                {GROUPS[f.group as GroupId].label}: {f.level === "skip" ? "better to skip" : "ask your doctor or pharmacist"} ({f.why})
              </li>
            ))}
          </ul>
          <p className="mt-2">{PREGNANCY_OK_NOTE}</p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-foreground">Product check: sensitive skin and allergy profile</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SENSITIVE_SKIN_FLAGS.map((f) => (
              <li key={`s-${f.group}`}>
                Sensitive skin, {GROUPS[f.group as GroupId].label}: ask your pharmacist or doctor ({f.why})
              </li>
            ))}
            {ALLERGY_PROFILE_FLAGS.map((f) => (
              <li key={`a-${f.group}`}>
                Any allergy listed, {GROUPS[f.group as GroupId].label}: ask your pharmacist or doctor ({f.why})
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
