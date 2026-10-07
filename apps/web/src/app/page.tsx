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

export default function Home() {
  const [task, setTask] = useState('Find latest Acme invoice and enter it into Finance portal');
  const [status, setStatus] = useState<'READY' | 'UNDERSTAND' | 'PLAN' | 'OBSERVE' | 'EXTRACT' | 'EXECUTING' | 'VERIFY' | 'COMPLETED' | 'FAILED'>('READY');
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentUrl, setCurrentUrl] = useState(SIM_BASE_URL);
  const [currentAction, setCurrentAction] = useState('Browser Standby');
  const [latestScreenshot, setLatestScreenshot] = useState<string | null>(null);
  const [stats, setStats] = useState({ total_tasks: 0, completed_tasks: 0, success_rate: '100%' });
  const timelineEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial stats & check for any recent tasks
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

          if (data.event === 'STEP') {
            setStatus(data.state as any);
            setCurrentAction(data.description);
            if (data.url) setCurrentUrl(data.url);
            if (data.screenshot) setLatestScreenshot(`data:image/jpeg;base64,${data.screenshot}`);
            
            setSteps((prev) => {
              // Avoid duplicates
              const exists = prev.some(s => s.step_id === data.step_id && s.state === data.state && s.description === data.description);
              if (exists) return prev;
              return [...prev, data];
            });
          } else if (data.event === 'TASK_COMPLETED') {
            setStatus('COMPLETED');
            setCurrentAction('Workflow successfully verified & completed');
            fetchStats();
          } else if (data.event === 'TASK_FAILED') {
            setStatus('FAILED');
            setCurrentAction(`Execution failed: ${data.error || 'Unknown error'}`);
            fetchStats();
          }
        } catch (err) {
          console.error("SSE parse error", err);
        }
      };

      eventSource.onerror = () => {
        // EventSource will auto reconnect
      };
    } catch (e) {
      console.error("Failed to connect SSE", e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Auto scroll timeline to bottom on new steps
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  // Polling fallback to guarantee state sync if SSE misses anything
  useEffect(() => {
    if (!activeTaskId || status === 'COMPLETED' || status === 'FAILED') return;

    const poller = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/${activeTaskId}/steps`);
        if (res.ok) {
          const fetchedSteps: Step[] = await res.json();
          if (fetchedSteps.length > 0) {
            setSteps(fetchedSteps);
            const last = fetchedSteps[fetchedSteps.length - 1];
            if (last.state === 'COMPLETE') {
              setStatus('COMPLETED');
            } else if (last.state === 'FAILED') {
              setStatus('FAILED');
            } else {
              setStatus(last.state as any);
            }
          }
        }
      } catch (err) {}
    }, 1500);

    return () => clearInterval(poller);
  }, [activeTaskId, status]);

  const handleRun = async () => {
    if (!task.trim()) return;
    setStatus('UNDERSTAND');
    setSteps([]);
    setLatestScreenshot(null);
    setCurrentUrl(SIM_BASE_URL);
    setCurrentAction('Initializing agent cognition...');

    try {
      // 1. Create Task
      const createRes = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: task })
      });
      const taskData = await createRes.json();
      setActiveTaskId(taskData.id);

      // 2. Trigger Task Execution
      await fetch(`${API_BASE_URL}/api/tasks/${taskData.id}/run`, {
        method: 'POST'
      });
    } catch (e) {
      setStatus('FAILED');
      setCurrentAction('Failed to connect to Nexo backend server');
    }
  };

  const cardStyle = {
    background: 'rgba(141, 190, 222, 0.25)',
    border: '1px solid rgba(141, 190, 222, 0.40)',
    borderRadius: '16px',
  };

  const quickPrompts = [
    "Find latest Acme invoice and enter it into Finance portal",
    "Process pending invoices for Acme Corp from Document Center",
    "Extract Acme Corp INV-2048 details and record to accounting"
  ];

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'UNDERSTAND': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'PLAN': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'OBSERVE': return 'bg-sky-100 text-sky-700 border-sky-300';
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
    { key: 'OBSERVE', label: '3. Observe' },
    { key: 'EXTRACT', label: '4. Extract' },
    { key: 'EXECUTING', label: '5. Execute' },
    { key: 'VERIFY', label: '6. Verify' },
    { key: 'COMPLETED', label: '7. Complete' }
  ];

  const isPhaseActive = (phaseKey: string) => {
    return status === phaseKey;
  };

  const isPhaseDone = (phaseKey: string) => {
    const order = ['UNDERSTAND', 'PLAN', 'OBSERVE', 'EXTRACT', 'EXECUTING', 'VERIFY', 'COMPLETED'];
    const currentIndex = order.indexOf(status);
    const phaseIndex = order.indexOf(phaseKey);
    return currentIndex > phaseIndex || status === 'COMPLETED';
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      
      {/* Cognitive Lifecycle Header Bar */}
      <div className="p-4 flex items-center justify-between" style={cardStyle}>
        <div className="text-xs font-bold uppercase tracking-wider text-[#5C7F9B] mr-4">
          Cognitive Cycle:
        </div>
        <div className="flex-1 flex items-center justify-between gap-2 overflow-x-auto">
          {cognitivePhases.map((phase) => {
            const active = isPhaseActive(phase.key);
            const done = isPhaseDone(phase.key);
            return (
              <div 
                key={phase.key}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active 
                    ? 'bg-[#447A9C] text-white shadow-md scale-105 ring-2 ring-[#447A9C]/40' 
                    : done 
                    ? 'bg-emerald-600/15 text-emerald-800 border border-emerald-400/30' 
                    : 'text-[#5C7F9B]/70 bg-white/30'
                }`}
              >
                {done && !active && <span className="text-[10px]">✓</span>}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>}
                <span>{phase.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Main Task Composer */}
        <div className="col-span-2 p-6 flex flex-col justify-between relative shadow-sm" style={cardStyle}>
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-[#2A4B61] flex items-center gap-2">
                <svg className="w-5 h-5 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Autonomous Task Input
              </h3>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(status)} flex items-center gap-1.5`}>
                  {status !== 'READY' && status !== 'COMPLETED' && status !== 'FAILED' && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  )}
                  Status: {status}
                </span>
              </div>
            </div>
            
            <textarea 
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What goal would you like Nexo to accomplish today?"
              className="w-full text-[#2A4B61] font-semibold text-base focus:outline-none min-h-[75px] resize-none bg-transparent placeholder:text-[#5C7F9B]/60"
            />
            
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-[#5C7F9B] self-center mr-1">Suggestions:</span>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setTask(prompt)}
                  className="text-xs font-medium text-[#447A9C] bg-white/50 hover:bg-white/80 border border-[rgba(141,190,222,0.4)] px-2.5 py-1 rounded-full transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-4 pt-3 border-t border-[rgba(141,190,222,0.3)]">
            <div className="text-xs text-[#5C7F9B] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Playwright browser automation ready
            </div>
            
            <button 
              onClick={handleRun}
              disabled={status !== 'READY' && status !== 'COMPLETED' && status !== 'FAILED'}
              className="bg-[#447A9C] hover:bg-[#2A4B61] active:scale-95 text-white px-7 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status !== 'READY' && status !== 'COMPLETED' && status !== 'FAILED' ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Executing ({status})...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Run Autonomous Task</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status / Quick Stats Card */}
        <div className="col-span-1 p-6 flex flex-col justify-between shadow-sm" style={cardStyle}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[rgba(141,190,222,0.4)] text-[#447A9C]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Agent Live
              </span>
            </div>
            
            <div className="text-xs font-bold text-[#5C7F9B] uppercase mb-1">Tasks Completed</div>
            <div className="text-3xl font-bold text-[#2A4B61]">{stats.completed_tasks} / {stats.total_tasks}</div>
            
            <div className="text-xs text-[#10B981] mt-2 flex items-center gap-1 font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Success Rate: {stats.success_rate}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[rgba(141,190,222,0.3)] text-xs text-[#5C7F9B]">
            Connected to <strong>FastAPI :8000</strong> & <strong>Playwright Chromium</strong>
          </div>
        </div>
      </div>

      {/* Split lower area */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-[480px]">
        
        {/* Timeline / Live Progress Panel */}
        <div className="col-span-7 p-6 flex flex-col shadow-sm" style={cardStyle}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-[#2A4B61] flex items-center gap-2">
              <svg className="w-5 h-5 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Execution Timeline
            </h3>
            <span className="text-xs font-semibold text-[#5C7F9B] bg-white/40 px-2.5 py-1 rounded-full">
              {steps.length} {steps.length === 1 ? 'Step' : 'Steps'} Recorded
            </span>
          </div>
          <p className="text-xs text-[#5C7F9B] mb-4">Real-time trace of cognitive reasoning and tool execution</p>
          
          <div className="flex-1 overflow-y-auto max-h-[440px] pr-2 space-y-4">
            {steps.length > 0 ? (
              steps.map((st, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/60 border border-[rgba(141,190,222,0.3)] shadow-xs transition-all hover:bg-white/80"
                >
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-[#447A9C] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(st.state)}`}>
                        {st.state}
                      </span>
                      {st.tool_name && (
                        <span className="text-[11px] font-mono font-medium text-[#447A9C] bg-[rgba(141,190,222,0.25)] px-2 py-0.5 rounded">
                          tool: {st.tool_name}
                        </span>
                      )}
                    </div>
                    
                    <p className="font-semibold text-[#2A4B61] text-sm leading-snug">
                      {st.description}
                    </p>
                    
                    {st.observation && st.observation !== st.description && (
                      <div className="mt-2 text-xs font-mono text-[#4A6477] bg-white/80 p-2.5 rounded-lg border border-[rgba(141,190,222,0.2)] whitespace-pre-wrap">
                        {st.observation}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-[#5C7F9B] gap-2">
                <svg className="w-10 h-10 opacity-40 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-medium text-sm">Awaiting task submission...</span>
                <span className="text-xs opacity-75">Click "Run Autonomous Task" to initiate real-time browser execution.</span>
              </div>
            )}
            <div ref={timelineEndRef} />
          </div>
        </div>

        {/* Live Browser Preview Panel */}
        <div className="col-span-5 p-6 flex flex-col shadow-sm" style={cardStyle}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-[#2A4B61] flex items-center gap-2">
              <svg className="w-5 h-5 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Live Browser View
            </h3>
            <span className="text-xs font-bold text-[#447A9C] bg-white/50 px-2.5 py-1 rounded-full border border-[rgba(141,190,222,0.4)]">
              Target: Port 3001
            </span>
          </div>

          {/* Browser frame container */}
          <div className="flex-1 rounded-xl bg-[rgba(246,246,233,0.7)] border border-[rgba(141,190,222,0.45)] flex flex-col overflow-hidden shadow-inner">
            
            {/* Browser top chrome */}
            <div className="w-full py-2 px-3 border-b border-[rgba(141,190,222,0.35)] bg-white/40 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#D99A3D]/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/80"></div>
              </div>

              {/* URL Bar */}
              <div className="flex-1 bg-white/70 border border-[rgba(141,190,222,0.3)] rounded-md px-2.5 py-1 text-xs text-[#2A4B61] font-mono truncate flex items-center gap-1.5">
                <svg className="w-3 h-3 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>{currentUrl}</span>
              </div>
            </div>
            
            {/* Browser display body */}
            <div className="flex-1 relative bg-white flex flex-col items-center justify-center overflow-hidden min-h-[300px]">
              {latestScreenshot ? (
                <img 
                  src={latestScreenshot} 
                  alt="Live Browser Frame" 
                  className="w-full h-full object-contain"
                />
              ) : status !== 'READY' ? (
                <iframe 
                  src={currentUrl} 
                  title="Live App Preview" 
                  className="w-full h-full border-0 pointer-events-none opacity-90"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-[#5C7F9B]">
                  <div className="w-12 h-12 rounded-full bg-[rgba(141,190,222,0.2)] flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <p className="font-bold text-[#2A4B61] text-sm mb-1">Company Simulator (Port 3001)</p>
                  <p className="text-xs max-w-xs">Playwright Chromium window opens visibly on your desktop during execution.</p>
                </div>
              )}
            </div>

            {/* Bottom active status banner */}
            <div className="py-2.5 px-3 bg-white/70 border-t border-[rgba(141,190,222,0.3)] flex items-center justify-between text-xs">
              <span className="font-bold text-[#2A4B61] flex items-center gap-1.5 truncate max-w-[260px]">
                <span className={`w-2 h-2 rounded-full ${status === 'COMPLETED' ? 'bg-emerald-500' : status === 'FAILED' ? 'bg-rose-500' : status === 'READY' ? 'bg-gray-400' : 'bg-blue-500 animate-pulse'}`}></span>
                {currentAction}
              </span>
              <a 
                href={currentUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-[#447A9C] font-semibold hover:underline flex items-center gap-1 text-[11px]"
              >
                Open in tab ↗
              </a>
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
