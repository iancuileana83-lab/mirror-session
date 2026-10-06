// The product being checked: its ingredient list, kept in this browser only.

export type Product = {
  ingredients: string[];
  source: "photo" | "sample" | "typed";
};

const KEY = "cc:product:v1";

export function loadProduct(): Product | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Product) : null;
  } catch {
    return null;
  }
}

export function saveProduct(p: Product) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore quota errors
  }
}
