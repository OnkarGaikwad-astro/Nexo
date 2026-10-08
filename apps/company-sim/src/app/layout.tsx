import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Acme Corporation - Internal Systems Portal",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased`}>
        {/* High-Contrast Enterprise Top Navigation */}
        <header className="bg-[#0F172A] text-white border-b border-slate-800 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Left Brand & Portal Navigation */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-sm group-hover:bg-indigo-500 transition-colors">
                  A
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                    Acme Corporation
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Internal Systems
                  </span>
                </div>
              </Link>

              {/* Portal Links with High-Contrast Hover/Focus */}
              <nav className="hidden md:flex items-center gap-1">
                {[
                  { name: "Dashboard", href: "/" },
                  { name: "Document Center", href: "/documents" },
                  { name: "Finance Portal", href: "/finance" },
                  { name: "Client CRM", href: "/crm" },
                  { name: "Corporate Email", href: "/email" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Environment Indicator */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Port 3001 Isolated
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
