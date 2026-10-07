'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

interface Step {
  id: number;
  task_id: number;
  state: string;
  tool_name?: string;
  tool_args?: any;
  observation?: string;
  created_at?: string;
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

  useEffect(() => {
    loadTasks();
  }, [queryTaskId]);

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
      case 'EXTRACT': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'EXECUTING': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'VERIFY': return 'bg-teal-100 text-teal-700 border-teal-300';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-400';
      case 'FAILED': return 'bg-rose-100 text-rose-700 border-rose-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      
      {/* Header with Task Selector */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={cardStyle}>
        <div>
          <h1 className="text-2xl font-bold text-[#2A4B61]">Execution Inspector</h1>
          <p className="text-sm text-[#5C7F9B] mt-1">Deep-dive cognitive reasoning, tool dispatch, and verification audits</p>
        </div>

        {/* Task dropdown picker */}
        <div className="flex items-center gap-3">
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
                Task #{t.id} - {t.goal.substring(0, 30)}... ({t.status})
              </option>
            ))}
          </select>

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
            </div>
            
            <h2 className="text-xl font-bold text-[#2A4B61] mb-2">{task.goal}</h2>
            {task.result_summary && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs font-medium text-emerald-900 mt-3">
                <strong>Final Result Summary:</strong> {task.result_summary}
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
                Detailed Step Trace ({steps.length} Steps)
              </h3>
            </div>

            <div className="space-y-4">
              {steps.map((st, idx) => (
                <div 
                  key={st.id || idx}
                  className="p-4 rounded-xl bg-white/60 border border-[rgba(141,190,222,0.35)] shadow-xs"
                >
                  <div className="flex justify-between items-center mb-2">
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
                    {st.created_at && (
                      <span className="text-[11px] text-[#5C7F9B]">
                        {new Date(st.created_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-sm text-[#2A4B61] mb-2">
                    {st.observation && !st.tool_name ? st.observation.split('\n')[0] : (st.observation || 'Action executed')}
                  </p>

                  {st.tool_args && (
                    <div className="mb-2 p-2.5 rounded bg-gray-50 border border-gray-200 text-xs font-mono text-gray-700">
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Tool Arguments:</div>
                      {typeof st.tool_args === 'string' ? st.tool_args : JSON.stringify(st.tool_args, null, 2)}
                    </div>
                  )}

                  {st.observation && (
                    <div className="p-3 rounded-lg bg-white/90 border border-[rgba(141,190,222,0.25)] text-xs font-mono text-[#334E68] whitespace-pre-wrap">
                      <div className="text-[10px] uppercase font-bold text-[#5C7F9B] mb-1">Observation / Artifact:</div>
                      {st.observation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
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
