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
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
            {/* Left Brand & Portal Navigation */}
            <div className="flex items-center gap-4 flex-wrap">
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-sm group-hover:bg-indigo-500 transition-colors">
                  A
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-indigo-300 transition-colors leading-tight">
                    Acme Corporation
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    Internal Systems
                  </span>
                </div>
              </Link>

              {/* Portal Links - Always Visible */}
              <nav className="flex items-center gap-1 flex-wrap">
                {[
                  { name: "Dashboard", href: "/" },
                  { name: "Documents", href: "/documents" },
                  { name: "Finance", href: "/finance" },
                  { name: "CRM", href: "/crm" },
                  { name: "Email", href: "/email" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-2.5 py-1 rounded-md text-[11px] font-extrabold text-slate-300 hover:text-white hover:bg-slate-800 transition-all whitespace-nowrap"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Environment Indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Port 3001
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 py-4 flex-grow w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
