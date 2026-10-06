// The pharmacist check: fixed rules, no AI. Same inputs always give the same verdict.
// Principles (decided by the pharmacist):
//  1. Three levels only: "Good match", "Check first", "Better to skip", each with the exact
//     ingredients and the reason (skin results, routine, medicine, pregnancy, allergy, preference).
//  2. Never the words safe / cure / treat / diagnose. Check first and Better to skip end with
//     "ask your pharmacist or doctor".
//  3. The strictest flag decides the verdict.
//  4. Preferences can only lower the verdict to "Check first".
//  5. If the ingredients cannot be matched, say so instead of "Good match".

import {
  ALLERGY_CHOICES,
  ALLERGY_PROFILE_FLAGS,
  EFFECTS,
  GROUPS,
  MEDICINES,
  PREFERENCE_CHOICES,
  PREGNANCY_FLAGS,
  SENSITIVE_SKIN_FLAGS,
  classify,
  expandAvoid,
  type Flag,
  type GroupId,
  type Level,
} from "./knowledge-base";
import { isCommonIngredient } from "./common-ingredients";
import type { Profile } from "./profile";
import { MAX_ACTIVES, RULES, buildRoutine } from "./routine-rules";
import type { Scores } from "./skin-concerns";

export type Verdict = "match" | "ask" | "skip" | "unmatched";

export type Category = "allergy" | "preference" | "medicine" | "pregnancy" | "sensitive" | "skin" | "routine";

/** One finding about one set of ingredients. Findings about the same ingredients are merged. */
export type Reason = {
  level: Level;
  categories: Category[];
  /** The exact ingredients (as printed) behind this reason. */
  ingredients: string[];
  /** The separate reasons, each a short sentence. */
  because: string[];
  /** "Contains X. Reason one. Reason two." */
  text: string;
};

export type CheckResult = {
  verdict: Verdict;
  headline: string;
  /** One sentence; for Check first / Better to skip it ends with "Ask your pharmacist or doctor." */
  summary: string;
  reasons: Reason[];
  /** Points where the product fits the skin results (information, never changes the verdict). */
  fits: string[];
  notes: string[];
  /** Ingredients the check did not recognise at all. */
  unrecognised: string[];
  recognisedShare: number;
};

export const ASK_DOCTOR = "Ask your pharmacist or doctor.";

/** Below this share of recognised ingredients the check refuses to give a verdict. */
export const MIN_RECOGNISED_SHARE = 0.5;

const list = (xs: string[]) => xs.join(", ");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Finding = { level: Level; category: Category; ingredients: string[]; because: string };

