/** Shared filter option lists for the Data Portal advanced filter bar */

export const DISEASE_FILTER_OPTIONS = [
  "Malaria",
  "Meningitis",
  "Cholera",
  "Diphtheria",
  "HIV/AIDS",
  "TB",
  "Measles",
  "Polio",
  "Maternal Health",
  "NTD",
].map((v) => ({ value: v, label: v }));

export const WARD_FILTER_OPTIONS = [
  "Tunga",
  "Minna Central",
  "Kpakungu",
  "Shango",
  "Limawa",
  "Bida Central",
  "Lapai Central",
  "Suleja Central",
].map((v) => ({ value: v, label: v }));

export const YEAR_FILTER_OPTIONS = Array.from({ length: 8 }, (_, i) => {
  const y = 2019 + i;
  return { value: String(y), label: String(y) };
});

export const DEFAULT_PORTAL_FILTERS: Record<string, string[]> = {
  categories: [],
  organisations: [],
  lgas: [],
  formats: [],
  diseases: [],
  wards: [],
  years: [],
};
