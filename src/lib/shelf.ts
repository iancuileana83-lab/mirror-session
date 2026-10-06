// The products the user is comparing (up to 3) and the confirmed basket, kept in this browser only.

export type ProductKind = "cleanser" | "moisturiser" | "serum" | "sunscreen" | "lipstick" | "foundation" | "other";

export const KIND_LABEL: Record<ProductKind, string> = {
  cleanser: "Cleanser",
  moisturiser: "Moisturiser",
  serum: "Serum",
  sunscreen: "Sunscreen",
  lipstick: "Lipstick",
  foundation: "Foundation",
  other: "Other",
};

export type ShelfItem = {
  id: string;
  name: string;
  kind: ProductKind;
  ingredients: string[];
};

export const MAX_SHELF = 4;

export type Basket = {
  /** ISO date the user confirmed it. */
  confirmedOn: string;
  buyNow: Array<{ name: string; kind: ProductKind; why: string; tip: string }>;
  later: Array<{ name: string; kind: ProductKind; why: string; tip: string }>;
};

const SHELF_KEY = "cc:shelf:v1";
const BASKET_KEY = "cc:basket:v1";

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export const loadShelf = (): ShelfItem[] => read<ShelfItem[]>(SHELF_KEY) ?? [];
export const saveShelf = (items: ShelfItem[]) => write(SHELF_KEY, items.slice(0, MAX_SHELF));
export const loadBasket = (): Basket | null => read<Basket>(BASKET_KEY);
export const saveBasket = (b: Basket) => write(BASKET_KEY, b);
export const clearBasket = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(BASKET_KEY);
  } catch {
    // ignore
  }
};

export const newId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Four fictional products for the judge sample mode. No real brands. */
export const SAMPLE_SHELF: ShelfItem[] = [
  {
    id: "sample-meadow",
    name: "Meadow Day Cream",
    kind: "moisturiser",
    ingredients: [
      "Aqua", "Glycerin", "Cetearyl Alcohol", "Prunus Amygdalus Dulcis (Sweet Almond) Oil",
      "Butyrospermum Parkii (Shea) Butter", "Citrus Limon (Lemon) Peel Extract",
      "Lavandula Angustifolia (Lavender) Oil", "Dimethicone", "Niacinamide", "Phenoxyethanol",
      "Parfum", "Linalool", "Limonene", "Tocopherol", "Sodium Hydroxide",
    ],
  },
  {
    id: "sample-lantern",
    name: "Lantern Vitamin C Serum",
    kind: "serum",
    ingredients: [
      "Aqua", "Ascorbic Acid", "Glycerin", "Propanediol", "Sodium Hyaluronate", "Tocopherol",
      "Panthenol", "Ethylhexylglycerin", "Sodium Hydroxide", "Caprylyl Glycol",
    ],
  },
  {
    id: "sample-dune",
    name: "Dune Azelaic Cream",
    kind: "moisturiser",
    ingredients: [
      "Aqua", "Glycerin", "Azelaic Acid", "Cetearyl Alcohol", "Panthenol", "Sodium Hyaluronate",
      "Caprylic/Capric Triglyceride", "Tocopherol", "Xanthan Gum", "Sodium Hydroxide",
    ],
  },
  {
    id: "sample-harbor",
    name: "Harbor Glycolic Toner",
    kind: "other",
    ingredients: ["Aqua", "Glycolic Acid", "Glycerin", "Propanediol", "Panthenol", "Sodium Hydroxide", "Caprylyl Glycol"],
  },
];