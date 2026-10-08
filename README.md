<div align="center">

<img src="./assets/nexo-icon.png" width="130" height="130" alt="NEXO Logo Icon" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);" />

# NEXO: Autonomous Enterprise AI Task Worker

**From Intent to Verified Execution.**  
*An autonomous AI task worker that deconstructs high-level business goals, operates internal company web systems via native browser automation, recovers gracefully from errors, and independently audits and verifies tangible business deliverables.*

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.3-black?logo=next.js" alt="Next.js" /></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi" alt="FastAPI" /></a>
  <a href="https://playwright.dev/"><img src="https://img.shields.io/badge/Playwright-Chromium-2EAD33?logo=playwright" alt="Playwright" /></a>
  <a href="https://groq.com/"><img src="https://img.shields.io/badge/Groq-Llama%203.3%20%2F%20Qwen-F55036?logo=groq" alt="Groq" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css" alt="Tailwind" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
</p>

</div>

---

## 🌟 Executive Summary

Traditional AI assistants stop at suggestions and chat responses. **NEXO bridges the gap between intent and verified completion.** When given a complex objective (e.g. *"Find Acme Corp's latest unpaid invoice, reconcile it in the Finance general ledger, and prepare a payment reminder email"*), NEXO:

1. **Deconstructs & Plans**: Parses high-level goals into a deterministic ReAct workflow with phased cognitive telemetry (`UNDERSTAND`, `PLAN`, `EXECUTE`, `OBSERVE`, `ADAPT`, `VERIFY`, `COMPLETE`).
2. **Operates Enterprise Portals**: Uses Playwright browser automation to navigate real web applications (Document Center, Finance Ledger, Client CRM, Corporate Email) just like a human operator.
3. **Recovers Gracefully**: Detects edge cases and errors (e.g. duplicate invoice submissions) in real time and automatically pivots to verification instead of crashing.
4. **Guards Against Risks (HITL)**: Automatically gates high-consequence external operations (such as outbound email dispatch) behind human supervisor approval.
5. **Collects Tangible Evidence**: Extracts receipts, ledger confirmation IDs, and sandbox proofs with cryptographic SHA-256 verification hashes.
6. **Provides Real-Time Observability**: Streams live viewport captures, reasoning traces, and audit ledger entries in real time via Server-Sent Events (SSE).

---

## 🏗️ System Architecture

```mermaid
graph TD
    User["👤 Human Operator"] -->|Goal Intent| Console["🖥️ NEXO Web Console (Port 3000)"]
    Console -->|REST / SSE Stream| Backend["⚡ FastAPI Autonomous Engine (Port 8000)"]
    
    subgraph Cognitive Loop
        Backend --> LLM["🧠 Multi-Provider LLM (Groq Llama 3.3 / Gemini 2.5)"]
        LLM --> Planner["📋 ReAct Execution Engine & Intent Parser"]
    end
    
    subgraph Tool & Execution Layer
        Planner -->|Headless / Headful| Playwright["🎭 Adaptive Chromium Engine"]
        Planner -->|Open Exchange API| FX["💱 Real-Time Foreign Exchange Tool"]
        Planner -->|DuckDuckGo / Tavily| Web["🌐 Live Web Search & Scraping"]
        Planner -->|SMTP Relay| Mail["✉️ Verified Outbound Mailer"]
    end

    subgraph Simulated Acme Enterprise (Port 3001)
        Playwright --> DocCenter["📄 Document Center (/documents)"]
        Playwright --> Finance["💳 Finance General Ledger (/finance)"]
        Playwright --> CRM["👥 Client CRM (/crm)"]
        Playwright --> SimEmail["✉️ Corporate Email (/email)"]
    end
    
    subgraph Safety & Verification
        Planner -->|Outbound Send| HITL{"🛡️ Supervisor Gate (HITL)"}
        HITL -->|Pending Approval| Console
        Playwright -->|Artifact Proofs| Audit["🛡️ Verified Evidence Ledger (SHA-256)"]
        Audit -->|Real-Time SSE| Console
    end
```

---

## 🚀 Key Features

### 1. 🤖 Autonomous ReAct Execution Engine
- Dynamic ReAct loop (`Reasoning + Acting`) that evaluates current browser observations, executes next actions, and adapts when unexpected UI states occur.
- Multi-provider cognitive engine supporting **Groq** (`llama-3.3-70b-versatile`, `qwen-2.5-32b`) and **Google Gemini** with automatic fallback.

### 2. 🎭 Native Browser Navigation (Playwright)
- Performs natural DOM interactions: element inspection, text extraction, form completion, and button clicks.
- Adaptive Chromium browser runner that works smoothly across Windows, Linux, and macOS.

### 3. 🖥️ Mini Desktop Simulated Environment Preview
- Real-time browser viewport rendered directly inside the operations console.
- Employs a **2x desktop virtual viewport** (`scale(0.5)`) providing high-resolution, uncropped miniature desktop previews of internal applications alongside live agent streams.

