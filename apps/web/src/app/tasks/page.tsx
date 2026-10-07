'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

interface Task {
  id: number;
  goal: string;
  status: string;
  created_at: string;
  result_summary?: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const cardStyle = {
    background: 'rgba(141, 190, 222, 0.25)',
    border: '1px solid rgba(141, 190, 222, 0.40)',
    borderRadius: '16px',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold">COMPLETED</span>;
      case 'EXECUTING':
        return <span className="bg-blue-100 text-blue-700 border border-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse">EXECUTING</span>;
      case 'FAILED':
        return <span className="bg-rose-100 text-rose-700 border border-rose-300 px-2.5 py-0.5 rounded-full text-xs font-bold">FAILED</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 border border-gray-300 px-2.5 py-0.5 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center" style={cardStyle}>
        <div>
          <h1 className="text-2xl font-bold text-[#2A4B61]">Task History & Audit Log</h1>
          <p className="text-sm text-[#5C7F9B] mt-1">Review all autonomous missions executed by Nexo Agent</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchTasks}
            className="bg-white/60 hover:bg-white text-[#447A9C] border border-[rgba(141,190,222,0.4)] px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          <Link 
            href="/"
            className="bg-[#447A9C] hover:bg-[#2A4B61] text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </Link>
        </div>
      </div>

      {/* Task List Table */}
      <div className="p-6 shadow-sm" style={cardStyle}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#5C7F9B] font-medium">
            <svg className="animate-spin h-6 w-6 text-[#447A9C] mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Loading task records...
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#5C7F9B] gap-3">
            <div className="w-12 h-12 rounded-full bg-[rgba(141,190,222,0.2)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#447A9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-bold text-[#2A4B61]">No tasks recorded yet</p>
            <Link href="/" className="text-sm font-bold text-[#447A9C] hover:underline">
              Execute your first autonomous task from the Overview dashboard →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[rgba(141,190,222,0.3)] text-xs font-bold uppercase tracking-wider text-[#5C7F9B]">
                  <th className="pb-3 px-4">Task ID</th>
                  <th className="pb-3 px-4">Goal</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Outcome Summary</th>
                  <th className="pb-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(141,190,222,0.2)] text-sm">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-[#447A9C]">
                      #{task.id}
                    </td>
                    <td className="py-4 px-4 font-semibold text-[#2A4B61] max-w-xs">
                      {task.goal}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="py-4 px-4 text-xs text-[#5C7F9B] max-w-sm truncate">
                      {task.result_summary || 'In progress or pending execution'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link 
                        href={`/execution?task_id=${task.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#447A9C] hover:text-[#2A4B61] bg-white/60 hover:bg-white px-3 py-1.5 rounded-lg border border-[rgba(141,190,222,0.4)] shadow-xs transition-all"
                      >
                        Inspect Execution →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
