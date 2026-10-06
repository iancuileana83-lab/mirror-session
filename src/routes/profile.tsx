import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  ALLERGY_CHOICES,
  EFFECTS,
  GROUPS,
  MEDICINES,
  PREFERENCE_CHOICES,
  type GroupId,
} from "@/lib/knowledge-base";
import {
  EMPTY_PROFILE,
  SAMPLE_PROFILE,
  USING_CHOICES,
  clearProfile,
  loadProfile,
  saveProfile,
  type Profile,
} from "@/lib/profile";
import { WARNING_SIGNS } from "@/lib/routine-rules";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "About you - Counter Check" },
      {
        name: "description",
        content: "Allergies, medicines, pregnancy or breastfeeding: kept only in your browser.",
      },
    ],
  }),
  component: ProfilePage,
});

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [ready, setReady] = useState(false);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    setProfile(loadProfile());
    setReady(true);
  }, []);

  const update = (next: Profile) => {
    setProfile(next);
    saveProfile(next);
  };

  const addCustom = () => {
    const word = custom.trim().toLowerCase();
    if (!word || profile.customAvoid.includes(word)) return;
    update({ ...profile, customAvoid: [...profile.customAvoid, word] });
    setCustom("");
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link
          to="/skin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to scan
        </Link>
        <span className="font-serif text-lg text-foreground">Counter Check</span>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-8 px-6 pb-24">
        <section>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 2 of 5</p>
          <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">About you</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Everything here stays in this browser. Nothing is sent anywhere. Fill in only what you want to;
            every answer makes the check more useful.
          </p>
        </section>

        {ready && (
          <>
            <fieldset className="rounded-3xl border border-border bg-card p-5">
              <legend className="px-2 text-sm font-medium text-foreground">Right now</legend>
              <label className="flex items-center gap-3 py-1 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={profile.pregnantOrBreastfeeding}
                  onChange={(e) => update({ ...profile, pregnantOrBreastfeeding: e.target.checked })}
                />
                I am pregnant, trying to be, or breastfeeding
              </label>
              <label className="flex items-center gap-3 py-1 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={profile.sensitiveSkin}
                  onChange={(e) => update({ ...profile, sensitiveSkin: e.target.checked })}
                />
                My skin is sensitive or reacts easily
              </label>
            </fieldset>

            <fieldset className="rounded-3xl border border-border bg-card p-5">
              <legend className="px-2 text-sm font-medium text-foreground">Medicines I take or use on the skin</legend>
              <p className="mb-2 text-xs text-muted-foreground">
                Generic names only. Tick what applies; the check will say when to ask your pharmacist or doctor.
              </p>
              {MEDICINES.map((m) => (
                <label key={m.id} className="flex items-start gap-3 py-1 text-sm text-foreground">
                  <input
                    className="mt-1"
                    type="checkbox"
                    checked={profile.medicines.includes(m.id)}
                    onChange={() => update({ ...profile, medicines: toggle(profile.medicines, m.id) })}
                  />
                  <span>
                    {m.label} <span className="text-muted-foreground">({m.note})</span>
                    {profile.medicines.includes(m.id) && (
                      <span className="block text-xs text-muted-foreground">
                        {m.tags.map((t) => EFFECTS[t].label).join("; ")}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>

            <fieldset className="rounded-3xl border border-border bg-card p-5">
              <legend className="px-2 text-sm font-medium text-foreground">Allergies and intolerances (avoid these)</legend>
              <div className="grid gap-x-6 sm:grid-cols-2">
                {ALLERGY_CHOICES.map((id: GroupId) => (
                  <label key={id} className="flex items-start gap-3 py-1 text-sm text-foreground">
                    <input
                      className="mt-1"
                      type="checkbox"
                      checked={profile.avoid.includes(id)}
                      onChange={() => update({ ...profile, avoid: toggle(profile.avoid, id) })}
                    />
                    <span>
                      {GROUPS[id].label}
                      <span className="block text-xs text-muted-foreground">{GROUPS[id].about}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-4">
                <label htmlFor="custom" className="text-sm font-medium text-foreground">
                  Another ingredient to avoid
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="custom"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustom()}
                    placeholder="e.g. sodium benzoate"
                    className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addCustom}
                    className="h-10 rounded-full border border-input bg-background px-5 text-sm font-medium hover:bg-accent"
                  >
                    Add
                  </button>
                </div>
                {profile.customAvoid.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {profile.customAvoid.map((w) => (
                      <li key={w}>
                        <button
                          type="button"
                          onClick={() => update({ ...profile, customAvoid: profile.customAvoid.filter((x) => x !== w) })}
                          className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground"
                          aria-label={`Remove ${w}`}
                        >
                          {w} x
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </fieldset>

            <fieldset className="rounded-3xl border border-border bg-card p-5">
              <legend className="px-2 text-sm font-medium text-foreground">Preferences (not allergies)</legend>
              <div className="grid gap-x-6 sm:grid-cols-2">
                {PREFERENCE_CHOICES.map((id: GroupId) => (
                  <label key={id} className="flex items-start gap-3 py-1 text-sm text-foreground">
                    <input
                      className="mt-1"
                      type="checkbox"
                      checked={profile.avoid.includes(id)}
                      onChange={() => update({ ...profile, avoid: toggle(profile.avoid, id) })}
                    />
                    <span>
                      I would rather avoid: {GROUPS[id].label}
                      <span className="block text-xs text-muted-foreground">{GROUPS[id].about}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-3xl border border-border bg-card p-5">
              <legend className="px-2 text-sm font-medium text-foreground">What I already use on my skin</legend>
              <p className="mb-2 text-xs text-muted-foreground">
                Tick what you really use today. The product check counts only these, and your confirmed basket, when it looks
                for clashes and for "one new active at a time". The suggested routine is only a suggestion and does not count.
              </p>
              {USING_CHOICES.map((u) => (
                <label key={u.id} className="flex items-center gap-3 py-1 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={profile.using.includes(u.id)}
                    onChange={() => update({ ...profile, using: toggle(profile.using, u.id) })}
                  />
                  {u.label}
                </label>
              ))}
              <label className="flex items-center gap-3 py-1 text-sm text-foreground">
                <input type="checkbox" checked={profile.using.length === 0} onChange={() => update({ ...profile, using: [] })} />
                None of these
              </label>
            </fieldset>

            <fieldset className="rounded-3xl border border-border bg-card p-5">
              <legend className="px-2 text-sm font-medium text-foreground">Do any of these apply?</legend>
              {WARNING_SIGNS.map((w) => (
                <label key={w.key} className="flex items-center gap-3 py-1 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={profile[w.key]}
                    onChange={(e) => update({ ...profile, [w.key]: e.target.checked })}
                  />
                  {w.label}
                </label>
              ))}
              <p className="mt-2 text-xs text-muted-foreground">
                If one applies, only a basic routine is advised and actives are paused until you have seen a
                pharmacist or doctor.
              </p>
            </fieldset>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => update(SAMPLE_PROFILE)}
                  className="text-left text-sm text-muted-foreground underline underline-offset-4"
                >
                  Demo: fill in a sample profile (fictional)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearProfile();
                    setProfile(EMPTY_PROFILE);
                  }}
                  className="text-left text-sm text-muted-foreground underline underline-offset-4"
                >
                  Clear everything I entered
                </button>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/routine" className="text-sm text-muted-foreground underline underline-offset-4">
                  See my routine
                </Link>
                <Link
                  to="/product"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20"
                >
                  Next: read a label
                </Link>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Not medical advice. Ask your pharmacist or doctor about your medicines.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
