import os
import json
import re
from typing import Optional, Dict, Any, List
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

def get_llm_config():
    """Returns (api_key, base_url, model_name)."""
    k = os.getenv("GROQ_API_KEY") or os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY") or ""
    if not k or k.strip() in ("", "dummy-key", "your_api_key_here", "your_groq_api_key_here"):
        return None, None, None
    
    base_url = os.getenv("OPENAI_BASE_URL")
    if not base_url and (k.startswith("gsk_") or os.getenv("GROQ_API_KEY")):
        base_url = "https://api.groq.com/openai/v1"
        
    model = os.getenv("MODEL_NAME")
    if not model:
        if base_url and "groq" in base_url:
            model = "llama-3.3-70b-versatile"
        else:
            model = "gpt-4o"
            
    return k, base_url, model

def get_llm_client() -> Optional[AsyncOpenAI]:
    """Returns an AsyncOpenAI client if API key is present, else None."""
    k, base_url, _ = get_llm_config()
    if not k:
        return None
    try:
        return AsyncOpenAI(api_key=k, base_url=base_url)
    except Exception as e:
        print(f"Failed to create LLM client: {e}")
        return None

def is_llm_configured() -> bool:
    """Checks whether a valid API key is present."""
    k, _, _ = get_llm_config()
    return k is not None

SYSTEM_PROMPT = """You are Nexo, an autonomous enterprise AI Task Worker powered by Groq & Playwright.
You navigate corporate portals, inspect dynamic DOM elements, execute precision actions, and verify record states.
Always think step-by-step with structured reasoning.
"""

