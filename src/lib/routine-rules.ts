// DRAFT rules for the skin routine. Deterministic: same scan in, same routine out.
// Written as a first draft for pharmacist review. Nothing here is medical advice.
// Ingredients only, no brand names. Scores come from YouCam (1-100, higher = healthier).

import type { ConcernId, Scores } from "./skin-concerns";

export type IngredientId =
  | "cleanser"
  | "humectant"
  | "ceramide"
  | "sunscreen"
  | "niacinamide"
  | "salicylic"
  | "azelaic"
  | "retinol"
  | "vitamin_c"
  | "soothing";

export type Ingredient = {
  id: IngredientId;
  name: string;
  /** Plain description of what to look for on a label. */
  look_for: string;
  /** True for actives that can irritate: they need a patch test and slow start. */
  active: boolean;
  /** Typical label strength to start with (guidance only). */
  start: string;
  frequency: string;
  /** Which part of the day it belongs to. */
  when: "am" | "pm" | "both";
};

export const INGREDIENTS: Record<IngredientId, Ingredient> = {
  cleanser: {
    id: "cleanser",
    name: "Gentle cleanser",
    look_for: "A mild, fragrance-free cleanser (low-foam or gel for oily skin).",
    active: false,
    start: "n/a",
    frequency: "Morning: rinse or cleanse. Evening: cleanse.",
    when: "both",
  },
  humectant: {
    id: "humectant",
    name: "Hydrating moisturizer (glycerin, hyaluronic acid)",
    look_for: "Glycerin or hyaluronic acid in a light cream or gel.",
    active: false,
    start: "n/a",
    frequency: "Morning and evening, on slightly damp skin.",
    when: "both",
  },
  ceramide: {
    id: "ceramide",
    name: "Barrier moisturizer (ceramides)",
    look_for: "Ceramides, often with cholesterol and fatty acids, in a cream.",
    active: false,
    start: "n/a",
    frequency: "Evening, or morning and evening if skin feels tight.",
    when: "pm",
  },
  sunscreen: {
    id: "sunscreen",
    name: "Broad-spectrum sunscreen",
    look_for: "SPF 30 or higher, labelled broad-spectrum, fragrance-free if skin is easily upset.",
    active: false,
    start: "SPF 30+",
    frequency: "Every morning, last step; reapply if outdoors for long.",
    when: "am",
  },
  niacinamide: {
    id: "niacinamide",
    name: "Niacinamide",
    look_for: "A serum or cream with niacinamide.",
    active: true,
    start: "2-5%",
    frequency: "Once a day, morning or evening.",
    when: "am",
  },
  salicylic: {
    id: "salicylic",
    name: "Salicylic acid (BHA)",
    look_for: "A leave-on product with salicylic acid.",
    active: true,
    start: "0.5-2%",
    frequency: "Start 2 evenings a week, build up slowly if the skin is comfortable.",
    when: "pm",
  },
  azelaic: {
    id: "azelaic",
    name: "Azelaic acid",
    look_for: "A cream or gel with azelaic acid.",
    active: true,
    start: "10%",
    frequency: "Once a day (evening), start every second day.",
    when: "pm",
  },
  retinol: {
    id: "retinol",
    name: "Retinol (vitamin A)",
    look_for: "A low-strength retinol cream or serum.",
    active: true,
    start: "0.1-0.3%",
    frequency: "Start 2 evenings a week, build up slowly if the skin is comfortable.",
    when: "pm",
  },
  vitamin_c: {
    id: "vitamin_c",
    name: "Vitamin C (ascorbic acid)",
    look_for: "A serum with vitamin C, kept in a dark, closed bottle.",
    active: true,
    start: "10-15%",
    frequency: "Morning, before moisturizer and sunscreen.",
    when: "am",
  },
  soothing: {
    id: "soothing",
    name: "Soothing ingredients (panthenol, allantoin)",
    look_for: "Panthenol or allantoin in a fragrance-free cream.",
    active: false,
    start: "n/a",
    frequency: "Morning and evening, in place of a regular moisturizer.",
    when: "both",
  },
};

/** One rule: when this concern is visible enough, suggest this ingredient, with the reason. */
export type Rule = {
  id: string;
  concern: ConcernId;
  /** The rule fires when the concern score is below this number. */
  below: number;
  ingredient: IngredientId;
  /** Lower number = higher priority when too many actives would fire. */
  priority: number;
  reason: string;
};

