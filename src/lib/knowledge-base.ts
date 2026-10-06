// DRAFT knowledge base for the pharmacist check. Written for review, nothing here is medical advice.
// Generic names only, no brands. Matching is by INCI name (the ingredient list on a label).
// Labels list ingredients in order of amount but not the percentage: the check can say an ingredient
// is present, never how much. Every group, medicine and rule below is for the pharmacist to review.

export type GroupId =
  | "fragrance"
  | "essential_oils"
  | "furocoumarin_oils"
  | "lanolin"
  | "isothiazolinones"
  | "formaldehyde_releasers"
  | "parabens"
  | "phenoxyethanol"
  | "drying_alcohol"
  | "sulfates"
  | "propylene_glycol"
  | "silicones"
  | "peanut"
  | "tree_nuts"
  | "wheat"
  | "soy"
  | "uv_filters_chemical"
  | "retinoids"
  | "aha"
  | "bha"
  | "vitamin_c"
  | "niacinamide"
  | "azelaic"
  | "benzoyl_peroxide";

export type Group = {
  id: GroupId;
  label: string;
  /** Plain description for the profile page and the rules page. */
  about: string;
  /** Lowercase INCI names or name fragments that put an ingredient in this group. */
  terms: string[];
  /** Match terms anywhere inside the ingredient name instead of as whole words. */
  substring?: boolean;
  /** Only match when the ingredient name also contains this word (e.g. "oil" for essential oils). */
  also?: string;
};

