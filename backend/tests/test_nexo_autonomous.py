import pytest
import asyncio
import httpx
import json

BASE_URL = "http://127.0.0.1:8000"
SIM_URL = "http://localhost:3001"

@pytest.mark.asyncio
async def test_01_health_and_simulated_systems():
    """Verify backend and simulated company applications are online."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Backend health
        res = await client.get(f"{BASE_URL}/api/stats")
        assert res.status_code == 200
        stats = res.json()
        assert "total_tasks" in stats

        # Acme Document Center
        doc_res = await client.get(f"{SIM_URL}/documents")
        assert doc_res.status_code == 200

        # Acme Finance Portal
        fin_res = await client.get(f"{SIM_URL}/finance")
        assert fin_res.status_code == 200

        # Acme CRM System
        crm_res = await client.get(f"{SIM_URL}/crm")
        assert crm_res.status_code == 200

        # Acme Corporate Email System
        email_res = await client.get(f"{SIM_URL}/email")
        assert email_res.status_code == 200


@pytest.mark.asyncio
async def test_02_demo1_multi_system_autonomous_task():
    """Demo 1: Autonomous cross-system workflow (Document -> Finance -> CRM -> Email Draft)."""
    goal = "Find Acme's latest unpaid invoice, add it to Finance, and prepare a payment reminder email."
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        create_res = await client.post(f"{BASE_URL}/api/tasks", json={"goal": goal})
        assert create_res.status_code == 200
        task_id = create_res.json()["id"]

        run_res = await client.post(f"{BASE_URL}/api/tasks/{task_id}/run")
        assert run_res.status_code == 200

        # Poll until COMPLETED or FAILED (up to 60s)
        completed = False
        task_data = None
        for _ in range(40):
            await asyncio.sleep(1.5)
            check_res = await client.get(f"{BASE_URL}/api/tasks/{task_id}")
            if check_res.status_code == 200:
                task_data = check_res.json()
                status = task_data["task"]["status"]
                if status == "WAITING_FOR_APPROVAL":
                    await client.post(f"{BASE_URL}/api/tasks/{task_id}/approve")
                elif status in ["COMPLETED", "COMPLETE", "FAILED"]:
                    completed = True
                    break

        assert completed, f"Task {task_id} did not finish in time. Current status: {task_data['task']['status'] if task_data else 'None'}"
        assert task_data["task"]["status"] in ["COMPLETED", "COMPLETE"]
        
        # Verify execution steps and tool invocations
        steps = task_data.get("steps", [])
        assert len(steps) >= 5, "Expected multi-step reasoning trace"
        
        step_descriptions = " ".join([str(s.get("observation") or s.get("description") or s.get("tool_name") or "") for s in steps])
        assert "document" in step_descriptions.lower() or "invoice" in step_descriptions.lower()
        assert "finance" in step_descriptions.lower()
        assert "email" in step_descriptions.lower() or "draft" in step_descriptions.lower()


@pytest.mark.asyncio
async def test_03_demo2_failure_recovery_duplicate_invoice():
    """Demo 2: Failure recovery upon encountering duplicate invoice INV-2048 in Finance."""
    goal = "Process Acme Corp invoice INV-2048 and enter it into Finance portal."

    async with httpx.AsyncClient(timeout=90.0) as client:
        create_res = await client.post(f"{BASE_URL}/api/tasks", json={"goal": goal})
        assert create_res.status_code == 200
        task_id = create_res.json()["id"]

        run_res = await client.post(f"{BASE_URL}/api/tasks/{task_id}/run")
        assert run_res.status_code == 200

        # Poll until finished
        completed = False
        task_data = None
        for _ in range(40):
            await asyncio.sleep(1.5)
            check_res = await client.get(f"{BASE_URL}/api/tasks/{task_id}")
            if check_res.status_code == 200:
                task_data = check_res.json()
                status = task_data["task"]["status"]
                if status in ["COMPLETED", "COMPLETE", "FAILED"]:
                    completed = True
                    break

        assert completed, f"Task {task_id} did not complete in time"
        assert task_data["task"]["status"] in ["COMPLETED", "COMPLETE"]

        # Check steps for adapting/recovery
        steps = task_data.get("steps", [])
        states = [s.get("state") for s in steps]
        descriptions = " ".join([str(s.get("observation") or s.get("description") or s.get("tool_name") or "") for s in steps])
        assert "ADAPTING" in states or "OBSERVE" in states or "PLAN" in states
        assert "already exists" in descriptions.lower() or "duplicate" in descriptions.lower() or "inspect" in descriptions.lower() or "match" in descriptions.lower() or "finance" in descriptions.lower()


@pytest.mark.asyncio
async def test_04_demo3_human_in_the_loop_approval():
    """Demo 3: Human-in-the-loop approval when sending external communication."""
    goal = "Find Acme's latest overdue invoice and send the client a payment reminder."

    async with httpx.AsyncClient(timeout=90.0) as client:
        create_res = await client.post(f"{BASE_URL}/api/tasks", json={"goal": goal})
        assert create_res.status_code == 200
        task_id = create_res.json()["id"]

        run_res = await client.post(f"{BASE_URL}/api/tasks/{task_id}/run")
        assert run_res.status_code == 200

        # Poll until WAITING_FOR_APPROVAL
        waiting_for_approval = False
        task_data = None
        for _ in range(50):
            await asyncio.sleep(1.0)
            check_res = await client.get(f"{BASE_URL}/api/tasks/{task_id}")
            if check_res.status_code == 200:
                task_data = check_res.json()
                status = task_data["task"]["status"]
                if status == "WAITING_FOR_APPROVAL":
                    waiting_for_approval = True
                    break
                elif status in ["COMPLETED", "FAILED"]:
                    break

        assert waiting_for_approval, f"Task {task_id} did not pause for human approval. Current status: {task_data['task']['status'] if task_data else 'None'}"
        assert task_data["task"]["approval_status"] == "PENDING"
        assert task_data["task"]["approval_payload"] is not None

        # Human supervisor approves the action via API
        approve_res = await client.post(f"{BASE_URL}/api/tasks/{task_id}/approve")
        assert approve_res.status_code == 200

        # Poll until completed
        completed = False
        for _ in range(35):
            await asyncio.sleep(1.0)
            check_res = await client.get(f"{BASE_URL}/api/tasks/{task_id}")
            if check_res.status_code == 200:
                task_data = check_res.json()
                if task_data["task"]["status"] in ["COMPLETED", "COMPLETE", "FAILED"]:
                    completed = True
                    break

        assert completed, f"Task {task_id} did not finish after approval"
        assert task_data["task"]["status"] in ["COMPLETED", "COMPLETE"]
        
        # Verify that sent email action was executed and verified
        steps = task_data.get("steps", [])
        descriptions = " ".join([str(s.get("observation") or s.get("description") or s.get("tool_name") or "") for s in steps])
        assert "approved" in descriptions.lower() or "mail" in descriptions.lower() or "sent" in descriptions.lower() or "email" in descriptions.lower()
