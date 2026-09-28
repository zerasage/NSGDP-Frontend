import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import { QA_DIMENSIONS } from "@/lib/constants/qa-checklist";
import type { TemplateAsset } from "./types";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Array<Array<string | number>>): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

function lgaTemplate(): string {
  const rows: Array<Array<string | number>> = [
    ["lga", "indicator", "year", "period", "value", "notes"],
  ];
  for (const lga of NIGER_STATE_LGAS) {
    rows.push([lga, "confirmed_malaria_cases", 2025, "2025-Q1", "", ""]);
  }
  return toCsv(rows);
}

function facilityTemplate(): string {
  return toCsv([
    ["lga", "ward", "facility_name", "facility_code", "year", "month", "indicator", "value"],
    ["Chanchaga", "Minna Central", "Example PHC", "NG/NI/000001", 2025, 1, "confirmed_malaria_cases", 42],
    ["Chanchaga", "Minna Central", "Example PHC", "NG/NI/000001", 2025, 2, "confirmed_malaria_cases", 37],
    ["Bida", "Bida North", "Example Health Post", "NG/NI/000214", 2025, 1, "confirmed_malaria_cases", 18],
  ]);
}

function dictionaryTemplate(): string {
  return toCsv([
    ["column_name", "description", "data_type", "allowed_values", "example"],
    ["lga", "Official LGA name", "text", "One of the 25 Niger State LGAs", "Chanchaga"],
    ["year", "Calendar year of the record", "integer", "2015–2030", 2025],
    ["indicator", "Name of the health measure", "text", "Use consistent snake_case names", "confirmed_malaria_cases"],
    ["value", "Reported value", "number", "Non-negative; blank if not reported", 42],
  ]);
}

function metadataWorksheet(): string {
  return toCsv([
    ["field", "what_reviewers_look_for", "example", "your_answer"],
    ["Title", "Specific, searchable; subject + geography + year", "Niger State Malaria Burden by LGA, 2025", ""],
    ["Description", "What it contains, period, source, intended use (20+ characters)", "Quarterly confirmed malaria cases…", ""],
    ["Category", "The health domain that best fits", "Disease Data", ""],
    ["Tags", "At least one; mix topic, method and cadence", "malaria, dhis2, quarterly", ""],
    ["LGA coverage", "Only the LGAs actually covered", "All 25 LGAs", ""],
    ["Reporting period", "Must match dates inside the file", "2025-01-01 to 2025-12-31", ""],
    ["Disease / health indicators", "Precise measure names", "Confirmed cases; Deaths", ""],
    ["Data licence", "Terms of reuse", "CC-BY-4.0", ""],
    ["Methodology", "How the data was collected", "Facility-based routine reporting via DHIS2", ""],
    ["Known limitations", "Gaps and caveats", "Reporting delays from rural facilities", ""],
    ["Responsible department", "Unit that manages the dataset", "Disease Surveillance Unit", ""],
    ["Contact person and email", "A real person who can answer questions", "Jane Doe, jane.doe@example.org", ""],
    ["Update frequency", "A cadence you can keep", "Monthly", ""],
    ["Visibility", "Public, Restricted, or Private", "Public", ""],
  ]);
}

function qaChecklist(): string {
  const lines = ["NSPHCDA Data Portal — Pre-submission QA checklist", ""];
  for (const dim of QA_DIMENSIONS) {
    lines.push(`${dim.label.toUpperCase()}`);
    lines.push(dim.description);
    for (const item of dim.guidanceItems) lines.push(`  [ ] ${item}`);
    lines.push("");
  }
  return lines.join("\n");
}

const GENERATORS: Record<string, () => string> = {
  "tpl-lga": lgaTemplate,
  "tpl-facility": facilityTemplate,
  "tpl-dictionary": dictionaryTemplate,
  "tpl-metadata": metadataWorksheet,
  "tpl-qa": qaChecklist,
};

export function downloadTemplate(asset: TemplateAsset) {
  const generate = GENERATORS[asset.id];
  if (!generate) return;
  const content = generate();
  const type = asset.format === "CSV" ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8";
  // BOM keeps Excel from mangling UTF-8 in CSV files.
  const blob = new Blob([asset.format === "CSV" ? "﻿" : "", content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = asset.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
