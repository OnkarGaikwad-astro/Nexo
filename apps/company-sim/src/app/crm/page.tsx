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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#171923]">Client & CRM Management</h1>
          <p className="text-sm text-gray-500 mt-1">Acme Corporation corporate accounts, billing contacts, and CRM interactions</p>
        </div>
        <div className="w-72">
          <input
            id="crm-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients by name, company, email..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients Table */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full" id="clients-table">
            <thead className="bg-[#F4F1EA]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client / Contact</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClients.map((c, idx) => (
                <tr 
                  key={c.id} 
                  id={`client-row-${idx}`}
                  data-client-id={c.id}
                  data-company={c.company}
                  data-email={c.email}
                  className={selectedClient.id === c.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}
                >
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900 client-name">
                    {c.name}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700 client-company font-medium">
                    {c.company}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-gray-600 client-email">
                    {c.email}
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-amber-700">
                    {c.totalUnpaidAmount}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <button
                      id={`view-client-${idx}`}
                      onClick={() => setSelectedClient(c)}
                      className="px-3 py-1 bg-[#5B5FEF] hover:bg-[#474BD9] text-white text-xs font-medium rounded transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Client Details Card */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col justify-between" id="client-details">
          <div>
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#5B5FEF] bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedClient.id}
                </span>
                <h2 id="client-name" className="text-xl font-bold text-gray-900 mt-1">
                  {selectedClient.name}
                </h2>
                <div id="client-company" className="text-sm font-semibold text-gray-600">
                  {selectedClient.company}
                </div>
              </div>
              <span id="client-status" className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {selectedClient.status}
              </span>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
              <div>
                <strong className="text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Billing Email:</strong>
                <span id="client-email" className="font-mono text-sm text-[#5B5FEF] font-bold">
                  {selectedClient.email}
                </span>
              </div>
              <div>
                <strong className="text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Phone:</strong>
                <span id="client-phone" className="font-medium text-gray-800">
                  {selectedClient.phone}
                </span>
              </div>
              <div>
                <strong className="text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Recent CRM Interaction:</strong>
                <p id="client-interaction" className="text-gray-700 bg-gray-50 p-2.5 rounded border border-gray-200">
                  {selectedClient.recentInteraction}
                </p>
              </div>
              <div>
                <strong className="text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Unpaid Invoices Ledger:</strong>
                <div id="client-invoices" className="p-2.5 bg-amber-50 rounded border border-amber-200 text-amber-900 font-medium">
                  {selectedClient.outstandingInvoices}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
            Simulated CRM Database Record • Verified by Acme Account Operations
          </div>
        </div>
      </div>
    </div>
  );
}