export const GROUPS: Record<GroupId, Group> = {
  fragrance: {
    id: "fragrance",
    label: "Fragrance",
    about: "Perfume mixes and the common fragrance allergens that must be listed in the EU.",
    terms: [
      "parfum", "fragrance", "aroma", "linalool", "limonene", "citronellol", "geraniol", "eugenol",
      "isoeugenol", "coumarin", "citral", "farnesol", "benzyl salicylate", "benzyl alcohol",
      "cinnamal", "cinnamyl alcohol", "hexyl cinnamal", "amyl cinnamal", "hydroxycitronellal",
      "alpha-isomethyl ionone", "butylphenyl methylpropional", "benzyl benzoate", "benzyl cinnamate",
    ],
  },
  essential_oils: {
    id: "essential_oils",
    label: "Essential oils",
    about: "Plant oils used for scent (lavender, tea tree, peppermint, citrus, rose, ylang ylang, clove and similar).",
    terms: [
      "lavandula", "melaleuca", "mentha", "eucalyptus", "citrus", "rosa damascena", "cananga",
      "pelargonium", "cymbopogon", "rosmarinus", "thymus", "origanum", "cinnamomum",
      "eugenia caryophyllus", "juniperus", "pinus", "boswellia", "santalum", "jasminum",
      "salvia sclarea", "ocimum", "illicium", "cedrus",
    ],
    substring: true,
    also: "oil",
  },
  furocoumarin_oils: {
    id: "furocoumarin_oils",
    label: "Oils that can react with sunlight (bergamot, lime, bitter orange, angelica)",
    about: "Some citrus and herb oils contain compounds that can cause skin reactions in sunlight.",
    terms: ["citrus aurantium bergamia", "bergamot", "citrus aurantifolia", "lime", "citrus aurantium amara", "bitter orange", "angelica"],
    substring: true,
    also: "oil",
  },
  lanolin: {
    id: "lanolin",
    label: "Lanolin (wool wax)",
    about: "A wool-derived fat; a known contact allergen for some people.",
    terms: ["lanolin", "adeps lanae", "wool wax", "wool fat", "lanolin alcohol", "lanolin oil", "hydrogenated lanolin"],
    substring: true,
  },
  isothiazolinones: {
    id: "isothiazolinones",
    label: "Isothiazolinone preservatives",
    about: "Preservatives (such as methylisothiazolinone) that are common causes of contact allergy.",
    terms: ["methylisothiazolinone", "methylchloroisothiazolinone", "benzisothiazolinone", "octylisothiazolinone"],
  },
  formaldehyde_releasers: {
    id: "formaldehyde_releasers",
    label: "Formaldehyde-releasing preservatives",
    about: "Preservatives that slowly release small amounts of formaldehyde; allergen for some people.",
    terms: [
      "dmdm hydantoin", "imidazolidinyl urea", "diazolidinyl urea", "quaternium-15",
      "2-bromo-2-nitropropane-1,3-diol", "bronopol", "sodium hydroxymethylglycinate",
    ],
  },
  parabens: {
    id: "parabens",
    label: "Parabens",
    about: "A family of preservatives (methylparaben, propylparaben and others).",
    terms: ["methylparaben", "ethylparaben", "propylparaben", "butylparaben", "isobutylparaben", "isopropylparaben"],
  },
  phenoxyethanol: {
    id: "phenoxyethanol",
    label: "Phenoxyethanol",
    about: "A widely used preservative; some people react to it.",
    terms: ["phenoxyethanol"],
  },
  drying_alcohol: {
    id: "drying_alcohol",
    label: "Drying alcohols",
    about: "Ethanol-type alcohols that can dry or sting the skin (not fatty alcohols such as cetyl alcohol).",
    terms: ["alcohol denat", "alcohol", "sd alcohol", "ethanol", "isopropyl alcohol", "denatured alcohol"],
  },
  sulfates: {
    id: "sulfates",
    label: "Sulfate cleansers",
    about: "Strong foaming cleansers (sodium lauryl sulfate and similar) that can dry or irritate.",
    terms: ["sodium lauryl sulfate", "sodium laureth sulfate", "ammonium lauryl sulfate", "ammonium laureth sulfate", "sodium coco-sulfate"],
  },
  propylene_glycol: {
    id: "propylene_glycol",
    label: "Propylene glycol",
    about: "A common moisturising solvent; some people react to it.",
    terms: ["propylene glycol"],
  },
  silicones: {
    id: "silicones",
    label: "Silicones",
    about: "Smoothing ingredients (dimethicone, siloxanes). Not an allergy for most people; some prefer to avoid them.",
    terms: ["dimethicone", "dimethiconol", "cyclomethicone", "trimethicone", "siloxane", "silicone"],
    substring: true,
  },
  peanut: {
    id: "peanut",
    label: "Peanut",
    about: "Peanut oil and peanut-derived ingredients.",
    terms: ["arachis hypogaea", "peanut"],
    substring: true,
  },
  tree_nuts: {
    id: "tree_nuts",
    label: "Tree nuts",
    about: "Almond, hazelnut, walnut, macadamia and similar nut oils and extracts.",
    terms: ["prunus amygdalus", "almond", "corylus avellana", "hazelnut", "juglans regia", "walnut", "macadamia", "pistacia vera", "pistachio"],
    substring: true,
  },
  wheat: {
    id: "wheat",
    label: "Wheat / gluten",
    about: "Wheat-derived ingredients (wheat germ oil, hydrolysed wheat protein).",
    terms: ["triticum", "wheat", "hordeum", "barley", "secale", "rye", "avena sativa"],
    substring: true,
  },
  soy: {
    id: "soy",
    label: "Soy",
    about: "Soy-derived oils and extracts.",
    terms: ["glycine soja", "soybean"],
    substring: true,
  },
  uv_filters_chemical: {
    id: "uv_filters_chemical",
    label: "Chemical UV filters",
    about: "Organic sunscreen filters (oxybenzone, octinoxate, avobenzone, octocrylene, homosalate).",
    terms: [
      "benzophenone-3", "oxybenzone", "ethylhexyl methoxycinnamate", "octinoxate",
      "butyl methoxydibenzoylmethane", "avobenzone", "octocrylene", "homosalate", "ethylhexyl salicylate",
    ],
  },
  retinoids: {
    id: "retinoids",
    label: "Retinoids (vitamin A)",
    about: "Retinol, retinal, retinyl esters and prescription retinoids.",
    terms: [
      "retinol", "retinal", "retinaldehyde", "retinyl palmitate", "retinyl acetate", "retinyl retinoate",
      "hydroxypinacolone retinoate", "tretinoin", "adapalene", "tazarotene", "isotretinoin",
    ],
    substring: true,
  },
  aha: {
    id: "aha",
    label: "Exfoliating acids (AHA)",
    about: "Glycolic, lactic, mandelic and malic acid.",
    terms: ["glycolic acid", "lactic acid", "mandelic acid", "malic acid", "tartaric acid"],
  },
  bha: {
    id: "bha",
    label: "Salicylic acid (BHA)",
    about: "Salicylic acid (not its esters used as UV filters or fragrance).",
    terms: ["salicylic acid"],
  },
  vitamin_c: {
    id: "vitamin_c",
    label: "Vitamin C",
    about: "Ascorbic acid and its derivatives.",
    terms: [
      "ascorbic acid", "l-ascorbic acid", "sodium ascorbyl phosphate", "magnesium ascorbyl phosphate",
      "ascorbyl glucoside", "ascorbyl palmitate", "tetrahexyldecyl ascorbate",
    ],
  },
  niacinamide: {
    id: "niacinamide",
    label: "Niacinamide",
    about: "Vitamin B3.",
    terms: ["niacinamide"],
  },
  azelaic: {
    id: "azelaic",
    label: "Azelaic acid",
    about: "Azelaic acid and its derivatives.",
    terms: ["azelaic acid", "potassium azeloyl diglycinate"],
  },
  benzoyl_peroxide: {
    id: "benzoyl_peroxide",
    label: "Benzoyl peroxide",
    about: "An acne ingredient that can dry, irritate and bleach fabric.",
    terms: ["benzoyl peroxide"],
  },
};

