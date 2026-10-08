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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#171923]">Finance Accounting Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Acme Corporation general ledger and accounts payable entries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create / Input Card */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Record Vendor Invoice</h2>
          
          {message && (
            <div 
              id="form-message" 
              className={`p-4 mb-4 rounded-lg text-sm font-semibold border ${
                isDuplicate 
                  ? 'bg-amber-50 text-amber-900 border-amber-300' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}
            >
              {message}
            </div>
          )}

          {isDuplicate && duplicateMatch && (
            <div id="duplicate-warning-banner" className="mb-4 p-3 bg-amber-50/80 border border-amber-200 rounded text-xs text-amber-900">
              <strong className="block mb-1">Existing Ledger Record Detected:</strong>
              <div id="existing-record-details" className="font-mono text-gray-800">
                Number: <span id="existing-inv-num">{duplicateMatch.invoiceNumber}</span> | 
                Vendor: <span id="existing-inv-company">{duplicateMatch.company}</span> | 
                Amount: <span id="existing-inv-amount">{duplicateMatch.amount}</span> | 
                Due: <span id="existing-inv-due">{duplicateMatch.dueDate}</span>
              </div>
              <button 
                id="force-update-btn"
                type="button" 
                onClick={handleForceUpdate}
                className="mt-2 text-xs font-bold text-[#5B5FEF] underline hover:text-[#474BD9]"
              >
                Overwrite / Update Existing Record
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Invoice Number</label>
              <input 
                type="text" 
                id="invoiceNumber" 
                value={formData.invoiceNumber} 
                onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} 
                placeholder="INV-XXXX"
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Company / Vendor</label>
              <input 
                type="text" 
                id="company" 
                value={formData.company} 
                onChange={e => setFormData({...formData, company: e.target.value})} 
                placeholder="Acme Corp, XYZ Ltd..."
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Amount</label>
              <input 
                type="text" 
                id="amount" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})} 
                placeholder="₹84,500"
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Due Date</label>
              <input 
                type="text" 
                id="dueDate" 
                value={formData.dueDate} 
                onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                placeholder="15 October 2026"
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]" 
                required 
              />
            </div>

            <button 
              type="submit" 
              id="saveInvoice" 
              className="w-full bg-[#5B5FEF] hover:bg-[#474BD9] text-white font-bold py-2.5 px-4 rounded-lg transition shadow-sm text-sm"
            >
              Save Invoice
            </button>
          </form>
        </div>

        {/* Ledger Invoices List */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Invoices Ledger</h2>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {invoices.length} Entries
            </span>
          </div>
          
          <ul className="space-y-3" id="invoice-list">
            {invoices.map((inv, idx) => (
              <li 
                key={idx} 
                id={`invoice-item-${inv.invoiceNumber}`} 
                data-invoice={inv.invoiceNumber}
                className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono font-bold text-sm text-[#5B5FEF]">{inv.invoiceNumber}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Verified Ledger</span>
                </div>
                <div className="font-semibold text-gray-800 mt-1">{inv.company}</div>
                <div className="text-xs text-gray-600 mt-0.5 flex justify-between">
                  <span>Amount: <strong className="text-gray-900">{inv.amount}</strong></span>
                  <span>Due: <strong className="text-gray-900">{inv.dueDate}</strong></span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