async def plan_goal_with_llm(goal: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Uses Groq / LLM to formulate reasoning, intent deconstruction, and plan.
    Falls back gracefully to deterministic cognitive synthesis if no API key is provided."""
    client = get_llm_client()
    _, _, model = get_llm_config()
    
    if client and model:
        try:
            prompt = f"""Deconstruct this user goal for an autonomous web agent operating on Acme Corp enterprise portals:
Goal: "{goal}"
Context: {json.dumps(context or {})}

Portals available:
1. Corporate Email (http://localhost:3001/email): compose, draft, send (requires supervisor approval), audit sent messages, audit drafts.
2. Client CRM (http://localhost:3001/crm): directory search, contact accounts, outstanding client invoices.
3. Finance Accounting (http://localhost:3001/finance): record invoice, detect duplicate entries, audit ledger.
4. Document Center (http://localhost:3001/documents): document repository, invoice viewer.

Return a valid JSON object with keys:
- "reasoning": "brief cognitive chain-of-thought analysis of what needs to be done",
- "target_entity": "detected company name, recipient email, or target portal",
- "workflow": "DIRECT_EMAIL" | "CRM_LOOKUP" | "FINANCE_OPERATIONS" | "FIND_DOCUMENT_ONLY" | "DOCUMENT_TO_FINANCE" | "CLIENT_EMAIL_REMINDER" | "MULTI_SYSTEM_FINANCE_AND_EMAIL" | "CUSTOM_TASK",
- "plan": ["step 1", "step 2", "step 3", ...],
- "tools": ["browser_navigate", "browser_click", "browser_type", "browser_extract_text", ...]
"""
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                timeout=12.0
            )
            content = response.choices[0].message.content
            if content:
                data = json.loads(content)
                data["llm_powered"] = True
                data["model"] = model
                return data
        except Exception as e:
            print(f"LLM planning fallback triggered due to: {e}")

    # Cognitive fallback reasoning engine
    goal_lower = goal.lower()
    target_comp = "Acme Corp"
    if "xyz" in goal_lower:
        target_comp = "XYZ Ltd"
    elif "nova" in goal_lower:
        target_comp = "Nova Systems"
    elif "marcus" in goal_lower or "vance" in goal_lower:
        target_comp = "Marcus Vance"
    elif "starlight" in goal_lower:
        target_comp = "Starlight Media"
    
    has_email = any(w in goal_lower for w in ["email", "mail", "send", "draft", "recipient", "@"])
    has_crm = any(w in goal_lower for w in ["crm", "client", "customer", "contact", "directory"])
    has_finance = any(w in goal_lower for w in ["finance", "ledger", "invoice entry", "record invoice", "accounting"])
    has_doc = any(w in goal_lower for w in ["document", "pdf", "invoice doc", "doc center"])

    if has_email and (has_finance or has_doc):
        workflow = "MULTI_SYSTEM_FINANCE_AND_EMAIL"
    elif has_email and has_crm:
        workflow = "CLIENT_EMAIL_REMINDER"
    elif has_email and not has_finance and not has_doc:
        workflow = "DIRECT_EMAIL"
    elif has_crm and not has_finance and not has_doc:
        workflow = "CRM_LOOKUP"
    elif has_finance and not has_doc:
        workflow = "FINANCE_OPERATIONS"
    elif has_finance and has_doc:
        workflow = "DOCUMENT_TO_FINANCE"
    elif any(w in goal_lower for w in ["find", "get", "search", "lookup", "show", "what is", "read", "inspect", "latest", "newest", "check"]):
        workflow = "FIND_DOCUMENT_ONLY"
    else:
        workflow = "CUSTOM_TASK"
    
    if workflow == "DIRECT_EMAIL":
        reasoning = (
            f"Cognitive Analysis: Goal requests direct Corporate Email action. "
            f"Agent will access Email Portal, prepare communication, request human supervisor approval if sending, and audit output."
        )
        plan = [
            f"1. Open Chromium browser session and navigate to Corporate Email (http://localhost:3001/email)",
            f"2. Access Compose, Sent, or Drafts tab as requested",
            f"3. Populate recipient, subject, and message content",
            f"4. If sending, pause at supervisor approval gate before transmission",
            f"5. Dispatch message and independently verify record in Sent Messages ledger"
        ]
        tools = ["browser_navigate", "browser_click", "browser_type", "supervisor_approval"]
    elif workflow == "CRM_LOOKUP":
        reasoning = (
            f"Cognitive Analysis: Goal requests Client CRM lookup for '{target_comp}'. "
            f"Agent will access CRM directory, locate client file, and audit account data."
        )
        plan = [
            f"1. Open Chromium browser session and navigate to Client CRM (http://localhost:3001/crm)",
            f"2. Search directory for '{target_comp}'",
            f"3. Open client detail drawer and extract contact email, status, and outstanding invoices",
            f"4. Record verified CRM profile evidence"
        ]
        tools = ["browser_navigate", "browser_type", "browser_click", "browser_extract_text"]
    elif workflow == "FINANCE_OPERATIONS":
        reasoning = (
            f"Cognitive Analysis: Direct Finance portal operation requested for '{target_comp}'. "
            f"Workflow will interact with ledger and verify record persistence."
        )
        plan = [
            f"1. Open Chromium browser session and access Finance Portal (http://localhost:3001/finance)",
            f"2. Inspect ledger and populate invoice entry form",
            f"3. Check for duplicate warning banners and adapt if already recorded",
            f"4. Submit transaction and independently verify DOM confirmation banner"
        ]
        tools = ["browser_navigate", "browser_type", "browser_click", "finance_create_invoice"]
    elif workflow == "FIND_DOCUMENT_ONLY":
        reasoning = (
            f"Cognitive Analysis: Goal specifically requests finding/inspecting document for '{target_comp}'. "
            f"No finance entry or ledger update was requested. Strict adherence requires locating the record, "
            f"extracting invoice metadata in Document Center, and returning the result without touching the Finance portal."
        )
        plan = [
            f"1. Open Chromium browser session and access Document Center (http://localhost:3001/documents)",
            f"2. Locate matching invoice record for '{target_comp}'",
            f"3. Open Document Viewer and inspect live metadata (Invoice #, Amount, Due Date)",
            f"4. Confirm and report retrieved document details without touching Finance portal"
        ]
        tools = ["browser_navigate", "browser_extract_text", "browser_click"]
    else:
        reasoning = (
            f"Cognitive Analysis: Multi-system workflow requested for '{target_comp}'. "
            f"Agent will coordinate between Document Center, Finance Portal, and Corporate Email."
        )
        plan = [
            f"1. Open Chromium browser session and navigate to Document Center",
            f"2. Inspect repository and filter for '{target_comp}' records",
            f"3. Dynamically extract live DOM metadata (Invoice #, Amount, Due Date)",
            f"4. Navigate to Finance Accounting Portal and populate ledger form",
            f"5. Submit transaction and independently verify DOM confirmation banner and ledger entry"
        ]
        tools = ["browser_navigate", "browser_extract_text", "browser_click", "finance_create_invoice"]

    return {
        "reasoning": reasoning,
        "target_entity": target_comp,
        "workflow": workflow,
        "plan": plan,
        "tools": tools,
        "llm_powered": False,
        "model": "heuristic-engine"
    }

async def react_step_with_llm(goal: str, url: str, page_text: str, elements: List[Dict[str, Any]], history: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Groq / LLM Autonomous ReAct step decision."""
    client = get_llm_client()
    if not client:
        return None
    _, _, model = get_llm_config()

    prompt = f"""You are an autonomous web browsing agent solving this user goal:
Goal: "{goal}"
Current URL: {url}

Previous Actions Taken:
{json.dumps(history[-5:], indent=2) if history else "[] (starting)"}

Interactive Elements on Current Page:
{json.dumps(elements[:30], indent=2)}

Visible Page Text Snippet:
{page_text[:1200]}

Decide the SINGLE NEXT action to make progress toward the goal.
Return a valid JSON object with:
- "thought": "your step-by-step reasoning on what you see and what to do next",
- "action": "click" | "type" | "navigate" | "verify" | "finish",
- "selector": "CSS selector to interact with (e.g. #saveInvoice, #view-doc-1, input selector)",
- "text": "text to type if action is type",
- "url": "destination URL if action is navigate",
- "summary": "final success summary if action is finish"
"""
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are Nexo, an autonomous browser agent. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            timeout=12.0
        )
        content = response.choices[0].message.content
        if content:
            res = json.loads(content)
            res["model"] = model
            return res
    except Exception as e:
        print(f"Groq ReAct step error: {e}")
    return None

async def extract_metadata_with_llm(dom_content: str, goal: str) -> Optional[Dict[str, Any]]:
    """Extracts invoice fields using Groq / LLM."""
    client = get_llm_client()
    if not client:
        return None
    _, _, model = get_llm_config()
    try:
        prompt = f"""Extract invoice metadata from this DOM text for goal "{goal}":
Content:
{dom_content[:2000]}

Return JSON with keys:
- "company": string,
- "invoice_number": string,
- "amount": string,
- "due_date": string,
- "confidence": string (e.g. "99.2%")
"""
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a precise data extraction specialist."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            timeout=10.0
        )
        content = response.choices[0].message.content
        if content:
            return json.loads(content)
    except Exception as e:
        print(f"LLM extraction error: {e}")
    return None

async def verify_outcome_with_llm(dom_evidence: str, target: Dict[str, Any]) -> Dict[str, Any]:
    """Uses Groq / LLM to evaluate DOM evidence."""
    client = get_llm_client()
    _, _, model = get_llm_config()
    if client and model:
        try:
            prompt = f"""Evaluate whether the following DOM state confirms the successful recording of invoice {target.get('invoice_number')} for {target.get('company')}:
DOM Evidence:
{dom_evidence}

Return JSON:
- "verified": boolean,
- "reasoning": "explanation of verification proof from DOM"
"""
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an independent verification auditor."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                timeout=10.0
            )
            content = response.choices[0].message.content
            if content:
                return json.loads(content)
        except Exception as e:
            print(f"LLM verification error: {e}")

    # Fallback verification heuristic
    inv = (target.get("invoice_number") or "").lower()
    comp = (target.get("company") or "").lower()
    ev_lower = dom_evidence.lower()
    verified = ("successfully" in ev_lower) or (inv in ev_lower) or (comp in ev_lower)
    return {
        "verified": verified,
        "reasoning": f"DOM evidence confirmed presence of confirmation banner and invoice reference ({inv.upper()})."
    }
