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
    <div className="py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
              Communications Hub
            </span>
            <span className="text-xs font-bold text-slate-500">Corporate SMTP Relay</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Corporate Communications & Email</h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Acme Corporation simulated client communication gateway.
          </p>
        </div>

        {/* High-Contrast Nav Tabs */}
        <div className="flex gap-2">
          <button
            id="tab-sent"
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border-2 ${
              activeTab === 'sent' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            Sent Messages ({sentEmails.length})
          </button>
          <button
            id="tab-drafts"
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border-2 ${
              activeTab === 'drafts' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            Drafts ({draftEmails.length})
          </button>
          <button
            id="tab-compose"
            onClick={() => setActiveTab('compose')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border-2 ${
              activeTab === 'compose' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            + Compose
          </button>
        </div>
      </div>

      {statusMessage && (
        <div 
          id="email-status-message" 
          className={`p-4 mb-6 rounded-xl text-sm font-bold border-2 flex items-center gap-2.5 shadow-2xs ${
            isSuccess 
              ? 'bg-emerald-50 text-emerald-950 border-emerald-400' 
              : 'bg-rose-50 text-rose-950 border-rose-400'
          }`}
        >
          <span>{isSuccess ? '✓' : '⚠️'}</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Compose Form */}
      {activeTab === 'compose' && (
        <div className="bg-white p-7 rounded-2xl shadow-sm border-2 border-slate-200/90 max-w-3xl">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-200">
            <span className="text-xl">✉️</span>
            <div>
              <h2 className="text-xl font-black text-slate-900">Compose Corporate Email</h2>
              <p className="text-xs font-semibold text-slate-500">Draft or dispatch messages to verified clients</p>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">To Recipient Email</label>
              <input
                id="email-recipient"
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="client@example.com"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Subject</label>
              <input
                id="email-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Payment reminder for INV-XXXX"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Message Body</label>
              <textarea
                id="email-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="Write message content..."
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all leading-relaxed"
                required
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                id="send-email-btn"
                type="button"
                onClick={handleSend}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-xs rounded-xl transition shadow-md hover:shadow-lg tracking-wide"
              >
                Send Email Message
              </button>
              <button
                id="save-draft-btn"
                type="button"
                onClick={handleDraft}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border-2 border-slate-300 transition"
              >
                Save as Draft
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sent Emails Tab */}
      {activeTab === 'sent' && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200/90 overflow-hidden" id="sent-emails-table">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100 border-b-2 border-slate-300">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Ref ID</th>
                <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Subject & Body Preview</th>
                <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3.5 text-right text-xs font-extrabold text-slate-800 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white" id="sent-list">
              {sentEmails.map((item, idx) => (
                <tr key={item.id} id={`sent-row-${idx}`} data-recipient={item.recipient} data-subject={item.subject} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono font-black text-indigo-700">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-slate-900 sent-recipient font-mono">
                    {item.recipient}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-700 sent-subject">
                    <span className="font-extrabold text-slate-900 text-sm block mb-0.5">{item.subject}</span>
                    <p className="text-xs text-slate-500 truncate max-w-md font-medium">{item.body}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                    {item.timestamp}
                  </td>
                  <td className="px-6 py-4 text-xs text-right">
                    <span className="px-2.5 py-1 rounded-full font-black text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
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
        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200/90 overflow-hidden" id="drafts-emails-table">
          {draftEmails.length === 0 ? (
            <div className="p-12 text-center text-sm font-semibold text-slate-500">
              No pending drafts found. Compose a message to create a draft.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Draft ID</th>
                  <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3.5 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Preview</th>
                  <th className="px-6 py-3.5 text-right text-xs font-extrabold text-slate-800 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white" id="drafts-list">
                {draftEmails.map((item, idx) => (
                  <tr key={item.id} id={`draft-row-${idx}`} data-recipient={item.recipient} data-subject={item.subject} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono font-black text-amber-800">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-900 draft-recipient font-mono">
                      {item.recipient}
                    </td>
                    <td className="px-6 py-4 text-xs font-extrabold text-slate-900 draft-subject">
                      {item.subject}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 truncate max-w-sm draft-body font-medium">
                      {item.body}
                    </td>
                    <td className="px-6 py-4 text-xs text-right">
                      <span className="px-2.5 py-1 rounded-full font-black text-[11px] bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
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
