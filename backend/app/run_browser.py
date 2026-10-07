import sys
import os
import asyncio
import argparse

# Add backend directory to sys.path so app imports work cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.agent.agent import NexoAgent
from app.database import SessionLocal
from app import models

async def main():
    parser = argparse.ArgumentParser(description="Nexo Playwright Agent Runner")
    parser.add_argument("--task-id", type=int, default=None, help="Task ID to execute")
    args = parser.parse_args()

    task_id = args.task_id
    
    # If no task_id provided, find the most recent task or create a demo one
    if not task_id:
        db = SessionLocal()
        latest = db.query(models.Task).order_by(models.Task.id.desc()).first()
        if latest and latest.status in ["READY", "EXECUTING"]:
            task_id = latest.id
        else:
            demo_task = models.Task(
                goal="Find latest Acme invoice and enter it into Finance portal",
                status="READY"
            )
            db.add(demo_task)
            db.commit()
            db.refresh(demo_task)
            task_id = demo_task.id
        db.close()

    print(f"Starting Nexo Agent for Task ID: {task_id}")
    agent = NexoAgent(task_id=task_id)
    await agent.run()
    print(f"Finished Nexo Agent for Task ID: {task_id}")

if __name__ == "__main__":
    asyncio.run(main())