### 4. 🛡️ Human-in-the-Loop (HITL) Supervisor Gates
- Sensitive outward operations (e.g., sending emails to clients, financial transaction commitments) automatically pause the agent in state `WAITING_FOR_APPROVAL`.
- The human supervisor reviews the recipient, subject line, and body before issuing a 1-click **Approve & Send** or **Reject** decision.

### 5. 📁 Cryptographic Evidence Ledger & Audit Trail
- Collects verifiable receipts across company systems: Invoice IDs, transaction reference codes, contact records, and outbound message IDs.
- Calculates **SHA-256 integrity hashes** for each tangible proof.
- Single-click deliverable summary copy to clipboard with 100% verified status.

### 6. 🧠 Long-Term Enterprise Memory
- Persistent SQLite repository storing company schemas, DOM selector registries, and business rules across tasks.
- Dynamically learns vendor attributes and invoice statuses during autonomous runs.

---

## 🏢 Simulated Acme Corporation Ecosystem (Port 3001)

NEXO includes a complete, stateful internal company suite built with Next.js:

| Portal | URL | Purpose & Data Schemas |
| :--- | :--- | :--- |
| **📄 Document Center** | `http://localhost:3001/documents` | Vendor invoices repository (`INV-2048`, `INV-2039`, `INV-1092`, `INV-5521`), PDF previews, due dates, and structured JSON invoice data. |
| **💳 Finance Ledger** | `http://localhost:3001/finance` | Accounts payable ledger, general ledger reconciliation, and duplicate invoice detection safeguard. |
| **👥 Client CRM** | `http://localhost:3001/crm` | Corporate client directory, primary account contacts (e.g. Marcus Vance), verified email addresses, and account standing. |
| **✉️ Corporate Email** | `http://localhost:3001/email` | Enterprise correspondence system with composer, draft storage, and outbound dispatch records. |

---

## 🎯 Verified Demonstration Scenarios

NEXO comes pre-configured with 1-click interactive triggers on the dashboard:

| Action | Objective | Systems Involved | Safeguards & Verifications |
| :--- | :--- | :--- | :--- |
| **📑 Scan Acme Invoices** | Find the latest invoice for Acme Corp and extract invoice number, amount, and due date. | Document Center | DOM Extraction & Verification |
| **💳 Sync General Ledger** | Process invoice `INV-2048` and record it into the Finance general ledger. | Finance Portal | Duplicate Detection Safeguard |
| **👥 Verify CRM Profile** | Search Marcus Vance in Client CRM and verify contact profile and unpaid balances. | Client CRM | Sandbox Isolation |
| **✉️ Send Payment Email** | Compose and dispatch an invoice payment reminder with recipient verification. | Corporate Email / SMTP | **HITL Supervisor Gate** (Approval Required) |
| **⚡ Multi-Step Pipeline** | Extract unpaid invoice $\rightarrow$ enter in Finance $\rightarrow$ prepare payment reminder email. | Docs + Finance + Email | End-to-End Audit Verification |
| **💱 Real-Time Forex** | Live multi-currency conversion with automatic natural-language parsing (e.g. *250 dirham to INR*). | Open Exchange Rate API | Live Rate Telemetry |
| **🌐 Live Web Search** | Real-world DuckDuckGo query with Chromium DOM extraction and live screenshots. | Live Chromium Browser | Sandbox Proofs |

---

## 📦 Quick Start Guide

### Prerequisites
- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/OnkarGaikwad-astro/Nexo.git
cd Nexo
```

---

### Step 2: Configure Environment Variables
Copy the template file:
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and add your free [Groq API Key](https://console.groq.com/):
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
COGNITIVE_MODEL=llama-3.3-70b-versatile
```
*(Optional: configure Gmail SMTP if you wish to test real external email dispatch).*

---

### Step 3: Setup & Start Backend API (Port 8000)
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
playwright install chromium
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API runs at `http://127.0.0.1:8000`.*

---

### Step 4: Setup & Start Company Simulator (Port 3001)
In a new terminal:
```bash
cd apps/company-sim
npm install
npm run dev -- -p 3001
```
*Company Simulator runs at `http://localhost:3001`.*

---

### Step 5: Setup & Start Web Operations Console (Port 3000)
In a new terminal:
```bash
cd apps/web
npm install
npm run dev -- -p 3000
```
*NEXO Console opens at `http://localhost:3000`.*

---

## 🐳 1-Command Docker Deployment (Recommended)

NEXO provides complete container definitions for all 3 services (`backend`, `company-sim`, `web`):

```bash
# 1. Provide your free Groq API key
echo "GROQ_API_KEY=your_key_here" >> backend/.env

# 2. Build and launch entire stack
docker compose up --build -d
```

- **Web Operations Console**: `http://localhost:3000`
- **Acme Corporation Portal**: `http://localhost:3001`
- **FastAPI Engine**: `http://localhost:8000`

---

## ☁️ Cloud Deployment Guide

