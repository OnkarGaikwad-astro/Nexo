from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio
import subprocess
import sys
import os
import json
from app import database, models
from sse_starlette.sse import EventSourceResponse

from sqlalchemy import text

# Ensure tables are created
models.Base.metadata.create_all(bind=database.engine)

# Auto-migrate SQLite schema for newly added columns if missing
with database.engine.connect() as conn:
    for col, col_type in [("approval_payload", "JSON"), ("approval_status", "VARCHAR"), ("evidence", "JSON")]:
        try:
            conn.execute(text(f"ALTER TABLE tasks ADD COLUMN {col} {col_type}"))
            conn.commit()
        except Exception:
            pass

app = FastAPI(title="Nexo Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskCreate(BaseModel):
    goal: str

events_queue = asyncio.Queue()

def execute_agent_sync(task_id: int):
    """Spawns an isolated Python process to run Playwright safely on Windows."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    venv_py = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    python_exe = venv_py if os.path.exists(venv_py) else sys.executable
    script_path = os.path.join(backend_dir, "app", "run_browser.py")
    
    cmd = [python_exe, script_path, "--task-id", str(task_id)]
    print(f"Spawning background agent: {' '.join(cmd)}")
    subprocess.Popen(cmd, cwd=backend_dir)

@app.post("/api/tasks")
def create_task(task: TaskCreate, db: Session = Depends(database.get_db)):
    db_task = models.Task(goal=task.goal, status="READY")
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/api/tasks")
def list_tasks(db: Session = Depends(database.get_db)):
    tasks = db.query(models.Task).order_by(models.Task.id.desc()).all()
    return tasks

@app.get("/api/tasks/{task_id}")
def get_task(task_id: int, db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    steps = db.query(models.Step).filter(models.Step.task_id == task_id).order_by(models.Step.id.asc()).all()
    return {
        "task": task,
        "steps": steps
    }

@app.get("/api/tasks/{task_id}/steps")
def get_task_steps(task_id: int, db: Session = Depends(database.get_db)):
    steps = db.query(models.Step).filter(models.Step.task_id == task_id).order_by(models.Step.id.asc()).all()
    return steps

@app.post("/api/tasks/{task_id}/run")
async def run_task(task_id: int, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = "EXECUTING"
    db.commit()
    
    await events_queue.put({
        "event": "TASK_STARTED",
        "task_id": task_id,
        "status": "EXECUTING"
    })
    
    # Spawn browser worker
    background_tasks.add_task(execute_agent_sync, task_id)
    
    return {"message": "Task started", "task_id": task_id}

@app.post("/api/tasks/{task_id}/approve")
async def approve_task(task_id: int, db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.approval_status = "APPROVED"
    task.status = "ADAPTING"
    db.commit()
    await events_queue.put({
        "event": "APPROVAL_RESPONDED",
        "task_id": task_id,
        "approved": True
    })
    return {"status": "ok", "message": "Action approved"}

@app.post("/api/tasks/{task_id}/reject")
async def reject_task(task_id: int, db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.approval_status = "REJECTED"
    task.status = "ADAPTING"
    db.commit()
    await events_queue.put({
        "event": "APPROVAL_RESPONDED",
        "task_id": task_id,
        "approved": False
    })
    return {"status": "ok", "message": "Action rejected"}

@app.post("/api/internal/event")
async def receive_internal_event(request: Request, db: Session = Depends(database.get_db)):
    """Internal webhook for NexoAgent to publish real-time events to frontend SSE."""
    body = await request.json()
    
    # Check for approval request or evidence
    if body.get("event") == "APPROVAL_REQUEST" and body.get("task_id"):
        task = db.query(models.Task).filter(models.Task.id == body["task_id"]).first()
        if task and task.approval_status != "APPROVED":
            task.status = "WAITING_FOR_APPROVAL"
            task.approval_status = "PENDING"
            task.approval_payload = body.get("approval_payload")
            db.commit()
    elif body.get("event") == "TASK_COMPLETED" and body.get("task_id"):
        task = db.query(models.Task).filter(models.Task.id == body["task_id"]).first()
        if task:
            task.status = "COMPLETED"
            if body.get("evidence"):
                task.evidence = body.get("evidence")
            if body.get("summary"):
                task.result_summary = body.get("summary")
            db.commit()
    elif body.get("event") == "TASK_FAILED" and body.get("task_id"):
        task = db.query(models.Task).filter(models.Task.id == body["task_id"]).first()
        if task:
            task.status = "FAILED"
            if body.get("error"):
                task.result_summary = f"Execution failed: {body.get('error')}"
            db.commit()

    await events_queue.put(body)
    return {"status": "ok"}

class EntityCreate(BaseModel):
    name: str
    category: Optional[str] = "Vendor / Supplier"
    last_invoice: Optional[str] = None
    amount: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = "Discovered"
    confidence: Optional[str] = "98.5%"

class RuleCreate(BaseModel):
    rule_text: str
    category: Optional[str] = "Verification"
    active: Optional[bool] = True

def seed_initial_memory_if_empty(db: Session):
    try:
        if db.query(models.MemoryEntity).count() == 0:
            default_entities = [
                models.MemoryEntity(
                    entity_id="ENT-01",
                    name="Acme Corp",
                    category="Vendor / Supplier",
                    last_invoice="INV-2048",
                    amount="₹84,500",
                    due_date="15 October 2026",
                    status="Verified & Entered",
                    confidence="99.8%"
                ),
                models.MemoryEntity(
                    entity_id="ENT-02",
                    name="XYZ Ltd",
                    category="Vendor",
                    last_invoice="INV-1092",
                    amount="₹112,000",
                    due_date="20 October 2026",
                    status="Verified & Entered",
                    confidence="99.9%"
                ),
                models.MemoryEntity(
                    entity_id="ENT-03",
                    name="Nova Systems",
                    category="Vendor",
                    last_invoice="INV-5521",
                    amount="₹35,400",
                    due_date="28 October 2026",
                    status="Discovered in Documents",
                    confidence="95.0%"
                )
            ]
            db.add_all(default_entities)
            db.commit()

        if db.query(models.MemorySchema).count() == 0:
            sim_url = os.getenv("SIM_URL", "http://localhost:3001")
            default_schemas = [
                models.MemorySchema(
                    portal="Document Center",
                    url=f"{sim_url}/documents",
                    selectors=[
                        {"selector": "table tbody tr", "purpose": "List of incoming vendor invoices"},
                        {"selector": "#document-viewer", "purpose": "Target document inspection area"},
                        {"selector": "#document-viewer strong", "purpose": "Metadata field labels"}
                    ]
                ),
                models.MemorySchema(
                    portal="Finance Accounting Portal",
                    url=f"{sim_url}/finance",
                    selectors=[
                        {"selector": "#invoiceNumber", "purpose": "Unique invoice identifier input"},
                        {"selector": "#company", "purpose": "Company / Vendor name input"},
                        {"selector": "#amount", "purpose": "Total invoice currency amount"},
                        {"selector": "#dueDate", "purpose": "Due date deadline input"},
                        {"selector": "#saveInvoice", "purpose": "Submission trigger action button"}
                    ]
                ),
                models.MemorySchema(
                    portal="Client & CRM System",
                    url=f"{sim_url}/crm",
                    selectors=[
                        {"selector": "#crm-search-input", "purpose": "Client query filter"},
                        {"selector": "#clients-table", "purpose": "Corporate accounts directory"},
                        {"selector": "#client-details", "purpose": "Inspected client profile card"}
                    ]
                ),
                models.MemorySchema(
                    portal="Corporate Email System",
                    url=f"{sim_url}/email",
                    selectors=[
                        {"selector": "#tab-compose", "purpose": "Compose message tab switch"},
                        {"selector": "#email-recipient", "purpose": "Destination contact input"},
                        {"selector": "#email-subject", "purpose": "Subject line input"},
                        {"selector": "#email-body", "purpose": "Communication body textarea"},
                        {"selector": "#send-email-btn", "purpose": "Dispatch message trigger button"},
                        {"selector": "#save-draft-btn", "purpose": "Save draft trigger button"}
                    ]
                )
            ]
            db.add_all(default_schemas)
            db.commit()

        if db.query(models.MemoryRule).count() == 0:
            default_rules = [
                models.MemoryRule(
                    rule_text="Always perform independent DOM verification after ledger record creation",
                    category="Verification",
                    active=True
                ),
                models.MemoryRule(
                    rule_text="Enforce strict matching on Vendor Name and Invoice Identifier",
                    category="Validation",
                    active=True
                ),
                models.MemoryRule(
                    rule_text="Guard against duplicate ledger insertions for existing invoice IDs",
                    category="Safeguard",
                    active=True
                )
            ]
            db.add_all(default_rules)
            db.commit()
    except Exception as e:
        print(f"Error seeding memory: {e}")
        db.rollback()

# Seed on startup
with database.SessionLocal() as session:
    seed_initial_memory_if_empty(session)

@app.get("/api/memory")
def get_memory(db: Session = Depends(database.get_db)):
    entities = db.query(models.MemoryEntity).order_by(models.MemoryEntity.id.asc()).all()
    schemas = db.query(models.MemorySchema).order_by(models.MemorySchema.id.asc()).all()
    rules = db.query(models.MemoryRule).order_by(models.MemoryRule.id.asc()).all()
    return {
        "entities": entities,
        "schemas": schemas,
        "rules": rules
    }

@app.post("/api/memory/entities")
async def save_memory_entity(data: EntityCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.MemoryEntity).filter(
        (models.MemoryEntity.name.ilike(f"%{data.name}%"))
    ).first()
    
    if existing:
        existing.last_invoice = data.last_invoice or existing.last_invoice
        existing.amount = data.amount or existing.amount
        existing.due_date = data.due_date or existing.due_date
        existing.status = data.status or existing.status
        existing.confidence = data.confidence or existing.confidence
        db.commit()
        db.refresh(existing)
        res = existing
    else:
        count = db.query(models.MemoryEntity).count() + 1
        new_ent = models.MemoryEntity(
            entity_id=f"ENT-{count:02d}",
            name=data.name,
            category=data.category or "Vendor / Supplier",
            last_invoice=data.last_invoice,
            amount=data.amount,
            due_date=data.due_date,
            status=data.status or "Discovered",
            confidence=data.confidence or "98.5%"
        )
        db.add(new_ent)
        db.commit()
        db.refresh(new_ent)
        res = new_ent
        
    await events_queue.put({"event": "MEMORY_UPDATED", "entity": res.name})
    return res

@app.post("/api/memory/rules")
async def create_memory_rule(data: RuleCreate, db: Session = Depends(database.get_db)):
    rule = models.MemoryRule(
        rule_text=data.rule_text,
        category=data.category or "Custom",
        active=data.active if data.active is not None else True
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    await events_queue.put({"event": "MEMORY_UPDATED", "rule": rule.rule_text})
    return rule

@app.patch("/api/memory/rules/{rule_id}/toggle")
async def toggle_memory_rule(rule_id: int, db: Session = Depends(database.get_db)):
    rule = db.query(models.MemoryRule).filter(models.MemoryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.active = not rule.active
    db.commit()
    db.refresh(rule)
    await events_queue.put({"event": "MEMORY_UPDATED", "rule_id": rule_id, "active": rule.active})
    return rule

@app.get("/api/stats")
def get_stats(db: Session = Depends(database.get_db)):
    total = db.query(models.Task).count()
    completed = db.query(models.Task).filter(models.Task.status == "COMPLETED").count()
    failed = db.query(models.Task).filter(models.Task.status == "FAILED").count()
    executing = db.query(models.Task).filter(models.Task.status == "EXECUTING").count()
    
    rate = f"{int((completed / total) * 100)}%" if total > 0 else "100%"
    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "failed_tasks": failed,
        "executing_tasks": executing,
        "success_rate": rate
    }

@app.get("/api/events")
async def sse_events(request: Request):
    """Server-Sent Events endpoint streaming live agent activities."""
    async def event_generator():
        while True:
            # Check client disconnection
            if await request.is_disconnected():
                break
            try:
                # Wait for next event or heartbeat
                event = await asyncio.wait_for(events_queue.get(), timeout=15.0)
                yield {"data": json.dumps(event)}
            except asyncio.TimeoutError:
                # Heartbeat to keep connection alive
                yield {"data": json.dumps({"event": "PING"})}
            except Exception:
                break
                
    return EventSourceResponse(event_generator())

@app.get("/api/health")
def health_check():
    return {"status": "online"}

