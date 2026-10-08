'use client';
import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, SIM_BASE_URL } from '@/lib/config';

interface Step {
  id?: number;
  step_id?: number;
  state: string;
  description: string;
  tool_name?: string;
  tool_args?: any;
  observation?: string;
  url?: string;
  screenshot?: string;
  timestamp?: string;
}

interface ApprovalPayload {
  recipient?: string;
  subject?: string;
  body?: string;
  action?: string;
  invoice?: string;
  company?: string;
}

interface EvidenceItem {
  type: string;
  details: any;
  timestamp?: string;
}

export default function Home() {
  const [task, setTask] = useState("Find Acme's latest unpaid invoice, add it to Finance, and prepare a payment reminder email.");
  const [status, setStatus] = useState<'READY' | 'UNDERSTAND' | 'PLAN' | 'EXECUTING' | 'OBSERVE' | 'ADAPTING' | 'WAITING_FOR_APPROVAL' | 'VERIFY' | 'COMPLETED' | 'FAILED'>('READY');
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentUrl, setCurrentUrl] = useState(`${SIM_BASE_URL}/documents`);
  const [currentAction, setCurrentAction] = useState('Agent Ready');
  const [latestScreenshot, setLatestScreenshot] = useState<string | null>(null);
  const [approvalPayload, setApprovalPayload] = useState<ApprovalPayload | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [hasCopiedResult, setHasCopiedResult] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [browserViewMode, setBrowserViewMode] = useState<'stream' | 'interactive'>('stream');
  const [stats, setStats] = useState({ total_tasks: 0, completed_tasks: 0, success_rate: '100%' });
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const activeTaskIdRef = useRef<number | null>(null);
  const isUserScrolledUpRef = useRef(false);

  const handleCopyResult = () => {
    if (!resultSummary && !currentAction) return;
    const textToCopy = resultSummary || currentAction;
    navigator.clipboard?.writeText(textToCopy);
    setHasCopiedResult(true);
    setTimeout(() => setHasCopiedResult(false), 2500);
  };

  // Fetch initial stats
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      // Backend may be starting
    }
  };

  // SSE Event Listener for real-time streaming
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE_URL}/api/events`);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.event === 'PING') return;

          // If event belongs to a different task than what was actively initiated, ignore it
          if (data.task_id && activeTaskIdRef.current && data.task_id !== activeTaskIdRef.current) {
            return;
          }

          if (data.event === 'STEP') {
            setStatus(data.state as any);
            setCurrentAction(data.description);
            if (data.url) setCurrentUrl(data.url);
            if (data.screenshot) setLatestScreenshot(`data:image/jpeg;base64,${data.screenshot}`);
            
            setSteps((prev) => {
              const exists = prev.some(
                s => s.step_id === data.step_id && s.state === data.state && s.description === data.description
              );
              if (exists) return prev;
              return [...prev, data];
            });
          } else if (data.event === 'APPROVAL_REQUEST') {
            setStatus('WAITING_FOR_APPROVAL');
            setCurrentAction(`Human Approval Required: ${data.description || 'Confirm action'}`);
            if (data.approval_payload) {
              setApprovalPayload(data.approval_payload);
            }
          } else if (data.event === 'APPROVAL_RESPONDED') {
            setIsApproving(false);
            setApprovalPayload(null);
            if (data.approved) {
              setCurrentAction('Action approved by supervisor. Resuming execution...');
            } else {
              setCurrentAction('Action declined. Adapting plan...');
            }
          } else if (data.event === 'TASK_COMPLETED') {
            setStatus('COMPLETED');
            setCurrentAction('Workflow successfully verified & completed');
            if (data.summary) {
              setResultSummary(data.summary);
            }
            if (data.evidence && Array.isArray(data.evidence)) {
              setEvidence(data.evidence);
            }
            fetchStats();
          } else if (data.event === 'TASK_FAILED') {
            setStatus('FAILED');
            setResultSummary(data.error ? `Execution failed: ${data.error}` : 'Execution failed.');
            setCurrentAction(`Execution failed: ${data.error || 'Unknown error'}`);
            fetchStats();
          }
        } catch (err) {
          console.error("SSE parse error", err);
        }
      };

      eventSource.onerror = () => {
        // Auto reconnect handled by browser
      };
    } catch (e) {
      console.error("Failed to connect SSE", e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Auto scroll timeline to bottom on new steps (only when user hasn't scrolled up)
  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps]);

  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 70;
    isUserScrolledUpRef.current = !isNearBottom;
  };

  // Polling fallback to guarantee state sync
  useEffect(() => {
    if (!activeTaskId || status === 'COMPLETED' || status === 'FAILED') return;

    const poller = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/${activeTaskId}`);
        if (res.ok) {
          const data = await res.json();
          const taskObj = data.task;
          const fetchedSteps: Step[] = data.steps || [];

          if (taskObj) {
            if (taskObj.status === 'WAITING_FOR_APPROVAL') {
              setStatus('WAITING_FOR_APPROVAL');
              if (taskObj.approval_payload) {
                setApprovalPayload(taskObj.approval_payload);
              }
            } else {
              setApprovalPayload(null);
              if (taskObj.status === 'COMPLETED') {
                setStatus('COMPLETED');
                if (taskObj.result_summary) setResultSummary(taskObj.result_summary);
                if (taskObj.evidence) setEvidence(taskObj.evidence);
              } else if (taskObj.status === 'FAILED') {
                setStatus('FAILED');
                if (taskObj.result_summary) setResultSummary(taskObj.result_summary);
              } else if (taskObj.status && taskObj.status !== 'IDLE') {
                setStatus(taskObj.status as any);
              }
            }
          }

          if (fetchedSteps.length > 0) {
            setSteps(prev => {
              if (prev.length === fetchedSteps.length) {
                const prevLast = prev[prev.length - 1];
                const fetchedLast = fetchedSteps[fetchedSteps.length - 1];
                if (prevLast?.state === fetchedLast?.state && prevLast?.description === fetchedLast?.description) {
                  return prev;
                }
              }
              return fetchedSteps;
            });
            const last = fetchedSteps[fetchedSteps.length - 1];
            if (last.url) setCurrentUrl(last.url);
          }
        }
      } catch (err) {}
    }, 1500);

    return () => clearInterval(poller);
  }, [activeTaskId, status]);

  const handleRunTask = async (taskGoal?: string) => {
    const goalToRun = taskGoal || task;
    if (!goalToRun.trim()) return;

    setStatus('UNDERSTAND');
    setSteps([]);
    setResultSummary(null);
    isUserScrolledUpRef.current = false;
    setLatestScreenshot(null);
    setApprovalPayload(null);
    setEvidence([]);
    setCurrentUrl(`${SIM_BASE_URL}/documents`);
    setCurrentAction('Analyzing intent and retrieving company systems...');

    try {
      // 1. Create Task
      const createRes = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalToRun })
      });
      const taskData = await createRes.json();
      setActiveTaskId(taskData.id);
      activeTaskIdRef.current = taskData.id;

      // 2. Trigger Task Execution
      await fetch(`${API_BASE_URL}/api/tasks/${taskData.id}/run`, {
        method: 'POST'
      });
    } catch (e) {
      setStatus('FAILED');
      setCurrentAction('Failed to connect to Nexo backend server');
    }
  };

  const handleApproveAction = async (approved: boolean) => {
    if (!activeTaskId) return;
    setIsApproving(true);
    setApprovalPayload(null);
    if (approved) {
      setCurrentAction('Action approved by supervisor. Resuming autonomous execution...');
      setStatus('ADAPTING');
    } else {
      setCurrentAction('Action declined. Adapting workflow...');
      setStatus('ADAPTING');
    }
    try {
      const endpoint = approved ? 'approve' : 'reject';
      await fetch(`${API_BASE_URL}/api/tasks/${activeTaskId}/${endpoint}`, {
        method: 'POST'
      });
    } catch (e) {
      console.error('Approval request failed', e);
    } finally {
      setIsApproving(false);
    }
  };

  const cardStyle = {
    background: 'rgba(141, 190, 222, 0.25)',
    border: '1px solid rgba(141, 190, 222, 0.40)',
    borderRadius: '16px',
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'UNDERSTAND': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'PLAN': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'OBSERVE': return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'ADAPTING': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'WAITING_FOR_APPROVAL': return 'bg-orange-100 text-orange-800 border-orange-400 font-bold animate-pulse';
      case 'EXTRACT': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'EXECUTING': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'VERIFY': return 'bg-teal-100 text-teal-700 border-teal-300';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-400';
      case 'FAILED': return 'bg-rose-100 text-rose-700 border-rose-300';
      default: return 'bg-[rgba(141,190,222,0.2)] text-[#5C7F9B] border-transparent';
    }
  };

  const cognitivePhases = [
    { key: 'UNDERSTAND', label: '1. Understand' },
    { key: 'PLAN', label: '2. Plan' },
    { key: 'EXECUTING', label: '3. Execute' },
    { key: 'OBSERVE', label: '4. Observe' },
    { key: 'ADAPTING', label: '5. Adapt' },
    { key: 'WAITING_FOR_APPROVAL', label: '6. Approval' },
    { key: 'VERIFY', label: '7. Verify' },
    { key: 'COMPLETED', label: '8. Complete' }
  ];

  const isPhaseActive = (phaseKey: string) => {
    return status === phaseKey;
  };

  const isPhaseDone = (phaseKey: string) => {
    const order = ['UNDERSTAND', 'PLAN', 'EXECUTING', 'OBSERVE', 'ADAPTING', 'WAITING_FOR_APPROVAL', 'VERIFY', 'COMPLETED'];
    const currentIndex = order.indexOf(status);
    const phaseIndex = order.indexOf(phaseKey);
    return currentIndex > phaseIndex || status === 'COMPLETED';
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      
      {/* Top Banner: Product Positioning & Environment */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm" style={cardStyle}>
        <div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white bg-[#447A9C] shadow-sm text-sm">
              N
            </span>
            <h1 className="text-2xl font-bold text-[#2A4B61] tracking-wide">
              NEXO <span className="text-base font-medium text-[#5C7F9B]">| Autonomous AI Task Worker</span>
            </h1>
          </div>
          <p className="text-xs font-bold text-[#447A9C] uppercase tracking-wider mt-1">
            From Intent to Execution.
          </p>
          <p className="text-xs text-[#5C7F9B] mt-0.5 max-w-xl">
            NEXO turns natural-language company requests into completed, verified work across Acme Corporation internal systems.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/70 border border-[rgba(141,190,222,0.4)] px-3 py-1.5 rounded-xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-[#2A4B61]">Environment:</span>
            <span className="text-[#447A9C] font-semibold">Acme Corporation (Sandboxed)</span>
          </div>

          <div className="flex items-center gap-2 bg-white/70 border border-[rgba(141,190,222,0.4)] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#2A4B61]">
            <span>Success Rate:</span>
            <span className="text-emerald-700 font-bold">{stats.success_rate}</span>
            <span className="text-[#5C7F9B]">({stats.completed_tasks}/{stats.total_tasks})</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Autonomous Operations Console (Aligned bottom line across all 3 columns) */}
      <div className="grid grid-cols-12 gap-5 items-stretch">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN (Col 3): Company Workspace & Systems Hub     */}
        {/* ======================================================== */}
        <div className="col-span-3 flex flex-col gap-3.5 h-[825px]">
          
          {/* Company Systems Hub */}
          <div className="p-3 flex flex-col shadow-sm rounded-2xl shrink-0" style={cardStyle}>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-[#2A4B61] uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Company Systems
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                4 Active
              </span>
            </div>
            
            <p className="text-[10px] text-[#5C7F9B] mb-2">
              Simulated internal apps used autonomously by NEXO via tool calls.
            </p>

            <div className="space-y-1">
              {[
                { name: "Document Center", path: "/documents", desc: "Invoices, contracts, reports", icon: "📄" },
                { name: "Finance Portal", path: "/finance", desc: "General ledger & invoice audit", icon: "💳" },
                { name: "Client CRM", path: "/crm", desc: "Directory & accounts ledger", icon: "👥" },
                { name: "Corporate Email", path: "/email", desc: "Simulated drafts & sent mail", icon: "✉️" },
              ].map((sys, idx) => {
                const isActive = currentUrl.includes(sys.path);
                return (
                  <a 
                    key={idx}
                    href={`${SIM_BASE_URL}${sys.path}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className={`flex items-center justify-between p-1.5 px-2 rounded-xl transition-all group border ${
                      isActive 
                        ? 'bg-white border-[#447A9C] shadow-xs ring-1 ring-[#447A9C]/30' 
                        : 'bg-white/70 hover:bg-white border-[rgba(141,190,222,0.4)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">{sys.icon}</span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-[#2A4B61] group-hover:text-[#447A9C] truncate">{sys.name}</div>
                        <div className="text-[9px] text-[#5C7F9B] truncate">{sys.desc}</div>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ml-1.5 flex items-center gap-1 ${
                      isActive ? 'bg-[#447A9C] text-white' : 'bg-gray-100 text-[#5C7F9B]'
                    }`}>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>}
                      {isActive ? 'Active' : 'Online ↗'}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Enterprise Quick Actions & Capabilities Palette */}
          <div className="p-3 flex flex-col shadow-sm rounded-2xl shrink-0" style={cardStyle}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold text-[#2A4B61] uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Autonomous Actions
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">1-Click</span>
            </div>

            <p className="text-[10px] text-[#5C7F9B] mb-1.5">
              Rapid audit triggers across internal business systems:
            </p>

            <div className="space-y-1">
              {[
                { 
                  title: "Scan Acme Invoices", 
                  prompt: "find the latest invoice of Acme Corp and display details",
                  icon: "📑",
                  badge: "Docs" 
                },
                { 
                  title: "Sync General Ledger", 
                  prompt: "Process Acme Corp invoice INV-2048 and enter it into Finance portal.",
                  icon: "💳",
                  badge: "Finance" 
                },
                { 
                  title: "Verify CRM Profile", 
                  prompt: "Search Marcus Vance in CRM and verify contact profile",
                  icon: "👥",
                  badge: "CRM" 
                },
                { 
                  title: "Send Payment Email", 
                  prompt: "send the latest invoice via email to onkar.gaikwad@iitgn.ac.in",
                  icon: "✉️",
                  badge: "Email" 
                },
                { 
                  title: "Live Currency Rate", 
                  prompt: "Convert 250 USD to INR live exchange rate",
                  icon: "💱",
                  badge: "Forex" 
                }
              ].map((act, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTask(act.prompt);
                    handleRunTask(act.prompt);
                  }}
                  disabled={status !== 'READY' && status !== 'COMPLETED' && status !== 'FAILED'}
                  className="w-full flex items-center justify-between p-1.5 px-2 rounded-xl bg-white/70 hover:bg-white border border-[rgba(141,190,222,0.4)] hover:border-[#447A9C] text-left transition-all group disabled:opacity-60 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{act.icon}</span>
                    <span className="text-[11px] font-bold text-[#2A4B61] group-hover:text-[#447A9C] truncate">
                      {act.title}
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold text-[#5C7F9B] group-hover:text-[#447A9C] px-1.5 py-0.5 rounded bg-slate-100 group-hover:bg-blue-50 shrink-0">
                    Run →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Agent Engine & Infrastructure Telemetry */}
          <div className="p-3.5 flex flex-col shadow-sm rounded-2xl flex-1 min-h-0 justify-between overflow-hidden" style={cardStyle}>
            <div>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[rgba(141,190,222,0.25)]">
                <h3 className="text-xs font-bold text-[#2A4B61] uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  Runtime Guardrails
                </h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Operational
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-white/80 border border-[rgba(141,190,222,0.3)] shadow-2xs">
                  <span className="text-[#5C7F9B] font-medium">Cognitive Engine:</span>
                  <span className="text-[#2A4B61] font-bold">Groq / Gemini 2.5</span>
                </div>
                <div className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-white/80 border border-[rgba(141,190,222,0.3)] shadow-2xs">
                  <span className="text-[#5C7F9B] font-medium">Browser Mode:</span>
                  <span className="text-[#2A4B61] font-bold">Adaptive Chromium</span>
                </div>
                <div className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-white/80 border border-[rgba(141,190,222,0.3)] shadow-2xs">
                  <span className="text-[#5C7F9B] font-medium">Supervisor Gate:</span>
                  <span className="text-amber-800 font-bold">HITL Active</span>
                </div>
                <div className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-white/80 border border-[rgba(141,190,222,0.3)] shadow-2xs">
                  <span className="text-[#5C7F9B] font-medium">Outbound Mailer:</span>
                  <span className="text-emerald-700 font-bold">Gmail SMTP ✓</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[rgba(141,190,222,0.25)] flex items-center justify-between text-[10px] text-[#5C7F9B]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Port 3001 Isolated
              </span>
              <span className="font-semibold text-[#447A9C]">Zero-Leakage Active</span>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* CENTER COLUMN (Col 5): Task Composer & Execution Stream  */}
        {/* ======================================================== */}
        <div className="col-span-5 flex flex-col gap-3.5 h-[825px]">
          
          {/* Autonomous Task Composer */}
          <div className="p-3.5 flex flex-col shadow-sm shrink-0 rounded-2xl" style={cardStyle}>
            <div className="flex justify-between items-center mb-1.5">
              <h3 className="text-base font-bold text-[#2A4B61] flex items-center gap-2">
                <svg className="w-5 h-5 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Autonomous Goal Composer
              </h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(status)} flex items-center gap-1.5`}>
                {status !== 'READY' && status !== 'COMPLETED' && status !== 'FAILED' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                )}
                {status}
              </span>
            </div>
            
            <p className="text-xs text-[#5C7F9B] mb-2">
              Provide any high-level objective. NEXO determines the tools, sequence, and verification.
            </p>

            <textarea 
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What should Nexo do today for Acme Corporation?"
              rows={2}
              className="w-full text-[#2A4B61] font-semibold text-sm focus:outline-none min-h-[58px] p-2 rounded-xl bg-white/70 border border-[rgba(141,190,222,0.4)] resize-none placeholder:text-[#5C7F9B]/60 mb-2"
            />

            {/* Quick Action Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: '📧 Send Latest Invoice to onkar.gaikwad@iitgn.ac.in', query: 'send the latest invoice via email to onkar.gaikwad@iitgn.ac.in' },
                { label: '✉️ Send Email to Billing', query: 'Send an email to billing@acme.corp saying payment received for INV-2048' },
                { label: '📝 Draft Partner Email', query: 'Draft an email to sales@starlight.corp regarding engagement terms' },
                { label: '👥 CRM Client Profile', query: 'Search Marcus Vance in CRM and verify contact profile' },
                { label: '📄 Find Latest Invoice', query: 'find the latest invoice of xyz ltd' },
                { label: '💳 Process Ledger Invoice', query: 'Process Acme Corp invoice INV-2048 and enter it into Finance portal.' },
                { label: '⚡ End-to-End Pipeline', query: "Find Acme's latest unpaid invoice, add it to Finance, and prepare a payment reminder email." },
                { label: '🌐 Live Internet Search', query: 'Search the web for CentrAlign AI' },
                { label: '💱 Live Currency Exchange', query: 'Convert 250 USD to INR live exchange rate' },
                { label: '📰 Scrape Web Page', query: 'Fetch web page https://news.ycombinator.com' }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTask(chip.query)}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-white/60 hover:bg-white text-[#2A4B61] border border-[rgba(141,190,222,0.4)] hover:border-[#447A9C] transition-all"
                >
                  {chip.label}
                </button>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-[rgba(141,190,222,0.3)]">
              <div className="text-[11px] text-[#5C7F9B] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Playwright browser execution & Tool layer active
              </div>
              
              <button 
                onClick={() => handleRunTask()}
                disabled={status !== 'READY' && status !== 'COMPLETED' && status !== 'FAILED'}
                className="bg-[#447A9C] hover:bg-[#2A4B61] active:scale-95 text-white px-5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status !== 'READY' && status !== 'COMPLETED' && status !== 'FAILED' ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Executing ({status})...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Goal</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cognitive Lifecycle Steps Bar - Single row without horizontal scroll */}
          <div className="p-2 grid grid-cols-8 gap-1 shadow-sm rounded-xl shrink-0" style={cardStyle}>
            {cognitivePhases.map((phase) => {
              const active = isPhaseActive(phase.key);
              const done = isPhaseDone(phase.key);
              return (
                <div 
                  key={phase.key}
                  className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center truncate ${
                    active 
                      ? 'bg-[#447A9C] text-white shadow-sm ring-2 ring-[#447A9C]/40' 
                      : done 
                      ? 'bg-emerald-600/15 text-emerald-800 border border-emerald-400/30' 
                      : 'text-[#5C7F9B]/70 bg-white/40'
                  }`}
                  title={phase.label}
                >
                  {done && !active && <span className="text-[9px]">✓</span>}
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0"></span>}
                  <span className="truncate">{phase.label}</span>
                </div>
              );
            })}
          </div>

          {/* Execution Timeline Panel - Fixed size as requested */}
          <div className="p-3.5 flex flex-col shadow-sm flex-1 min-h-0 rounded-2xl" style={cardStyle}>
            <div className="flex justify-between items-center mb-1.5 shrink-0">
              <h3 className="text-base font-bold text-[#2A4B61] flex items-center gap-2">
                <svg className="w-4 h-4 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Execution Timeline & Cognition Trace
              </h3>
              <span className="text-xs font-semibold text-[#5C7F9B] bg-white/40 px-2 py-0.5 rounded-full">
                {steps.length} {steps.length === 1 ? 'Step' : 'Steps'} Recorded
              </span>
            </div>

            <p className="text-xs text-[#5C7F9B] mb-2.5 shrink-0">
              Live ReAct loop: Goal → Plan → Tool Action → Observation → Verification
            </p>

            <div onScroll={handleTimelineScroll} className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
              {steps.length > 0 ? (
                steps.map((st, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-[rgba(141,190,222,0.3)] shadow-xs transition-all hover:bg-white/90"
                  >
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[#447A9C] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(st.state)}`}>
                          {st.state}
                        </span>
                        {st.tool_name && (
                          <span className="text-[10px] font-mono font-medium text-[#447A9C] bg-[rgba(141,190,222,0.25)] px-2 py-0.5 rounded">
                            tool: {st.tool_name}
                          </span>
                        )}
                      </div>
                      
                      <p className="font-semibold text-[#2A4B61] text-xs leading-snug">
                        {st.description}
                      </p>
                      
                      {st.observation && st.observation !== st.description && (
                        <div className="mt-2 text-[11px] font-mono text-[#4A6477] bg-white/90 p-2 rounded-lg border border-[rgba(141,190,222,0.2)] whitespace-pre-wrap max-h-36 overflow-y-auto">
                          {st.observation}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-10 text-[#5C7F9B] gap-2">
                  <svg className="w-8 h-8 opacity-40 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="font-medium text-xs">Waiting for task initialization...</span>
                  <span className="text-[11px] opacity-75">Click any 1-Click Action or enter a custom goal to begin.</span>
                </div>
              )}
              <div ref={timelineEndRef} />
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN (Col 4): Browser View, Approval & Evidence */}
        {/* ======================================================== */}
        <div className="col-span-4 flex flex-col gap-3.5 h-[825px]">

          {/* 1. Live Browser Viewport Frame (Anchored at Top of Right Column) */}
          <div className="p-3 flex flex-col shadow-sm rounded-2xl shrink-0 bg-white/80 border border-[rgba(141,190,222,0.4)]" style={cardStyle}>
            <div className="flex justify-between items-center mb-1.5">
              <h3 className="text-sm font-bold text-[#2A4B61] flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Live Simulated Environment View
              </h3>

              {/* View Switcher: Stream vs Interactive */}
              <div className="flex items-center gap-1 bg-gray-200/70 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setBrowserViewMode('stream')}
                  className={`px-2 py-0.5 rounded-md transition-all ${browserViewMode === 'stream' ? 'bg-white text-[#2A4B61] shadow-xs' : 'text-[#5C7F9B] hover:text-[#2A4B61]'}`}
                  title="Live Playwright visual capture stream"
                >
                  📸 Agent Stream
                </button>
                <button
                  type="button"
                  onClick={() => setBrowserViewMode('interactive')}
                  className={`px-2 py-0.5 rounded-md transition-all ${browserViewMode === 'interactive' ? 'bg-white text-[#2A4B61] shadow-xs' : 'text-[#5C7F9B] hover:text-[#2A4B61]'}`}
                  title="Interactive live simulated DOM"
                >
                  🖥️ Live Portal
                </button>
              </div>
            </div>

            {/* Browser frame container */}
            <div className="rounded-xl bg-white border border-[rgba(141,190,222,0.45)] flex flex-col overflow-hidden shadow-inner">
              
              {/* Browser top chrome */}
              <div className="w-full py-1.5 px-3 border-b border-[rgba(141,190,222,0.35)] bg-slate-100 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/90"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D99A3D]/90"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/90"></div>
                </div>

                {/* URL Bar */}
                <div className="flex-1 bg-white border border-[rgba(141,190,222,0.35)] rounded-md px-2 py-0.5 text-[11px] text-[#2A4B61] font-mono truncate flex items-center justify-between">
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-[#10B981] text-[10px]">🔒</span>
                    <span className="truncate">{currentUrl}</span>
                  </div>
                  <span className="text-[9px] font-bold text-[#447A9C] bg-[rgba(141,190,222,0.2)] px-1.5 rounded shrink-0 ml-1">
                    Port 3001
                  </span>
                </div>
              </div>
              
              {/* Browser display body */}
              <div className="relative bg-slate-50 flex flex-col items-center justify-start overflow-hidden w-full h-[185px] transition-all">
                {browserViewMode === 'interactive' ? (
                  <iframe 
                    src={currentUrl} 
                    title="Live App Preview" 
                    className="w-full h-full border-0 bg-white"
                  />
                ) : latestScreenshot ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 overflow-hidden">
                    <img 
                      src={latestScreenshot} 
                      alt="Live Browser Viewport" 
                      className="w-full h-full object-contain object-top"
                      onError={() => setLatestScreenshot(null)}
                    />
                  </div>
                ) : (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) && status !== 'READY' ? (
                  <iframe 
                    src={currentUrl} 
                    title="Live App Preview" 
                    className="w-full h-full border-0 bg-white"
                  />
                ) : status !== 'READY' ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-[#5C7F9B] w-full h-full bg-slate-50">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-[#447A9C] flex items-center justify-center mb-1.5 text-base">
                      🌐
                    </div>
                    <p className="font-bold text-[#2A4B61] text-xs mb-0.5">Live External Navigation</p>
                    <p className="text-[10px] text-[#447A9C] font-mono mb-1.5 break-all max-w-xs px-2">{currentUrl}</p>
                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active in popup Chromium window
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center text-[#5C7F9B] h-full w-full">
                    <div className="w-8 h-8 rounded-full bg-[rgba(141,190,222,0.2)] flex items-center justify-center mb-1.5">
                      <svg className="w-4 h-4 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <p className="font-bold text-[#2A4B61] text-xs mb-0.5">Acme Corporation Simulator</p>
                    <p className="text-[10px] max-w-xs text-[#5C7F9B]">Playwright automation stream displays live internal app actions here.</p>
                  </div>
                )}
              </div>

              {/* Bottom active status banner */}
              <div className="py-1.5 px-3 bg-gray-50 border-t border-[rgba(141,190,222,0.3)] flex items-center justify-between text-[10px]">
                <span className="font-bold text-[#2A4B61] flex items-center gap-1.5 truncate max-w-[220px]">
                  <span className={`w-2 h-2 rounded-full ${status === 'COMPLETED' ? 'bg-emerald-500' : status === 'FAILED' ? 'bg-rose-500' : status === 'READY' ? 'bg-gray-400' : 'bg-blue-500 animate-pulse'}`}></span>
                  {currentAction}
                </span>
                <a 
                  href={currentUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[#447A9C] font-semibold hover:underline flex items-center gap-1 text-[10px]"
                >
                  Open in tab ↗
                </a>
              </div>
            </div>
          </div>

          {/* 2. HUMAN SUPERVISOR APPROVAL BANNER (Displays during HITL pause) */}
          {(status === 'WAITING_FOR_APPROVAL' && approvalPayload) && (
            <div className="p-3.5 rounded-2xl bg-amber-50/95 border-2 border-amber-400 shadow-md flex flex-col gap-2 shrink-0 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                  Human Approval Required
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                  Supervisor Gate
                </span>
              </div>

              <p className="text-xs font-semibold text-amber-950">
                NEXO prepared an external communication action and requires human sign-off before dispatching:
              </p>

              <div className="p-2.5 rounded-xl bg-white border border-amber-300 text-xs flex flex-col gap-1 font-mono">
                <div>
                  <span className="text-amber-800 font-bold">To: </span>
                  <span className="text-[#2A4B61]">{approvalPayload.recipient || 'client@example.com'}</span>
                </div>
                <div>
                  <span className="text-amber-800 font-bold">Subject: </span>
                  <span className="text-[#2A4B61]">{approvalPayload.subject || 'Payment Reminder'}</span>
                </div>
                <div className="mt-1 pt-1 border-t border-gray-200 text-[11px] text-gray-700 font-sans whitespace-pre-wrap max-h-20 overflow-y-auto">
                  {approvalPayload.body || 'Email content preview...'}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={() => handleApproveAction(true)}
                  disabled={isApproving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  ✓ Approve & Send
                </button>
                <button
                  onClick={() => handleApproveAction(false)}
                  disabled={isApproving}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1.5 px-3 rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* 3. VERIFIED TASK EVIDENCE & AUDIT LEDGER */}
          <div 
            className={`p-3.5 flex flex-col shadow-sm rounded-2xl ${
              status === 'COMPLETED' || status === 'FAILED' ? 'shrink-0 h-[225px]' : 'flex-1 min-h-0'
            }`} 
            style={cardStyle}
          >
            <div className="flex items-center justify-between mb-1 shrink-0">
              <h3 className="text-xs font-bold text-[#2A4B61] uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-emerald-600">🛡️</span>
                Verified Task Evidence & Audit
              </h3>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${evidence.length > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {evidence.length > 0 ? `${evidence.length} Verified` : 'Audit Active'}
              </span>
            </div>
            <p className="text-[10px] text-[#5C7F9B] mb-2 shrink-0">
              Tangible proofs and ledger records collected across company systems:
            </p>

            {evidence.length > 0 ? (
              <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
                {evidence.map((ev, idx) => {
                  const evAny = ev as any;
                  const evData = evAny.details !== undefined ? evAny.details : (evAny.data !== undefined ? evAny.data : ev);
                  return (
                    <div key={idx} className="p-2 rounded-xl bg-white/90 border border-emerald-500/20 shadow-2xs text-xs">
                      <div className="font-bold text-[#2A4B61] flex items-center justify-between gap-1.5 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-emerald-600 font-black">✓</span>
                          <span className="uppercase text-[10px] tracking-wider text-[#447A9C] font-extrabold">{ev.type ? ev.type.replace(/_/g, ' ') : 'ARTIFACT'}</span>
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          VERIFIED
                        </span>
                      </div>
                      {typeof evData === 'object' && evData !== null ? (
                        <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-200/60 font-mono text-[10px] text-slate-700 space-y-0.5">
                          {Object.entries(evData).map(([k, v]) => (
                            <div key={k} className="flex items-start justify-between gap-2">
                              <span className="text-[#5C7F9B] font-medium capitalize shrink-0">{k.replace(/_/g, ' ')}:</span>
                              <span className="text-[#2A4B61] font-semibold text-right break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] font-medium text-[#2A4B61] bg-slate-50/80 p-1.5 rounded-lg border border-slate-200/60 whitespace-pre-wrap">
                          {String(evData)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-3 bg-white/60 rounded-xl border border-[rgba(141,190,222,0.25)] flex-1 min-h-0">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm mb-1.5 font-bold border border-emerald-200">
                  🛡️
                </div>
                <span className="font-bold text-xs text-[#2A4B61] mb-0.5">Live Audit Ledger Active</span>
                <p className="text-[10px] text-[#5C7F9B] max-w-[240px] leading-relaxed mb-2">
                  Tool receipts, database records, and outbound drafts are recorded here as verified artifacts during task execution.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1 text-[9px] font-semibold text-[#447A9C]">
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[rgba(141,190,222,0.4)]">🔒 SHA-256</span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[rgba(141,190,222,0.4)]">📁 Sandbox Proof</span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[rgba(141,190,222,0.4)]">⚡ Auto-Verified</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. TASK COMPLETION & OUTPUT RESULTS (Positioned below Verified Task Evidence & Audit) */}
          {status === 'COMPLETED' && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/12 via-teal-500/8 to-white/95 border-2 border-emerald-500/40 shadow-md flex-1 min-h-0 flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-emerald-500/20 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#2A4B61] tracking-tight flex items-center gap-1">
                        Task Output & Deliverables
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-600/15 text-emerald-800 border border-emerald-400/40">
                          100% Verified
                        </span>
                      </h4>
                    </div>
                  </div>

                  <button 
                    onClick={handleCopyResult}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-50 text-[#2A4B61] border border-emerald-300/60 shadow-xs transition-all flex items-center gap-1"
                    title="Copy deliverable results to clipboard"
                  >
                    {hasCopiedResult ? (
                      <>
                        <span className="text-emerald-600 text-[10px]">✓</span>
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Deliverable Outcome Content Box */}
                <div className="p-2.5 rounded-xl bg-white/95 border border-emerald-500/25 shadow-2xs mb-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 mb-0.5 flex items-center gap-1">
                    <span className="text-emerald-600">📋</span> Final Deliverable Summary
                  </div>
                  <p className="text-[11px] text-[#2A4B61] leading-relaxed font-medium whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {resultSummary || currentAction || "Autonomous task accomplished and verified across company systems."}
                  </p>
                </div>
              </div>

              {/* Execution Summary Badges */}
              <div className="flex items-center flex-wrap gap-1.5 text-[9px] text-[#5C7F9B] shrink-0 pt-1 border-t border-emerald-500/15">
                <span className="bg-white/90 px-2 py-0.5 rounded-md border border-emerald-200/60 font-semibold shadow-2xs">
                  Cognitive Steps: <strong className="text-[#2A4B61]">{steps.length}</strong>
                </span>
                {evidence.length > 0 && (
                  <span className="bg-white/90 px-2 py-0.5 rounded-md border border-emerald-200/60 font-semibold shadow-2xs">
                    System Proofs: <strong className="text-emerald-700">{evidence.length} verified</strong>
                  </span>
                )}
                <span className="bg-white/90 px-2 py-0.5 rounded-md border border-emerald-200/60 font-semibold shadow-2xs truncate max-w-[200px]">
                  Target: <strong className="text-[#2A4B61]">{currentUrl}</strong>
                </span>
              </div>
            </div>
          )}

          {/* TASK FAILURE RESULTS CARD */}
          {status === 'FAILED' && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/12 via-red-500/8 to-white/95 border-2 border-rose-500/40 shadow-md flex-1 min-h-0 flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-rose-500/20 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                      ✕
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#2A4B61] tracking-tight">
                        Execution Interrupted
                      </h4>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRunTask()}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-1"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-white/95 border border-rose-500/25 shadow-2xs">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-rose-800 mb-0.5 flex items-center gap-1">
                    <span>⚠️</span> Error Details
                  </div>
                  <p className="text-[11px] text-rose-900 leading-relaxed font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {resultSummary || currentAction || "An unexpected error occurred during execution."}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
      
    </div>
  );
}
