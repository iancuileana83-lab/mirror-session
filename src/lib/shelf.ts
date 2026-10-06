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

export const MAX_SHELF = 3;

export type Basket = {
  /** ISO date the user confirmed it. */
  confirmedOn: string;
  buyNow: Array<{ name: string; kind: ProductKind; why: string }>;
  later: Array<{ name: string; kind: ProductKind; why: string }>;
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

/** Three fictional products for the judge sample mode. No real brands. */
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
    id: "sample-pebble",
    name: "Pebble Moisturiser",
    kind: "moisturiser",
    ingredients: [
      "Aqua", "Glycerin", "Cetearyl Alcohol", "Sodium Hyaluronate", "Panthenol", "Niacinamide",
      "Squalane", "Caprylic/Capric Triglyceride", "Tocopherol", "Citric Acid", "Xanthan Gum",
      "Ethylhexylglycerin", "Caprylyl Glycol",
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
];
