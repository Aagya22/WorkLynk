import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import {
  Bell,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CalendarRange,
  Inbox,
} from 'lucide-react';

// Single brand accent — used for every decorative highlight. Status greens/ambers
// are reserved strictly for health/alert semantics.
const BRAND = '#10367D';
const ANNUAL_ALLOWANCE = 28;

// Company holidays (fixed reference data).
const HOLIDAYS = [
  { name: 'Summer Bank Holiday', date: '2026-08-31' },
  { name: 'Christmas Day', date: '2026-12-25' },
  { name: 'Boxing Day', date: '2026-12-28' },
  { name: "New Year's Day", date: '2027-01-01' },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const dayCount = (start: string, end: string) =>
  Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);

const Ring: React.FC<{ pct: number; color: string; size?: number; children: React.ReactNode }> = ({
  pct,
  color,
  size = 76,
  children,
}) => (
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
      return <CalendarRange size={15} className="text-[#10367D]" />;
    default:
      return <Bell size={15} className="text-slate-500" />;
  }
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const Calendar: React.FC<{ leaves: any[]; remaining: number }> = ({ leaves, remaining }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() === m;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startOffset = (new Date(y, m, 1).getDay() + 6) % 7; // Monday-first

  const approved = leaves.filter((l) => l.status === 'approved');

  const leaveDays = new Set<number>();
  approved.forEach((l) => {
    const s = stripTime(new Date(l.startDate));
    const e = stripTime(new Date(l.endDate));
    for (let d = 1; d <= daysInMonth; d++) {
      const cur = new Date(y, m, d);
      if (cur >= s && cur <= e) leaveDays.add(d);
    }
  });

  const holidayMap = new Map<number, string>();
  HOLIDAYS.forEach((h) => {
    const d = new Date(h.date);
    if (d.getFullYear() === y && d.getMonth() === m) holidayMap.set(d.getDate(), h.name);
  });

  const firstOfMonth = new Date(y, m, 1);
  const lastOfMonth = new Date(y, m, daysInMonth);
  const events = [
    ...approved
      .filter((l) => new Date(l.startDate) <= lastOfMonth && new Date(l.endDate) >= firstOfMonth)
      .map((l) => ({ date: l.startDate, end: l.endDate, label: `${l.leaveType || l.type || 'leave'} leave`, kind: 'leave' as const })),
    ...[...holidayMap.entries()].map(([day, name]) => ({ date: new Date(y, m, day).toISOString(), end: '', label: name, kind: 'holiday' as const })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const shift = (n: number) => setViewDate(new Date(y, m + n, 1));

  return (
    <section aria-label="Calendar" className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#0D1326] shadow-lg">
      <div className="flex items-center justify-between px-6 py-3.5 text-white" style={{ background: `linear-gradient(115deg, ${BRAND} 0%, #0B1B38 100%)` }}>
        <div className="flex items-center gap-3">
          <button onClick={() => shift(-1)} aria-label="Previous month" className="rounded-lg p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
            <ChevronLeft size={17} />
          </button>
          <h2 className="min-w-[130px] text-center text-sm font-bold uppercase tracking-wider">{viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={() => shift(1)} aria-label="Next month" className="rounded-lg p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
            <ChevronRight size={17} />
          </button>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">{remaining} leave days left</span>
      </div>

      <div className="flex flex-col gap-6 p-6 lg:flex-row">
        {/* Grid */}
        <div className="flex-1">
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const isToday = isCurrentMonth && d === today.getDate();
              const isLeave = leaveDays.has(d);
              const holiday = holidayMap.get(d);
              let cls = 'text-slate-600';
              if (isToday) cls = 'bg-[#10367D] font-bold text-white';
              else if (isLeave) cls = 'bg-[#10367D]/[0.12] font-semibold text-[#10367D]';
              else if (holiday) cls = 'font-semibold text-slate-800';
              return (
                <div
                  key={i}
                  title={holiday || (isLeave ? 'Approved leave' : '')}
                  className={`relative flex h-9 items-center justify-center rounded-lg text-[13px] ${cls}`}
                >
                  {d}
                  {holiday && !isToday && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#10367D]" />}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-black/[0.06] pt-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#10367D]" /> Today</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[#10367D]/[0.12]" /> Leave</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#10367D]" /> Holiday</span>
          </div>
        </div>

        {/* Events for the viewed month */}
        <div className="lg:w-56 lg:border-l lg:border-black/[0.06] lg:pl-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">This month</h3>
          {events.length === 0 ? (
            <p className="text-xs text-slate-500">No events this month.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((e, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-[#10367D]/[0.08] text-[#10367D]">
                    <span className="text-[13px] font-bold leading-none">{new Date(e.date).getDate()}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold capitalize text-slate-800">{e.label}</p>
                    <p className="text-[11px] text-slate-500">
                      {fmt(e.date)}
                      {e.end && e.end !== e.date ? ` – ${fmt(e.end)}` : ''}
                      {e.kind === 'holiday' ? ' · Holiday' : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
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
  const year = new Date().getFullYear();

  const usedAnnual = leaves
    .filter((l) => l.status === 'approved' && (l.leaveType || l.type) === 'annual' && new Date(l.startDate).getFullYear() === year)
    .reduce((sum, l) => sum + dayCount(l.startDate, l.endDate), 0);
  const remaining = Math.max(0, ANNUAL_ALLOWANCE - usedAnnual);

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
          <Link to="/leaves" className="hidden items-center gap-1.5 text-xs font-semibold text-[#10367D] hover:underline sm:flex">
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
            <svg className="mr-3 h-5 w-5 animate-spin text-[#10367D]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading your dashboard…
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {/* MAIN (2/3): Calendar + Account health */}
            <div className="space-y-5 lg:col-span-2">
              <Calendar leaves={leaves} remaining={remaining} />

              <section aria-label="Account health" className="flex flex-col items-start gap-5 rounded-2xl border border-black/[0.06] bg-[#0D1326] p-6 shadow-sm sm:flex-row sm:items-center">
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
                    <Link to="/profile" className="flex items-center gap-1.5 rounded-lg bg-[#10367D] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0C2A63]">
                      <Fingerprint size={14} /> Enable 2FA
                    </Link>
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT RAIL (1/3): Notices */}
            <aside aria-label="Notices" className="flex flex-col rounded-2xl border border-black/[0.06] bg-[#0D1326] shadow-sm lg:min-h-[520px]">
              <header className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Bell size={15} className="text-[#10367D]" /> Notices
                </h2>
                {unread > 0 && <span className="rounded-full bg-[#10367D]/10 px-2 py-0.5 text-[10px] font-bold text-[#10367D]">{unread} new</span>}
              </header>
              <div className="flex-1 space-y-1 overflow-y-auto p-3">
                {notices.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
                    <Inbox size={26} className="text-slate-300" />
                    <p className="text-xs text-slate-500">You're all caught up.</p>
                  </div>
                ) : (
                  notices.slice(0, 8).map((n) => (
                    <div key={n._id} className={`flex gap-3 rounded-xl p-3 ${n.isRead ? '' : 'bg-slate-50'}`}>
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-black/[0.05] bg-white">
                        {noticeIcon(n.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[13px] font-semibold ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</p>
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