| Platform | Deployment Model | Recommended For |
| :--- | :--- | :--- |
| **Docker Compose / VPS** | DigitalOcean Droplet, Hetzner, AWS EC2 | **Production & Live Demos (Full Control)** |
| **Railway / Render** | Container Web Service for Backend + Static/Node for Frontends | **Quick 1-Click Cloud Hosting** |
| **Vercel + Cloud VM** | Vercel for `apps/web` & `apps/company-sim`, Cloud VM for `backend` | **Hybrid Edge Performance** |

### Deploying Backend with Playwright on Cloud (Render / Railway / Fly.io)
When deploying the `backend` to container-based hosts:
1. Connect your GitHub repository.
2. Set Root Directory to `backend`.
3. Select **Dockerfile** as build method.
4. Add environment variables:
   - `GROQ_API_KEY`: Your Groq API key
   - `COGNITIVE_MODEL`: `llama-3.3-70b-versatile`
   - `SIM_APP_URL`: The public or private URL of the company simulator.
5. Deploy! Playwright Chromium and dependencies are automatically provisioned.

---

## 🧪 Testing & Verification Suite

NEXO features an automated verification suite validating API endpoints, cross-system ReAct loops, duplicate invoice error recovery, and human-in-the-loop approval gates.

### Run with Pytest
```bash
cd backend
pytest
```

### Run Live Interactive Scenarios
To see live console step-by-step progress and tool receipts:
```bash
cd backend
python tests/run_tests.py
```

### Validate Frontend Production Builds
```bash
npm run build --prefix apps/web
npm run build --prefix apps/company-sim
```

---

## 📡 REST API & Real-Time SSE Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/tasks` | Create a new autonomous task with a natural language goal. |
| `GET` | `/api/tasks` | List all historical tasks with completion statuses. |
| `GET` | `/api/tasks/{id}` | Retrieve specific task details, audit evidence, and execution trace. |
| `POST` | `/api/tasks/{id}/run` | Spawn an autonomous agent worker process for the given task. |
| `POST` | `/api/tasks/{id}/approve` | **Supervisor Gate**: Approve a paused action (e.g., outbound email send). |
| `POST` | `/api/tasks/{id}/reject` | **Supervisor Gate**: Reject a paused action. |
| `GET` | `/api/events` | **Server-Sent Events (SSE)**: Real-time broadcast of agent steps, thoughts, screenshots, and evidence. |
| `GET` | `/api/memory` | Retrieve persistent entity memory, DOM selector schemas, and verification rules. |
| `GET` | `/api/stats` | System telemetry: Total tasks, success rate, and active agent counts. |

---

## 📂 Project Directory Structure

```text
Nexo/
├── assets/
│   ├── nexo-icon.png            # NEXO Brand Squircle Icon
│   └── favicon.ico              # Platform Favicon
├── apps/
│   ├── web/                     # Next.js 16 Web Operations Console (Port 3000)
│   │   ├── src/app/page.tsx     # 3-Column Autonomous Operations Console
│   │   ├── src/app/execution/   # Live Step Trace & Cognition Inspector
│   │   ├── src/app/memory/      # Enterprise Memory & Rules Registry
│   │   └── src/app/tasks/       # Historical Tasks Ledger
│   └── company-sim/             # Enterprise Sandbox Environment (Port 3001)
│       ├── src/app/page.tsx     # Company Systems Dashboard
│       ├── src/app/documents/   # Vendor Invoices & Document Center
│       ├── src/app/finance/     # Accounts Payable & General Ledger
│       ├── src/app/crm/         # Client Contacts & Account Standing
│       └── src/app/email/       # Corporate Outbox, Drafts & Dispatcher
├── backend/                     # FastAPI Autonomous Engine (Port 8000)
│   ├── app/
│   │   ├── agent/
│   │   │   ├── agent.py         # Autonomous Execution Loop & ReAct Engine
│   │   │   ├── llm.py           # Multi-Provider Cognitive Engine (Groq / Gemini)
│   │   │   ├── executor.py      # Playwright Automation Session Manager
│   │   │   └── services/        # Real SMTP Mailer & Live Currency Tools
│   │   ├── database.py          # SQLite Connection & Session Manager
│   │   ├── main.py              # REST API & SSE Event Stream
│   │   ├── models.py            # SQLite Schemas & Ledger Models
│   │   └── run_browser.py       # Isolated Playwright Worker Process
│   ├── tests/
│   │   ├── test_nexo_autonomous.py # Automated Pytest Suite
│   │   └── run_tests.py         # Interactive Live Scenario Runner
│   ├── .env.example             # Documented Environment Template
│   └── requirements.txt         # Python Dependencies
├── LICENSE                      # MIT License
└── README.md                    # Project Documentation
```

---

## 🛡️ Trust, Safety & Ethical Boundaries

NEXO is engineered with enterprise safety as a first-class citizen:
- **Zero-Leakage Sandbox**: Company simulation runs in an isolated network perimeter on port 3001, preventing cross-environment pollution.
- **Supervisor Approval Gate**: Irreversible outward actions (such as sending emails to external parties or financial mutations) require explicit human sign-off.
- **Verifiable Proofs**: All deliverables link directly to extracted DOM elements, receipts, and cryptographic SHA-256 hashes for total transparency.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