/** Exfoliating acids as one family for medicine and pregnancy rules. */
export const STRONG_EXFOLIANTS: GroupId[] = ["aha", "bha"];

// ---------- Profile choices ----------

/** Groups the user can mark as "avoid" (allergy or intolerance). */
export const AVOID_CHOICES: GroupId[] = [
  "fragrance", "essential_oils", "lanolin", "isothiazolinones", "formaldehyde_releasers", "parabens",
  "phenoxyethanol", "drying_alcohol", "sulfates", "propylene_glycol", "silicones", "peanut",
  "tree_nuts", "wheat", "soy", "uv_filters_chemical",
];

// ---------- Medicines ----------

export type EffectTag = "photosensitising" | "drying_fragile" | "retinoid_overlap" | "irritation_stacking" | "thin_skin";

export type Level = "ask" | "skip";

export type Flag = { group: GroupId | "strong_exfoliants"; level: Level; why: string };

export type Effect = {
  label: string;
  summary: string;
  /** Daily sunscreen reminder. */
  spf: boolean;
  flags: Flag[];
};

export const EFFECTS: Record<EffectTag, Effect> = {
  photosensitising: {
    label: "Makes skin more sensitive to sunlight",
    summary: "This kind of medicine can make skin burn or react more easily in the sun.",
    spf: true,
    flags: [
      { group: "retinoids", level: "ask", why: "retinoids also raise sun sensitivity" },
      { group: "strong_exfoliants", level: "ask", why: "exfoliating acids also raise sun sensitivity" },
      { group: "furocoumarin_oils", level: "skip", why: "these oils can react with sunlight" },
    ],
  },
  drying_fragile: {
    label: "Makes skin very dry and fragile",
    summary: "This kind of medicine dries and thins the skin, and makes it easier to irritate.",
    spf: true,
    flags: [
      { group: "strong_exfoliants", level: "skip", why: "skin is already fragile" },
      { group: "retinoids", level: "skip", why: "it adds vitamin A on top of the medicine" },
      { group: "benzoyl_peroxide", level: "skip", why: "it dries and irritates" },
      { group: "drying_alcohol", level: "ask", why: "it can dry and sting" },
      { group: "fragrance", level: "ask", why: "fragile skin reacts more easily" },
    ],
  },
  retinoid_overlap: {
    label: "Already a retinoid on the skin",
    summary: "A second retinoid or an exfoliating acid on top can irritate the skin.",
    spf: true,
    flags: [
      { group: "retinoids", level: "skip", why: "you already use one" },
      { group: "strong_exfoliants", level: "skip", why: "it stacks irritation" },
      { group: "benzoyl_peroxide", level: "ask", why: "it can stack irritation" },
    ],
  },
  irritation_stacking: {
    label: "Can irritate the skin",
    summary: "Adding other strong actives can stack irritation.",
    spf: false,
    flags: [
      { group: "strong_exfoliants", level: "ask", why: "it can stack irritation" },
      { group: "retinoids", level: "ask", why: "it can stack irritation" },
    ],
  },
  thin_skin: {
    label: "Can thin the skin where it is used",
    summary: "Used on the face, this kind of medicine can thin the skin, which then tolerates strong actives less.",
    spf: false,
    flags: [
      { group: "retinoids", level: "ask", why: "thinner skin tolerates it less" },
      { group: "strong_exfoliants", level: "ask", why: "thinner skin tolerates it less" },
    ],
  },
};

export type Medicine = { id: string; label: string; note: string; tags: EffectTag[] };

