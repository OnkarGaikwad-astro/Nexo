'use client';
import { useState } from 'react';
import Link from 'next/link';
import { SIM_BASE_URL } from '@/lib/config';

export default function MemoryPage() {
  const [activeTab, setActiveTab] = useState<'entities' | 'schemas' | 'rules'>('entities');

  const cardStyle = {
    background: 'rgba(141, 190, 222, 0.25)',
    border: '1px solid rgba(141, 190, 222, 0.40)',
    borderRadius: '16px',
  };

  const entities = [
    {
      id: "ENT-01",
      name: "Acme Corp",
      category: "Vendor / Supplier",
      lastInvoice: "INV-2048",
      amount: "₹84,500",
      dueDate: "15 October 2026",
      status: "Verified & Entered",
      confidence: "99.8%"
    },
    {
      id: "ENT-02",
      name: "XYZ Ltd",
      category: "Vendor",
      lastInvoice: "INV-1092",
      amount: "₹42,000",
      dueDate: "Pending",
      status: "Discovered in Documents",
      confidence: "94.2%"
    },
    {
      id: "ENT-03",
      name: "Nova Systems",
      category: "Vendor",
      lastInvoice: "INV-5521",
      amount: "₹112,000",
      dueDate: "Pending",
      status: "Discovered in Documents",
      confidence: "95.0%"
    }
  ];

  const schemas = [
    {
      portal: "Document Center",
      url: `${SIM_BASE_URL}/documents`,
      discoveredSelectors: [
        { selector: "table tbody tr", purpose: "List of incoming vendor invoices" },
        { selector: "#document-viewer", purpose: "Target document inspection area" },
        { selector: "#document-viewer strong", purpose: "Metadata field labels" }
      ]
    },
    {
      portal: "Finance Accounting Portal",
      url: `${SIM_BASE_URL}/finance`,
      discoveredSelectors: [
        { selector: "#invoiceNumber", purpose: "Invoice ID input field" },
        { selector: "#company", purpose: "Vendor organization name field" },
        { selector: "#amount", purpose: "Invoice total monetary amount" },
        { selector: "#dueDate", purpose: "Payment due date field" },
        { selector: "#saveInvoice", purpose: "Submission button trigger" },
        { selector: "#form-message", purpose: "Confirmation banner selector" },
        { selector: "#invoice-list", purpose: "Ledger verification table" }
      ]
    }
  ];

  const verificationRules = [
    {
      rule: "Dual-Stage Ledger Verification",
      description: "Do not assume form submission succeeded from network status code alone. Must physically inspect DOM confirmation banner and assert presence in #invoice-list ledger.",
      enforced: true
    },
    {
      rule: "Human Keystroke Timing",
      description: "Dispatch keystroke input events with human-mimicking delay to ensure React state binding and synthetic events fire accurately.",
      enforced: true
    },
    {
      rule: "Idempotent Upsert Check",
      description: "Detect duplicate invoices and allow updating or ledger synchronization without halting agent loop.",
      enforced: true
    }
  ];

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center" style={cardStyle}>
        <div>
          <h1 className="text-2xl font-bold text-[#2A4B61]">Agent Memory & Knowledge Bank</h1>
          <p className="text-sm text-[#5C7F9B] mt-1">Learned entities, discovered web schemas, and persistent verification policies</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white/50 p-1 rounded-xl border border-[rgba(141,190,222,0.4)] text-xs font-bold">
          <button 
            onClick={() => setActiveTab('entities')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'entities' ? 'bg-[#447A9C] text-white shadow-xs' : 'text-[#5C7F9B] hover:text-[#2A4B61]'}`}
          >
            Extracted Entities
          </button>
          <button 
            onClick={() => setActiveTab('schemas')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'schemas' ? 'bg-[#447A9C] text-white shadow-xs' : 'text-[#5C7F9B] hover:text-[#2A4B61]'}`}
          >
            Discovered Schemas
          </button>
          <button 
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'rules' ? 'bg-[#447A9C] text-white shadow-xs' : 'text-[#5C7F9B] hover:text-[#2A4B61]'}`}
          >
            Verification Rules
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="p-6 shadow-sm" style={cardStyle}>
        
        {activeTab === 'entities' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#2A4B61]">Extracted Organizational Entities</h2>
              <span className="text-xs font-bold text-[#5C7F9B] bg-white/40 px-2.5 py-1 rounded-full">
                3 Entities Cached
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {entities.map(ent => (
                <div key={ent.id} className="p-4 rounded-xl bg-white/60 border border-[rgba(141,190,222,0.3)] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[11px] font-mono font-bold text-[#447A9C] bg-[rgba(141,190,222,0.2)] px-2 py-0.5 rounded">
                        {ent.id}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {ent.confidence}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#2A4B61]">{ent.name}</h3>
                    <p className="text-xs text-[#5C7F9B] mb-3">{ent.category}</p>
                    
                    <div className="space-y-1.5 text-xs text-[#334E68]">
                      <div><strong>Invoice:</strong> {ent.lastInvoice}</div>
                      <div><strong>Amount:</strong> {ent.amount}</div>
                      <div><strong>Due Date:</strong> {ent.dueDate}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[rgba(141,190,222,0.2)] text-[11px] font-semibold text-emerald-800">
                    ✓ {ent.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schemas' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#2A4B61]">Discovered Application Schemas & DOM Selectors</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {schemas.map((sch, i) => (
                <div key={i} className="p-5 rounded-xl bg-white/60 border border-[rgba(141,190,222,0.35)]">
                  <h3 className="font-bold text-base text-[#2A4B61] mb-1">{sch.portal}</h3>
                  <a href={sch.url} target="_blank" rel="noreferrer" className="text-xs font-mono text-[#447A9C] hover:underline mb-4 block">
                    {sch.url} ↗
                  </a>

                  <div className="space-y-2 mt-3">
                    {sch.discoveredSelectors.map((sel, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white/80 border border-[rgba(141,190,222,0.2)] flex justify-between items-center text-xs">
                        <code className="font-bold text-[#447A9C]">{sel.selector}</code>
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
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#2A4B61]">Autonomous Verification Policies</h2>
            <div className="space-y-3">
              {verificationRules.map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/60 border border-[rgba(141,190,222,0.3)] flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-sm">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#2A4B61]">{r.rule}</h3>
                    <p className="text-xs text-[#5C7F9B] mt-1 leading-relaxed">{r.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
