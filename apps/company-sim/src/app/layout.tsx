import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Acme Corporation - Internal Systems Portal",
  icons: {
    icon: "/nexo-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        <nav className="bg-[#171923] text-[#F7F8FC] p-4 shadow-md">
          <div className="container mx-auto flex gap-6 items-center">
            <div className="font-bold text-xl mr-4 text-[#5B5FEF]">Acme Corporation</div>
            <Link href="/" className="hover:text-[#A9B1FF]">Dashboard</Link>
            <Link href="/documents" className="hover:text-[#A9B1FF]">Document Center</Link>
            <Link href="/finance" className="hover:text-[#A9B1FF]">Finance Portal</Link>
            <Link href="/crm" className="hover:text-[#A9B1FF]">Client CRM</Link>
            <Link href="/email" className="hover:text-[#A9B1FF]">Email System</Link>
          </div>
        </nav>
        <main className="container mx-auto p-6 flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