export function runCheck(ingredients: string[], profile: Profile, scores: Scores | null): CheckResult {
  const hits = classify(ingredients);
  const byGroup = new Map<GroupId, string[]>();
  for (const h of hits) for (const g of h.groups) byGroup.set(g, [...(byGroup.get(g) ?? []), h.ingredient]);
  const found = (g: GroupId) => byGroup.get(g) ?? [];
  const foundAny = (gs: GroupId[]) => [...new Set(gs.flatMap((g) => found(g)))];

  const unrecognised = ingredients.filter(
    (i) => !hits.some((h) => h.ingredient === i) && !isCommonIngredient(i),
  );
  const recognisedShare = ingredients.length === 0 ? 0 : 1 - unrecognised.length / ingredients.length;

  const findings: Finding[] = [];
  const notes: string[] = [];
  const fits: string[] = [];
  const add = (f: Finding) => {
    if (f.ingredients.length) findings.push(f);
  };

  const groupsOfFlag = (f: Flag): GroupId[] => (f.group === "strong_exfoliants" ? ["aha", "bha"] : [f.group]);
  const flagIngredients = (f: Flag) => foundAny(groupsOfFlag(f));
  const groupName = (f: Flag) => (f.group === "strong_exfoliants" ? "exfoliating acids" : GROUPS[f.group].label.toLowerCase());

  /** A reason sentence: names the group only when the flag text does not already do so. */
  const why = (f: Flag, context?: string) => {
    const short = groupName(f).split(" (")[0];
    const text = f.why.toLowerCase().includes(short.split(" ")[0]) ? f.why : `${short}: ${f.why}`;
    return context ? `${text} (${context})` : text;
  };

  // 1. Allergies and intolerances (strictest: better to skip)
  const avoid = expandAvoid(profile.avoid);
  for (const g of avoid) {
    if (PREFERENCE_CHOICES.includes(g)) continue;
    const what = GROUPS[g].message ?? GROUPS[g].label.toLowerCase();
    add({
      level: "skip",
      category: "allergy",
      ingredients: found(g),
      because: `${what}; you listed this as an allergy or intolerance`,
    });
  }
  for (const word of profile.customAvoid) {
    add({
      level: "skip",
      category: "allergy",
      ingredients: ingredients.filter((i) => i.toLowerCase().includes(word.toLowerCase())),
      because: `you asked to avoid "${word}"`,
    });
  }

  // 2. Preferences: can only lower the verdict to "Check first"
  for (const g of avoid) {
    if (!PREFERENCE_CHOICES.includes(g)) continue;
    add({
      level: "ask",
      category: "preference",
      ingredients: found(g),
      because: `${GROUPS[g].label.toLowerCase()}; you would rather avoid this (a preference, not an allergy)`,
    });
  }

  // 3. Medicines
  for (const id of profile.medicines) {
    const med = MEDICINES.find((m) => m.id === id);
    if (!med) continue;
    for (const tag of med.tags) {
      const effect = EFFECTS[tag];
      if (effect.spf || effect.flags.length === 0) notes.push(`Because you use ${med.label}: ${effect.summary}`);
      for (const f of effect.flags) {
        add({
          level: f.level,
          category: "medicine",
          ingredients: flagIngredients(f),
          because: why(f, `you use ${med.label.split(" (")[0].toLowerCase()}`),
        });
      }
    }
  }

  // 4. Pregnancy and breastfeeding
  if (profile.pregnantOrBreastfeeding) {
    for (const f of PREGNANCY_FLAGS) {
      add({
        level: f.level,
        category: "pregnancy",
        ingredients: flagIngredients(f),
        because: why(f, "pregnancy or breastfeeding"),
      });
    }
  }

  // 5. Sensitive skin, and plant extracts when any allergy is listed
  if (profile.sensitiveSkin) {
    for (const f of SENSITIVE_SKIN_FLAGS) {
      add({
        level: f.level,
        category: "sensitive",
        ingredients: flagIngredients(f),
        because: why(f, "sensitive skin"),
      });
    }
  }
  const hasAllergy = profile.avoid.some((g) => ALLERGY_CHOICES.includes(g)) || profile.customAvoid.length > 0;
  if (hasAllergy) {
    for (const f of ALLERGY_PROFILE_FLAGS) {
      add({ level: f.level, category: "sensitive", ingredients: flagIngredients(f), because: why(f) });
    }
  }

  // 6. Skin results (soft: scan scores are not clinically validated, so only "Check first")
  if (scores) {
    const low = (k: keyof Scores, n: number) => typeof scores[k] === "number" && scores[k]! < n;
    if (low("redness", 60))
      add({
        level: "ask",
        category: "skin",
        ingredients: foundAny(["fragrance", "essential_oils", "drying_alcohol", "aha", "bha", "retinoids", "scrubs", "benzoyl_peroxide"]),
        because: "your scan shows some redness and these can irritate (the scan is only a photo reading)",
      });
    if (low("moisture", 60))
      add({
        level: "ask",
        category: "skin",
        ingredients: foundAny(["drying_alcohol", "sulfates", "scrubs"]),
        because: "your scan shows low hydration and these can dry the skin",
      });
    // positive fits, from the same rules that build the routine
    const groupFor: Record<string, GroupId> = {
      niacinamide: "niacinamide", salicylic: "bha", azelaic: "azelaic", retinol: "retinoids", vitamin_c: "vitamin_c",
    };
    for (const r of RULES) {
      const g = groupFor[r.ingredient];
      const v = scores[r.concern];
      if (g && typeof v === "number" && v < r.below && found(g).length) {
        const msg = `${list(found(g))} fits your scan: ${r.reason}`;
        if (!fits.includes(msg)) fits.push(msg);
      }
    }
  } else {
    notes.push("No skin scan yet, so the fit with your skin results was not checked.");
  }

  // 7. Routine: clashes with the routine built from the scan and the profile
  const routine = buildRoutine(scores ?? {}, {
    pregnantOrBreastfeeding: profile.pregnantOrBreastfeeding,
    sensitive: profile.sensitiveSkin,
    painfulLesions: profile.painfulLesions,
    changingMole: profile.changingMole,
    noImprovement: profile.noImprovement,
  });
  const routineActives = [...routine.am, ...routine.pm].filter((s) => s.ingredient.active);
  const pmIds = routine.pm.map((s) => s.ingredient.id);
  const retinol = found("retinoids");
  const acids = foundAny(["aha", "bha", "azelaic"]);
  const productActives = foundAny(["retinoids", "aha", "bha", "vitamin_c", "azelaic", "benzoyl_peroxide"]);

  if (routine.paused)
    add({
      level: "ask",
      category: "routine",
      ingredients: productActives,
      because: "you reported a sign that pauses actives, so only a basic routine is advised until you have seen someone",
    });
  if (pmIds.includes("salicylic") || pmIds.includes("azelaic"))
    add({
      level: "ask",
      category: "routine",
      ingredients: retinol,
      because: "your evening routine already has an acid, and retinol and acids should never be used on the same night; you can use them on different evenings",
    });
  if (pmIds.includes("retinol")) {
    add({
      level: "ask",
      category: "routine",
      ingredients: acids,
      because: "your evening routine already has retinol, and retinol and acids should never be used on the same night; you can use them on different evenings",
    });
    add({
      level: "ask",
      category: "routine",
      ingredients: retinol,
      because: "your routine already has retinol; two retinol products would add up",
    });
  }
  if (!routine.paused && routineActives.length >= MAX_ACTIVES)
    add({
      level: "ask",
      category: "routine",
      ingredients: productActives,
      because: `your routine already has ${routineActives.length} active ingredients; introduce one new active at a time`,
    });

  // Merge findings about the same ingredients and level into one reason.
  const merged = new Map<string, Reason>();
  for (const f of findings) {
    const key = `${f.level}|${[...f.ingredients].sort().join("|")}`;
    const cur = merged.get(key);
    if (cur) {
      if (!cur.categories.includes(f.category)) cur.categories.push(f.category);
      if (!cur.because.includes(f.because)) cur.because.push(f.because);
    } else {
      merged.set(key, { level: f.level, categories: [f.category], ingredients: f.ingredients, because: [f.because], text: "" });
    }
  }
  const reasons = [...merged.values()];
  for (const r of reasons) {
    const patch = r.level === "ask" && r.categories.some((c) => c === "sensitive" || c === "skin");
    r.text = `Contains ${list(r.ingredients)}. ${r.because.map((b) => `${cap(b)}.`).join(" ")}${patch ? " Try a small patch test for 2-3 days first." : ""}`;
  }
  reasons.sort((a, b) => (a.level === b.level ? 0 : a.level === "skip" ? -1 : 1));


  // Verdict: the strictest flag decides.
  let verdict: Verdict;
  let headline: string;
  let summary: string;
  if (ingredients.length === 0 || recognisedShare < MIN_RECOGNISED_SHARE) {
    verdict = "unmatched";
    headline = "We couldn't match these ingredients";
    summary =
      "Too few of these ingredients are known to the rules for a fair check. Compare the text with the pack, correct it, or ask your pharmacist.";
  } else if (reasons.some((r) => r.level === "skip")) {
    const n = reasons.filter((r) => r.level === "skip").length;
    verdict = "skip";
    headline = "Better to skip";
    summary = `${n === 1 ? "One reason" : `${n} reasons`} to leave this one on the shelf. ${ASK_DOCTOR}`;
  } else if (reasons.length > 0) {
    verdict = "ask";
    headline = "Check first";
    summary = `${reasons.length === 1 ? "One point" : `${reasons.length} points`} to check before you buy. ${ASK_DOCTOR}`;
  } else {
    verdict = "match";
    headline = "Good match";
    summary = "Nothing in this ingredient list conflicts with what you told us. We can\u0027t see amounts or how you use it.";
  }

  return { verdict, headline, summary, reasons, fits, notes: [...new Set(notes)], unrecognised, recognisedShare };
}
