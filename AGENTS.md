# ClosureLoop Agent Instructions & Engineering Rules

## 1. Project Overview & Mission
ClosureLoop is an AI-powered enterprise workflow intelligence platform designed for graph-based dependency resolution, bottleneck investigation, and workflow completion.

Key architecture principles:
- **Graph-Centric Intelligence**: The system reasons about business outcomes using a property graph (FalkorDB / OpenCypher). Intermediate task completion does NOT imply workflow completion.
- **Strict Service Boundary**: All database queries and credentials live exclusively in the backend (`server/`). The browser client communicates only via REST APIs (`/api/graph`, `/api/investigations`, `/api/health`).
- **Data Authenticity**: Never fabricate graph query results or simulate fake AI reasoning. Clearly distinguish real graph-backed results from demo adapter fallbacks.

---

## 2. Mandatory UI Reference Policy (Permanent Rule)

All future module development and component implementation must strictly consult and adapt from the approved reference repositories documented in [UI_REFERENCE_GUIDE.md](file:///c:/Users/KIIT/OneDrive/Desktop/HACKATHON/ClosureLoop/UI_REFERENCE_GUIDE.md):

1. **shadcn-admin** (`satnaing/shadcn-admin`, MIT) — Admin shells, data tables, filter toolbars, dialogs.
2. **shadcndashboard** (`shadcndashboard/shadcndashboard`, MIT) — Card composition, metric widgets.
3. **Next Shadcn Dashboard Starter** (`Kiranism/next-shadcn-dashboard-starter`, MIT) — Navigation, responsive layouts.
4. **Dashboard-Design** (`sjorsbogers/Dashboard-Design`) — Visual hierarchy, metric states.
5. **shadcn-dashboard-landing-template** (`shadcnstore/shadcn-dashboard-landing-template`, MIT) — Spacing, typography tokens.
6. **shadcn/ui** (`ui.shadcn.com`, MIT) & **React Flow** (`reactflow.dev`, MIT).

### Development Procedure for Every New Feature:
1. **Never invent UI from scratch** if an established pattern exists in the approved references.
2. Inspect the reference implementation and adapt its clean layout, typography, and spacing into ClosureLoop's design system.
3. Avoid generic AI aesthetics (no neon glow, no rainbow gradients, no oversized bubbly cards, no placeholder graphs without real data).
4. Preserve the established application shell, sidebar, top navigation, and color tokens.

---

## 3. Technology Stack & Directory Structure

```
ClosureLoop/
├── server/                        # Backend API & FalkorDB Client Layer
│   ├── falkorClient.ts            # Secure FalkorDB connection manager & Cypher query runner
│   ├── graphRepository.ts         # Graph schema, seed fixtures, and Cypher query methods
│   └── apiRouter.ts               # Express/Connect router for /api/health, /api/graph, /api/cypher
├── src/
│   ├── components/
│   │   ├── dashboard/             # Module 1: Executive Dashboard & Canvas Hero
│   │   ├── workflows/             # Module 2: Workflow Registry & Filters
│   │   ├── investigations/        # Module 3: Dependency Investigation & Evidence Vault
│   │   ├── explorer/              # Module 4: Graph Explorer (React Flow Canvas & Inspector)
│   │   └── layout/                # Sidebar, Header, Breadcrumbs, Modals
│   ├── services/                  # Frontend API Client & Graph Services
│   ├── types/                     # TypeScript definitions (graph, investigation, workflow)
│   └── data/                      # Demo adapters and fallback datasets
└── UI_REFERENCE_GUIDE.md          # Permanent UI reference rules and approved patterns
```

---

## 4. Graph Modeling Standards (FalkorDB / OpenCypher)

Nodes must map to concrete enterprise entities:
- `:Workflow` (e.g., `id`, `title`, `department`, `status`, `targetOutcome`)
- `:BusinessOutcome` (e.g., `id`, `name`, `verificationMetric`, `status`)
- `:Task` (e.g., `id`, `name`, `system`, `status`, `completedAt`)
- `:Approval` (e.g., `id`, `ticketId`, `system`, `status`, `slaBreached`)
- `:Person` (e.g., `id`, `name`, `email`, `role`, `department`)
- `:Application` (e.g., `id`, `name`, `tier`, `environment`)
- `:Access` (e.g., `id`, `roleName`, `granted`)

Key relationship types:
- `(w:Workflow)-[:TARGETS_OUTCOME]->(o:BusinessOutcome)`
- `(w:Workflow)-[:HAS_STAGE]->(t:Task)`
- `(t:Task)-[:REQUIRES_ACCESS]->(a:Access)`
- `(a:Access)-[:REQUIRES_SECURITY_SIGNOFF]->(app:Approval)`
- `(app:Approval)-[:ASSIGNED_TO]->(p:Person)`
- `(app:Approval)-[:CONTROLS_ACCESS_TO]->(appSys:Application)`

---

## 5. Build & Lint Validation Requirements

Before completing any task:
1. Run `npm run lint` (`oxlint`) — Must pass with 0 warnings and 0 errors.
2. Run `npm run build` (`tsc -b && vite build`) — Must pass with 0 TypeScript/bundling errors.
3. Ensure all backend endpoints handle connection loss gracefully with clear error messages.
