<div align="center">

<img src="web/public/logo.png" alt="NEXUS Logo" width="130" style="border-radius: 12px; margin-bottom: 8px;" />

<img src="./high-resolution-color-logo.png" alt="NEXUS Logo" width="360" />

# 🛡️ NEXUS: Autonomous Supply-Chain Disruption & Procurement Recovery Engine

<p align="center"><strong><em>Autonomous Recovery. Zero-Trust Sourcing.</em></strong></p>

### *Autonomous Recovery. Zero-Trust Sourcing.*

[![Live Demo](https://img.shields.io/badge/Demo-nexus--hop.vercel.app-blue?style=for-the-badge&logo=vercel)](https://nexus-hop.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-90%2F90%20Passing-emerald?style=for-the-badge&logo=vitest)](https://github.com/VishalGhuge111/nexus-hackathon-2026)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-2D3748?style=for-the-badge&logo=prisma)](https://neon.tech)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

---

**NEXUS** is an autonomous multi-agent recovery system engineered to protect manufacturing assembly lines from critical component stockouts, unverified supplier delays, dishonest counterparty claims, and unauthorized procurement spending.

[Explore Live Demo](https://nexus-hop.vercel.app) · [View Architecture](#-system-architecture--fsm-pipeline) · [Test 7 Canonical Scenarios](#-the-7-canonical-disruption-scenarios) · [Quickstart Guide](#-quickstart-guide)

---

</div>

## 📌 Executive Summary

Modern industrial assembly lines (automotive, electronics, aerospace) operate under razor-thin inventory buffers. When sudden disruptions strike—such as carrier transit delays, factory capacity crashes, phantom warehouse stock, or supplier fraud—procurement engineers spend hours manually cross-referencing ERP ledgers, soliciting RFQ quotes via email, and computing delivery windows under severe cognitive stress.

**NEXUS automates this entire lifecycle in sub-30 seconds**:
1. **Detects** telemetry disruptions across shipments, consumption rates, and demand forecasts.
2. **Performs Zero-Trust Verification** by independently cross-referencing physical warehouse stock and live carrier GPS tracking.
3. **Synthesizes Multi-Supplier Recovery Plans** using dual-sourcing splits and lead-time slack optimization.
4. **Validates 100% Deterministically** across an 8-point physical and financial constraint engine (zero LLM math hallucination).
5. **Enforces Governance Boundaries** by auto-executing minor orders while generating concise decision briefs for human sign-off when capital exceeds ₹10,000.
6. **Dispatches Live Outbound Communications** via transactional email (Brevo) and records every action in an immutable cryptographic audit ledger.

---

## 🏗️ System Architecture & FSM Pipeline

NEXUS decouples unstructured AI reasoning from financial and physical arithmetic. The LLM is strictly constrained to RFQ document extraction and task decomposition, while all state transitions, inventory balances, and budget constraints are executed by a **deterministic Finite State Machine (FSM)**.

```mermaid
graph TD
    subgraph S1["1. Disruption Ingestion"]
        A["Factory Telemetry / Delayed PO Event"]
    end

    subgraph S2["2. Zero-Trust Verification"]
        B["Independent Warehouse Scan & Carrier GPS"]
    end

    subgraph S3["3. Recovery Synthesis"]
        C["Candidate Plan Formulation & Dual-Sourcing Split"]
    end

    subgraph S4["4. Deterministic 8-Point Gate"]
        D{"8-Point Constraint Engine"}
    end

    subgraph S5["5. Governance & Execution"]
        E["Policy Flag / Spend > ₹10,000"]
        F["Operator Decision Modal (One-Click Approval)"]
        G["Autonomous PO Dispatch & Audit Logged"]
    end

    A -->|"FSM: EARLY_RISK_CHECK"| B
    B -->|"Verified Shortage"| C
    C -->|"FSM: PLAN"| D
    D -->|"Coverage Deficit (e.g. 890 < 900)"| C
    D -->|"Valid (Cost > ₹10,000)"| E
    D -->|"Valid (Standard)"| G
    E --> F
    F -->|"Approved"| G
    G -->|"FSM: VERIFY_OUTCOME"| H["GOAL_ACHIEVED (Line Protected)"]

    style A fill:#eff6ff,stroke:#3b82f6,stroke-width:2px
    style B fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    style C fill:#faf5ff,stroke:#9333ea,stroke-width:2px
    style D fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style E fill:#fff1f2,stroke:#e11d48,stroke-width:2px
    style F fill:#fdf2f8,stroke:#db2777,stroke-width:2px
    style G fill:#ecfdf5,stroke:#059669,stroke-width:2px
    style H fill:#10b981,stroke:#047857,stroke-width:2px,color:#ffffff
```

---

## 🧪 The 7 Canonical Disruption Scenarios

NEXUS includes an interactive **Scenario Simulation Lab** (`/scenarios`) with test beds for every canonical scenario from the official problem statement:

| # | Scenario Name | Type | Key Constraint / Disruption Tested | System Autonomous Response |
|---|---|---|---|---|
| **1** | **In-Transit Shipment Delay (+24h)** | 🟢 *Positive* | Golden-path delivery buffer breach | Re-verifies stock, sources fast alternative (Veloce), routes to human review due to spend, and recovers SLA. |
| **2** | **Stale ERP vs. Warehouse Discrepancy** | 🟢 *Positive* | ERP shows 800 units, physical scan shows 390 units | Zero-trust telemetry re-read detects 410-unit phantom stock deficit and sizes recovery to real ground truth. |
| **3** | **Adversarial Supplier Contradiction** | 🔴 *Negative* | Vendor claims "dispatched" but carrier has no scan | Cross-references carrier tracking, flags supplier for deception, and blacklists vendor from the recovery plan. |
| **4** | **Substandard Quality Gate** | 🔴 *Negative* | Uncertified vendor offers cheap pricing (Budget Cheap-Cast) | Rejects vendor failing ISO-9001 certifications & quality threshold ($0.64 < 0.70$) despite attractive pricing. |
| **5** | **Governance Spend Limit (> ₹10,000)** | 🟡 *Governance* | Recovery order total exceeds executive threshold | Halts autonomous dispatch, holds state in `HUMAN_ESCALATED_AWAITING_DECISION`, and prompts operator console. |
| **6** | **Supplier Capacity Drop (-50%)** | 🟢 *Positive* | Primary vendor max capacity drops from 1000 to 500 | Dynamically formulates a dual-sourcing split across multiple vendors to fulfill the entire 900-unit requirement. |
| **7** | **Surge Demand Spike (+30%)** | 🟢 *Positive* | Production target surges from 1,000 to 1,300 units | `EARLY_RISK_CHECK` calculates dynamic daily run-rate deficit and triggers proactive procurement before stockout. |

---

## ⚙️ Core Technical Pillars

### 1. 🛡️ 8-Point Deterministic Constraint Engine
Every candidate recovery plan must pass all 8 mathematical gates before any capital allocation:
1. **Total Usable Coverage**: $(\text{Current Stock} + \text{Inbound POs} + \text{Recovery Plan}) \ge \text{Production Target}$.
2. **Lead-Time Slack**: $\text{Delivery Date} + \text{Buffer Hours} \le \text{Hard Production Deadline}$.
3. **Minimum Order Quantity (MOQ)**: $\text{Allocated Qty} \ge \text{Supplier MOQ}$.
4. **Emergency Budget Ceiling**: $\sum (\text{Qty} \times \text{Unit Price}) \le \text{Available Emergency Budget}$.
5. **Supplier Quality Index**: $\text{Quality Score} \ge 0.70$ threshold.
6. **Capacity Ceiling**: $\text{Allocated Qty} \le \text{Supplier Max Cycle Capacity}$.
7. **Reliability Benchmark**: $\text{Reliability Score} \ge 0.75$.
8. **Contradiction Shield**: Vendor must have `hasOpenContradiction === false`.

### 2. 🔄 Self-Correcting Replanning (`ADAPT_REPLAN`)
If a proposed plan V1 fails any validation gate (e.g. coverage deficit $890 < 900$), the FSM does not crash. It automatically transitions to `ADAPT_REPLAN`, captures invalidated assumptions, and synthesizes Plan V2 with full parent lineage.

### 3. 📧 Real Outbound Transactional Supplier RFQs (Brevo API)
NEXUS connects to real email infrastructure via Brevo. When an expedited RFQ is needed, transactional emails are sent to supplier contacts, and inbound text responses are parsed into structured machine-readable quotes.

### 4. 📜 Cryptographic Append-Only Audit Ledger
Every state change, tool dispatch, calculation result, and human approval is cryptographically stamped in an immutable audit ledger (`/audit`), ensuring full regulatory compliance and post-mortem transparency.

---

## 🏭 Enterprise Ecosystem & Mock Catalog

NEXUS includes a rich manufacturing network:

* **Customer Assembly Lines (OEM Buyers)**:
  * **Tata Motors EV Division** (Pune Plant 1 · Assembly Line Alpha)
  * **Mahindra Aerospace** (Nashik Assembly Facility)
  * **Bajaj Auto Precision** (Chakan Plant · Unit 2)
  * **Bharat Forge Powertrain** (Mundhwa Heavy Plant)
* **Component Suppliers Network**:
  * **Orbital Components Ltd** (Tier-1 Primary Precision Bearings · ISO9001/IATF16949 · 1,000 u/cycle)
  * **Veloce Parts Co** (High-Speed Expedited Aerospace & Automotive · ISO9001/AS9100D · 800 u/cycle)
  * **Apex Precision Dynamics** (OEM Hydraulic Assemblies · ISO9001/ISO14001 · 1,200 u/cycle)
  * **Kalyani Heavy Forgings** (Heavy Castings & Structural Forgings · ISO9001/IATF16949 · 1,500 u/cycle)
  * **Zenith Micro-Tech Systems** (Electronic Sensors & PCB Controllers · ISO9001/RoHS · 600 u/cycle)
  * **Budget Cheap-Cast Corp** (Uncertified Low-Cost Vendor for negative quality-gate testing)
* **Logistics Telemetry**: Real-time carrier tracking across **Blue Dart Surface Freight**, **DHL Express Air**, and **Gati-KWE**.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend UI** | Next.js 15 (App Router), React 19, TailwindCSS, Lucide Icons |
| **Backend API** | Next.js Edge & Serverless API Routes (`/api/*`) |
| **State Machine & Logic** | Pure TypeScript FSM with strict deterministic constraint validators |
| **Database & ORM** | Neon Serverless PostgreSQL, Prisma ORM, In-Memory Seed Store |
| **LLM Reasoning** | Claude 3.5 Sonnet / Local Deterministic Stub Client |
| **Email Infrastructure** | Brevo Transactional Email API |
| **Testing & Quality** | Vitest (90/90 Unit & Integration Tests), TypeScript Strict Mode |

---

## 🚀 Quickstart Guide

### Prerequisites
* **Node.js**: `v22.x` or `v24.x`
* **Package Manager**: `pnpm` (`v10.x`)

### 1. Clone & Install
```bash
git clone https://github.com/VishalGhuge111/nexus-hackathon-2026.git
cd nexus-hackathon-2026
pnpm install
```

### 2. Run Test Suite
Verify all 90 unit, calculation, and state machine integration tests:
```bash
pnpm test
```

### 3. Run Locally
Start the development server:
```bash
pnpm dev:web
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> *Note: NEXUS runs fully locally out-of-the-box using the built-in memory store and deterministic LLM stub with zero external API keys required!*

### 4. Optional: Real PostgreSQL & Live Brevo Emailing
Copy `.env.example` to `.env`:
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/nexus?sslmode=require"
BREVO_API_KEY="your-brevo-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```
Seed the database:
```bash
pnpm db:push
pnpm db:seed
```

---

## 📊 Comprehensive Test Suite Overview

```
 ✓ tests/tools/budgetAndDispatch.test.ts (4 tests)
 ✓ tests/tools/supplierCommunication.test.ts (8 tests)
 ✓ tests/validator/validate.test.ts (9 tests)
 ✓ tests/validator/ranking.test.ts (3 tests)
 ✓ tests/validator/eligibility.test.ts (5 tests)
 ✓ tests/calculations/coverage.test.ts (6 tests)
 ✓ tests/calculations/cost.test.ts (3 tests)
 ✓ tests/calculations/production.test.ts (2 tests)
 ✓ tests/calculations/deadline.test.ts (3 tests)
 ✓ tests/calculations/continuity.test.ts (2 tests)
 ✓ tests/calculations/requiredMinimumCoverage.test.ts (4 tests)
 ✓ tests/state-machine/earlyRiskMonitor.test.ts (6 tests)
 ✓ tests/state-machine/fsmTransitions.test.ts (3 tests)
 ✓ tests/state-machine/concurrency.test.ts (2 tests)
 ✓ tests/state-machine/failures.test.ts (5 tests)
 ✓ tests/audit/auditTrail.test.ts (3 tests)
 ✓ tests/integration/shipmentDelay.test.ts (4 tests)
 ✓ tests/integration/supplierCapacityDrop.test.ts (2 tests)
 ✓ tests/integration/demandSpike.test.ts (2 tests)
 ✓ tests/integration/supplierClaimContradiction.test.ts (2 tests)
 ✓ tests/integration/multiEvent.test.ts (2 tests)
 ✓ tests/integration/apiRoutes.test.ts (10 tests)

 Test Files  22 passed (22)
      Tests  90 passed (90)
```

---

## 👥 Team & Acknowledgments

* **Project**: NEXUS Autonomous Supply Chain Engine
* **Hackathon**: Hackers Occupied Pune (HOP 2026)
* **License**: Open Source under the MIT License

<div align="center">
<sub>Built with precision for mission-critical manufacturing operations.</sub>
</div>