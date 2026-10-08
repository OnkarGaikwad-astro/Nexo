'use client';
import { useState } from 'react';

interface DocumentItem {
  name: string;
  type: string;
  company: string;
  date: string;
  dueDate: string;
  invoiceNumber: string;
  amount: string;
  status: string;
}

export default function Documents() {
  const documents: DocumentItem[] = [
    { 
      name: "invoice_acme_2048.pdf", 
      type: "Invoice", 
      company: "Acme Corp", 
      date: "1 October 2026", 
      dueDate: "15 October 2026",
      invoiceNumber: "INV-2048",
      amount: "₹84,500",
      status: "Pending" 
    },
    { 
      name: "invoice_acme_2039.pdf", 
      type: "Invoice", 
      company: "Acme Corp", 
      date: "1 September 2026", 
      dueDate: "15 September 2026",
      invoiceNumber: "INV-2039",
      amount: "₹42,000",
      status: "Processed" 
    },
    { 
      name: "invoice_xyz_1092.pdf", 
      type: "Invoice", 
      company: "XYZ Ltd", 
      date: "2 October 2026", 
      dueDate: "20 October 2026",
      invoiceNumber: "INV-1092",
      amount: "₹112,000",
      status: "Pending" 
    },
    { 
      name: "invoice_nova_5521.pdf", 
      type: "Invoice", 
      company: "Nova Systems", 
      date: "3 October 2026", 
      dueDate: "28 October 2026",
      invoiceNumber: "INV-5521",
      amount: "₹35,400",
      status: "Pending" 
    },
  ];

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem>(documents[0]);

  return (
    <div className="py-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              Repository
            </span>
            <span className="text-xs font-bold text-slate-500">4 Invoices Indexed</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Document Center</h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Internal invoice repository and purchase contract files for Acme Corporation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-2xs">
            Format: PDF / JSON Structured
          </span>
        </div>
      </div>

      {/* High-Contrast Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200/90 overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-slate-200" id="documents-table">
          <thead className="bg-slate-100 border-b-2 border-slate-300">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Document Name</th>
              <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-right text-xs font-extrabold text-slate-800 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {documents.map((doc, idx) => {
              const isSelected = selectedDoc.name === doc.name;
              return (
                <tr 
                  key={idx} 
                  id={`doc-row-${idx}`}
                  data-company={doc.company}
                  data-invoice={doc.invoiceNumber}
                  onClick={() => setSelectedDoc(doc)}
                  className={`hover:bg-indigo-50/70 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50/90 border-l-4 border-indigo-600 font-semibold' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-bold text-indigo-700 doc-name flex items-center gap-2">
                    <span className="text-base">📄</span>
                    <span>{doc.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 doc-company">{doc.company}</td>
                  <td className="px-6 py-4 text-sm font-extrabold text-slate-900 font-mono">{doc.amount}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                      doc.status === 'Processed'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button 
                      id={`view-doc-${idx}`}
                      onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* High-Contrast Document Inspector */}
      <div className="p-6 bg-white rounded-2xl shadow-sm border-2 border-slate-200/90" id="document-viewer">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-200">
              📑
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900" id="document-viewer-title">
                Document Viewer: {selectedDoc.name}
              </h2>
              <span className="text-xs font-bold text-slate-500">
                Verified Enterprise File Record
              </span>
            </div>
          </div>

          <span className="text-xs font-bold font-mono px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg">
            {selectedDoc.invoiceNumber}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-5 bg-slate-50/90 border-2 border-slate-200/80 rounded-xl">
          <div className="p-3 bg-white rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Company</span>
            <p className="text-sm font-extrabold text-slate-900" id="doc-field-company">{selectedDoc.company}</p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Invoice Number</span>
            <p className="text-sm font-extrabold text-indigo-600 font-mono" id="doc-field-invoice">{selectedDoc.invoiceNumber}</p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Amount</span>
            <p className="text-base font-black text-slate-900 font-mono" id="doc-field-amount">{selectedDoc.amount}</p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Issue Date</span>
            <p className="text-sm font-bold text-slate-800" id="doc-field-date">{selectedDoc.date}</p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Due Date</span>
            <p className="text-sm font-bold text-rose-700" id="doc-field-due-date">{selectedDoc.dueDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
