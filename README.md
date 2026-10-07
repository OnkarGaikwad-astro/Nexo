# Nexo

Autonomous AI Task Worker

## Overview
Nexo turns natural-language goals into completed work. From intent to execution, Nexo is an AI worker that figures out what needs to happen, instead of requiring you to manually describe every step.

## Solution
Nexo bridges the gap between intent and execution. It acts as an autonomous agent that not only decides what tools to use (like Playwright for browser interactions) but also critically observes the outcome of its actions, handles errors gracefully, and independently verifies its own success.

## Core Features
- **Autonomous Execution**: Understands goals and creates step-by-step plans.
- **Browser Automation**: Interacts with actual web applications using Playwright.
- **Failure Recovery**: Observes failures and attempts to recover or ask for help.
- **Independent Verification**: Does not assume success; explicitly verifies final state.
- **Human-in-the-Loop**: Asks for approval before performing sensitive operations.
- **Live Observability**: Real-time websocket events for tracking the agent's progress.

## Setup
1. Clone the repository.
2. Install Python dependencies: `cd backend && pip install -r requirements.txt && playwright install`
3. Install Frontend dependencies: `cd apps/web && npm install` and `cd apps/company-sim && npm install`
4. Set up `.env` from `.env.example`.
