'use client';
import { useState, useEffect } from 'react';

export default function Finance() {
  const [formData, setFormData] = useState({ invoiceNumber: '', company: '', amount: '', dueDate: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);

  // We need to persist state for Playwright tests, so we use localStorage or backend.
  // For the sim, we'll use a mocked API or just localStorage to persist across reloads.
  useEffect(() => {
    const saved = localStorage.getItem('sim_invoices');
    if (saved) setInvoices(JSON.parse(saved));
  }, []);

  const saveInvoices = (newInvoices: any[]) => {
    setInvoices(newInvoices);
    localStorage.setItem('sim_invoices', JSON.stringify(newInvoices));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existingIndex = invoices.findIndex(inv => inv.invoiceNumber === formData.invoiceNumber);
    let newInvoices;
    if (existingIndex >= 0) {
      newInvoices = [...invoices];
      newInvoices[existingIndex] = formData;
      saveInvoices(newInvoices);
      setError(false);
      setMessage(`Invoice ${formData.invoiceNumber} recorded successfully.`);
    } else {
      newInvoices = [...invoices, formData];
      saveInvoices(newInvoices);
      setError(false);
      setMessage('Invoice created successfully.');
    }
    setFormData({ invoiceNumber: '', company: '', amount: '', dueDate: '' });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-[#171923]">Finance Portal</h1>
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Create Invoice</h2>
          {message && (
            <div id="form-message" className={`p-4 mb-4 rounded ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <input type="text" id="invoiceNumber" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <input type="text" id="company" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input type="text" id="amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input type="text" id="dueDate" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
            </div>
            <button type="submit" id="saveInvoice" className="w-full bg-[#5B5FEF] text-white py-2 px-4 rounded hover:bg-[#7C83FF]">
              Save Invoice
            </button>
          </form>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Recent Invoices</h2>
          {invoices.length === 0 ? (
            <p className="text-gray-500">No invoices saved.</p>
          ) : (
            <ul className="space-y-4" id="invoice-list">
              {invoices.map((inv, idx) => (
                <li key={idx} className="border-b pb-4 invoice-item">
                  <p><strong>{inv.invoiceNumber}</strong> - {inv.company}</p>
                  <p className="text-sm text-gray-600">Amount: {inv.amount} | Due: {inv.dueDate}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
