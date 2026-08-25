# Niger State GeoHealth Portal - Project Documentation

This directory contains project-wide documentation including requirements, proposals, and planning documents.

## 📚 Documentation Index

### UI design
- **[PORTAL_UI_DESIGN_GUIDE.md](./PORTAL_UI_DESIGN_GUIDE.md)** — Public portal visual system (metrics, panels, tabs, tables, **home landing**); references: `/analytics`, `/`

### Current Documentation (v1.1)
Located in `newdocs/`:

- **[Master_Build_Plan_v1.1.md](./newdocs/Master_Build_Plan_v1.1.md)** - Complete build plan covering M1-M4 milestones
- **[Niger_State_GeoHealth_Portal_PRD_v2.0.md](./newdocs/Niger_State_GeoHealth_Portal_PRD_v2.0.md)** - Product Requirements Document v2.0
- **[PROJECT_STRUCTURE_v1.1.md](./newdocs/PROJECT_STRUCTURE_v1.1.md)** - Project organization and folder structure
- **[NSPHCDA_Project_Workplan.csv](./newdocs/NSPHCDA_Project_Workplan%20-%20Project%20Workplan.csv)** - Detailed project workplan and timeline

### Project Proposals & Reports
- **Copy of Zerasage_FACT_Proposal_FINAL_v2_ZTL-FACT-2026-001.docx** - Original project proposal
- **FACT [Final] Inception Report.docx** - Project inception report
- **Niger_State_Data_Portal_PRD_v1.0.docx** - Original PRD (superseded by v2.0)
- **Terms of Reference (ToR).docx** - Technology partner terms of reference

## 🎯 Project Overview

**Niger State GeoHealth Data Portal** is a comprehensive platform for health and geospatial data management, supporting the Niger State Primary Health Care Development Agency (NSPHCDA).

### Milestones
- **M1**: Foundation & Core Setup (Backend) - ✅ Complete
- **M2**: MVP Backend Features - ✅ Complete (18/18 gaps closed)
- **M3**: Frontend Development & Advanced Features - 🔄 In Progress
- **M4**: Launch Preparation & Refinement

## 📁 Repository Structure

```
NSGDP/
├── nsgdp-backend/          # NestJS backend API
│   └── docs/               # Backend-specific documentation
├── NSGDP-Frontend/         # React frontend (coming in M3)
│   └── docs/               # Project-wide documentation (this folder)
└── README.md
```

## 🔗 Related Documentation

### Backend Documentation
All backend-specific docs are now in: `../nsgdp-backend/docs/`
- API Specification
- Backend Architecture
- Deployment Guide
- Sprint Plans & Gap Reports

### Frontend Documentation
Frontend-specific documentation will be added in M3 when frontend development begins.

## 📝 Documentation Versioning

- **v1.0**: Initial project documentation
- **v1.1**: Updated after M1 completion with refined architecture
- **v2.0**: PRD updated with stakeholder feedback and scope refinement

## 🚀 Getting Started

1. Review [Master Build Plan](./newdocs/Master_Build_Plan_v1.1.md) for overall project scope
2. Check [PRD v2.0](./newdocs/Niger_State_GeoHealth_Portal_PRD_v2.0.md) for detailed requirements
3. See [Project Structure](./newdocs/PROJECT_STRUCTURE_v1.1.md) for repository organization
4. Refer to `../nsgdp-backend/docs/` for backend implementation details
