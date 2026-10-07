import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 1. Database & Models
create_file("backend/app/database.py", """
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./nexo.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
""")

create_file("backend/app/models.py", """
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    goal = Column(Text, nullable=False)
    status = Column(String, default="IDLE")  # IDLE, EXECUTING, COMPLETED, FAILED, WAITING_APPROVAL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    result_summary = Column(Text, nullable=True)

class Step(Base):
    __tablename__ = "steps"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    state = Column(String, nullable=False) # PLANNING, OBSERVING, EXECUTING
    tool_name = Column(String, nullable=True)
    tool_args = Column(JSON, nullable=True)
    observation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
""")

# 2. Main API App
create_file("backend/app/main.py", """
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import asyncio
from app import database, models
from sse_starlette.sse import EventSourceResponse

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

@app.post("/api/tasks")
def create_task(task: TaskCreate, db: Session = Depends(database.get_db)):
    db_task = models.Task(goal=task.goal, status="READY")
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.post("/api/tasks/{task_id}/run")
async def run_task(task_id: int, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = "EXECUTING"
    db.commit()
    
    await events_queue.put({"event": "TASK_STARTED", "task_id": task_id, "status": "EXECUTING"})
    
    # Trigger background agent loop here
    # background_tasks.add_task(agent_loop, task_id)
    
    return {"message": "Task started", "task_id": task_id}

@app.get("/api/events")
async def sse_events():
    async def event_generator():
        while True:
            event = await events_queue.get()
            yield {"data": str(event)}
    return EventSourceResponse(event_generator())

@app.get("/api/health")
def health_check():
    return {"status": "online"}
""")

# 3. Agent & Playwright Stub
create_file("backend/app/agent/executor.py", """
from playwright.async_api import async_playwright

class BrowserTool:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None

    async def start(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=False)
        self.page = await self.browser.new_page()

    async def navigate(self, url: str):
        if not self.page:
            await self.start()
        await self.page.goto(url)
        return f"Navigated to {url}"

    async def close(self):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
""")

print("Successfully generated backend files.")