/** Generic names only. */
export const MEDICINES: Medicine[] = [
  { id: "doxycycline", label: "Doxycycline", note: "antibiotic (tablets)", tags: ["photosensitising"] },
  { id: "tetracyclines", label: "Other tetracyclines (minocycline, lymecycline, tetracycline)", note: "antibiotics", tags: ["photosensitising"] },
  { id: "fluoroquinolones", label: "Fluoroquinolones (ciprofloxacin, levofloxacin)", note: "antibiotics", tags: ["photosensitising"] },
  { id: "isotretinoin", label: "Isotretinoin (tablets)", note: "prescription acne treatment", tags: ["drying_fragile", "photosensitising"] },
  { id: "topical_retinoid", label: "Prescription retinoid cream or gel (tretinoin, adapalene, tazarotene)", note: "applied to the skin", tags: ["retinoid_overlap", "photosensitising"] },
  { id: "benzoyl_peroxide_med", label: "Benzoyl peroxide (acne treatment)", note: "applied to the skin", tags: ["irritation_stacking"] },
  { id: "hydrochlorothiazide", label: "Hydrochlorothiazide", note: "water tablet for blood pressure", tags: ["photosensitising"] },
  { id: "amiodarone", label: "Amiodarone", note: "heart rhythm medicine", tags: ["photosensitising"] },
  { id: "methotrexate", label: "Methotrexate", note: "tablets or injection", tags: ["photosensitising"] },
  { id: "ketoprofen_topical", label: "Ketoprofen gel (painkiller gel)", note: "applied to the skin", tags: ["photosensitising"] },
  { id: "st_johns_wort", label: "St John's wort (herbal)", note: "supplement", tags: ["photosensitising"] },
  { id: "topical_steroid_face", label: "Steroid cream used on the face", note: "applied to the skin", tags: ["thin_skin"] },
];

// ---------- Pregnancy and breastfeeding ----------

export const PREGNANCY_FLAGS: Flag[] = [
  { group: "retinoids", level: "skip", why: "retinoids are left out in pregnancy and breastfeeding" },
  { group: "bha", level: "skip", why: "salicylic acid is left out in pregnancy and breastfeeding" },
  { group: "essential_oils", level: "ask", why: "essential oils: check with your doctor or pharmacist" },
  { group: "benzoyl_peroxide", level: "ask", why: "check with your doctor or pharmacist" },
];

/** Kept on purpose (reviewed): azelaic acid, vitamin C and niacinamide stay, with this note. */
export const PREGNANCY_OK_NOTE =
  "Azelaic acid, vitamin C and niacinamide are not flagged. Please still check with your doctor or pharmacist.";

// ---------- Matching ----------

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function matchesTerm(name: string, term: string, substring: boolean): boolean {
  if (substring) return name.includes(term);
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`).test(name);
}

export function groupsOf(ingredient: string): GroupId[] {
  const name = norm(ingredient);
  const out: GroupId[] = [];
  for (const g of Object.values(GROUPS)) {
    if (g.also && !name.includes(g.also)) continue;
    if (g.terms.some((t) => matchesTerm(name, t, Boolean(g.substring)))) out.push(g.id);
  }
  // "salicylic acid" must not match esters like "benzyl salicylate"; terms are whole words so it does not.
  // Fatty alcohols (cetyl, cetearyl, stearyl alcohol) are not drying alcohols.
  if (out.includes("drying_alcohol") && /(cetyl|cetearyl|stearyl|behenyl|myristyl|lauryl|benzyl|phenethyl) alcohol|alcohol (benzoate)/.test(name)) {
    return out.filter((g) => g !== "drying_alcohol");
  }
  return out;
}

export type IngredientHit = { ingredient: string; groups: GroupId[] };

/** Ingredients that belong to at least one group, in label order. Others are simply not flagged. */
export function classify(ingredients: string[]): IngredientHit[] {
  return ingredients
    .map((ingredient) => ({ ingredient, groups: groupsOf(ingredient) }))
    .filter((h) => h.groups.length > 0);
}

/** Split a pasted INCI list into ingredient names (commas, middots, newlines; not commas inside brackets). */
export function splitInci(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of text.replace(/\n/g, ",").replace(/[·•]/g, ",")) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  parts.push(cur);
  return parts.map((p) => p.trim().replace(/^[.:;\s]+|[.:;\s]+$/g, "")).filter(Boolean);
}
