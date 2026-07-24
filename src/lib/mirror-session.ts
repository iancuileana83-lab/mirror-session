// Client-side session storage for the Mirror Session flow.
// Photos are read as data URLs so they survive route changes.

export type MirrorFace = { dataUrl: string };
export type MirrorSkin = {
  hydration: string;
  texture: string;
  focus: string;
  tip: string;
};
export type MirrorOutfit =
  | { kind: "photo"; dataUrl: string }
  | { kind: "preset"; id: string; label: string };

export type MirrorTryOn = { imageUrl: string };

const KEYS = {
  face: "ms:face",
  skin: "ms:skin",
  outfit: "ms:outfit",
  tryon: "ms:tryon",
} as const;

function isBrowser() {
  return typeof window !== "undefined";
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function save<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

function load<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const saveFace = (v: MirrorFace) => save(KEYS.face, v);
export const loadFace = () => load<MirrorFace>(KEYS.face);
export const clearFace = () => isBrowser() && sessionStorage.removeItem(KEYS.face);

export const saveSkin = (v: MirrorSkin) => save(KEYS.skin, v);
export const loadSkin = () => load<MirrorSkin>(KEYS.skin);

export const saveOutfit = (v: MirrorOutfit) => save(KEYS.outfit, v);
export const loadOutfit = () => load<MirrorOutfit>(KEYS.outfit);
export const clearOutfit = () => isBrowser() && sessionStorage.removeItem(KEYS.outfit);

export const saveTryOn = (v: MirrorTryOn) => save(KEYS.tryon, v);
export const loadTryOn = () => load<MirrorTryOn>(KEYS.tryon);
export const clearTryOn = () => isBrowser() && sessionStorage.removeItem(KEYS.tryon);
