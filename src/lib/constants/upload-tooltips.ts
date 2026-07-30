export const UPLOAD_FIELD_TOOLTIPS = {
  // Identification
  /** @deprecated use datasetName */
  title:
    "A clear, descriptive title that helps users find your dataset in search results.",
  datasetName:
    "A clear, descriptive title that helps users find your dataset in search results. E.g. 'Niger State Malaria Burden by LGA, 2024'.",
  organisation:
    "The agency or organisation that owns or produced this dataset. Use your official organisation name.",
  responsibleDept:
    "The specific directorate, department, or unit responsible for managing this dataset. E.g. 'DPRS', 'Surveillance Unit'.",
  contactPerson:
    "The name (and optionally phone/email) of the person who can answer questions about this dataset.",

  // Coverage
  geographicCoverage:
    "Describe the area this dataset covers. E.g. 'All 25 LGAs, Niger State' or 'Minna, Bosso, and Paikoro LGAs'.",
  reportingPeriod:
    "The calendar period this data represents. E.g. 'January – December 2024' or 'Q4 2024'.",

  // Technical
  category:
    "Select the health domain that best describes this dataset.",
  dataFormat:
    "The file format you are uploading. CSV and Excel are most common; GeoJSON/Shapefile for spatial data.",
  updateFrequency:
    "How often you plan to update this dataset. Choose 'One-time' if it is a static historical snapshot.",

  // Governance
  dataLicense:
    "The license under which this data can be used. 'CC BY 4.0' allows open reuse with attribution. 'Restricted Use' means internal/partner access only.",
  methodology:
    "How the data was collected or produced. E.g. 'Facility-based routine reporting via DHIS2' or 'Household survey, random sampling'.",
  limitations:
    "Known gaps, caveats, or quality issues. E.g. 'Reporting delays from rural facilities' or 'Excludes private-sector facilities'.",
  diseaseIndicators:
    "The specific indicators this dataset measures. E.g. 'Confirmed cases', 'Deaths', 'ANC 4th visit attendance'.",

  // Description
  description:
    "Explain what the dataset contains, its methodology, time period, data source, and intended use cases. Minimum 20 characters.",
  tags:
    "Comma-separated keywords that improve discoverability. E.g. 'malaria, LGA, quarterly, DHIS2, 2024'.",

  // Legacy
  lgas: "Select all Local Government Areas covered by this dataset. Choose multiple if applicable.",
  visibility:
    "Public datasets are open to all. Restricted requires approval. Private is visible only to your organisation.",
  files: "Supported formats include CSV, XLSX, JSON, GeoJSON, Shapefile, and PDF documentation.",
} as const;
