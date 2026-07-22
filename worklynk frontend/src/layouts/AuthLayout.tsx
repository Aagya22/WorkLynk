import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, KeyRound, Lock, ScrollText } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: <KeyRound size={15} />, title: 'Multi-factor authentication', body: 'TOTP on every account, with admin-assisted recovery.' },
  { icon: <Lock size={15} />, title: 'Encrypted records', body: 'Salary and bank details sealed with AES-256-GCM.' },
  { icon: <ScrollText size={15} />, title: 'Full audit trail', body: 'Every sensitive action logged and reviewable.' },
];

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="content-scope grid min-h-screen bg-[#F7F6F3] font-sans lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#14110F] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="aurora float-slow absolute -left-16 -top-20 h-80 w-80 bg-[#3B3560] opacity-40" />
        <div className="aurora float-slower absolute -bottom-24 -right-10 h-80 w-80 bg-[#1F3A5F] opacity-40" />

        <Link to="/" className="group relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#14110F] transition-transform duration-300 group-hover:-rotate-6">
            <Shield size={19} />
          </span>
          <span className="font-display text-[21px] font-bold tracking-[-0.02em] text-white">Worklynk</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-[40px] font-bold leading-[1.06] tracking-[-0.03em] text-white">
            The HR workspace your team can actually <span className="gradient-text">trust</span>.
          </h2>
          <p className="mt-5 text-[14.5px] leading-relaxed text-white/55">
            Payslips, leave and employee records in one place, protected from the first login.
          </p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  {h.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-white">{h.title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-white/50">{h.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[12px] text-white/35">© {new Date().getFullYear()} Worklynk</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-[#57534E] transition-colors hover:bg-white hover:text-[#1C1917]"
          >
            <ArrowLeft size={15} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to home
          </Link>

          <Link to="/" className="flex items-center gap-2 lg:hidden" aria-label="Worklynk home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14110F] text-white">
              <Shield size={15} />
            </span>
            <span className="font-display text-[16px] font-bold tracking-[-0.02em] text-[#1C1917]">Worklynk</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[420px] animate-fade-in">{children}</div>
        </div>

        <p className="text-center text-[11.5px] text-[#A8A29E]">
          Protected by multi-factor authentication and audit logging.
        </p>
      </main>
    </div>
  );
};
