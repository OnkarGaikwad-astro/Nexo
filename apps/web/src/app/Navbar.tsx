'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Overview' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/execution', label: 'Execution' },
    { href: '/memory', label: 'Memory' },
  ];

  return (
    <header className="flex justify-between items-center px-10 py-5 w-full">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white bg-[#447A9C] shadow-sm">
          N
        </div>
        <span className="font-bold text-xl tracking-wide text-[#2A4B61]">NEXO</span>
      </Link>

      {/* Navigation Links */}
      <nav className="flex gap-4 font-medium text-[15px]">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-5 py-2 rounded-full transition-all ${
                isActive
                  ? 'text-[#2A4B61] font-bold shadow-xs'
                  : 'text-[#5C7F9B] hover:text-[#2A4B61]'
              }`}
              style={
                isActive
                  ? {
                      background: 'rgba(141, 190, 222, 0.40)',
                      border: '1px solid rgba(141, 190, 222, 0.70)',
                    }
                  : {}
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-[#10B981] bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300/40">
          ● Autonomous Agent
        </span>
        <div
          className="w-9 h-9 rounded-full border bg-[#447A9C] text-white flex items-center justify-center shadow-sm"
          style={{ borderColor: 'rgba(141, 190, 222, 0.60)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </header>
  );
}
