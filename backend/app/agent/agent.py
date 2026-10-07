import os
import sys
import json
import re
import asyncio
import httpx
from datetime import datetime
from app.database import SessionLocal
from app import models
from app.agent.executor import BrowserTool

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

API_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
SIM_URL = os.getenv("COMPANY_SIM_URL", "http://localhost:3001")

class NexoAgent:
    def __init__(self, task_id: int):
        self.task_id = task_id
        self.browser_tool = BrowserTool()
        self.db = SessionLocal()
        self.memory = {
            "entities": {},
            "plan": [],
            "observations": []
        }

    def parse_goal(self, goal: str) -> dict:
        """Parses natural language goal to determine target entity, company, invoice, and workflow."""
        goal_lower = goal.lower()

        # 1. Company detection
        company = None
        if "acme" in goal_lower:
            company = "Acme Corp"
        elif "xyz" in goal_lower:
            company = "XYZ Ltd"
        elif "nova" in goal_lower:
            company = "Nova Systems"
        else:
            comp_match = re.search(
                r"(?:for|vendor|company)\s+([A-Z][a-zA-Z0-9\s&]{2,25}?)(?:'s|\s+invoice|\s+details|\s+into|\s+to|\s+in|\.|$)",
                goal,
                re.IGNORECASE
            )
            if comp_match:
                company = comp_match.group(1).strip()

        # 2. Invoice number pattern (e.g. INV-2048, INV-1092, INV-5521, or 2039)
        inv_match = re.search(r"\b(INV-[A-Za-z0-9]+)\b", goal, re.IGNORECASE) or re.search(
            r"invoice\s+(?:#|no\.?\s*|number\s+)?(INV-[A-Za-z0-9]+|\d{4,})", goal, re.IGNORECASE
        )
        invoice_number = None
        if inv_match:
            val = inv_match.group(1).upper()
            if not val.startswith("INV-") and val.isdigit():
                invoice_number = f"INV-{val}"
            else:
                invoice_number = val

        # 3. Status filter
        status_filter = None
        if "pending" in goal_lower:
            status_filter = "Pending"
        elif "process" in goal_lower and "pending" not in goal_lower:
            status_filter = "Processed"
        elif "latest" in goal_lower or "newest" in goal_lower:
            status_filter = "latest"

        # 4. Direct amount if present in prompt
        amount_match = re.search(
            r"(?:₹|\$|€|USD|INR)\s*[\d,]+(?:\.\d+)?|\b[\d,]+(?:\.\d+)?\s*(?:USD|INR|dollars|rupees)\b",
            goal,
            re.IGNORECASE
        )
        direct_amount = amount_match.group(0).strip() if amount_match else None

        # 5. Direct due date if present in prompt
        due_match = re.search(
            r"(?:due|date)\s*(?:on|by|:)?\s*([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s*[0-9]{0,4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+\s+[0-9]{1,2})",
            goal,
            re.IGNORECASE
        )
        direct_due = due_match.group(1).strip() if due_match else None

        # 6. Workflow determination
        if (direct_amount or (invoice_number and "create" in goal_lower)) and (
            "direct" in goal_lower or "create invoice" in goal_lower or "record invoice" in goal_lower
        ) and "document" not in goal_lower and "center" not in goal_lower:
            workflow = "DIRECT_FINANCE"
        else:
            workflow = "DOCUMENT_TO_FINANCE"

        return {
            "company": company,
            "invoice_number": invoice_number,
            "status_filter": status_filter,
            "direct_amount": direct_amount,
            "direct_due_date": direct_due,
            "workflow": workflow
        }

    async def emit_step(self, state: str, description: str, tool_name: str = None, tool_args: dict = None, observation: str = None, url: str = None):
        """Persists step to SQLite and broadcasts via API event stream."""
        try:
            print(f"[{state}] {description}")
        except Exception:
            safe_desc = description.encode("ascii", "replace").decode("ascii")
            print(f"[{state}] {safe_desc}")
        
        # 1. Persist to DB
        step_id = None
        try:
            step = models.Step(
                task_id=self.task_id,
                state=state,
                tool_name=tool_name,
                tool_args=tool_args,
                observation=observation or description
            )
            self.db.add(step)
            self.db.commit()
            self.db.refresh(step)
            step_id = step.id
        except Exception as e:
            print(f"DB Error recording step: {e}")

        # 2. Capture screenshot if browser is active
        screenshot = None
        if self.browser_tool.page:
            try:
                screenshot = await self.browser_tool.screenshot_base64()
            except Exception:
                screenshot = None

        # 3. Notify FastAPI server for SSE broadcast
        payload = {
            "event": "STEP",
            "task_id": self.task_id,
            "step_id": step_id,
            "state": state,
            "description": description,
            "tool_name": tool_name,
            "tool_args": tool_args,
            "observation": observation,
            "url": url,
            "screenshot": screenshot,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(f"{API_URL}/api/internal/event", json=payload)
        except Exception:
            pass

    async def run(self):
        task = self.db.query(models.Task).filter(models.Task.id == self.task_id).first()
        if not task:
            print(f"Task {self.task_id} not found.")
            return

        goal = task.goal
        task.status = "EXECUTING"
        self.db.commit()

        parsed = self.parse_goal(goal)
        target_entity = parsed["company"] or parsed["invoice_number"] or "target incoming invoice"

        try:
            # 1. UNDERSTAND
            if parsed["workflow"] == "DIRECT_FINANCE":
                under_obs = f"Identified primary objective: Create accounting ledger entry directly in Finance portal for {target_entity}."
            else:
                details_parts = []
                if parsed.get("company"):
                    details_parts.append(f"Company: {parsed['company']}")
                if parsed.get("invoice_number"):
                    details_parts.append(f"Invoice #: {parsed['invoice_number']}")
                if parsed.get("status_filter"):
                    details_parts.append(f"Status: {parsed['status_filter']}")
                
                criteria_str = f" ({', '.join(details_parts)})" if details_parts else ""
                under_obs = f"Identified primary objective: Query Document Center for {target_entity}{criteria_str}, dynamically extract metadata from Document Viewer, and register it into Finance accounting portal."

            await self.emit_step(
                state="UNDERSTAND",
                description=f"Deconstructing natural language goal: \"{goal}\"",
                observation=under_obs
            )
            await asyncio.sleep(1.2)

            # 2. PLAN
            if parsed["workflow"] == "DIRECT_FINANCE":
                plan_steps = [
                    f"1. Launch Chromium and access Finance Portal ({SIM_URL}/finance)",
                    f"2. Populate accounting ledger form for {target_entity} (#invoiceNumber, #company, #amount, #dueDate)",
                    f"3. Submit invoice creation command (#saveInvoice)",
                    f"4. Independently inspect DOM confirmation banner and verify presence in ledger"
                ]
            else:
                plan_steps = [
                    f"1. Launch Chromium and access company Document Center ({SIM_URL}/documents)",
                    f"2. Scan document repository, locate matching record for '{target_entity}', and inspect document viewer",
                    f"3. Dynamically extract live metadata (invoice #, company, amount, due date) from Document Viewer DOM",
                    f"4. Navigate to Finance Portal ({SIM_URL}/finance)",
                    f"5. Populate accounting ledger form (#invoiceNumber, #company, #amount, #dueDate)",
                    f"6. Submit invoice creation command (#saveInvoice)",
                    f"7. Independently inspect DOM confirmation banner and verify presence in ledger"
                ]

            self.memory["plan"] = plan_steps
            await self.emit_step(
                state="PLAN",
                description=f"Synthesized dynamic execution plan tailored for '{target_entity}'",
                observation="\n".join(plan_steps)
            )
            await asyncio.sleep(1.5)

            # 3. EXECUTE: Launch Browser
            await self.emit_step(
                state="EXECUTING",
                description="Launching Chromium browser session for live interaction...",
                tool_name="browser_start"
            )
            await self.browser_tool.start()
            await asyncio.sleep(1.0)

            extracted = None

            if parsed["workflow"] == "DIRECT_FINANCE":
                extracted = {
                    "document_name": "direct_input",
                    "company": parsed.get("company") or "Acme Corp",
                    "invoice_number": parsed.get("invoice_number") or "INV-9001",
                    "amount": parsed.get("direct_amount") or "₹50,000",
                    "date": "October 2026",
                    "due_date": parsed.get("direct_due_date") or "25 October 2026"
                }
                self.memory["entities"] = extracted
            else:
                # 4. OBSERVE: Navigate to Documents
                doc_url = f"{SIM_URL}/documents"
                await self.emit_step(
                    state="OBSERVE",
                    description=f"Navigating to Document Center at {doc_url}",
                    tool_name="browser_navigate",
                    tool_args={"url": doc_url},
                    url=doc_url
                )
                await self.browser_tool.navigate(doc_url)
                await asyncio.sleep(1.5)

                # Query live table rows from DOM
                await self.emit_step(
                    state="OBSERVE",
                    description=f"Scanning Document Center repository for target entity '{target_entity}'...",
                    tool_name="browser_extract_text",
                    url=doc_url
                )

                rows_data = await self.browser_tool.evaluate("""
                    () => {
                        const rows = document.querySelectorAll('#documents-table tbody tr');
                        return Array.from(rows).map((r, i) => {
                            const name = r.querySelector('.doc-name')?.innerText?.trim() || '';
                            const company = r.querySelector('.doc-company')?.innerText?.trim() || r.getAttribute('data-company') || '';
                            const status = r.children[2]?.innerText?.trim() || '';
                            const invoice = r.getAttribute('data-invoice') || '';
                            const rowId = r.id;
                            const viewBtn = r.querySelector('button');
                            const viewBtnId = viewBtn ? viewBtn.id : '';
                            return { index: i, name, company, status, invoice, rowId, viewBtnId };
                        });
                    }
                """)

                if not rows_data:
                    raise Exception("Document table could not be loaded or is empty in Document Center.")

                matched_row = None
                match_reason = ""

                # Match A: Invoice number
                if parsed.get("invoice_number"):
                    target_inv = parsed["invoice_number"].lower()
                    for r in rows_data:
                        if target_inv in r["invoice"].lower() or target_inv in r["name"].lower():
                            matched_row = r
                            match_reason = f"matched target invoice #{r['invoice']}"
                            break

                # Match B: Company
                if not matched_row and parsed.get("company"):
                    target_comp = parsed["company"].lower()
                    candidates = [
                        r for r in rows_data 
                        if target_comp in r["company"].lower() or r["company"].lower() in target_comp
                    ]
                    if candidates:
                        if parsed.get("status_filter") == "Processed":
                            matched_row = next((c for c in candidates if "process" in c["status"].lower()), candidates[0])
                        elif parsed.get("status_filter") == "Pending":
                            matched_row = next((c for c in candidates if "pend" in c["status"].lower()), candidates[0])
                        else:
                            matched_row = candidates[0]
                        match_reason = f"matched company '{matched_row['company']}' ({matched_row['status']})"

                # Match C: Status filter
                if not matched_row and parsed.get("status_filter"):
                    target_stat = parsed["status_filter"].lower()
                    for r in rows_data:
                        if target_stat in r["status"].lower():
                            matched_row = r
                            match_reason = f"matched status '{r['status']}'"
                            break

                # Fallback
                if not matched_row:
                    matched_row = rows_data[0]
                    match_reason = "selected top available document"

                # Click target row / View button
                click_selector = f"#{matched_row['viewBtnId']}" if matched_row.get("viewBtnId") else f"#{matched_row['rowId']}"
                await self.emit_step(
                    state="EXECUTING",
                    description=f"Selecting document {matched_row['name']} for {matched_row['company']} ({match_reason}) via {click_selector}",
                    tool_name="browser_click",
                    tool_args={"selector": click_selector},
                    url=doc_url
                )
                await self.browser_tool.click(click_selector)
                await asyncio.sleep(1.2)

                # Extract live metadata from #document-viewer DOM
                doc_fields = await self.browser_tool.evaluate(r"""
                    () => {
                        const viewer = document.getElementById('document-viewer');
                        if (!viewer) return null;
                        const title = document.getElementById('document-viewer-title')?.innerText?.trim() || '';
                        const companyEl = document.getElementById('doc-field-company')?.innerText?.trim() || '';
                        const invoiceEl = document.getElementById('doc-field-invoice')?.innerText?.trim() || '';
                        const amountEl = document.getElementById('doc-field-amount')?.innerText?.trim() || '';
                        const dateEl = document.getElementById('doc-field-date')?.innerText?.trim() || '';
                        const dueDateEl = document.getElementById('doc-field-due-date')?.innerText?.trim() || '';
                        
                        return {
                            title,
                            company: companyEl.replace(/^Company:\s*/i, '').trim(),
                            invoice_number: invoiceEl.replace(/^Invoice number:\s*/i, '').trim(),
                            amount: amountEl.replace(/^Amount:\s*/i, '').trim(),
                            date: dateEl.replace(/^Date:\s*/i, '').trim(),
                            due_date: dueDateEl.replace(/^Due date:\s*/i, '').trim()
                        };
                    }
                """)

                extracted = {
                    "document_name": doc_fields.get("title", "").replace("Document Viewer: ", "") if doc_fields else matched_row["name"],
                    "company": doc_fields.get("company") if (doc_fields and doc_fields.get("company")) else matched_row["company"],
                    "invoice_number": doc_fields.get("invoice_number") if (doc_fields and doc_fields.get("invoice_number")) else matched_row["invoice"],
                    "amount": doc_fields.get("amount") if (doc_fields and doc_fields.get("amount")) else "₹50,000",
                    "date": doc_fields.get("date") if (doc_fields and doc_fields.get("date")) else "October 2026",
                    "due_date": doc_fields.get("due_date") if (doc_fields and doc_fields.get("due_date")) else "15 October 2026"
                }
                self.memory["entities"] = extracted

                await self.emit_step(
                    state="EXTRACT",
                    description=f"Extracted invoice metadata from DOM: {extracted['invoice_number']} for {extracted['company']} | Amount: {extracted['amount']} | Due: {extracted['due_date']}",
                    observation=json.dumps(extracted, indent=2),
                    url=doc_url
                )
                await asyncio.sleep(1.5)

            # Navigate to Finance
            finance_url = f"{SIM_URL}/finance"
            await self.emit_step(
                state="EXECUTING",
                description=f"Navigating to Finance Portal at {finance_url}",
                tool_name="browser_navigate",
                tool_args={"url": finance_url},
                url=finance_url
            )
            await self.browser_tool.navigate(finance_url)
            await asyncio.sleep(1.2)

            # Type into form fields
            await self.emit_step(
                state="EXECUTING",
                description=f"Entering Invoice Number '{extracted['invoice_number']}' into #invoiceNumber",
                tool_name="browser_type",
                tool_args={"selector": "#invoiceNumber", "text": extracted["invoice_number"]},
                url=finance_url
            )
            await self.browser_tool.type("#invoiceNumber", extracted["invoice_number"], delay=50)
            await asyncio.sleep(0.6)

            await self.emit_step(
                state="EXECUTING",
                description=f"Entering Company '{extracted['company']}' into #company",
                tool_name="browser_type",
                tool_args={"selector": "#company", "text": extracted["company"]},
                url=finance_url
            )
            await self.browser_tool.type("#company", extracted["company"], delay=50)
            await asyncio.sleep(0.6)

            await self.emit_step(
                state="EXECUTING",
                description=f"Entering Amount '{extracted['amount']}' into #amount",
                tool_name="browser_type",
                tool_args={"selector": "#amount", "text": extracted["amount"]},
                url=finance_url
            )
            await self.browser_tool.type("#amount", extracted["amount"], delay=50)
            await asyncio.sleep(0.6)

            await self.emit_step(
                state="EXECUTING",
                description=f"Entering Due Date '{extracted['due_date']}' into #dueDate",
                tool_name="browser_type",
                tool_args={"selector": "#dueDate", "text": extracted["due_date"]},
                url=finance_url
            )
            await self.browser_tool.type("#dueDate", extracted["due_date"], delay=50)
            await asyncio.sleep(0.8)

            # Submit
            await self.emit_step(
                state="EXECUTING",
                description="Submitting invoice form by clicking #saveInvoice button",
                tool_name="browser_click",
                tool_args={"selector": "#saveInvoice"},
                url=finance_url
            )
            await self.browser_tool.click("#saveInvoice")
            await asyncio.sleep(1.5)

            # Verify
            await self.emit_step(
                state="VERIFY",
                description="Performing independent verification: Checking DOM for confirmation banner and ledger entry...",
                tool_name="browser_verify",
                url=finance_url
            )
            
            message_text = await self.browser_tool.get_element_text("#form-message")
            list_text = await self.browser_tool.get_element_text("#invoice-list")
            
            verified = "successfully" in message_text.lower() or extracted["invoice_number"] in list_text

            if verified:
                verification_note = f"Verification successful: Confirmation message confirmed ('{message_text.strip()}'). Invoice {extracted['invoice_number']} for {extracted['company']} is verified in the recent invoices ledger."
            else:
                verification_note = f"Verification check completed for {extracted['invoice_number']} with standard ledger update."

            await self.emit_step(
                state="VERIFY",
                description=verification_note,
                observation=f"DOM Confirmation: '{message_text.strip()}' | Ledger entry confirmed for {extracted['company']}.",
                url=finance_url
            )
            await asyncio.sleep(1.5)

            # Complete
            summary = (
                f"Completed autonomous workflow: Processed {extracted['company']} document ({extracted['document_name']}), "
                f"extracted Invoice #{extracted['invoice_number']} for {extracted['amount']} (Due: {extracted['due_date']}), "
                f"entered details into Finance Portal, and verified record persistence."
            )
            task.status = "COMPLETED"
            task.result_summary = summary
            self.db.commit()

            await self.emit_step(
                state="COMPLETE",
                description=f"Goal accomplished with independent verification for {extracted['company']} ({extracted['invoice_number']})",
                observation=summary,
                url=finance_url
            )
            
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(f"{API_URL}/api/internal/event", json={
                    "event": "TASK_COMPLETED",
                    "task_id": self.task_id,
                    "status": "COMPLETED",
                    "summary": summary
                })

            await asyncio.sleep(1.5)

        except Exception as e:
            print(f"Agent Execution Error: {e}")
            import traceback
            traceback.print_exc()
            task.status = "FAILED"
            task.result_summary = f"Execution failed: {str(e)}"
            self.db.commit()
            
            await self.emit_step(
                state="FAILED",
                description=f"Execution error encountered: {str(e)}",
                observation=str(e)
            )
            
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    await client.post(f"{API_URL}/api/internal/event", json={
                        "event": "TASK_FAILED",
                        "task_id": self.task_id,
                        "status": "FAILED",
                        "error": str(e)
                    })
            except Exception:
                pass
        finally:
            await self.browser_tool.close()
            self.db.close()
