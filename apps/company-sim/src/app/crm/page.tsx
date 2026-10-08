'use client';
import { useState } from 'react';

interface ClientItem {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  recentInteraction: string;
  outstandingInvoices: string;
  totalUnpaidAmount: string;
}

export default function CRMPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const clients: ClientItem[] = [
    {
      id: "CLI-01",
      name: "Marcus Vance",
      company: "Acme Corp",
      email: "billing@acme.corp",
      phone: "+1 (555) 234-8901",
      status: "Active Corporate Account",
      recentInteraction: "Q3 Vendor settlement review completed",
      outstandingInvoices: "INV-2048 (₹84,500 - Due 15 Oct 2026)",
      totalUnpaidAmount: "₹84,500"
    },
    {
      id: "CLI-02",
      name: "Johnathan Vance",
      company: "XYZ Ltd",
      email: "jvance@xyz.example.com",
      phone: "+1 (555) 891-2304",
      status: "Active Enterprise",
      recentInteraction: "Quarterly IT maintenance contract renewal pending",
      outstandingInvoices: "INV-1092 (₹112,000 - Due 20 Oct 2026)",
      totalUnpaidAmount: "₹112,000"
    },
    {
      id: "CLI-03",
      name: "Sarah Chen",
      company: "Nova Systems",
      email: "schen@novasystems.io",
      phone: "+1 (555) 772-1092",
      status: "Active Standard",
      recentInteraction: "Cloud deployment license expansion discussion",
      outstandingInvoices: "INV-5521 (₹35,400 - Due 28 Oct 2026)",
      totalUnpaidAmount: "₹35,400"
    },
    {
      id: "CLI-04",
      name: "Elena Rostova",
      company: "Starlight Dynamics",
      email: "erostova@starlight.corp",
      phone: "+1 (555) 304-9912",
      status: "Active Partner",
      recentInteraction: "Consulting engagement milestone signed off",
      outstandingInvoices: "None (All paid)",
      totalUnpaidAmount: "₹0"
    }
  ];

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [selectedClient, setSelectedClient] = useState<ClientItem>(clients[0]);

  return (
    <div className="py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-purple-800 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-full">
              CRM & Directory
            </span>
            <span className="text-xs font-bold text-slate-500">4 Accounts Registered</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client & CRM Management</h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Acme Corporation corporate accounts, billing contacts, and CRM interactions.
          </p>
        </div>

        <div className="w-full md:w-80">
          <input
            id="crm-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients by name, company, email..."
            className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all shadow-2xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Clients Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border-2 border-slate-200/90 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200" id="clients-table">
            <thead className="bg-slate-100 border-b-2 border-slate-300">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Client / Contact</th>
                <th className="px-5 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Unpaid</th>
                <th className="px-5 py-3.5 text-right text-xs font-extrabold text-slate-800 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredClients.map((c, idx) => {
                const isSelected = selectedClient.id === c.id;
                return (
                  <tr 
                    key={c.id} 
                    id={`client-row-${idx}`}
                    data-client-id={c.id}
                    data-company={c.company}
                    data-email={c.email}
                    onClick={() => setSelectedClient(c)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/90 border-l-4 border-indigo-600 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-5 py-4 text-sm font-extrabold text-slate-900 client-name">
                      {c.name}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700 client-company">
                      {c.company}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono font-bold text-indigo-700 client-email">
                      {c.email}
                    </td>
                    <td className="px-5 py-4 text-xs font-black font-mono text-amber-900">
                      <span className={`px-2 py-0.5 rounded-full border ${
                        c.totalUnpaidAmount === '₹0'
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {c.totalUnpaidAmount}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-right">
                      <button
                        id={`view-client-${idx}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedClient(c); }}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Client Details Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-200/90 flex flex-col justify-between" id="client-details">
          <div>
            <div className="flex justify-between items-start mb-5 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-indigo-800 bg-indigo-100 border border-indigo-300 px-2.5 py-0.5 rounded-full">
                  {selectedClient.id}
                </span>
                <h2 id="client-name" className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
                  {selectedClient.name}
                </h2>
                <div id="client-company" className="text-sm font-bold text-slate-600">
                  {selectedClient.company}
                </div>
              </div>
              <span id="client-status" className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                {selectedClient.status}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <strong className="text-slate-500 uppercase tracking-wider text-[10px] block mb-1 font-black">
                  Billing Email
                </strong>
                <span id="client-email" className="font-mono text-sm text-indigo-700 font-black">
                  {selectedClient.email}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <strong className="text-slate-500 uppercase tracking-wider text-[10px] block mb-1 font-black">
                  Phone
                </strong>
                <span id="client-phone" className="font-mono text-sm font-bold text-slate-900">
                  {selectedClient.phone}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <strong className="text-slate-500 uppercase tracking-wider text-[10px] block mb-1 font-black">
                  Recent CRM Interaction
                </strong>
                <p id="client-interaction" className="text-slate-900 font-semibold bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                  {selectedClient.recentInteraction}
                </p>
              </div>

              <div className="p-3 bg-amber-50/80 border-2 border-amber-300/80 rounded-xl">
                <strong className="text-amber-900 uppercase tracking-wider text-[10px] block mb-1 font-black">
                  Unpaid Invoices Ledger
                </strong>
                <div id="client-invoices" className="p-2.5 bg-white rounded-lg border border-amber-200 text-amber-950 font-bold font-mono">
                  {selectedClient.outstandingInvoices}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-200 text-[11px] font-bold text-slate-500 flex items-center justify-between">
            <span>Verified Acme Account Record</span>
            <span className="text-emerald-700 font-black">✓ Synchronized</span>
          </div>
        </div>
      </div>
    </div>
  );
}