export const RULES: Rule[] = [
  { id: "moisture-humectant", concern: "moisture", below: 70, ingredient: "humectant", priority: 1,
    reason: "Hydration looks low. Humectants pull water into the top layer of the skin." },
  { id: "moisture-ceramide", concern: "moisture", below: 45, ingredient: "ceramide", priority: 2,
    reason: "Hydration looks clearly low. Ceramides help the skin keep its water in." },
  { id: "oiliness-niacinamide", concern: "oiliness", below: 55, ingredient: "niacinamide", priority: 3,
    reason: "The skin looks shiny. Niacinamide is used to help balance oil." },
  { id: "pore-niacinamide", concern: "pore", below: 55, ingredient: "niacinamide", priority: 3,
    reason: "Pores look visible. Niacinamide may make them look less obvious over weeks." },
  { id: "pore-salicylic", concern: "pore", below: 45, ingredient: "salicylic", priority: 4,
    reason: "Pores look very visible. Salicylic acid is oil-soluble and works inside the pore." },
  { id: "texture-salicylic", concern: "texture", below: 50, ingredient: "salicylic", priority: 4,
    reason: "The surface looks uneven. A mild exfoliating acid can smooth it, slowly." },
  { id: "acne-salicylic", concern: "acne", below: 60, ingredient: "salicylic", priority: 2,
    reason: "Some spots and bumps are visible. Salicylic acid helps keep pores clear." },
  { id: "acne-azelaic", concern: "acne", below: 45, ingredient: "azelaic", priority: 3,
    reason: "Spots and bumps are clearly visible. Azelaic acid is gentle and also evens skin tone." },
  { id: "redness-soothing", concern: "redness", below: 60, ingredient: "soothing", priority: 1,
    reason: "Redness is visible. Keep the routine simple and use calming ingredients." },
  { id: "redness-azelaic", concern: "redness", below: 50, ingredient: "azelaic", priority: 4,
    reason: "Redness is clearly visible. Azelaic acid is often well tolerated by reactive skin." },
  { id: "spots-vitc", concern: "age_spot", below: 60, ingredient: "vitamin_c", priority: 3,
    reason: "Darker patches are visible. Vitamin C is used to help even skin tone." },
  { id: "spots-niacinamide", concern: "age_spot", below: 60, ingredient: "niacinamide", priority: 4,
    reason: "Darker patches are visible. Niacinamide can help even tone." },
  { id: "circles-vitc", concern: "dark_circle", below: 50, ingredient: "vitamin_c", priority: 5,
    reason: "Under-eye darkness is visible. Vitamin C may brighten a little; sleep and light matter more." },
  { id: "wrinkle-retinol", concern: "wrinkle", below: 60, ingredient: "retinol", priority: 3,
    reason: "Fine lines are visible. Retinol is the best-studied ingredient for fine lines." },
  { id: "firmness-retinol", concern: "firmness", below: 55, ingredient: "retinol", priority: 4,
    reason: "Firmness looks lower. Retinol supports skin renewal over months." },
  { id: "radiance-vitc", concern: "radiance", below: 55, ingredient: "vitamin_c", priority: 4,
    reason: "Skin looks dull. Vitamin C is used for a brighter look." },
];

/** Never more than this many ACTIVE ingredients at the start. */
export const MAX_ACTIVES = 2;

// ---------- Safety ----------

export type Options = {
  /** User says they are pregnant, trying to be, or breastfeeding. */
  pregnantOrBreastfeeding: boolean;
  /** User says their skin is sensitive or reacts easily. */
  sensitive: boolean;
  /** User-reported warning signs. Any of these pauses all actives. */
  painfulLesions: boolean;
  changingMole: boolean;
  /** No improvement after 6-8 weeks of a routine. */
  noImprovement: boolean;
};

export const DEFAULT_OPTIONS: Options = {
  pregnantOrBreastfeeding: false,
  sensitive: false,
  painfulLesions: false,
  changingMole: false,
  noImprovement: false,
};

/** Labels for the user-reported signs, shown as checkboxes. */
export const WARNING_SIGNS: Array<{ key: "painfulLesions" | "changingMole" | "noImprovement"; label: string }> = [
  { key: "painfulLesions", label: "I have painful, inflamed or deep spots or lesions" },
  { key: "changingMole", label: "A mole or spot is new, changing, uneven, itchy or bleeding" },
  { key: "noImprovement", label: "No improvement after 6-8 weeks of a routine" },
];

/** Sensitive skin: lower vitamin C (or gentler derivatives). */
export const SENSITIVE_VITAMIN_C = "5-10%, or a gentler derivative such as magnesium ascorbyl phosphate";

export const PATCH_TEST =
  "Patch test every new active first: apply a small amount behind the ear or on the jawline once a day for 2 days. Do not continue if you see redness, itching, burning or swelling.";

