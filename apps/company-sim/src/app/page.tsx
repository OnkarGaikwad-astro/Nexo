import Link from "next/link";

export default function Home() {
  const portals = [
    {
      title: "Document Center",
      href: "/documents",
      desc: "Central repository for vendor invoices, client contracts, and verified purchase orders.",
      stats: "4 Active Documents Indexed",
      icon: (
        <svg className="w-6 h-6 text-[#5B5FEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Finance Accounting Portal",
      href: "/finance",
      desc: "Accounts payable ledger, general ledger recording, duplicate safeguards, and fiscal compliance.",
      stats: "Active General Ledger",
      icon: (
        <svg className="w-6 h-6 text-[#5B5FEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Client & CRM System",
      href: "/crm",
      desc: "Enterprise client profiles, verified billing contacts, account standing, and payment records.",
      stats: "4 Corporate Accounts",
      icon: (
        <svg className="w-6 h-6 text-[#5B5FEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "Corporate Email System",
      href: "/email",
      desc: "Simulated internal and external client correspondence gateway for drafts and outbound messages.",
      stats: "Secure Simulated Relay",
      icon: (
        <svg className="w-6 h-6 text-[#5B5FEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="py-6">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-[#5B5FEF] bg-indigo-50 px-3 py-1 rounded-full">
          Simulated Enterprise Environment
        </span>
        <h1 className="text-3xl font-bold text-[#171923] mt-2">Acme Corporation Internal Systems</h1>
        <p className="text-gray-600 text-sm mt-1 max-w-2xl">
          Coherent internal infrastructure operated autonomously by Nexo. Applications are isolated, stateful, and tool-accessible via Playwright automation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portals.map((p, idx) => (
          <Link 
            key={idx} 
            href={p.href}
            className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-[#5B5FEF] hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {p.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#5B5FEF] transition-colors">{p.title}</h2>
                  <span className="text-[11px] font-mono font-medium text-gray-500">{p.stats}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#5B5FEF]">
              <span>Access Internal Portal</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
