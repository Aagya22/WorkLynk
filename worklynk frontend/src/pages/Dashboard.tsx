import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { CalendarCard } from '../components/CalendarCard';
import {
  Bell,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  CalendarRange,
  Inbox,
} from 'lucide-react';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const Ring: React.FC<{ pct: number; color: string; size?: number; children: React.ReactNode }> = ({ pct, color, size = 76, children }) => (
  <div
    className="relative flex flex-shrink-0 items-center justify-center rounded-full"
    style={{ width: size, height: size, background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(148,163,184,0.18) 0deg)` }}
    role="img"
    aria-label={`${Math.round(pct)} percent`}
  >
    <div className="flex items-center justify-center rounded-full bg-[#0D1326]" style={{ width: size - 16, height: size - 16 }}>
      {children}
    </div>
  </div>
);

const noticeIcon = (type: string) => {
  switch (type) {
    case 'security':
      return <ShieldAlert size={15} className="text-rose-500" />;
    case 'payslip':
      return <Wallet size={15} className="text-emerald-600" />;
    case 'leave':
      return <CalendarRange size={15} className="text-accent-500" />;
    default:
      return <Bell size={15} className="text-slate-500" />;
  }
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (user.role === 'hr_manager') navigate('/hr/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [leaves, setLeaves] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [leavesRes, notifRes] = await Promise.all([api.get('/api/leaves/me'), api.get('/api/notifications')]);
        setLeaves(leavesRes.data.leaves || []);
        setNotices(notifRes.data.notifications || []);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const name = user?.email.split('@')[0] || 'there';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const mfaOn = !!user?.mfaEnabled;
  const health = mfaOn
    ? { score: 100, label: 'Strong', color: '#16A34A', tone: 'text-emerald-600', note: 'Two-factor auth is on and your data is encrypted.' }
    : { score: 65, label: 'Action needed', color: '#D97706', tone: 'text-amber-600', note: 'Enable two-factor authentication for full protection.' };

  const unread = notices.filter((n) => !n.isRead).length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Utility greeting line */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            {greeting()}, <span className="font-semibold text-slate-700">{name}</span> · {today}
          </p>
          <Link to="/leaves" className="hidden items-center gap-1.5 text-xs font-semibold text-accent-500 hover:underline sm:flex">
            Request leave <ArrowRight size={13} />
          </Link>
        </div>

        {!loading && !mfaOn && (
          <div role="status" className="flex items-center gap-3 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={17} className="flex-shrink-0 text-amber-600" />
            <span className="flex-1 font-medium">Two-factor authentication is off. Turn it on to secure your account.</span>
            <Link to="/profile" className="flex-shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700">Enable 2FA</Link>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm font-semibold text-slate-500">
            <svg className="mr-3 h-5 w-5 animate-spin text-accent-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading your dashboard…
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {/* MAIN (2/3): Calendar + Account health */}
            <div className="space-y-5 lg:col-span-2">
              <CalendarCard leaves={leaves} />

              <section aria-label="Account health" className="flex flex-col items-start gap-5 rounded-2xl border border-white/[0.08] bg-[#0D1326] p-6 shadow-sm sm:flex-row sm:items-center">
                <Ring pct={health.score} color={health.color}>
                  <span className="font-display text-lg font-extrabold" style={{ color: health.color }}>{health.score}</span>
                </Ring>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className={health.tone} />
                    <h2 className={`text-base font-bold ${health.tone}`}>Account Health · {health.label}</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{health.note}</p>
                </div>
                <div className="flex-shrink-0">
                  {mfaOn ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={14} /> 2FA Active
                    </span>
                  ) : (
                    <Link to="/profile" className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-accent-600">
                      <Fingerprint size={14} /> Enable 2FA
                    </Link>
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT RAIL (1/3): Notices */}
            <aside aria-label="Notices" className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#0D1326] shadow-sm lg:min-h-[520px]">
              <header className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100">
                  <Bell size={15} className="text-accent-500" /> Notices
                </h2>
                {unread > 0 && <span className="rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-bold text-accent-500">{unread} new</span>}
              </header>
              <div className="flex-1 space-y-1 overflow-y-auto p-3">
                {notices.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
                    <Inbox size={26} className="text-slate-400" />
                    <p className="text-xs text-slate-500">You're all caught up.</p>
                  </div>
                ) : (
                  notices.slice(0, 8).map((n) => (
                    <div key={n._id} className={`flex gap-3 rounded-xl p-3 ${n.isRead ? '' : 'bg-slate-900/50'}`}>
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-slate-900">
                        {noticeIcon(n.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[13px] font-semibold ${n.isRead ? 'text-slate-400' : 'text-slate-100'}`}>{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{n.message}</p>
                        <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
