import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# 1. Company Sim Layout
create_file("apps/company-sim/src/app/layout.tsx", """import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Company Portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        <nav className="bg-[#171923] text-[#F7F8FC] p-4 shadow-md">
          <div className="container mx-auto flex gap-6 items-center">
            <div className="font-bold text-xl mr-4 text-[#5B5FEF]">Acme Internal</div>
            <Link href="/" className="hover:text-[#A9B1FF]">Dashboard</Link>
            <Link href="/documents" className="hover:text-[#A9B1FF]">Documents</Link>
            <Link href="/finance" className="hover:text-[#A9B1FF]">Finance</Link>
          </div>
        </nav>
        <main className="container mx-auto p-6 flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
""")

# 2. Company Sim Documents
create_file("apps/company-sim/src/app/documents/page.tsx", """export default function Documents() {
  const documents = [
    { name: "invoice_acme_2048.pdf", type: "Invoice", company: "Acme Corp", date: "2026-10-01", status: "Pending" },
    { name: "invoice_acme_2039.pdf", type: "Invoice", company: "Acme Corp", date: "2026-09-01", status: "Processed" },
    { name: "invoice_xyz_1092.pdf", type: "Invoice", company: "XYZ Ltd", date: "2026-10-02", status: "Pending" },
    { name: "invoice_nova_5521.pdf", type: "Invoice", company: "Nova Systems", date: "2026-10-03", status: "Pending" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-[#171923]">Document Center</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-[#F4F1EA]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {documents.map((doc, idx) => (
              <tr key={idx} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 text-sm font-medium text-blue-600">{doc.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{doc.company}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{doc.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 p-6 bg-white rounded-lg shadow border border-gray-200" id="document-viewer">
        <h2 className="text-xl font-bold mb-4">Document Viewer: invoice_acme_2048.pdf</h2>
        <div className="p-4 bg-gray-50 border rounded font-mono text-sm">
          <p><strong>Company:</strong> Acme Corp</p>
          <p><strong>Invoice number:</strong> INV-2048</p>
          <p><strong>Amount:</strong> ₹84,500</p>
          <p><strong>Date:</strong> 1 October 2026</p>
          <p><strong>Due date:</strong> 15 October 2026</p>
        </div>
      </div>
    </div>
  );
}
""")

# 3. Company Sim Finance
create_file("apps/company-sim/src/app/finance/page.tsx", """'use client';
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
    if (invoices.find(inv => inv.invoiceNumber === formData.invoiceNumber)) {
      setError(true);
      setMessage(`Invoice ${formData.invoiceNumber} already exists.`);
      return;
    }
    const newInvoices = [...invoices, formData];
    saveInvoices(newInvoices);
    setError(false);
    setMessage('Invoice created successfully.');
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
""")

# 4. Web App Layout (Skeuomorphic + Glassmorphism - Ivory/Graphite/Indigo)
create_file("apps/web/src/app/layout.tsx", """import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexo - Autonomous AI Task Worker",
  description: "From Intent to Execution",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex h-screen overflow-hidden text-[#181A22] relative bg-[#F4F1EA]`}
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(124,131,255,0.15), transparent 45%), radial-gradient(circle at 80% 90%, rgba(91,95,239,0.08), transparent 45%)'
            }}>
        
        {/* Sidebar - Floating Glass/Skeuomorphic */}
        <aside className="w-64 flex flex-col z-20 m-4 rounded-2xl overflow-hidden shadow-lg"
               style={{
                 background: 'rgba(255, 255, 255, 0.45)',
                 backdropFilter: 'blur(18px)',
                 border: '1px solid rgba(255, 255, 255, 0.55)',
                 boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07), inset 0 1px 1px rgba(255,255,255,0.8)'
               }}>
          
          <div className="p-6 border-b border-[rgba(255,255,255,0.2)]">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {/* Minimal geometric N logo */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white relative shadow-sm"
                   style={{
                     background: 'linear-gradient(135deg, #5B5FEF 0%, #7C83FF 100%)',
                     boxShadow: 'inset 0 2px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 10px rgba(91,95,239,0.3)',
                     border: '1px solid rgba(255,255,255,0.2)'
                   }}>
                N
              </div>
              <span className="tracking-wide text-[#171923]">NEXO</span>
            </h1>
          </div>
          
          <nav className="flex-1 p-5 space-y-3 overflow-y-auto">
            {['Overview', 'Tasks', 'Execution', 'Memory', 'Tools', 'Environment'].map((item, i) => (
              <a key={item} href="#" className={`block px-4 py-3 rounded-xl font-medium transition-all ${i === 0 ? 'text-white' : 'text-[#737887] hover:bg-[rgba(255,255,255,0.3)]'}`}
                 style={i === 0 ? {
                   background: '#5B5FEF',
                   boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -2px 3px rgba(0,0,0,0.1), 0 4px 12px rgba(91,95,239,0.3)',
                 } : {}}>
                {item}
              </a>
            ))}
          </nav>
          
          <div className="p-5 border-t border-[rgba(255,255,255,0.2)] text-xs font-medium">
            <div className="flex items-center gap-2 text-[#737887]">
              <div className="w-2 h-2 rounded-full bg-[#3BA776] shadow-[0_0_8px_#3BA776]"></div>
              Agent Online
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative z-10 my-4 mr-4">
          {children}
        </main>
      </body>
    </html>
  );
}
""")