export const GENERAL_SAFETY: string[] = [
  "Sunscreen every morning, always. It matters most with retinol, vitamin C or exfoliating acids, which make skin more sun-sensitive.",
  "Introduce one new active at a time and wait about 2 weeks before adding another.",
  "Retinol only at night.",
  "Never use retinol and acids (salicylic or azelaic) on the same night.",
  "Vitamin C in the morning.",
  "If skin stings, peels or feels tight for more than a few days, stop the newest active and keep only cleanser, moisturizer and sunscreen.",
  "Keep products away from the eyes, mouth and broken skin.",
];

export type ComboWarning = {
  id: string;
  a: IngredientId;
  b: IngredientId;
  advice: string;
};

/** Pairs that should not be used in the same routine slot. */
export const COMBO_WARNINGS: ComboWarning[] = [
  { id: "retinol-salicylic", a: "retinol", b: "salicylic",
    advice: "Do not use retinol and salicylic acid on the same evening. Use them on different evenings." },
  { id: "retinol-azelaic", a: "retinol", b: "azelaic",
    advice: "Do not use retinol and azelaic acid on the same evening. Use them on different evenings." },
  { id: "retinol-vitc", a: "retinol", b: "vitamin_c",
    advice: "Keep vitamin C for the morning and retinol for the evening." },
  { id: "salicylic-azelaic", a: "salicylic", b: "azelaic",
    advice: "Do not start salicylic acid and azelaic acid together. Choose one first." },
];

export type Escalation = {
  id: string;
  /** Plain reason to show. */
  text: string;
};

/**
 * Escalation is based on what the USER reports. YouCam scores are not clinically
 * validated, so they only give a soft hint (see scoreHints) and never pause actives.
 */
export function escalations(options: Options): Escalation[] {
  const out: Escalation[] = [];
  if (options.painfulLesions)
    out.push({ id: "painful", text: "Painful, inflamed or deep lesions need a pharmacist or a doctor, not a cosmetic routine." });
  if (options.changingMole)
    out.push({ id: "mole", text: "A new or changing mole or spot, or one that is uneven, itchy or bleeding, should be seen by a doctor or dermatologist soon." });
  if (options.noImprovement)
    out.push({ id: "noimprovement", text: "No improvement after 6-8 weeks means it is time to ask a pharmacist or a dermatologist." });
  return out;
}

/** Supporting hints from the scan. They never pause the routine. */
export function scoreHints(scores: Scores): string[] {
  const out: string[] = [];
  const low = (k: ConcernId, n: number) => typeof scores[k] === "number" && scores[k]! < n;
  if (low("redness", 40) || low("acne", 35))
    out.push("The scan sees strong redness or many spots. The scan is not clinically validated, but if this matches what you see and it bothers you, ask a pharmacist.");
  return out;
}

export const ALWAYS_ESCALATE =
  "See a pharmacist or a dermatologist if skin hurts, bleeds, swells, spreads, gets worse after a few weeks, or if you are unsure about anything here.";

export const PREGNANCY_NOTE =
  "You said you are pregnant, trying to be, or breastfeeding. Retinol and salicylic acid are left out of this routine. Azelaic acid, vitamin C and niacinamide can stay: please check with your doctor or pharmacist.";

export const SENSITIVE_NOTE =
  "You said your skin is sensitive. Only one active is suggested, vitamin C is kept low (or a gentler derivative), and a patch test matters even more.";

export const AZELAIC_NOTE =
  "Azelaic acid at 15-20% is a prescription-level strength: ask a doctor or pharmacist before going above the 10% start.";

export const PAUSED_NOTE =
  "Because of what you reported, only a basic routine is shown (gentle cleanser, moisturizer, daily sunscreen). Actives are paused until you have seen a pharmacist or a doctor.";

// ---------- Engine ----------

export type Step = {
  ingredient: Ingredient;
  reasons: string[];
  /** Fixed steps (cleanser, moisturizer, sunscreen) are always there. */
  base: boolean;
  /** Replaces ingredient.start when set (e.g. gentler vitamin C for sensitive skin). */
  start?: string;
};

export type Routine = {
  am: Step[];
  pm: Step[];
  /** Actives that matched but were held back to keep the routine simple. */
  later: Array<{ ingredient: Ingredient; reasons: string[] }>;
  warnings: string[];
  escalations: Escalation[];
  /** Soft hints from the scan scores; they never pause the routine. */
  hints: string[];
  /** True when user-reported signs paused all actives (basic routine only). */
  paused: boolean;
  notes: string[];
  patchTest: string | null;
};

const BASE_REASON: Record<string, string> = {
  cleanser: "Removes dirt and oil without stripping the skin.",
  humectant: "Every routine needs a moisturizer.",
  sunscreen: "Daily sun protection is the most useful step for skin health.",
};

