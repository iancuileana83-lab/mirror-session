// Common, mostly plain cosmetic ingredients. They carry no rule of their own; they only tell the
// check how much of a list it recognises, so it can say "we couldn't match these ingredients"
// instead of a misleading "Good match". Draft for the author to extend.

const NAMES = [
  "aqua", "water", "eau", "glycerin", "glycerol", "butylene glycol", "pentylene glycol", "propanediol",
  "1,2-hexanediol", "caprylyl glycol", "ethylhexylglycerin", "cetyl alcohol", "cetearyl alcohol",
  "stearyl alcohol", "behenyl alcohol", "cetyl palmitate", "stearic acid", "palmitic acid", "oleic acid",
  "glyceryl stearate", "glyceryl stearate se", "glyceryl caprylate", "glyceryl oleate", "sorbitan olivate",
  "tocopherol", "tocopheryl acetate", "sodium hydroxide", "potassium hydroxide", "citric acid",
  "sodium citrate", "xanthan gum", "carbomer", "acrylates/c10-30 alkyl acrylate crosspolymer",
  "hydroxyethylcellulose", "cellulose gum", "sodium benzoate", "potassium sorbate", "sorbic acid",
  "benzoic acid", "dehydroacetic acid", "sodium chloride", "magnesium sulfate", "disodium edta",
  "tetrasodium edta", "trisodium ethylenediamine disuccinate", "panthenol", "allantoin", "bisabolol",
  "sodium hyaluronate", "hyaluronic acid", "ceramide np", "ceramide ap", "ceramide eop", "phytosphingosine",
  "cholesterol", "squalane", "squalene", "caprylic/capric triglyceride", "isopropyl myristate",
  "isopropyl palmitate", "dicaprylyl carbonate", "coco-caprylate", "c12-15 alkyl benzoate",
  "petrolatum", "paraffinum liquidum", "mineral oil", "paraffin", "microcrystalline wax", "cera alba",
  "beeswax", "cera microcristallina", "ozokerite", "urea", "betaine", "trehalose", "sodium pca",
  "sodium lactate", "arginine", "lysine", "tromethamine", "triethanolamine", "aminomethyl propanol",
  "zinc oxide", "titanium dioxide", "zinc pca", "mica", "talc", "silica", "kaolin", "bentonite",
  "boron nitride", "iron oxides", "polyethylene", "nylon-12", "magnesium stearate", "zinc stearate",
  "simmondsia chinensis seed oil", "olea europaea fruit oil", "helianthus annuus seed oil",
  "carthamus tinctorius seed oil", "cocos nucifera oil", "ricinus communis seed oil",
  "vitis vinifera seed oil", "rosa canina fruit oil", "squalene", "polyglyceryl-3 polyricinoleate",
  "polyhydroxystearic acid", "lecithin", "phospholipids", "ascorbyl glucoside", "sodium phytate",
  "phytic acid", "chlorphenesin", "potassium cetyl phosphate", "sodium stearoyl glutamate",
  "decyl glucoside", "coco-glucoside", "lauryl glucoside", "cocamidopropyl betaine", "sodium cocoyl isethionate",
  "disodium cocoamphodiacetate", "sodium cocoyl glutamate", "sodium lauroyl sarcosinate",
];

const PATTERNS: RegExp[] = [
  /^ci \d{5}/, // colour index pigments
  /^peg-\d+/,
  /^ppg-\d+/,
  /^polysorbate \d+/,
  /^polyglyceryl-\d+/,
  /^glyceryl /,
  /^caprylic/,
  /^hydrogenated /,
  /^hydrolyzed /,
  /^acrylates/,
  /^polyacrylate/,
  /crosspolymer$/,
  /copolymer$/,
  /^sodium .*(glutamate|isethionate|sarcosinate|pca|lactate|citrate|phosphate|gluconate)$/,
  /^cellulose/,
  /gum$/,
  /^c\d+-\d+ /,
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s*\([^)]*\)/g, "") // drop "(Water)", "(Shea)" etc.
    .replace(/\s+/g, " ")
    .trim();

const SET = new Set(NAMES);

export function isCommonIngredient(ingredient: string): boolean {
  const n = norm(ingredient);
  return SET.has(n) || PATTERNS.some((p) => p.test(n));
}
