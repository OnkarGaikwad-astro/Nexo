'use client';
import { useState, useEffect } from 'react';

interface EmailItem {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  status: 'DRAFT' | 'SENT';
}

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState<'sent' | 'drafts' | 'compose'>('sent');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  const defaultEmails: EmailItem[] = [
    {
      id: "EML-001",
      recipient: "billing@acme.corp",
      subject: "Acme Corporation Q2 Operations Overview",
      body: "Attached is the quarterly corporate review and account reconciliation report.",
      timestamp: "05 October 2026, 09:30 AM",
      status: "SENT"
    },
    {
      id: "EML-002",
      recipient: "operations@starlight.corp",
      subject: "Master Consulting Agreement Finalization",
      body: "Thank you for partnering with Acme Corporation. The signed engagement terms are confirmed.",
      timestamp: "06 October 2026, 14:15 PM",
      status: "SENT"
    }
  ];

  const [emails, setEmails] = useState<EmailItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('sim_emails');
    if (saved) {
      try {
        setEmails(JSON.parse(saved));
      } catch {
        setEmails(defaultEmails);
      }
    } else {
      setEmails(defaultEmails);
      localStorage.setItem('sim_emails', JSON.stringify(defaultEmails));
    }
  }, []);

  const saveEmails = (newItems: EmailItem[]) => {
    setEmails(newItems);
    localStorage.setItem('sim_emails', JSON.stringify(newItems));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !subject) {
      setIsSuccess(false);
      setStatusMessage('Recipient email and subject are required.');
      return;
    }

    const newEmail: EmailItem = {
      id: `EML-${Date.now().toString().slice(-4)}`,
      recipient,
      subject,
      body,
      timestamp: new Date().toLocaleString(),
      status: 'SENT'
    };

    const updated = [newEmail, ...emails];
    saveEmails(updated);
    setIsSuccess(true);
    setStatusMessage(`Email successfully dispatched to ${recipient}. Ref #${newEmail.id}`);
    setActiveTab('sent');
    setRecipient('');
    setSubject('');
    setBody('');
  };

  const handleDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !subject) {
      setIsSuccess(false);
      setStatusMessage('Recipient and subject required to save draft.');
      return;
    }

    const newDraft: EmailItem = {
      id: `DFT-${Date.now().toString().slice(-4)}`,
      recipient,
      subject,
      body,
      timestamp: new Date().toLocaleString(),
      status: 'DRAFT'
    };

    const updated = [newDraft, ...emails];
    saveEmails(updated);
    setIsSuccess(true);
    setStatusMessage(`Email draft saved for ${recipient}. Ref #${newDraft.id}`);
    setActiveTab('drafts');
  };

  const sentEmails = emails.filter(e => e.status === 'SENT');
  const draftEmails = emails.filter(e => e.status === 'DRAFT');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#171923]">Corporate Communications & Email</h1>
          <p className="text-sm text-gray-500 mt-1">Acme Corporation simulated client communication gateway</p>
        </div>

        <div className="flex gap-2">
          <button
            id="tab-sent"
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'sent' ? 'bg-[#5B5FEF] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Sent Messages ({sentEmails.length})
          </button>
          <button
            id="tab-drafts"
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'drafts' ? 'bg-[#5B5FEF] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Drafts ({draftEmails.length})
          </button>
          <button
            id="tab-compose"
            onClick={() => setActiveTab('compose')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'compose' ? 'bg-[#5B5FEF] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            + Compose
          </button>
        </div>
      </div>

      {statusMessage && (
        <div 
          id="email-status-message" 
          className={`p-4 mb-6 rounded-lg text-sm font-semibold border ${isSuccess ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'}`}
        >
          {statusMessage}
        </div>
      )}

      {/* Compose Form */}
      {activeTab === 'compose' && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Compose Corporate Email</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">To Recipient Email</label>
              <input
                id="email-recipient"
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subject</label>
              <input
                id="email-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Payment reminder for INV-XXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Message Body</label>
              <textarea
                id="email-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="Write message content..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                id="send-email-btn"
                type="button"
                onClick={handleSend}
                className="px-5 py-2.5 bg-[#5B5FEF] hover:bg-[#474BD9] text-white font-bold text-xs rounded-lg transition shadow-sm"
              >
                Send Email
              </button>
              <button
                id="save-draft-btn"
                type="button"
                onClick={handleDraft}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg transition"
              >
                Save as Draft
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sent Emails Tab */}
      {activeTab === 'sent' && (
        <div className="bg-white rounded-lg shadow overflow-hidden" id="sent-emails-table">
          <table className="min-w-full">
            <thead className="bg-[#F4F1EA]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref ID</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200" id="sent-list">
              {sentEmails.map((item, idx) => (
                <tr key={item.id} id={`sent-row-${idx}`} data-recipient={item.recipient} data-subject={item.subject}>
                  <td className="px-5 py-3.5 text-xs font-mono font-bold text-[#5B5FEF]">
                    {item.id}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-gray-900 sent-recipient">
                    {item.recipient}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-700 sent-subject">
                    <span className="font-bold">{item.subject}</span>
                    <p className="text-[11px] text-gray-500 truncate max-w-md mt-0.5">{item.body}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {item.timestamp}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                      ✓ Sent
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drafts Tab */}
      {activeTab === 'drafts' && (
        <div className="bg-white rounded-lg shadow overflow-hidden" id="drafts-emails-table">
          {draftEmails.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No pending drafts found. Compose a message to create a draft.
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-[#F4F1EA]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Draft ID</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200" id="drafts-list">
                {draftEmails.map((item, idx) => (
                  <tr key={item.id} id={`draft-row-${idx}`} data-recipient={item.recipient} data-subject={item.subject}>
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-amber-700">
                      {item.id}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-900 draft-recipient">
                      {item.recipient}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-gray-800 draft-subject">
                      {item.subject}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 truncate max-w-sm draft-body">
                      {item.body}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                        Draft Prepared
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