# 5. Web App Dashboard
create_file("apps/web/src/app/page.tsx", """'use client';
import { useState } from 'react';

export default function Home() {
  const [task, setTask] = useState('');
  const [status, setStatus] = useState('READY');

  const handleRun = () => {
    if (!task) return;
    setStatus('EXECUTING');
    setTimeout(() => setStatus('COMPLETED'), 5000);
  };

  return (
    <div className="flex-1 overflow-y-auto pr-2 relative h-full flex flex-col gap-6">
      <header className="mb-2">
        <h2 className="text-4xl font-semibold tracking-tight text-[#171923]">
          Autonomous Workspace
        </h2>
        <p className="text-[#737887] mt-1 text-lg">Give Nexo a goal. It figures out how to get it done.</p>
      </header>

      {/* Main Task Composer - Glass Panel */}
      <section className="relative rounded-2xl p-8 z-10 shadow-xl"
               style={{
                 background: 'rgba(255, 255, 255, 0.65)',
                 backdropFilter: 'blur(20px)',
                 border: '1px solid rgba(255, 255, 255, 0.8)',
                 boxShadow: '0 12px 40px rgba(23, 25, 35, 0.05), inset 0 1px 0 rgba(255,255,255,1)'
               }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium tracking-wide text-[#171923]">What would you like Nexo to accomplish?</h3>
          
          {/* Status Badge */}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${status === 'READY' ? 'bg-[#D99A3D]' : status === 'EXECUTING' ? 'bg-[#5B5FEF] animate-pulse' : 'bg-[#3BA776]'}`}
                 style={{ boxShadow: `0 0 8px ${status === 'EXECUTING' ? '#5B5FEF' : 'transparent'}` }}></div>
            <span className="text-xs font-bold tracking-widest text-[#737887] uppercase">{status}</span>
          </div>
        </div>
        
        <textarea 
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="e.g., Find the latest invoice from Acme Corp and enter it into the finance system..."
          className="w-full bg-white/50 text-[#171923] p-5 font-medium text-lg focus:outline-none min-h-[140px] resize-none rounded-xl border border-white/60 shadow-inner placeholder:text-[#737887]/60"
          style={{ transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}
        />
        
        <div className="flex justify-end mt-6">
          <button 
            onClick={handleRun}
            disabled={status === 'EXECUTING'}
            className="relative rounded-xl font-semibold tracking-wide px-8 py-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 shadow-lg text-white"
            style={{
              background: 'linear-gradient(135deg, #5B5FEF 0%, #7C83FF 100%)',
              boxShadow: '0 8px 20px rgba(91,95,239,0.3), inset 0 2px 2px rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            RUN TASK
          </button>
        </div>
      </section>

      {/* Split lower area */}
      <div className="flex gap-6 flex-1">
        {/* Timeline Panel */}
        <div className="w-1/2 rounded-2xl p-6"
             style={{
               background: 'rgba(255, 255, 255, 0.4)',
               backdropFilter: 'blur(15px)',
               border: '1px solid rgba(255, 255, 255, 0.5)',
             }}>
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#737887] mb-6">Execution Timeline</h4>
          <div className="space-y-4">
            {status !== 'READY' && (
              <div className="flex items-start gap-4">
                <div className="mt-1 w-5 h-5 rounded-full bg-[#3BA776] text-white flex items-center justify-center text-xs shadow-sm">✓</div>
                <div>
                  <p className="font-medium text-[#171923]">Task understood</p>
                  <p className="text-sm text-[#737887]">Parsed intent and parameters</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Browser Preview Panel */}
        <div className="w-1/2 rounded-2xl p-6 bg-[#171923] text-white shadow-xl relative overflow-hidden"
             style={{ border: '1px solid #242735' }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5B5FEF] to-[#7C83FF]"></div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#737887] mb-4 flex justify-between items-center">
            <span>Live Browser</span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#D95C5C]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#D99A3D]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#3BA776]"></div>
            </div>
          </h4>
          <div className="bg-[#242735] rounded-xl h-[calc(100%-2rem)] border border-[#333] flex items-center justify-center text-[#737887]">
            {status === 'READY' ? 'Browser inactive. Awaiting task.' : 'Navigating to Company Portal...'}
          </div>
        </div>
      </div>
      
    </div>
  );
}
""")

print("Successfully generated all frontend and layout files.")
