from typing import Dict, Any, Optional, Callable, Awaitable
from pydantic import BaseModel

class ToolObservation(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None

class ToolDefinition(BaseModel):
    name: str
    description: str
    category: str  # DOCUMENT, FINANCE, CRM, EMAIL, BROWSER, USER
    parameters: Dict[str, Any]
