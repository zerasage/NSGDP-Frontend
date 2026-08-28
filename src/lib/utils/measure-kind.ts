/**
 * Client measure-kind helper (mirrors backend measure-kind.ts).
 */

export type MeasureKind =
  | "cases"
  | "completeness"
  | "coverage"
  | "positivity"
  | "stock"
  | "population";

export const MEASURE_KIND_MODES: Array<{ value: MeasureKind; label: string }> = [
  { value: "cases", label: "Cases" },
  { value: "completeness", label: "Reporting rate" },
  { value: "coverage", label: "Coverage" },
  { value: "positivity", label: "Positivity" },
  { value: "stock", label: "Stock" },
  { value: "population", label: "Population" },
];

export function resolveMeasureKind(params: {
  name?: string | null;
  category?: string | null;
  unit?: string | null;
}): MeasureKind {
  const cat = params.category?.toLowerCase()?.trim();
  if (
    cat === "completeness" ||
    cat === "coverage" ||
    cat === "positivity" ||
    cat === "stock" ||
    cat === "population"
  ) {
    return cat;
  }

  const name = params.name ?? "";
  if (
    /\breporting\s+rate\b|\btimeliness\b|\breports?\s+on\s+time\b|\bactual\s+reports\b|\bexpected\s+reports\b/i.test(
      name,
    )
  ) {
    return "completeness";
  }
  if (/\bpositivity\b|\bpositive\s+rate\b|\bprevalence\s+rate\b/i.test(name)) {
    return "positivity";
  }
  if (
    /\bcatchment\s+area\s+population\b|\btarget\s+population\b|\bestimated\s+population\b/i.test(
      name,
    )
  ) {
    return "population";
  }
  if (
    /\bcoverage\b|^%\s*of\b|\bpercentage\s+of\b|\/\s*ANC\s*1\b/i.test(name) &&
    !/\breporting\b/i.test(name)
  ) {
    return "coverage";
  }
  if (
    /\b(antenatal|anc|visits?|attendance)\b[\w\s/%.-]{0,40}\brate\b/i.test(name)
  ) {
    return "coverage";
  }
  if (
    /\bstock\s*-?\s*out\b|\bstock\s+on\s+hand\b|\bdoses?\b|\baverage\s+monthly\s+consumption\b|\bAMC\b(?!\s*attendance)/i.test(
      name,
    ) ||
    (/\butilization\b/i.test(name) &&
      !/\b(actual|expected)\s+reports\b/i.test(name))
  ) {
    return "stock";
  }

  const unit = params.unit?.toLowerCase() ?? "";
  if (
    unit.includes("%") ||
    unit.includes("rate") ||
    unit.includes("proportion")
  ) {
    return "completeness";
  }

  return "cases";
}

export function measureKindTotalLabel(
  kind: MeasureKind,
  unit: string | null | undefined,
): string {
  if (kind === "cases") return `Total ${unit ?? "cases"}`;
  if (kind === "stock") return `Total ${unit ?? "units"}`;
  if (kind === "population") return `Total ${unit ?? "persons"}`;
  return `Average ${unit ?? "%"}`;
}

export function measureKindChartNoun(kind: MeasureKind): string {
  switch (kind) {
    case "completeness":
      return "reporting rate";
    case "coverage":
      return "coverage";
    case "positivity":
      return "positivity";
    case "stock":
      return "stock";
    case "population":
      return "population";
    default:
      return "cases";
  }
}
