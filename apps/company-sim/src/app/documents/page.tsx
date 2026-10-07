export default function Documents() {
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