export function buildRoutine(scores: Scores, options: Options = DEFAULT_OPTIONS): Routine {
  const esc = escalations(options);
  const paused = esc.length > 0;
  const fired = RULES.filter((r) => {
    if (paused) return false;
    const v = scores[r.concern];
    return typeof v === "number" && v < r.below;
  }).sort((a, b) => a.priority - b.priority);

  const blocked = new Set<IngredientId>();
  if (options.pregnantOrBreastfeeding) {
    blocked.add("retinol");
    blocked.add("salicylic");
  }
  const maxActives = options.sensitive ? 1 : MAX_ACTIVES;

  // group reasons per ingredient, keeping the best priority
  const byIngredient = new Map<IngredientId, { priority: number; reasons: string[] }>();
  for (const r of fired) {
    if (blocked.has(r.ingredient)) continue;
    const cur = byIngredient.get(r.ingredient);
    if (cur) cur.reasons.push(r.reason);
    else byIngredient.set(r.ingredient, { priority: r.priority, reasons: [r.reason] });
  }

  const ordered = [...byIngredient.entries()].sort((a, b) => a[1].priority - b[1].priority);
  const chosen: Array<[IngredientId, string[]]> = [];
  const later: Routine["later"] = [];
  let actives = 0;
  const pmActives: IngredientId[] = [];
  for (const [id, info] of ordered) {
    const ing = INGREDIENTS[id];
    const clash = ing.active && ing.when === "pm" && pmActives.some((p) => COMBO_WARNINGS.some(
      (w) => (w.a === id && w.b === p) || (w.b === id && w.a === p),
    ));
    if (ing.active && (actives >= maxActives || clash)) {
      later.push({ ingredient: ing, reasons: info.reasons });
      continue;
    }
    if (ing.active) {
      actives++;
      if (ing.when === "pm") pmActives.push(id);
    }
    chosen.push([id, info.reasons]);
  }

  const has = (id: IngredientId) => chosen.some(([c]) => c === id);
  const am: Step[] = [{ ingredient: INGREDIENTS.cleanser, reasons: [BASE_REASON.cleanser], base: true }];
  const pm: Step[] = [{ ingredient: INGREDIENTS.cleanser, reasons: [BASE_REASON.cleanser], base: true }];

  for (const [id, reasons] of chosen) {
    const ing = INGREDIENTS[id];
    if (id === "humectant" || id === "soothing" || id === "ceramide") continue; // moisturizer slot below
    const step: Step = {
      ingredient: ing,
      reasons,
      base: false,
      start: id === "vitamin_c" && options.sensitive ? SENSITIVE_VITAMIN_C : undefined,
    };
    if (ing.when === "am" || ing.when === "both") am.push(step);
    if (ing.when === "pm") pm.push(step);
  }

  // moisturizer slot: soothing > humectant (+ ceramide at night)
  const moist = has("soothing") ? "soothing" : "humectant";
  const moistReasons = (id: IngredientId) => chosen.find(([c]) => c === id)?.[1] ?? [BASE_REASON.humectant];
  am.push({ ingredient: INGREDIENTS[moist], reasons: moistReasons(moist), base: !has(moist) });
  pm.push({
    ingredient: INGREDIENTS[has("ceramide") ? "ceramide" : moist],
    reasons: has("ceramide") ? moistReasons("ceramide") : moistReasons(moist),
    base: !has("ceramide") && !has(moist),
  });
  am.push({ ingredient: INGREDIENTS.sunscreen, reasons: [BASE_REASON.sunscreen], base: true });

  const warnings: string[] = [];
  const present = new Set<IngredientId>(chosen.map(([c]) => c));
  for (const w of COMBO_WARNINGS) if (present.has(w.a) && present.has(w.b)) warnings.push(w.advice);
  for (const l of later) {
    // explain why something was held back
    warnings.push(`${l.ingredient.name} also fits your scan, but is held back for now: add it after about 2 weeks if your skin is comfortable.`);
  }

  const notes: string[] = [];
  if (options.pregnantOrBreastfeeding) notes.push(PREGNANCY_NOTE);
  if (options.sensitive) notes.push(SENSITIVE_NOTE);
  if (present.has("azelaic")) notes.push(AZELAIC_NOTE);
  if (paused) notes.push(PAUSED_NOTE);

  return {
    am,
    pm,
    later,
    warnings,
    escalations: esc,
    hints: scoreHints(scores),
    paused,
    notes,
    patchTest: chosen.some(([id]) => INGREDIENTS[id].active) ? PATCH_TEST : null,
  };
}
