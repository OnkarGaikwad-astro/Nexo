from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    goal = Column(Text, nullable=False)
    status = Column(String, default="IDLE")  # IDLE, UNDERSTANDING, PLANNING, EXECUTING, OBSERVING, ADAPTING, WAITING_FOR_APPROVAL, VERIFYING, COMPLETED, FAILED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    result_summary = Column(Text, nullable=True)
    approval_payload = Column(JSON, nullable=True)
    approval_status = Column(String, nullable=True) # PENDING, APPROVED, REJECTED
    evidence = Column(JSON, nullable=True)

class Step(Base):
    __tablename__ = "steps"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    state = Column(String, nullable=False) # UNDERSTAND, PLAN, OBSERVE, EXTRACT, EXECUTING, VERIFY, COMPLETE, FAILED
    tool_name = Column(String, nullable=True)
    tool_args = Column(JSON, nullable=True)
    observation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MemoryEntity(Base):
    __tablename__ = "memory_entities"
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, default="Vendor / Supplier")
    last_invoice = Column(String, nullable=True)
    amount = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    status = Column(String, default="Discovered")
    confidence = Column(String, default="98.5%")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class MemorySchema(Base):
    __tablename__ = "memory_schemas"
    id = Column(Integer, primary_key=True, index=True)
    portal = Column(String, nullable=False)
    url = Column(String, nullable=False)
    selectors = Column(JSON, nullable=False)  # List of {selector, purpose}
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class MemoryRule(Base):
    __tablename__ = "memory_rules"
    id = Column(Integer, primary_key=True, index=True)
    rule_text = Column(String, nullable=False)
    category = Column(String, default="Verification")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
