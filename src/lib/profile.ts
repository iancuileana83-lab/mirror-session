// The user's profile: stored only in this browser (localStorage), never sent to a server.

import type { GroupId } from "./knowledge-base";

/** What the person says they already use. Only these (and a confirmed basket) count for routine clashes. */
export type UsingId = "retinol" | "acid" | "vitamin_c" | "azelaic" | "benzoyl_peroxide" | "prescription_cream";

export const USING_CHOICES: Array<{ id: UsingId; label: string }> = [
  { id: "retinol", label: "Retinol or another retinoid" },
  { id: "acid", label: "An exfoliating acid (AHA or BHA, such as glycolic, lactic or salicylic acid)" },
  { id: "vitamin_c", label: "Vitamin C" },
  { id: "azelaic", label: "Azelaic acid" },
  { id: "benzoyl_peroxide", label: "Benzoyl peroxide" },
  { id: "prescription_cream", label: "A prescription cream or gel for the skin" },
];

export type Profile = {
  pregnantOrBreastfeeding: boolean;
  sensitiveSkin: boolean;
  /** Groups to avoid (allergy or intolerance). */
  avoid: GroupId[];
  /** Own ingredient words to avoid, matched inside ingredient names. */
  customAvoid: string[];
  /** Ids from MEDICINES. */
  medicines: string[];
  /** What the person already uses on the skin (empty = none). */
  using: UsingId[];
  /** User-reported warning signs: any of these pauses actives. */
  painfulLesions: boolean;
  changingMole: boolean;
  noImprovement: boolean;
};

export const EMPTY_PROFILE: Profile = {
  pregnantOrBreastfeeding: false,
  sensitiveSkin: false,
  avoid: [],
  customAvoid: [],
  medicines: [],
  using: [],
  painfulLesions: false,
  changingMole: false,
  noImprovement: false,
};

/** Fictional profile for the judge sample mode (not a real person). */
export const SAMPLE_PROFILE: Profile = {
  ...EMPTY_PROFILE,
  sensitiveSkin: true,
  avoid: ["fragrance", "nuts", "silicones"],
  medicines: ["tetracyclines"],
  using: ["benzoyl_peroxide"],
};

const KEY = "cc:profile:v1";

export function loadProfile(): Profile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) } : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveProfile(p: Profile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore quota errors
  }
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
