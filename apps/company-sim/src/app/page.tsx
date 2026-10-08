import Link from "next/link";

export default function Home() {
  const portals = [
    {
      title: "Document Center",
      href: "/documents",
      desc: "Central repository for vendor invoices, client contracts, and verified purchase orders.",
      stats: "4 Indexed Invoices",
      badge: "Invoices & PDFs",
      badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
      iconColor: "bg-blue-600 text-white",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Finance Accounting Portal",
      href: "/finance",
      desc: "Accounts payable ledger, general ledger recording, duplicate safeguards, and fiscal compliance.",
      stats: "General Ledger Live",
      badge: "Accounts Payable",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      iconColor: "bg-emerald-600 text-white",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Client & CRM System",
      href: "/crm",
      desc: "Enterprise client profiles, verified billing contacts, account standing, and payment records.",
      stats: "4 Corporate Accounts",
      badge: "Account Directory",
      badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
      iconColor: "bg-purple-600 text-white",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "Corporate Email System",
      href: "/email",
      desc: "Simulated internal and external client correspondence gateway for drafts and outbound messages.",
      stats: "Secure SMTP Gateway",
      badge: "Dispatch Relay",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      iconColor: "bg-amber-600 text-white",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="py-2">
      {/* Executive Header */}
      <div className="mb-4 p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
              Enterprise Simulation Platform
            </span>
            <span className="text-[11px] font-bold text-slate-500">• Port 3001 Isolated</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Acme Corporation Business Applications
          </h1>
          <p className="text-slate-600 text-xs mt-0.5 max-w-2xl font-medium leading-relaxed">
            Stateful company infrastructure automated by NEXO. Every portal maintains realistic data schemas, verified IDs, and Playwright automation hooks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700">
            Automated by NEXO
          </span>
        </div>
      </div>

      {/* High-Contrast Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portals.map((p, idx) => (
          <Link 
            key={idx} 
            href={p.href}
            className="p-6 bg-white rounded-2xl shadow-sm border-2 border-slate-200/80 hover:border-indigo-600 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${p.iconColor} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0`}>
                    {p.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {p.title}
                    </h2>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {p.stats}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${p.badgeColor} shrink-0`}>
                  {p.badge}
                </span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {p.desc}
              </p>
            </div>

            <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-indigo-600 group-hover:text-indigo-700">
              <span>Launch Enterprise App</span>
              <span className="group-hover:translate-x-1.5 transition-transform text-sm">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
