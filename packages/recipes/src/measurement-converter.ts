// Pure client-side imperial <-> metric conversion for recipe display. No
// network calls, no AI — deterministic math, run at render time so the
// underlying stored data stays in whatever unit the recipe was generated in.

type Category = "weight" | "volume" | "temperature" | "length";
type System = "imperial" | "metric";

interface UnitDef {
  system: System;
  category: Category;
  /** Canonical short abbreviation shown to the user. */
  abbr: string;
  /** Canonical key of this unit's counterpart in the other system. */
  partner: string;
  /** Convert a value in this unit to the partner unit. */
  toPartner: (value: number) => number;
}

// Fixed unit pairs using the standard rounded "kitchen conversion chart"
// factors (28.35 g/oz, 240 mL/cup, etc.) rather than scientifically precise
// ones (28.3495, 236.588...) — confirmed against the prompt's own worked
// example: 10 oz -> 283.5g (10 * 28.35) -> rounds to 284g, matching exactly.
// The precise factors would give 283.495g -> 283g, one gram off. Also kept
// deliberately not magnitude-based (mL always pairs with fl oz, never
// tsp/tbsp/cup) to keep the converter simple, predictable, and testable.
const CONVERSIONS: Record<string, UnitDef> = {
  oz: { system: "imperial", category: "weight", abbr: "oz", partner: "g", toPartner: (v) => v * 28.35 },
  lb: { system: "imperial", category: "weight", abbr: "lb", partner: "kg", toPartner: (v) => v * 0.4536 },
  g: { system: "metric", category: "weight", abbr: "g", partner: "oz", toPartner: (v) => v / 28.35 },
  kg: { system: "metric", category: "weight", abbr: "kg", partner: "lb", toPartner: (v) => v / 0.4536 },

  tsp: { system: "imperial", category: "volume", abbr: "tsp", partner: "mL", toPartner: (v) => v * 5 },
  tbsp: { system: "imperial", category: "volume", abbr: "tbsp", partner: "mL", toPartner: (v) => v * 15 },
  cup: { system: "imperial", category: "volume", abbr: "cup", partner: "mL", toPartner: (v) => v * 240 },
  flOz: { system: "imperial", category: "volume", abbr: "fl oz", partner: "mL", toPartner: (v) => v * 30 },
  pt: { system: "imperial", category: "volume", abbr: "pt", partner: "mL", toPartner: (v) => v * 480 },
  qt: { system: "imperial", category: "volume", abbr: "qt", partner: "L", toPartner: (v) => v * 0.96 },
  gal: { system: "imperial", category: "volume", abbr: "gal", partner: "L", toPartner: (v) => v * 3.84 },
  mL: { system: "metric", category: "volume", abbr: "mL", partner: "flOz", toPartner: (v) => v / 30 },
  L: { system: "metric", category: "volume", abbr: "L", partner: "qt", toPartner: (v) => v / 0.96 },

  // Inches <-> cm is an exact conversion (2.54 is the literal definition), no
  // "kitchen chart" rounding involved.
  in: { system: "imperial", category: "length", abbr: "in", partner: "cm", toPartner: (v) => v * 2.54 },
  cm: { system: "metric", category: "length", abbr: "cm", partner: "in", toPartner: (v) => v / 2.54 },

  F: { system: "imperial", category: "temperature", abbr: "F", partner: "C", toPartner: (v) => ((v - 32) * 5) / 9 },
  C: { system: "metric", category: "temperature", abbr: "C", partner: "F", toPartner: (v) => (v * 9) / 5 + 32 },
};

// Metric units render with no space before the abbreviation ("284g", "93°C");
// imperial units render with a space ("10 oz", "200°F") — matches the
// prompt's own examples.
const NO_SPACE_UNITS = new Set(["g", "kg", "mL", "L", "cm", "F", "C"]);
const DEGREE_UNITS = new Set(["F", "C"]);

