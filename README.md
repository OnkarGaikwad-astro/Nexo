# NEXO: Autonomous Enterprise AI Task Worker

<div align="center">

**From Intent to Execution.**  
*An autonomous AI worker that deconstructs high-level objectives, operates internal company systems, and independently audits and verifies tangible business deliverables.*

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Playwright](https://img.shields.io/badge/Playwright-Automation-2EAD33?logo=playwright)](https://playwright.dev/)
[![Groq](https://img.shields.io/badge/Groq-Llama%20%2F%20Qwen-F55036?logo=groq)](https://groq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 🌟 Executive Summary

Traditional AI assistants stop at suggestions. **NEXO bridges the gap between intent and verified completion.** When given a high-level goal (e.g. *"Find Acme Corp's latest unpaid invoice, reconcile it in the Finance general ledger, and prepare a payment reminder"*), NEXO:

1. **Understands & Plans**: Deconstructs the goal into a deterministic ReAct workflow with cognitive phase telemetry.
2. **Operates Internal Systems**: Uses Playwright browser automation to navigate company portals (Document Center, Finance Ledger, Client CRM, Corporate Email) just like a human operator.
3. **Guards Against Risks (HITL)**: Automatically gates high-consequence external operations (such as outbound email dispatch) behind human supervisor approval.
4. **Collects Tangible Evidence**: Extracts receipts, ledger confirmation IDs, and sandbox proofs with cryptographic SHA-256 verification hashes.
5. **Provides Live Observability**: Streams live viewport streams, reasoning steps, and audit ledger entries in real time via Server-Sent Events (SSE).

---

## 🏗️ System Architecture

```mermaid
graph TD
    User["👤 Human Operator"] -->|Goal Intent| Console["🖥️ NEXO Web Console (Port 3000)"]
    Console -->|REST / SSE| Backend["⚡ FastAPI Autonomous Engine (Port 8000)"]
    
    subgraph Cognitive Loop
        Backend --> LLM["🧠 LLM Cognitive Engine (Groq / Gemini)"]
        LLM --> Planner["📋 ReAct Execution Engine & Intent Parser"]
    end
    
    subgraph Tool & Execution Layer
        Planner -->|Browser Automation| Playwright["🎭 Adaptive Chromium Engine"]
        Planner -->|Open Exchange API| FX["💱 Real-Time Foreign Exchange"]
        Planner -->|DuckDuckGo / Tavily| Web["🌐 Live Web Search & Scraping"]
        Planner -->|SMTP Relay| Mail["✉️ Verified Outbound Mailer"]
    end

    subgraph Simulated Acme Enterprise (Port 3001)
        Playwright --> DocCenter["📄 Document Center (/documents)"]
        Playwright --> Finance["💳 Finance General Ledger (/finance)"]
        Playwright --> CRM["👥 Client CRM (/crm)"]
        Playwright --> SimEmail["✉️ Corporate Email (/email)"]
    end
    
    Playwright -->|Artifacts & Proofs| Audit["🛡️ Verified Evidence & Audit Ledger"]
    Audit -->|Real-Time SSE| Console
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- **Git**

---

### Step 1: Clone Repository
```bash
git clone https://github.com/OnkarGaikwad-astro/Nexo.git
cd Nexo
```

---

### Step 2: Configure Environment Variables
Copy the template and fill in your free Groq API key:
```bash
cp backend/.env.example backend/.env
```
*(Optionally set up Gmail SMTP credentials if testing live external email delivery.)*

---

### Step 3: Setup & Launch Backend
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
*Backend runs on `http://localhost:8000`.*

---

### Step 4: Setup & Launch Company Simulator
In a second terminal:
```bash
cd apps/company-sim
npm install
npm run dev -- -p 3001
```
*Company Simulator runs on `http://localhost:3001`.*

---

### Step 5: Setup & Launch Web Operations Console
In a third terminal:
```bash
cd apps/web
npm install
npm run dev -- -p 3000
```
*Web Console runs on `http://localhost:3000`.*

---

## 🎯 Verified Demonstration Scenarios

NEXO comes pre-configured with 1-click test actions right on the dashboard:

| Scenario | Objective | Systems Involved | Safeguards |
| :--- | :--- | :--- | :--- |
| **📑 Scan Acme Invoices** | Find the latest invoice for Acme Corp and extract invoice number, amount, and due date. | Document Center | Auto-Verification |
| **💳 Sync General Ledger** | Process invoice `INV-2048` and record it into the Finance general ledger. | Finance Accounting Portal | Duplicate Detection Safeguard |
| **👥 Verify CRM Profile** | Search Marcus Vance in Client CRM and verify contact profile and unpaid balances. | Client CRM | Sandbox Isolation |
| **✉️ Send Payment Email** | Compose and dispatch an invoice payment reminder with recipient verification. | Corporate Email / SMTP | **HITL Supervisor Gate** (Requires Approval) |
| **⚡ Multi-Step Pipeline** | Extract unpaid invoice $\rightarrow$ enter in Finance $\rightarrow$ prepare payment reminder email. | Docs + Finance + Email | Human-in-the-Loop Sign-Off |
| **💱 Real-Time Forex** | Live multi-currency conversion with automatic natural-language parsing (e.g. *250 dirham to INR*). | Open Exchange Rate API | Live Rate Telemetry |
| **🌐 Live Web Search** | Real-world DuckDuckGo query with Chromium DOM extraction and live screenshots. | Live Chromium Browser | Zero-Leakage Sandbox |

---

## 🛡️ Trust, Safety & Human-in-the-Loop (HITL)

High-autonomy systems require uncompromising safety boundaries:
- **Zero-Leakage Sandbox**: Simulated company systems run isolated on port 3001 to prevent unintended data exposure.
- **Supervisor Gate**: Destructive or outward-facing actions (e.g., sending emails to external parties) automatically pause execution in state `WAITING_FOR_APPROVAL` and require explicit human operator confirmation.
- **Auditable Ledger**: Every completed task records timestamps, tool arguments, HTTP receipts, and verified output deliverables with single-click clipboard export.

---

## 📂 Project Structure

```text
Nexo/
├── apps/
│   ├── web/                     # Next.js 16 Operations Console (Port 3000)
│   │   ├── src/app/page.tsx     # 3-Column Autonomous Operations Dashboard
│   │   ├── src/app/execution/   # Live Step Trace & Cognition Inspector
│   │   └── src/app/memory/      # Audit Ledger & Long-Term Memory View
│   └── company-sim/             # Enterprise Sandbox Environment (Port 3001)
│       ├── src/app/documents/   # Vendor Invoices & File Center
│       ├── src/app/finance/     # Accounts Payable & General Ledger
│       ├── src/app/crm/         # Client Contacts & Account Standing
│       └── src/app/email/       # Corporate Outbox, Drafts & Dispatcher
├── backend/                     # FastAPI Autonomous Engine (Port 8000)
│   ├── app/
│   │   ├── agent/
│   │   │   ├── agent.py         # Autonomous Execution Loop & ReAct Engine
│   │   │   ├── llm.py           # Multi-Provider Cognitive Engine (Groq / Gemini)
│   │   │   ├── executor.py      # Playwright Automation Session Manager
│   │   │   └── services/        # Real Email (SMTP) & Live Currency Tools
│   │   ├── main.py              # REST API & SSE Event Stream
│   │   └── models.py            # SQLite Database Schemas & Ledger Models
│   ├── .env.example             # Documented Environment Template
│   └── requirements.txt         # Python Dependencies
└── README.md                    # Project Documentation
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
