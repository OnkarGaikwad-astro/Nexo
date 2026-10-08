'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

interface Step {
  id?: number;
  step_id?: number;
  task_id?: number;
  state: string;
  description?: string;
  tool_name?: string;
  tool_args?: any;
  observation?: string;
  url?: string;
  screenshot?: string;
  created_at?: string;
  timestamp?: string;
}

interface TaskData {
  id: number;
  goal: string;
  status: string;
  result_summary?: string;
  created_at: string;
}

function ExecutionContent() {
  const searchParams = useSearchParams();
  const queryTaskId = searchParams.get('task_id');
  
  const [task, setTask] = useState<TaskData | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableTasks, setAvailableTasks] = useState<TaskData[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  
  const currentTaskIdRef = useRef<number | null>(null);
  const traceEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTasks();
  }, [queryTaskId]);

  useEffect(() => {
    currentTaskIdRef.current = task?.id || null;
  }, [task]);

  useEffect(() => {
    if (autoScroll && traceEndRef.current) {
      traceEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps, autoScroll]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/tasks`);
      if (res.ok) {
        const allTasks: TaskData[] = await res.json();
        setAvailableTasks(allTasks);

        const targetId = queryTaskId ? parseInt(queryTaskId) : (allTasks[0]?.id || null);
        if (targetId) {
          const detailRes = await fetch(`${API_BASE_URL}/api/tasks/${targetId}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            setTask(detailData.task);
            setSteps(detailData.steps || []);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching execution details', e);
    } finally {
      setLoading(false);
    }
  };

  // Real-time SSE Stream Listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE_URL}/api/events`);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.event === 'PING') return;

          const currentId = currentTaskIdRef.current;

          // If step belongs to this task, add it in real-time
          if (data.event === 'STEP' && currentId && data.task_id === currentId) {
            setSteps((prev) => {
              const exists = prev.some(
                s => (s.step_id && s.step_id === data.step_id) || 
                     (s.state === data.state && s.description === data.description && s.tool_name === data.tool_name)
              );
              if (exists) return prev;
              return [...prev, data];
            });

            // Update task status if changed
            setTask((prev) => {
              if (!prev) return prev;
              return { ...prev, status: data.state };
            });
          } else if (data.event === 'TASK_COMPLETED' && currentId && data.task_id === currentId) {
            setTask((prev) => {
              if (!prev) return prev;
              return { ...prev, status: 'COMPLETED', result_summary: data.summary };
            });
          } else if (data.event === 'TASK_FAILED' && currentId && data.task_id === currentId) {
            setTask((prev) => {
              if (!prev) return prev;
              return { ...prev, status: 'FAILED', result_summary: data.error };
            });
          }
        } catch (err) {
          console.error('SSE trace parse error', err);
        }
      };
    } catch (e) {
      console.error('SSE connect failed in ExecutionPage', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const cardStyle = {
    background: 'rgba(141, 190, 222, 0.25)',
    border: '1px solid rgba(141, 190, 222, 0.40)',
    borderRadius: '16px',
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'UNDERSTAND': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'LLM_REASONING': return 'bg-indigo-100 text-indigo-800 border-indigo-400 font-bold';
      case 'PLAN': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'OBSERVE': return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'EXTRACT': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'EXECUTING': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'VERIFY': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'COMPLETED':
      case 'COMPLETE': return 'bg-emerald-100 text-emerald-800 border-emerald-400';
      case 'FAILED': return 'bg-rose-100 text-rose-700 border-rose-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      
      {/* Header with Task Selector & Live Controls */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={cardStyle}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#2A4B61]">Execution Inspector</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live SSE Active
            </span>
          </div>
          <p className="text-sm text-[#5C7F9B] mt-1">Real-time cognitive reasoning, tool dispatch telemetry, and verification audits</p>
        </div>

        {/* Task dropdown picker & Auto-scroll toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-[#5C7F9B] uppercase">Select Task:</label>
          <select 
            value={task?.id || ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              window.location.href = `/execution?task_id=${selectedId}`;
            }}
            className="bg-white/70 border border-[rgba(141,190,222,0.4)] text-[#2A4B61] text-xs font-bold rounded-lg px-3 py-2 focus:outline-none"
          >
            {availableTasks.map(t => (
              <option key={t.id} value={t.id}>
                Task #{t.id} - {t.goal.substring(0, 32)}... ({t.status})
              </option>
            ))}
          </select>

          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
              autoScroll 
                ? 'bg-[#447A9C] text-white border-[#447A9C]' 
                : 'bg-white/60 text-[#5C7F9B] border-[rgba(141,190,222,0.4)]'
            }`}
          >
            {autoScroll ? 'Auto-scroll: ON' : 'Auto-scroll: OFF'}
          </button>

          <button 
            onClick={loadTasks}
            className="bg-white/60 hover:bg-white text-[#447A9C] border border-[rgba(141,190,222,0.4)] px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center items-center text-[#5C7F9B] font-bold" style={cardStyle}>
          Loading execution trace...
        </div>
      ) : !task ? (
        <div className="p-12 flex flex-col items-center justify-center text-[#5C7F9B] gap-3" style={cardStyle}>
          <p className="font-bold text-lg text-[#2A4B61]">No execution record found</p>
          <Link href="/" className="text-sm text-[#447A9C] font-bold hover:underline">
            Launch a task from the Overview Dashboard →
          </Link>
        </div>
      ) : (
        <>
          {/* Active Task Summary Card */}
          <div className="p-6 shadow-sm" style={cardStyle}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#447A9C] bg-white/60 px-2.5 py-1 rounded-md border border-[rgba(141,190,222,0.3)]">
                  Task #{task.id}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(task.status)}`}>
                  Status: {task.status}
                </span>
              </div>
              <span className="text-xs text-[#5C7F9B]">
                Started: {new Date(task.created_at).toLocaleString()}
              </span>
            </div>
            
            <h2 className="text-xl font-bold text-[#2A4B61] mb-2">{task.goal}</h2>
            
            {task.result_summary && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-white/95 border-2 border-emerald-500/40 text-xs text-[#2A4B61] mt-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">✓</span>
                    <span className="font-extrabold text-[#2A4B61] uppercase tracking-wider text-[11px]">Task Output & Deliverables</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {task.status}
                  </span>
                </div>
                <div className="font-medium text-[#2A4B61] leading-relaxed whitespace-pre-wrap">
                  {task.result_summary}
                </div>
              </div>
            )}

            {/* Approval Banner if waiting */}
            {task.status === 'WAITING_FOR_APPROVAL' && (
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 mt-3 text-xs flex flex-col gap-2">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    Human Supervisor Approval Required
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-200">Pending Gate</span>
                </div>
                <p className="text-amber-950">
                  NEXO is paused waiting for authorization on an external communication action.
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={async () => {
                      await fetch(`${API_BASE_URL}/api/tasks/${task.id}/approve`, { method: 'POST' });
                      loadTasks();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                  >
                    ✓ Approve & Send
                  </button>
                  <button
                    onClick={async () => {
                      await fetch(`${API_BASE_URL}/api/tasks/${task.id}/reject`, { method: 'POST' });
                      loadTasks();
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-3 py-1.5 rounded-lg text-xs"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Execution Trace Steps */}
          <div className="p-6 shadow-sm flex flex-col gap-4" style={cardStyle}>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-[#2A4B61] flex items-center gap-2">
                <svg className="w-5 h-5 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Detailed Cognitive Trace ({steps.length} Steps)
              </h3>
              <span className="text-xs text-[#5C7F9B]">
                Real-time chronological events
              </span>
            </div>

            <div className="space-y-4">
              {steps.map((st, idx) => (
                <div 
                  key={st.id || st.step_id || idx}
                  className="p-4 rounded-xl bg-white/70 border border-[rgba(141,190,222,0.35)] shadow-xs transition-all hover:bg-white/85"
                >
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#447A9C] text-white flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${getStatusColor(st.state)}`}>
                        {st.state}
                      </span>
                      {st.tool_name && (
                        <span className="text-xs font-mono font-semibold text-[#447A9C] bg-[rgba(141,190,222,0.2)] px-2 py-0.5 rounded">
                          {st.tool_name}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#5C7F9B]">
                      {st.created_at ? new Date(st.created_at).toLocaleTimeString() : (st.timestamp ? new Date(st.timestamp).toLocaleTimeString() : '')}
                    </div>
                  </div>

                  {st.description && (
                    <p className="font-semibold text-sm text-[#2A4B61] mb-2">
                      {st.description}
                    </p>
                  )}

                  {st.url && (
                    <div className="mb-2 text-xs font-mono text-[#5C7F9B]">
                      URL: <span className="text-[#447A9C]">{st.url}</span>
                    </div>
                  )}

                  {st.tool_args && (
                    <div className="mb-2 p-2.5 rounded bg-gray-50 border border-gray-200 text-xs font-mono text-gray-700">
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Tool Arguments:</div>
                      {typeof st.tool_args === 'string' ? st.tool_args : JSON.stringify(st.tool_args, null, 2)}
                    </div>
                  )}

                  {st.observation && (
                    <div className="p-3 rounded-lg bg-white/90 border border-[rgba(141,190,222,0.25)] text-xs font-mono text-[#334E68] whitespace-pre-wrap">
                      <div className="text-[10px] uppercase font-bold text-[#5C7F9B] mb-1">Cognitive Observation / Artifact:</div>
                      {st.observation}
                    </div>
                  )}

                  {/* Screenshot preview if available */}
                  {st.screenshot && (
                    <div className="mt-3">
                      <div className="text-[10px] uppercase font-bold text-[#5C7F9B] mb-1">DOM Viewport Snapshot:</div>
                      <img 
                        src={st.screenshot.startsWith('data:') ? st.screenshot : `data:image/jpeg;base64,${st.screenshot}`} 
                        alt="Step Screenshot" 
                        onClick={() => setSelectedScreenshot(st.screenshot?.startsWith('data:') ? st.screenshot : `data:image/jpeg;base64,${st.screenshot}` || null)}
                        className="max-h-48 rounded-lg border border-gray-300 shadow-xs cursor-pointer hover:opacity-90 object-contain bg-white"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div ref={traceEndRef} />
            </div>
          </div>
        </>
      )}

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div 
          onClick={() => setSelectedScreenshot(null)}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 cursor-pointer"
        >
          <div className="max-w-4xl max-h-[90vh] bg-white p-2 rounded-xl shadow-2xl overflow-auto">
            <img src={selectedScreenshot} alt="Enlarged Screenshot" className="w-full h-auto rounded" />
          </div>
        </div>
      )}

    </div>
  );
}

export default function ExecutionPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-[#5C7F9B]">Loading execution inspector...</div>}>
      <ExecutionContent />
    </Suspense>
  );
}
