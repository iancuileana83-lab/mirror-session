// The shopping agent: compares up to three checked products and PROPOSES a basket.
// Rules only, no AI. It never saves or acts: the user must confirm, edit or decline.
// Principles: never put a "Better to skip" or unmatched product in the basket; "Check first"
// products wait for the pharmacist; one product per type; one new active at a time.

import { classify } from "./knowledge-base";
import type { Profile } from "./profile";
import { runCheck, type CheckResult } from "./pharmacist-check";
import type { ProductKind, ShelfItem } from "./shelf";
import type { Scores } from "./skin-concerns";

export type Evaluated = {
  item: ShelfItem;
  check: CheckResult;
  /** True when the product contains an active ingredient (retinoid, acid, vitamin C, azelaic, benzoyl peroxide). */
  hasActive: boolean;
  /** Higher is better: used only to choose between products of the same type. */
  score: number;
};

export type Line = { item: ShelfItem; why: string };

export type Proposal = {
  buyNow: Line[];
  later: Line[];
  /** "Check first": waiting for the pharmacist. */
  waitFirst: Line[];
  /** "Better to skip" or not matched. */
  leaveOut: Line[];
  notes: string[];
};

const ACTIVE_GROUPS = ["retinoids", "aha", "bha", "vitamin_c", "azelaic", "benzoyl_peroxide"] as const;

/** Groups of ingredients that commonly irritate or cause reactions: fewer is a tie-break in favour of a product. */
const IRRITATION_PRONE = [
  "fragrance", "essential_oils", "furocoumarin_oils", "citrus_extracts", "plant_extracts", "drying_alcohol",
  "isothiazolinones", "formaldehyde_releasers", "lanolin", "propylene_glycol", "sulfates", "scrubs",
];

export function evaluate(items: ShelfItem[], profile: Profile, scores: Scores | null): Evaluated[] {
  return items.map((item) => {
    const check = runCheck(item.ingredients, profile, scores);
    const hasActive = classify(item.ingredients).some((h) => h.groups.some((g) => (ACTIVE_GROUPS as readonly string[]).includes(g)));
    const proneCount = classify(item.ingredients).filter((h) => h.groups.some((g) => IRRITATION_PRONE.includes(g))).length;
    const score =
      -10 * check.reasons.filter((r) => r.level === "ask").length +
      2 * check.fits.length -
      proneCount -
      check.unrecognised.length;
    return { item, check, hasActive, score };
  });
}

export function proposeBasket(evals: Evaluated[]): Proposal {
  const buyNow: Line[] = [];
  const later: Line[] = [];
  const waitFirst: Line[] = [];
  const leaveOut: Line[] = [];
  const notes: string[] = [];

  const matches: Evaluated[] = [];
  for (const e of evals) {
    if (e.check.verdict === "skip") {
      const first = e.check.reasons.find((r) => r.level === "skip");
      leaveOut.push({ item: e.item, why: `Better to skip. ${first ? first.text : ""}`.trim() });
    } else if (e.check.verdict === "unmatched") {
      leaveOut.push({ item: e.item, why: "We couldn't match enough of these ingredients for a fair check. Correct the list or ask your pharmacist." });
    } else if (e.check.verdict === "ask") {
      waitFirst.push({
        item: e.item,
        why: `Check first: ${e.check.reasons.length === 1 ? "one point" : `${e.check.reasons.length} points`} to look at. Ask your pharmacist or doctor before you buy it.`,
      });
    } else {
      matches.push(e);
    }
  }

  // One product per type: the best match wins ("other" has no type to compare).
  const chosen: Evaluated[] = [];
  const byKind = new Map<ProductKind, Evaluated[]>();
  for (const e of matches) {
    if (e.item.kind === "other") chosen.push(e);
    else byKind.set(e.item.kind, [...(byKind.get(e.item.kind) ?? []), e]);
  }
  for (const group of byKind.values()) {
    const sorted = [...group].sort((a, b) => b.score - a.score);
    chosen.push(sorted[0]);
    for (const rest of sorted.slice(1)) {
      leaveOut.push({
        item: rest.item,
        why: `Good match too, but ${sorted[0].item.name} is the better pick for this type: fewer points to check, more that fit your scan and fewer ingredients that commonly irritate.`,
      });
    }
  }

  // One new active at a time: the first product with an active goes in now, the rest later.
  chosen.sort((a, b) => b.score - a.score);
  let activeTaken = false;
  for (const e of chosen) {
    const fit = e.check.fits.length > 0 ? ` ${e.check.fits[0]}` : "";
    if (e.hasActive && activeTaken) {
      later.push({
        item: e.item,
        why: "Good match, but it has an active ingredient. Add one new active at a time, after about 2 weeks if your skin is comfortable.",
      });
    } else {
      if (e.hasActive) activeTaken = true;
      buyNow.push({ item: e.item, why: `Good match.${fit} We can't see amounts or how you use it.` });
    }
  }

  if (buyNow.length === 0 && later.length === 0) notes.push("None of these products is a clear match right now. Nothing is proposed for the basket.");
  if (waitFirst.length > 0) notes.push("Products marked Check first are not in the basket until you have asked your pharmacist or doctor.");
  return { buyNow, later, waitFirst, leaveOut, notes };
}
