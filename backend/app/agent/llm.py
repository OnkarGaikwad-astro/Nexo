import os
import json
from openai import AsyncOpenAI
from pydantic import BaseModel

client = AsyncOpenAI(api_key=os.getenv("LLM_API_KEY", "dummy-key"))
MODEL = os.getenv("MODEL_NAME", "gpt-4o")

SYSTEM_PROMPT = """
You are Nexo, an autonomous AI Task Worker.
Your goal is to accomplish the user's task using the provided tools.
You must:
1. Understand the goal.
2. Formulate a plan.
3. Execute actions using tools.
4. Observe the results.
5. Verify the final outcome before completing the task.

Do not assume success. Always verify.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "browser_navigate",
            "description": "Navigate to a specific URL in the browser.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "The URL to navigate to."}
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "browser_extract_text",
            "description": "Extract all readable text from the current browser page.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "finance_create_invoice",
            "description": "Create an invoice in the finance system.",
            "parameters": {
                "type": "object",
                "properties": {
                    "invoice_number": {"type": "string"},
                    "company": {"type": "string"},
                    "amount": {"type": "string"},
                    "due_date": {"type": "string"}
                },
                "required": ["invoice_number", "company", "amount", "due_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "task_complete",
            "description": "Mark the task as completed once you have verified success.",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary": {"type": "string", "description": "A summary of what was accomplished."}
                },
                "required": ["summary"]
            }
        }
    }
]

async def chat_with_agent(messages: list):
    """Sends a conversation history to the LLM and returns the response."""
    if not messages:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto"
        )
        return response.choices[0].message
    except Exception as e:
        print(f"LLM Error: {e}")
        return None
