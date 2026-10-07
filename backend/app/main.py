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

# Ensure tables are created
models.Base.metadata.create_all(bind=database.engine)

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
    python_exe = sys.executable
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

@app.post("/api/internal/event")
async def receive_internal_event(request: Request):
    """Internal webhook for NexoAgent to publish real-time events to frontend SSE."""
    body = await request.json()
    await events_queue.put(body)
    return {"status": "ok"}

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
