// Plain-language description of each YouCam skin concern.
// YouCam scores run 1-100 and HIGHER IS BETTER for every concern (per the API docs),
// so a low score means more visible signs of that concern.
// This is a cosmetic reading of a photo, not a diagnosis. Texts are for the author's review.

export type ConcernId =
  | "moisture"
  | "oiliness"
  | "texture"
  | "pore"
  | "redness"
  | "acne"
  | "dark_circle"
  | "age_spot"
  | "wrinkle"
  | "radiance"
  | "firmness"
  | "eye_bag";

export type Concern = {
  id: ConcernId;
  label: string;
  /** What the camera looks at, in plain words. */
  meaning: string;
  /** What this result does NOT tell you. */
  notMeaning: string;
};

export const CONCERNS: Concern[] = [
  {
    id: "moisture",
    label: "Hydration",
    meaning: "How much water the skin surface seems to hold.",
    notMeaning: "It is not a measure of how much water you drink.",
  },
  {
    id: "oiliness",
    label: "Oil balance",
    meaning: "How shiny the skin looks, mostly on the forehead, nose and chin.",
    notMeaning: "Shine changes with light, sweat and time of day.",
  },
  {
    id: "texture",
    label: "Smoothness",
    meaning: "How even the skin surface looks.",
    notMeaning: "Uneven texture can have many harmless causes.",
  },
  {
    id: "pore",
    label: "Pores",
    meaning: "How visible the pores are.",
    notMeaning: "Pore size is mostly genetic and cannot be shrunk for good.",
  },
  {
    id: "redness",
    label: "Redness",
    meaning: "How much redness the camera sees on the face.",
    notMeaning:
      "It cannot say why the skin is red. Strong or lasting redness should be checked by a professional.",
  },
  {
    id: "acne",
    label: "Blemishes",
    meaning: "Spots and bumps the camera can see.",
    notMeaning: "It does not grade acne or tell you how to treat it.",
  },
  {
    id: "dark_circle",
    label: "Under-eye darkness",
    meaning: "How dark the area under the eyes looks.",
    notMeaning: "Tiredness, genetics and shadows from the light all play a part.",
  },
  {
    id: "age_spot",
    label: "Dark spots",
    meaning: "Flat, darker patches on the skin.",
    notMeaning:
      "It cannot tell a harmless spot from a worrying one. A spot that changes should be seen by a professional.",
  },
  {
    id: "wrinkle",
    label: "Fine lines",
    meaning: "Lines and wrinkles the camera can see.",
    notMeaning: "Lines are a normal part of skin and expression.",
  },
  {
    id: "radiance",
    label: "Radiance",
    meaning: "How bright and fresh the skin looks.",
    notMeaning: "It varies a lot with sleep, light and season.",
  },
  {
    id: "firmness",
    label: "Firmness",
    meaning: "How firm the face contour looks.",
    notMeaning: "It is an estimate from a photo, not a measurement of the skin.",
  },
  {
    id: "eye_bag",
    label: "Under-eye puffiness",
    meaning: "How puffy the area under the eyes looks.",
    notMeaning: "Puffiness often changes during the day.",
  },
];

/** The YouCam action names to request, e.g. "hd_moisture". */
export const HD_ACTIONS = CONCERNS.map((c) => `hd_${c.id}`);

export type Band = "good" | "some" | "attention";

export function bandOf(score: number): Band {
  if (score >= 70) return "good";
  if (score >= 45) return "some";
  return "attention";
}

export const BAND_LABEL: Record<Band, string> = {
  good: "Looks good",
  some: "Some visible signs",
  attention: "Most visible",
};

export type Scores = Partial<Record<ConcernId, number>>;

/** Concerns sorted from most visible (lowest score) to least. */
export function rankConcerns(scores: Scores): Array<{ concern: Concern; score: number }> {
  return CONCERNS.flatMap((concern) => {
    const score = scores[concern.id];
    return typeof score === "number" ? [{ concern, score }] : [];
  }).sort((a, b) => a.score - b.score);
}
