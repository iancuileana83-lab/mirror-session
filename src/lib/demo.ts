// Fictional demo data for the judge sample mode. Not a real person.

import type { Scores } from "./skin-concerns";

/** A fictional first scan. */
export const DEMO_SCORES: Scores = {
  moisture: 55, oiliness: 60, texture: 62, pore: 50, redness: 48, acne: 70,
  dark_circle: 66, age_spot: 55, wrinkle: 72, radiance: 50, firmness: 74, eye_bag: 80,
};

/** A fictional re-scan five weeks later: some better, most unchanged, one a little worse. */
export const DEMO_LATER_SCORES: Scores = {
  moisture: 68, oiliness: 61, texture: 64, pore: 52, redness: 60, acne: 71,
  dark_circle: 66, age_spot: 57, wrinkle: 72, radiance: 63, firmness: 73, eye_bag: 69,
};
