'use client';
import { useState, useEffect } from 'react';

interface InvoiceData {
  invoiceNumber: string;
  company: string;
  amount: string;
  dueDate: string;
}

export default function Finance() {
  const [formData, setFormData] = useState<InvoiceData>({ invoiceNumber: '', company: '', amount: '', dueDate: '' });
  const [message, setMessage] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState<InvoiceData | null>(null);

  const initialInvoices: InvoiceData[] = [
    {
      invoiceNumber: "INV-2048",
      company: "Acme Corp",
      amount: "₹84,500",
      dueDate: "15 October 2026"
    },
    {
      invoiceNumber: "INV-2039",
      company: "Acme Corp",
      amount: "₹42,000",
      dueDate: "15 September 2026"
    }
  ];

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('sim_invoices');
    if (saved) {
      try {
        setInvoices(JSON.parse(saved));
      } catch {
        setInvoices(initialInvoices);
      }
    } else {
      setInvoices(initialInvoices);
      localStorage.setItem('sim_invoices', JSON.stringify(initialInvoices));
    }
  }, []);

  const saveInvoices = (newInvoices: InvoiceData[]) => {
    setInvoices(newInvoices);
    localStorage.setItem('sim_invoices', JSON.stringify(newInvoices));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = invoices.find(inv => inv.invoiceNumber.toLowerCase() === formData.invoiceNumber.trim().toLowerCase());
    
    if (existing) {
      setIsDuplicate(true);
      setDuplicateMatch(existing);
      setMessage(`Invoice ${formData.invoiceNumber} already exists in ledger.`);
      return;
    }

    const newInvoices = [...invoices, formData];
    saveInvoices(newInvoices);
    setIsDuplicate(false);
    setDuplicateMatch(null);
    setMessage('Invoice created successfully.');
    setFormData({ invoiceNumber: '', company: '', amount: '', dueDate: '' });
  };

  const handleForceUpdate = () => {
    const existingIndex = invoices.findIndex(inv => inv.invoiceNumber.toLowerCase() === formData.invoiceNumber.trim().toLowerCase());
    let newInvoices;
    if (existingIndex >= 0) {
      newInvoices = [...invoices];
      newInvoices[existingIndex] = formData;
    } else {
      newInvoices = [...invoices, formData];
    }
    saveInvoices(newInvoices);
    setIsDuplicate(false);
    setMessage(`Invoice ${formData.invoiceNumber} updated successfully.`);
    setFormData({ invoiceNumber: '', company: '', amount: '', dueDate: '' });
  };

  return (
    <div className="py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
              General Ledger Live
            </span>
            <span className="text-xs font-bold text-slate-500">Accounts Payable</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finance Accounting Portal</h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Acme Corporation general ledger and accounts payable invoice entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-2xs">
            Fiscal Year 2026-Q4
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Record Invoice Form Card */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-200/90">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-200">
            <span className="text-xl">💳</span>
            <div>
              <h2 className="text-xl font-black text-slate-900">Record Vendor Invoice</h2>
              <p className="text-xs font-semibold text-slate-500">Enter and reconcile fiscal payable entries</p>
            </div>
          </div>
          
          {message && (
            <div 
              id="form-message" 
              className={`p-4 mb-5 rounded-xl text-sm font-bold border-2 flex items-center gap-2.5 shadow-2xs ${
                isDuplicate 
                  ? 'bg-amber-50 text-amber-950 border-amber-400' 
                  : 'bg-emerald-50 text-emerald-950 border-emerald-400'
              }`}
            >
              <span>{isDuplicate ? '⚠️' : '✓'}</span>
              <span>{message}</span>
            </div>
          )}

          {isDuplicate && duplicateMatch && (
            <div id="duplicate-warning-banner" className="mb-5 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-950 shadow-2xs">
              <strong className="block mb-2 font-black text-sm uppercase tracking-wider text-amber-900">
                Existing Ledger Record Detected:
              </strong>
              <div id="existing-record-details" className="font-mono bg-white/90 p-3 rounded-lg border border-amber-200 text-slate-800 space-y-1">
                <div>Number: <span id="existing-inv-num" className="font-bold text-indigo-700">{duplicateMatch.invoiceNumber}</span></div>
                <div>Vendor: <span id="existing-inv-company" className="font-bold text-slate-900">{duplicateMatch.company}</span></div>
                <div>Amount: <span id="existing-inv-amount" className="font-bold text-slate-900">{duplicateMatch.amount}</span></div>
                <div>Due Date: <span id="existing-inv-due" className="font-bold text-rose-700">{duplicateMatch.dueDate}</span></div>
              </div>
              <button 
                id="force-update-btn"
                type="button" 
                onClick={handleForceUpdate}
                className="mt-3 text-xs font-black text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1"
              >
                Overwrite / Update Existing Record →
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">Invoice Number</label>
              <input 
                type="text" 
                id="invoiceNumber" 
                value={formData.invoiceNumber} 
                onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} 
                placeholder="INV-XXXX"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all font-mono" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">Company / Vendor</label>
              <input 
                type="text" 
                id="company" 
                value={formData.company} 
                onChange={e => setFormData({...formData, company: e.target.value})} 
                placeholder="Acme Corp, XYZ Ltd..."
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">Amount</label>
              <input 
                type="text" 
                id="amount" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})} 
                placeholder="₹84,500"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-3 text-sm font-black text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all font-mono" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">Due Date</label>
              <input 
                type="text" 
                id="dueDate" 
                value={formData.dueDate} 
                onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                placeholder="15 October 2026"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all" 
                required 
              />
            </div>

            <button 
              type="submit" 
              id="saveInvoice" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black py-3 px-4 rounded-xl transition shadow-md hover:shadow-lg text-sm tracking-wide mt-2"
            >
              Save Invoice into General Ledger
            </button>
          </form>
        </div>

        {/* Ledger Invoices List Card */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-200/90">
          <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📑</span>
              <div>
                <h2 className="text-xl font-black text-slate-900">Recent Invoices Ledger</h2>
                <p className="text-xs font-semibold text-slate-500">Live active accounting records</p>
              </div>
            </div>
            <span className="text-xs font-black text-indigo-900 bg-indigo-100 border border-indigo-300 px-3 py-1 rounded-full">
              {invoices.length} Entries
            </span>
          </div>
          
          <ul className="space-y-3.5" id="invoice-list">
            {invoices.map((inv, idx) => (
              <li 
                key={idx} 
                id={`invoice-item-${inv.invoiceNumber}`} 
                data-invoice={inv.invoiceNumber}
                className="p-4 rounded-xl border-2 border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-indigo-400 transition-all shadow-2xs group"
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="font-mono font-black text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                    {inv.invoiceNumber}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Verified Ledger
                  </span>
                </div>
                <div className="font-extrabold text-slate-900 text-base">{inv.company}</div>
                <div className="text-xs font-semibold text-slate-600 mt-2 flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span>Amount: <strong className="text-slate-900 font-mono text-sm">{inv.amount}</strong></span>
                  <span>Due: <strong className="text-rose-700">{inv.dueDate}</strong></span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
