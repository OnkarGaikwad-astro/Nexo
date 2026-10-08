import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import Navbar from "./Navbar";
import "./globals.css";

const josefin = Josefin_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexo - Autonomous AI Task Worker",
  description: "From Intent to Execution",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/nexo-icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/nexo-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${josefin.className} min-h-screen flex flex-col text-[#2A4B61] relative`}
            style={{
              background: '#F6F6E9', // Solid cream background
            }}>
        <Navbar />
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-10 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
