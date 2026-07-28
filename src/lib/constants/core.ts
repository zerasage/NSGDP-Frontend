// The 25 Local Government Areas of Niger State (PRD: LGA Coverage filter).
export const NIGER_STATE_LGAS = [
  "Agaie",
  "Agwara",
  "Bida",
  "Borgu",
  "Bosso",
  "Chanchaga",
  "Edati",
  "Gbako",
  "Gurara",
  "Katcha",
  "Kontagora",
  "Lapai",
  "Lavun",
  "Magama",
  "Mariga",
  "Mashegu",
  "Mokwa",
  "Munya",
  "Paikoro",
  "Rafi",
  "Rijau",
  "Shiroro",
  "Suleja",
  "Tafa",
  "Wushishi",
] as const;

// Filter option values match the backend `DatasetFormat` enum exactly
// (lowercase) — labels are the friendly display text.
export const FILE_FORMAT_OPTIONS = [
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel" },
  { value: "json", label: "JSON" },
  { value: "geojson", label: "GeoJSON" },
  { value: "shapefile", label: "Shapefile" },
  { value: "geopackage", label: "GeoPackage" },
  { value: "kml", label: "KML" },
  { value: "pdf", label: "PDF" },
  { value: "other", label: "Other" },
];

// Formats the "Data Preview" card has no case for — the preview generator
// returns a table + map-ready GeoJSON for these (see datasets.service.ts),
// which the "Spatial Preview" card renders fully on its own. Showing the
// generic Data Preview card too would just be an empty box.
export const SPATIAL_ONLY_PREVIEW_FORMATS = ["geopackage", "shapefile", "kml"];

// Sectors used for organisation filtering (PUB-04).
export const SECTORS = [
  "Health",
  "Agriculture",
  "Education",
  "Finance",
  "Infrastructure",
  "Environment",
  "Other",
] as const;
