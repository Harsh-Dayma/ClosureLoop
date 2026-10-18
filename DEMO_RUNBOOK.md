# ClosureLoop — Hackathon Demonstration Runbook

> **Executive Summary**: This runbook provides step-by-step instructions for judges, evaluators, and operators to run and verify ClosureLoop end-to-end. It covers how to start the app, optionally launch FalkorDB in Docker, investigate an incomplete workflow using graph intelligence, approve and execute an action, verify the business outcome with trustworthy evidence, and inspect the archived resolution in long-term enterprise memory.

---

## 1. Prerequisites & Environment

### System Requirements
- **Node.js**: v20+ or v24+ (Node v24.18.0 tested)
- **Package Manager**: npm v10+
- **Docker** (Optional, for live FalkorDB graph engine): Docker Desktop / Docker Engine

### Environment Variables (`.env`)
The repository includes a `.env` template. Sensitive credentials are never hardcoded or exposed to the browser.
```bash
# FalkorDB Configuration (Backend Layer Only)
FALKORDB_HOST=127.0.0.1
FALKORDB_PORT=6379
FALKORDB_PASSWORD=
FALKORDB_GRAPH=closureloop

# Application Server
PORT=5173
VITE_API_BASE_URL=
```

---

## 2. Starting the Application

### Option A: Standard Quickstart (With Structured Fixture Fallback)
If Docker is not running, ClosureLoop automatically engages its structured property graph fallback fixture. All graph traversal, Cypher exploration, investigation rooms, action centers, and verification checks remain 100% operational.
```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Run automated verification test suite
npm test

# 3. Start local development server
npm run dev
```
Open **[http://127.0.0.1:5173](http://127.0.0.1:5173)** in your browser.

### Option B: Launch Live FalkorDB Graph Engine (Optional)
To run live OpenCypher queries against a real FalkorDB container:
```bash
# Start FalkorDB container
docker run -d -p 6379:6379 -p 3000:3000 -v falkordb_data:/var/lib/falkordb/data --name falkordb falkordb/falkordb:edge

# Verify FalkorDB is listening
docker ps | grep falkordb
```
In the ClosureLoop UI, navigate to **Settings & Integrations** $\rightarrow$ click **"Test FalkorDB Connection"**. The status pill will immediately switch to **`ONLINE / CONNECTED`** with live ping telemetry.

---

## 3. End-to-End Demonstration Walkthrough

### Scenario Context: Jordan Hayes Employee Onboarding (`wf-001`)
- **Situation**: Staff Platform Engineer Jordan Hayes was hired 4 days ago. Workday HR record exists, Okta SSO account is active, and the manager orientation checklist is signed.
- **The Problem**: Jordan Hayes still cannot push code to `closureloop/core-services`.
- **Target Business Outcome**: Verified initial Day-1 code commit telemetry (`verified_commits >= 1`).

---

### Step 1: Discover Blocked Workflow on Main Dashboard (Module 1)
1. Open **Overview** in the sidebar.
2. Observe the **Needs Attention** workflow table.
3. Locate **"Employee Onboarding - Jordan Hayes"** (`wf-001`), marked **`BLOCKED`** with a critical alert: *"4.2 days stalled on production IAM sign-off"*.
4. Look at the **Dependency Graph Hero** showing the multi-hop dependency path from the employee to the target business outcome.
5. Click **"Investigate"** on the `wf-001` row.

---

### Step 2: Root Cause Dependency Investigation (Module 3)
1. You are now in the **Dependency Investigation** room for `wf-001` (`INV-2026-8812`).
2. Examine the **Root Cause Findings Ledger**:
   - `CONFIRMED`: Missing Tier-1 AWS IAM Security Sign-off on Jira ticket `SEC-TKT-9912`.
   - `CONFIRMED`: SLA breach: 102 hours elapsed vs 24-hour target threshold.
   - `CONFIRMED`: Bottleneck approver identified as **Sarah Lin (SecOps Lead)**.
3. Review the **6-Hop Dependency Stepper**:
   - `Jordan Hayes` $\rightarrow$ `Workday Profile (Done)` $\rightarrow$ `Okta Identity (Done)` $\rightarrow$ `Manager Checklist (Done)` $\rightarrow$ `SEC-TKT-9912 (Stalled)` $\rightarrow$ `AWS IAM Role (Blocked)`.
4. Click **"Review in Action Center"** (or click **Action Center** in the sidebar).

---

### Step 3: Graph Context Inspection in Graph Explorer (Module 4)
1. Navigate to **Graph Explorer** in the sidebar.
2. Select workflow **"Employee Onboarding - Jordan Hayes"** (`wf-001`).
3. Notice the interactive visual property graph showing custom enterprise nodes:
   - Green nodes: `Task` (Workday, Okta, Manager Checklist)
   - Red critical node: `Approval` (`sec-tkt-9912`, Sarah Lin)
   - Amber blocked node: `Access` (`acc-aws-iam`, CorePlatformDev)
   - Target Outcome: `BusinessOutcome` (`bo-001`, First Code Commit Telemetry)
4. Click on node `sec-tkt-9912` to open the inspector drawer showing the OpenCypher query and ticket metadata.

---

### Step 4: Review & Dispatch Action in Action Center (Module 5)
1. Navigate to **Action Center** in the sidebar.
2. In the Action Queue, find **`ACT-2026-0901`**: *"Priority Security Approval Escalation for Jordan Hayes"*.
3. Click **"Inspect & Review"** to open the slide-over Review Drawer:
   - **Overview Tab**: Shows blocker context, Sarah Lin assignment, and proposed resolution.
   - **Evidence Vault Tab**: Direct links to Jira ticket `SEC-TKT-9912` and FalkorDB graph edge.
   - **Integration Tab**: Displays target integration (*SecOps Emergency Notification Dispatcher*) and simulated JSON payload.
   - **Audit Trail Tab**: Shows immutable chronological history.
4. Click **"Approve Action"** $\rightarrow$ review notes $\rightarrow$ click **"Confirm Approval"**.
   - Notice status transitions to **`READY_FOR_EXECUTION`**.
5. Click **"Execute Action"** $\rightarrow$ watch the simulated 3-step dispatch sequence.
   - **Crucial Anti-Fabrication Rule**: Status transitions to **`AWAITING_VERIFICATION`**. ClosureLoop does **not** fake granting AWS access or claim onboarding is complete merely because a message was sent!
6. Click **"Open in Verification & Memory"**.

---

### Step 5: Cryptographic Outcome Verification (Module 6)
1. You are now in the **Verification Cockpit** for `wf-001`.
2. Inspect the **6 Outcome Verification Criteria**:
   - Workday HR Record: `PASSED`
   - Okta SSO Provisioned: `PASSED`
   - Manager Orientation Checklist: `PASSED`
   - Security Approval Sign-off: `PASSED` (Dispatched to Sarah Lin)
   - Production Core AWS IAM Role Binding: `FAILED` (Role binding not yet confirmed in AWS IAM)
   - First Verified Code Commit: `FAILED` (0 commits in GitHub audit webhook)
   - Overall Outcome Status: **`INCOMPLETE`** (50% complete).
3. **Interactive Scenario Testing**:
   - Click **"Test Scenarios"** in the upper right.
   - Select **"CASE 2: Approval Without Access"** $\rightarrow$ Click run.
     - *Demonstrates*: Sarah Lin approved the ticket, but AWS IAM hasn't provisioned access yet. Status correctly remains **`INCOMPLETE`**.
   - Select **"CASE 1: All Criteria Passed (Full Resolution)"** $\rightarrow$ Click run.
     - *Demonstrates*: Sarah Lin sign-off confirmed, AWS IAM role active, and signed git commit `sha256:7a82f09` received from GitHub Enterprise webhook.
     - Result: Status updates to **`VERIFIED_COMPLETE`** (100%), Action `ACT-2026-0901` marks completed, and the incident is automatically archived to Long-Term Enterprise Memory!

---

### Step 6: Enterprise Graph Memory & Knowledge Retention (Module 6)
1. In Module 6, click the **"Enterprise Graph Memory"** tab.
2. Observe the newly archived memory record:
   - `MEM-2026-0005`: *"Resolved Jordan Hayes Core Platform Onboarding Bottleneck"*.
   - Graph pattern signature traversed: `(Access:acc-aws-iam)-[:REQUIRES_SECURITY_SIGNOFF]->(Approval:sec-tkt-9912)`.
   - Key learnings captured to prevent future onboarding deadlocks.

---

### Step 7: System Settings & Integration Verification (Module 7)
1. Navigate to **Settings & Integrations** in the sidebar.
2. Check the **FalkorDB Engine** tab:
   - Click **"Test Connection"** to verify live backend ping.
3. Check the **Application Integrations** tab:
   - Review all 8 connectors and their live vs. demo adapter status.
4. Click **"Reset Demo Baseline"** to restore clean initial Day-1 state at any time.

---

## 4. Distinction Between Live Infrastructure & Demo Adapters

| System | Mode | Description |
| :--- | :--- | :--- |
| **FalkorDB Graph Engine** | **Live Client / Real Query** | Real TCP connection over port 6379 via `falkordb` SDK when container is active; structured fixture fallback when offline. |
| **Backend REST APIs** | **Live Node.js Server** | Real endpoints on `/api/health`, `/api/graph`, `/api/cypher`, `/api/actions`, `/api/verifications`, `/api/memory`, and `/api/settings`. |
| **State Machine & Storage** | **Live In-Memory Repository** | Enforces valid transitions, prevents duplicate executions, maintains immutable audit trails. |
| **Workday, Okta, Jira, AWS, GitHub, Slack, Stripe** | **Demo Adapters** | Transparently tagged with `DEMO_ADAPTER` badges. Simulates realistic payloads without requiring production API tokens. |

---

## 5. Automated Testing & Verification
Run the complete automated test suite anytime:
```bash
# Run unit & scenario acceptance tests (13/13 cases)
npm test

# Run linter (0 warnings, 0 errors required)
npm run lint

# Run typecheck & production build
npm run build
```

---

## 6. Known Limitations & Troubleshooting Recovery

### 1. FalkorDB Offline (ECONNREFUSED)
- **Observed Behavior**: The dashboard header displays `FalkorDB Graph Engine: Fallback Fixture`. Graph Explorer, investigations, and verification continue to function using the in-memory property graph.
- **Recovery**: If you want live OpenCypher execution, start Docker Desktop and run:
  ```bash
  docker run -d -p 6379:6379 -p 3000:3000 -v falkordb_data:/var/lib/falkordb/data --name falkordb falkordb/falkordb:edge
  ```
  Then in ClosureLoop, open **Settings & Integrations** and click **"Test Connection"**.

### 2. State Desynchronization or Demo Reset
- **Observed Behavior**: If an action was approved or scenario executed during rehearsal and you need to reset to pristine Day-1 state before presenting to judges:
- **Recovery**: Click **"Reset Demo Baseline"** under **Settings & Integrations** tab, or run:
  ```bash
  curl -X POST http://localhost:5173/api/settings/reset-all
  ```
  This immediately resets actions to `PENDING_REVIEW` and verification to `INCOMPLETE` (50%).

### 3. Quick Keyboard Shortcuts
- **`⌘K` / `Ctrl+K`**: Global Command Palette (search workflows, navigate any module, copy Cypher query).
- **`⌘I` / `Ctrl+I`**: Open Workflow Investigation Intake Modal.
- **`⌘B` / `Ctrl+B`**: Toggle collapsible navigation sidebar.

