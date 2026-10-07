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
    <div>
      <h1 className="text-3xl font-bold mb-6 text-[#171923]">Document Center</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full" id="documents-table">
          <thead className="bg-[#F4F1EA]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {documents.map((doc, idx) => (
              <tr 
                key={idx} 
                id={`doc-row-${idx}`}
                data-company={doc.company}
                data-invoice={doc.invoiceNumber}
                onClick={() => setSelectedDoc(doc)}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedDoc.name === doc.name ? 'bg-blue-50/60 font-semibold' : ''}`}
              >
                <td className="px-6 py-4 text-sm font-medium text-blue-600 doc-name">{doc.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700 doc-company">{doc.company}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{doc.status}</td>
                <td className="px-6 py-4 text-sm">
                  <button 
                    id={`view-doc-${idx}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded border border-slate-300"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 p-6 bg-white rounded-lg shadow border border-gray-200" id="document-viewer">
        <h2 className="text-xl font-bold mb-4" id="document-viewer-title">Document Viewer: {selectedDoc.name}</h2>
        <div className="p-4 bg-gray-50 border rounded font-mono text-sm space-y-1">
          <p id="doc-field-company"><strong>Company:</strong> {selectedDoc.company}</p>
          <p id="doc-field-invoice"><strong>Invoice number:</strong> {selectedDoc.invoiceNumber}</p>
          <p id="doc-field-amount"><strong>Amount:</strong> {selectedDoc.amount}</p>
          <p id="doc-field-date"><strong>Date:</strong> {selectedDoc.date}</p>
          <p id="doc-field-due-date"><strong>Due date:</strong> {selectedDoc.dueDate}</p>
        </div>
      </div>
    </div>
  );
}
