# ClosureLoop UI Reference & Component Architecture Guide

> **MANDATORY POLICY**: This document defines the permanent UI/UX architecture and component reference rules for all modules in ClosureLoop. No new UI module, page, or component shall be designed from scratch when an established pattern exists in the approved references.

---

## 1. Approved Reference Repositories

| Reference | Repository URL | Primary Focus Areas | License | Inspection Status |
| :--- | :--- | :--- | :--- | :--- |
| **shadcn-admin** | [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin) | Enterprise admin layouts, collapsible sidebar, data tables, filter toolbars, dialogs | **MIT** | Inspected |
| **shadcndashboard** | [shadcndashboard/shadcndashboard](https://github.com/shadcndashboard/shadcndashboard) | Data-dense dashboards, card composition, reusable metrics widgets | **MIT** | Inspected |
| **Next Shadcn Dashboard Starter** | [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) | Application shell, navigation structure, breadcrumbs, responsive layouts | **MIT** | Inspected |
| **Dashboard-Design** | [sjorsbogers/Dashboard-Design](https://github.com/sjorsbogers/Dashboard-Design) | Information hierarchy, visual organization, metric cards, status indicators | Community Open-Source | Inspected (Repository and topic index) |
| **shadcn-dashboard-landing-template** | [shadcnstore/shadcn-dashboard-landing-template](https://github.com/shadcnstore/shadcn-dashboard-landing-template) | Spacing systems, typography scales, card layouts, clean button styles | **MIT** | Inspected |
| **shadcn/ui (Official)** | [ui.shadcn.com](https://ui.shadcn.com/) | Primitive component design patterns (Dialog, Sheet, Popover, Badge, Tabs) | **MIT** | Inspected |
| **React Flow (Official)** | [reactflow.dev](https://reactflow.dev/) | Graph canvas, custom nodes, edge routing, minimap, controls, interactive inspection | **MIT** | Inspected |
| **FalkorDB Documentation** | [docs.falkordb.com](https://docs.falkordb.com/) | Graph schema conventions, Cypher query patterns, property graph modeling | **Official Docs** | Inspected |

---

## 2. Component & Layout Reuse Patterns

### A. Application Shell & Navigation (from `shadcn-admin` & `next-shadcn-dashboard-starter`)
- **Collapsible Sidebar**: A compact, responsive sidebar with grouped navigation items (Operations, Intelligence, System), badge indicators for active counts, and tooltip labels when collapsed.
- **Header Bar**: Global search input, live system connectivity badge (`FalkorDB Connected` vs `Demo Mode`), user avatar, and keyboard shortcut indicators (`⌘I`, `⌘B`).
- **Main Viewport**: High-density page container with clean breadcrumb header, contextual actions, and responsive grid layouts.

### B. Cards & Page Structure (from `shadcnstore/shadcn-dashboard-landing-template` & `shadcndashboard`)
- **Containers**: White background (`bg-white`), subtle neutral borders (`border-slate-200/80`), subtle elevation (`shadow-xs`), and rounded corners (`rounded-xl`).
- **Typography Scale**:
  - Page Titles: `text-2xl font-extrabold text-slate-900 tracking-tight`
  - Section Headers: `text-xs font-bold text-slate-900 uppercase tracking-tight`
  - Body Text: `text-xs text-slate-600` or `text-sm text-slate-700`
  - Technical / Code / Metrics: `font-mono text-[11px] text-slate-700`
- **Metric Cards**: Clear metric value, historical comparison or target delta, status pill (`text-emerald-700 bg-emerald-50` for complete, `text-amber-800 bg-amber-50` for bottlenecked).

### C. Graph Canvas & Node Topology (from `React Flow` & `FalkorDB`)
- **Custom Nodes**: Distinct visual representations for domain entities (`Workflow`, `Task`, `Employee`, `Approval`, `Application`, `Access`, `Person`, `BusinessOutcome`).
  - Left accent border or colored icon badge corresponding to entity type.
  - Distinct state borders (Emerald for `COMPLETED`, Amber for `PENDING`/`BLOCKED`, Slate for `IDLE`).
  - Subtitle displaying source system (e.g., `Workday REST`, `Okta API`, `Jira Service Management`).
- **Edges & Traversal**: Explicit relationship labels (`REQUIRES_SECURITY_SIGNOFF`, `TRIGGERS_PROVISIONING`, `TARGETS_OUTCOME`) with animated directional strokes on bottleneck paths.
- **Side Panel Drawer**: Slide-over or docked panel showing node properties, incoming/outgoing edges, evidence records, and executable Cypher snippet.

---

## 3. Strict Anti-Pattern Rules (What NOT to do)

1. **NO Generic AI Dashboard Aesthetics**:
   - Do NOT use rainbow gradient backgrounds, purple neon glows, or glowing dropshadows.
   - Do NOT use arbitrarily rounded cards (`rounded-3xl` or pill containers) that waste horizontal space.
   - Do NOT add decorative spinning widgets or fake animated telemetry that does not represent real data.
2. **NO Redundant UI Invention**:
   - Do NOT build a new button, badge, modal, or table style if one already exists in the ClosureLoop component library.
   - Maintain consistency across all 7 modules.
3. **NO Fabricated Graph Results**:
   - Clearly distinguish real database-backed responses from demo fixtures.
   - Always display connection health status and diagnostic errors when the graph database is unreachable.

---

## 4. Procedure for Implementing New Modules

Before writing code for any new module or page:
1. **Identify the Need**: Determine the required layouts (e.g., table, canvas, split-pane, master-detail).
2. **Check Reference Repositories**: Consult the approved references above for an existing implementation of that pattern.
3. **Adapt to ClosureLoop Stack**: Adapt the component to TypeScript, React, and Tailwind CSS, preserving ClosureLoop's slate/blue palette and typography tokens.
4. **Wire to Service Boundary**: Connect the component to a dedicated backend or service layer; never embed hardcoded database queries or credentials inside UI components.
5. **Verify Empty, Loading, and Error States**: Ensure every component gracefully handles offline database states, query failures, and empty datasets.

---

## 5. Module 5 Action Center Provenance & Review Patterns

- **Approval Queue Table**: Modeled after `satnaing/shadcn-admin` tasks and approval tables with urgency pill indicators, status filters, and action triggers.
- **Review Drawer & Action Panel**: Modeled after `shadcndashboard/shadcndashboard` review panels and `ui.shadcn.com` Sheet components.
- **Audit Timeline**: Modeled after `sjorsbogers/Dashboard-Design` chronological audit event stream.
- **Decision Modals**: Modeled after `satnaing/shadcn-admin` confirmation dialogs with role authorization inputs and transition notes.
- Complete component lineage is permanently documented in [UI_PROVENANCE_AUDIT.md](file:///c:/Users/KIIT/OneDrive/Desktop/HACKATHON/ClosureLoop/UI_PROVENANCE_AUDIT.md).

---

## 6. Module 6 Verification & Memory Provenance & Design Patterns

- **Master-Detail Verification Split-Pane**: Modeled after `shadcndashboard/shadcndashboard` telemetry widgets and `satnaing/shadcn-admin` layouts. Left pane lists workflows with completion progress rings; right pane exposes the verification cockpit.
- **Outcome Criteria Checklist**: Dense table and cards evaluating observed telemetry against expected conditions. Modeled after `satnaing/shadcn-admin` task checklists with status pills (`PASSED`, `FAILED`, `INCONCLUSIVE`, `UNAVAILABLE`) and mandatory indicators.
- **Chronological Audit History**: Full event ledger documenting investigation, action proposals, human decisions, dispatch executions, and verification checks. Modeled after `sjorsbogers/Dashboard-Design`.
- **Enterprise Graph Memory Grid**: Card grid displaying historical incident patterns, OpenCypher traversal signatures, resolutions, and key learnings. Modeled after `shadcn-dashboard-landing-template` card layouts.
- **Scenario Runner & Evidence Inspector**: Modal dialogs for testing acceptance cases (Cases 1–5) and inspecting raw evidence payloads. Modeled after `ui.shadcn.com` and `satnaing/shadcn-admin` dialog primitives.

---

## 7. Module 7 Settings & Integrations Provenance & Design Patterns

- **Settings Tabs & Layout**: Modeled after `satnaing/shadcn-admin` settings tabs with clean section dividing borders, breadcrumb headers, and sticky action toolbars.
- **FalkorDB Engine Telemetry Panel**: Modeled after `shadcndashboard/shadcndashboard` telemetry widgets and `Dashboard-Design` server metrics. Real-time ping testing without exposing database credentials.
- **Integration Connector Grid**: Modeled after `satnaing/shadcn-admin` integration cards with category pills, required configuration tokens, and distinct status badges (`CONNECTED`, `DEMO_ADAPTER`, `UNAVAILABLE`).
- **Demo Mode & Master Reset**: Modeled after `satnaing/shadcn-admin` danger zone and confirmation dialog patterns.
