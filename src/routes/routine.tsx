import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShieldAlert, Sun, Moon, FlaskConical } from "lucide-react";
import { loadSkin } from "@/lib/mirror-session";
import {
  ALWAYS_ESCALATE,
  DEFAULT_OPTIONS,
  GENERAL_SAFETY,
  buildRoutine,
  type Options,
  type Step,
} from "@/lib/routine-rules";
import type { Scores } from "@/lib/skin-concerns";

export const Route = createFileRoute("/routine")({
  head: () => ({
    meta: [
      { title: "Your routine - Mirror Session" },
      {
        name: "description",
        content:
          "A simple morning and evening routine of active ingredients, with the reason for each step and safety notes.",
      },
    ],
  }),
  component: RoutinePage,
});

function RoutinePage() {
  const [scores, setScores] = useState<Scores | null>(null);
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);

  useEffect(() => {
    const skin = loadSkin();
    setScores((skin?.scores as Scores | undefined) ?? null);
  }, []);

  const routine = useMemo(() => (scores ? buildRoutine(scores, options) : null), [scores, options]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link
          to="/skin"
          search={{ event: undefined }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to scan
        </Link>
        <span className="font-serif text-lg text-foreground">Mirror Session</span>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 pb-24">
        <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
          Your simple routine
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Built from your scan with fixed rules, not guesses. Active ingredients only, no brands.
          Each step says why. Not medical advice.
        </p>

        {!routine ? (
          <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center">
            <p className="text-foreground">No scan yet.</p>
            <Link
              to="/skin"
              search={{ event: undefined }}
              className="mt-4 inline-flex h-11 items-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground"
            >
              Scan your skin first
            </Link>
          </div>
        ) : (
          <>
            <fieldset className="mt-8 rounded-3xl border border-border bg-card p-5">
              <legend className="px-2 text-sm font-medium text-foreground">About you (optional)</legend>
              <label className="flex items-center gap-3 py-1 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={options.pregnantOrBreastfeeding}
                  onChange={(e) => setOptions({ ...options, pregnantOrBreastfeeding: e.target.checked })}
                />
                I am pregnant, trying to be, or breastfeeding
              </label>
              <label className="flex items-center gap-3 py-1 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={options.sensitive}
                  onChange={(e) => setOptions({ ...options, sensitive: e.target.checked })}
                />
                My skin is sensitive or reacts easily
              </label>
            </fieldset>

            {routine.escalations.length > 0 && (
              <div className="mt-6 rounded-3xl border border-rose-300 bg-rose-50 p-5 text-rose-950">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldAlert className="h-5 w-5" /> Please talk to a professional
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {routine.escalations.map((e) => (
                    <li key={e.id}>{e.text}</li>
                  ))}
                </ul>
              </div>
            )}

            {routine.notes.map((n) => (
              <p key={n} className="mt-4 rounded-2xl border border-border bg-accent/40 p-4 text-sm text-foreground">
                {n}
              </p>
            ))}

            <Slot title="Morning" icon={<Sun className="h-5 w-5" />} steps={routine.am} />
            <Slot title="Evening" icon={<Moon className="h-5 w-5" />} steps={routine.pm} />

            {routine.patchTest && (
              <Box title="Patch test first" icon={<FlaskConical className="h-5 w-5" />}>
                <p>{routine.patchTest}</p>
              </Box>
            )}

            {routine.warnings.length > 0 && (
              <Box title="Combinations and timing">
                <ul className="list-disc space-y-1 pl-5">
                  {routine.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </Box>
            )}

            <Box title="Safety">
              <ul className="list-disc space-y-1 pl-5">
                {GENERAL_SAFETY.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="mt-3 font-medium">{ALWAYS_ESCALATE}</p>
            </Box>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              See exactly how the rules work on the{" "}
              <Link to="/rules" className="underline underline-offset-2">
                rules page
              </Link>
              .
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function Slot({ title, icon, steps }: { title: string; icon: React.ReactNode; steps: Step[] }) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 font-serif text-2xl text-foreground">
        {icon}
        {title}
      </h2>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={`${s.ingredient.id}-${i}`} className="rounded-3xl border border-border bg-card p-5">
            <p className="font-medium text-foreground">
              {i + 1}. {s.ingredient.name}
              {s.ingredient.active && (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  active: patch test
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.ingredient.look_for}</p>
            {s.ingredient.active && (
              <p className="mt-1 text-sm text-muted-foreground">
                Start with {s.ingredient.start}. {s.ingredient.frequency}
              </p>
            )}
            {s.reasons.map((r) => (
              <p key={r} className="mt-2 text-sm text-foreground/90">
                Why: {r}
              </p>
            ))}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Box({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-5 text-sm leading-relaxed text-foreground/90">
      <h2 className="mb-2 flex items-center gap-2 font-serif text-xl text-foreground">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
