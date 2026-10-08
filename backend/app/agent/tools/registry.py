import os
from typing import Dict, Any, List, Optional
from app.config import get_sim_url
from app.agent.tools.base import ToolDefinition, ToolObservation

SIM_URL = get_sim_url()

ALL_TOOLS: List[ToolDefinition] = [
    # Document Tools
    ToolDefinition(
        name="search_documents",
        description="Navigate to Acme Document Center and scan available vendor/client documents.",
        category="DOCUMENT",
        parameters={
            "type": "object",
            "properties": {
                "company": {"type": "string", "description": "Company or vendor name to filter by (e.g. Acme Corp, XYZ Ltd, Nova Systems)"},
                "status": {"type": "string", "description": "Optional status filter (e.g. Pending, Processed, latest)"}
            }
        }
    ),
    ToolDefinition(
        name="open_document",
        description="Select and open a document in the Document Viewer to inspect its content.",
        category="DOCUMENT",
        parameters={
            "type": "object",
            "properties": {
                "document_name": {"type": "string", "description": "Name of the file to open"},
                "selector": {"type": "string", "description": "CSS selector or button ID to click (e.g. #view-doc-0)"}
            },
            "required": ["selector"]
        }
    ),
    ToolDefinition(
        name="extract_document_information",
        description="Extract structured metadata (invoice number, company, amount, date, due date) from open Document Viewer DOM.",
        category="DOCUMENT",
        parameters={
            "type": "object",
            "properties": {}
        }
    ),

    # Finance Tools
    ToolDefinition(
        name="open_finance_portal",
        description="Open the Acme Corporation Finance Accounting Portal.",
        category="FINANCE",
        parameters={
            "type": "object",
            "properties": {}
        }
    ),
    ToolDefinition(
        name="create_invoice",
        description="Fill and submit the Finance portal form to record an invoice in the general ledger.",
        category="FINANCE",
        parameters={
            "type": "object",
            "properties": {
                "invoice_number": {"type": "string"},
                "company": {"type": "string"},
                "amount": {"type": "string"},
                "due_date": {"type": "string"}
            },
            "required": ["invoice_number", "company", "amount", "due_date"]
        }
    ),
    ToolDefinition(
        name="inspect_existing_invoice",
        description="Inspect existing invoice record when Finance portal reports duplicate.",
        category="FINANCE",
        parameters={
            "type": "object",
            "properties": {
                "invoice_number": {"type": "string"}
            },
            "required": ["invoice_number"]
        }
    ),
    ToolDefinition(
        name="verify_invoice",
        description="Independently query the Finance ledger and verify that invoice number, company, amount, and due date match source data.",
        category="FINANCE",
        parameters={
            "type": "object",
            "properties": {
                "invoice_number": {"type": "string"},
                "expected_amount": {"type": "string"},
                "expected_company": {"type": "string"}
            },
            "required": ["invoice_number"]
        }
    ),

    # CRM Tools
    ToolDefinition(
        name="search_clients",
        description="Search Acme CRM for client contact profiles, account status, and billing emails.",
        category="CRM",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Client name, company name, or account ID"}
            },
            "required": ["query"]
        }
    ),
    ToolDefinition(
        name="get_client",
        description="Open client profile in CRM and retrieve verified billing email and outstanding invoices.",
        category="CRM",
        parameters={
            "type": "object",
            "properties": {
                "client_selector": {"type": "string", "description": "Button selector to view client card (e.g. #view-client-0)"}
            },
            "required": ["client_selector"]
        }
    ),

    # Email Tools
    ToolDefinition(
        name="draft_email",
        description="Compose and save a payment reminder or notification email as a draft in Acme Email System.",
        category="EMAIL",
        parameters={
            "type": "object",
            "properties": {
                "recipient": {"type": "string", "description": "Client email address"},
                "subject": {"type": "string", "description": "Email subject line"},
                "body": {"type": "string", "description": "Body message of reminder"}
            },
            "required": ["recipient", "subject", "body"]
        }
    ),
    ToolDefinition(
        name="send_email",
        description="Dispatch an email to client (Note: external communications require approval if user didn't pre-authorize).",
        category="EMAIL",
        parameters={
            "type": "object",
            "properties": {
                "recipient": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"}
            },
            "required": ["recipient", "subject", "body"]
        }
    ),
    ToolDefinition(
        name="verify_email_sent",
        description="Inspect Sent mailbox in Acme Email System and assert that message was delivered.",
        category="EMAIL",
        parameters={
            "type": "object",
            "properties": {
                "recipient": {"type": "string"},
                "subject": {"type": "string"}
            },
            "required": ["recipient"]
        }
    ),

    # User / Approval Tools
    ToolDefinition(
        name="request_approval",
        description="Pause execution and request human supervisor approval before performing external communication or sensitive updates.",
        category="USER",
        parameters={
            "type": "object",
            "properties": {
                "action_type": {"type": "string", "description": "e.g. SEND_CLIENT_EMAIL, OVERWRITE_INVOICE"},
                "description": {"type": "string", "description": "Explanation of what needs authorization"},
                "preview_data": {"type": "object", "description": "Recipient, subject, and body preview"}
            },
            "required": ["action_type", "description"]
        }
    ),

    # Completion Tool
    ToolDefinition(
        name="task_complete",
        description="Mark the task completed after independent verification with final evidence.",
        category="USER",
        parameters={
            "type": "object",
            "properties": {
                "summary": {"type": "string", "description": "Detailed completion report with evidence"}
            },
            "required": ["summary"]
        }
    )
]

def get_tool_definitions_for_llm() -> List[Dict[str, Any]]:
    """Converts tools into OpenAI / Groq tool specification format."""
    return [
        {
            "type": "function",
            "function": {
                "name": t.name,
                "description": t.description,
                "parameters": t.parameters
            }
        }
        for t in ALL_TOOLS
    ]
