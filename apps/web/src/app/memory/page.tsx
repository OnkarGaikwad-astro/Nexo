'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL, SIM_BASE_URL } from '@/lib/config';

interface MemoryEntity {
  id: number;
  entity_id: string;
  name: string;
  category: string;
  last_invoice?: string;
  amount?: string;
  due_date?: string;
  status: string;
  confidence: string;
  updated_at?: string;
}

interface SelectorItem {
  selector: string;
  purpose: string;
}

interface MemorySchema {
  id: number;
  portal: string;
  url: string;
  selectors: SelectorItem[];
  updated_at?: string;
}

interface MemoryRule {
  id: number;
  rule_text: string;
  category: string;
  active: boolean;
  created_at?: string;
}

export default function MemoryPage() {
  const [activeTab, setActiveTab] = useState<'entities' | 'schemas' | 'rules'>('entities');
  const [entities, setEntities] = useState<MemoryEntity[]>([]);
  const [schemas, setSchemas] = useState<MemorySchema[]>([]);
  const [rules, setRules] = useState<MemoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('Verification');
  const [isSubmittingRule, setIsSubmittingRule] = useState(false);

  const cardStyle = {
    background: 'rgba(141, 190, 222, 0.25)',
    border: '1px solid rgba(141, 190, 222, 0.40)',
    borderRadius: '16px',
  };

  const fetchMemory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/memory`);
      if (res.ok) {
        const data = await res.json();
        setEntities(data.entities || []);
        setSchemas(data.schemas || []);
        setRules(data.rules || []);
      }
    } catch (e) {
      console.error('Error fetching memory bank', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();

    // SSE Realtime Listener for memory updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE_URL}/api/events`);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.event === 'MEMORY_UPDATED' || data.event === 'TASK_COMPLETED') {
            fetchMemory();
          }
        } catch (err) {
          // ignore parse errors
        }
      };
    } catch (e) {
      console.error('Failed to connect memory SSE', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleToggleRule = async (ruleId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/memory/rules/${ruleId}/toggle`, {
        method: 'PATCH'
      });
      if (res.ok) {
        fetchMemory();
      }
    } catch (e) {
      console.error('Failed to toggle rule', e);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;

    try {
      setIsSubmittingRule(true);
      const res = await fetch(`${API_BASE_URL}/api/memory/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_text: newRuleText.trim(),
          category: newRuleCategory,
          active: true
        })
      });
      if (res.ok) {
        setNewRuleText('');
        fetchMemory();
      }
    } catch (e) {
      console.error('Failed to add rule', e);
    } finally {
      setIsSubmittingRule(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      
      {/* Header */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={cardStyle}>
        <div>
          <h1 className="text-2xl font-bold text-[#2A4B61]">Agent Memory & Knowledge Bank</h1>
          <p className="text-sm text-[#5C7F9B] mt-1">Persistent entities, discovered portal schemas, and dynamic verification policies</p>
        </div>

        {/* Tab switcher & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex bg-white/50 p-1 rounded-xl border border-[rgba(141,190,222,0.4)] text-xs font-bold">
            <button 
              onClick={() => setActiveTab('entities')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'entities' ? 'bg-[#447A9C] text-white shadow-xs' : 'text-[#5C7F9B] hover:text-[#2A4B61]'}`}
            >
              Entities ({entities.length})
            </button>
            <button 
              onClick={() => setActiveTab('schemas')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'schemas' ? 'bg-[#447A9C] text-white shadow-xs' : 'text-[#5C7F9B] hover:text-[#2A4B61]'}`}
            >
              Schemas ({schemas.length})
            </button>
            <button 
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'rules' ? 'bg-[#447A9C] text-white shadow-xs' : 'text-[#5C7F9B] hover:text-[#2A4B61]'}`}
            >
              Policies ({rules.length})
            </button>
          </div>

          <button
            onClick={() => { setLoading(true); fetchMemory(); }}
            className="bg-white/60 hover:bg-white text-[#447A9C] border border-[rgba(141,190,222,0.4)] px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="p-6 shadow-sm" style={cardStyle}>
        {loading ? (
          <div className="p-12 text-center text-[#5C7F9B] font-bold">
            Loading agent memory knowledge bank...
          </div>
        ) : (
          <>
            {activeTab === 'entities' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-[#2A4B61]">Discovered Corporate Entities & Invoices</h2>
                  <span className="text-xs font-bold text-[#5C7F9B] bg-white/40 px-2.5 py-1 rounded-full">
                    {entities.length} Entities Stored in SQLite
                  </span>
                </div>
                
                {entities.length === 0 ? (
                  <p className="text-sm text-[#5C7F9B]">No entities discovered yet. Run an autonomous task to populate memory.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {entities.map(ent => (
                      <div key={ent.id} className="p-4 rounded-xl bg-white/60 border border-[rgba(141,190,222,0.3)] flex flex-col justify-between shadow-xs">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-mono font-bold text-[#447A9C] bg-[rgba(141,190,222,0.2)] px-2 py-0.5 rounded">
                              {ent.entity_id || `ENT-${ent.id}`}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              {ent.confidence}
                            </span>
                          </div>
                          <h3 className="font-bold text-base text-[#2A4B61]">{ent.name}</h3>
                          <p className="text-xs text-[#5C7F9B] mb-3">{ent.category}</p>
                          
                          <div className="space-y-1.5 text-xs text-[#334E68] bg-white/50 p-2.5 rounded-lg border border-[rgba(141,190,222,0.2)]">
                            <div><strong>Invoice:</strong> {ent.last_invoice || 'Pending'}</div>
                            <div><strong>Amount:</strong> {ent.amount || 'Pending'}</div>
                            <div><strong>Due Date:</strong> {ent.due_date || 'Pending'}</div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[rgba(141,190,222,0.2)] text-[11px] font-semibold text-emerald-800 flex items-center justify-between">
                          <span>✓ {ent.status}</span>
                          {ent.updated_at && (
                            <span className="text-[10px] text-[#5C7F9B]">
                              {new Date(ent.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schemas' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-[#2A4B61]">Discovered Application Schemas & DOM Selectors</h2>
                  <span className="text-xs font-bold text-[#5C7F9B] bg-white/40 px-2.5 py-1 rounded-full">
                    {schemas.length} Portals Indexed
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {schemas.map((sch) => (
                    <div key={sch.id} className="p-5 rounded-xl bg-white/60 border border-[rgba(141,190,222,0.35)] shadow-xs">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-base text-[#2A4B61]">{sch.portal}</h3>
                        <span className="text-[10px] font-mono text-[#5C7F9B]">ID: #{sch.id}</span>
                      </div>
                      <a href={sch.url} target="_blank" rel="noreferrer" className="text-xs font-mono text-[#447A9C] hover:underline mb-4 block">
                        {sch.url} ↗
                      </a>

                      <div className="space-y-2 mt-3">
                        {(sch.selectors || []).map((sel, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white/80 border border-[rgba(141,190,222,0.2)] flex justify-between items-center text-xs">
                            <code className="font-bold text-[#447A9C] bg-[rgba(141,190,222,0.15)] px-1.5 py-0.5 rounded">{sel.selector}</code>
                            <span className="text-[#5C7F9B] text-[11px]">{sel.purpose}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-[#2A4B61]">Autonomous Verification Policies & Safeguards</h2>
                    <p className="text-xs text-[#5C7F9B]">Rules enforced by Nexo during tool execution and DOM verification</p>
                  </div>
                </div>

                {/* Add Rule Form */}
                <form onSubmit={handleAddRule} className="p-4 rounded-xl bg-white/70 border border-[rgba(141,190,222,0.35)] flex flex-col md:flex-row gap-3 items-center">
                  <input
                    type="text"
                    value={newRuleText}
                    onChange={(e) => setNewRuleText(e.target.value)}
                    placeholder="Enter custom policy constraint or verification requirement..."
                    className="flex-1 bg-white border border-[rgba(141,190,222,0.4)] text-xs font-medium text-[#2A4B61] px-3.5 py-2.5 rounded-lg focus:outline-none"
                  />
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value)}
                    className="bg-white border border-[rgba(141,190,222,0.4)] text-xs font-bold text-[#447A9C] px-3 py-2.5 rounded-lg focus:outline-none"
                  >
                    <option value="Verification">Verification</option>
                    <option value="Validation">Validation</option>
                    <option value="Safeguard">Safeguard</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isSubmittingRule || !newRuleText.trim()}
                    className="bg-[#447A9C] hover:bg-[#366380] disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-xs shrink-0"
                  >
                    {isSubmittingRule ? 'Adding...' : '+ Add Policy'}
                  </button>
                </form>

                {/* Rules List */}
                <div className="space-y-3">
                  {rules.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-white/60 border border-[rgba(141,190,222,0.3)] flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleRule(r.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-all ${
                            r.active ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gray-100 text-gray-400 border border-gray-300'
                          }`}
                          title={r.active ? "Click to disable rule" : "Click to enable rule"}
                        >
                          {r.active ? '✓' : '✕'}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-[#447A9C] bg-[rgba(141,190,222,0.2)] px-2 py-0.5 rounded">
                              {r.category}
                            </span>
                            <span className={`text-[10px] font-bold ${r.active ? 'text-emerald-700' : 'text-gray-400'}`}>
                              {r.active ? 'Active Enforced' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-[#2A4B61] mt-1.5 leading-relaxed">{r.rule_text}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRule(r.id)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${
                          r.active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                            : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {r.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