const UNIT_ALIASES: Record<string, string> = {
  oz: "oz", ounce: "oz", ounces: "oz",
  lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
  g: "g", gram: "g", grams: "g",
  kg: "kg", kilogram: "kg", kilograms: "kg",
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
  tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
  cup: "cup", cups: "cup",
  "fl oz": "flOz", floz: "flOz", "fluid ounce": "flOz", "fluid ounces": "flOz",
  pt: "pt", pint: "pt", pints: "pt",
  qt: "qt", quart: "qt", quarts: "qt",
  gal: "gal", gallon: "gal", gallons: "gal",
  ml: "mL", milliliter: "mL", milliliters: "mL", millilitre: "mL", millilitres: "mL",
  l: "L", liter: "L", liters: "L", litre: "L", litres: "L",
  in: "in", inch: "in", inches: "in",
  cm: "cm", centimeter: "cm", centimeters: "cm", centimetre: "cm", centimetres: "cm",
  f: "F", "°f": "F", fahrenheit: "F",
  c: "C", "°c": "C", celsius: "C",
};

function normalizeUnit(unit: string): string | undefined {
  return UNIT_ALIASES[unit.trim().toLowerCase()];
}

// >= 1 whole unit: round to the nearest integer on both sides. < 1 (e.g.
// 0.5, 0.25): rounding is completely disabled — show the exact value,
// capped at 3 decimal places purely to avoid floating-point noise
// (0.1 * 3 = 0.30000000000000004), not to round the *quantity* itself.
function formatNumber(value: number, shouldRound: boolean): string {
  if (shouldRound) {
    return String(Math.round(value));
  }
  return String(Number(value.toFixed(3)));
}

function formatValue(value: number, unitKey: string, shouldRound: boolean): string {
  const def = CONVERSIONS[unitKey];
  const abbr = def?.abbr ?? unitKey;
  const numStr = formatNumber(value, shouldRound);
  if (DEGREE_UNITS.has(unitKey)) {
    return `${numStr}°${abbr}`;
  }
  return NO_SPACE_UNITS.has(unitKey) ? `${numStr}${abbr}` : `${numStr} ${abbr}`;
}

/**
 * Formats a single ingredient quantity as "[Imperial (Metric)]", e.g.
 * "10 oz (284g)". Falls back to the plain "quantity unit" string for
 * count-based units with no defined conversion (e.g. "whole", "clove").
 */
export function formatDualMeasurement(quantity: number, unit: string): string {
  const key = normalizeUnit(unit);
  const def = key ? CONVERSIONS[key] : undefined;

  if (!key || !def) {
    return `${formatNumber(quantity, Math.abs(quantity) >= 1)} ${unit}`;
  }

  const shouldRound = Math.abs(quantity) >= 1;
  const partnerValue = def.toPartner(quantity);

  const imperialKey = def.system === "imperial" ? key : def.partner;
  const imperialValue = def.system === "imperial" ? quantity : partnerValue;
  const metricKey = def.system === "metric" ? key : def.partner;
  const metricValue = def.system === "metric" ? quantity : partnerValue;

  const imperialStr = formatValue(imperialValue, imperialKey, shouldRound);
  const metricStr = formatValue(metricValue, metricKey, shouldRound);

  return `${imperialStr} (${metricStr})`;
}

// Narrowly scoped to temperature and length/utensil-size mentions in
// freeform text (cooking directions) — not attempting to detect weight or
// volume mentioned in prose, since those are ingredient-shaped measurements
// already covered by the structured ingredients list, and prose-parsing
// those would be far more prone to false matches.
const TEXT_MEASUREMENT_PATTERN =
  /(\d+(?:\.\d+)?)\s*°?\s*(fahrenheit|celsius|F|C|inch(?:es)?|centimeters?|centimetres?|cm)\b/g;

const TEXT_UNIT_ALIASES: Record<string, string> = {
  fahrenheit: "F",
  f: "F",
  celsius: "C",
  c: "C",
  inch: "in",
  inches: "in",
  centimeter: "cm",
  centimeters: "cm",
  centimetre: "cm",
  centimetres: "cm",
  cm: "cm",
};

/**
 * Scans freeform text (e.g. a recipe direction step) for temperature and
 * utensil-size mentions and inlines the dual-format conversion right where
 * they appear, e.g. "Preheat oven to 350°F" -> "Preheat oven to 350°F (177°C)".
 */
export function annotateMeasurementsInText(text: string): string {
  return text.replace(TEXT_MEASUREMENT_PATTERN, (match, numStr: string, unitRaw: string) => {
    const unitKey = TEXT_UNIT_ALIASES[unitRaw.toLowerCase()];
    if (!unitKey) return match;
    const value = parseFloat(numStr);
    return formatDualMeasurement(value, unitKey);
  });
}
