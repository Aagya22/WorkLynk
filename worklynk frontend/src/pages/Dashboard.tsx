import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PageHeader, BarList, Meter } from '../components/Bento';
import {
  Bell,
  Wallet,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  ShieldAlert,
  CalendarRange,
  Inbox,
  Clock3,
} from 'lucide-react';

const ANNUAL_ALLOWANCE = 28;

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const dayCount = (start: string, end: string) =>
  Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);

const noticeIcon = (type: string) => {
  switch (type) {
    case 'security':
      return <ShieldAlert size={15} className="text-red-600" />;
    case 'payslip':
      return <Wallet size={15} className="text-emerald-700" />;
    case 'leave':
      return <CalendarRange size={15} className="text-blue-600" />;
    default:
      return <Bell size={15} className="ink-muted" />;
  }
};

const KPI_TONES: Record<string, { surface: string; border: string; chip: string; value: string }> = {
  info: { surface: '#F3F6FC', border: 'rgba(29,78,216,0.14)', chip: '#DEE8F9', value: '#1D4ED8' },
  warning: { surface: '#FDF8EF', border: 'rgba(180,83,9,0.14)', chip: '#F7E9D2', value: '#B45309' },
  violet: { surface: '#F7F4FC', border: 'rgba(109,40,217,0.14)', chip: '#E8E0F8', value: '#6D28D9' },
  positive: { surface: '#F2F8F4', border: 'rgba(21,128,61,0.14)', chip: '#DCEFE3', value: '#15803D' },
};

const Kpi: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
  to?: string;
  tone?: keyof typeof KPI_TONES;
  icon?: React.ReactNode;
}> = ({ label, value, sub, to, tone = 'info', icon }) => {
  const t = KPI_TONES[tone];
  const body = (
    <div
      className="paper-hover group flex items-center justify-between gap-4 rounded-2xl px-6 py-5 transition-shadow"
      style={{ background: t.surface, border: `1px solid ${t.border}` }}
    >
      <div className="min-w-0">
        <p className="eyebrow">{label}</p>
        <p className="font-display mt-2 text-[32px] font-bold leading-none" style={{ color: t.value }}>
          {value}
        </p>
        {sub && <p className="mt-1.5 text-[12px] ink-subtle">{sub}</p>}
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-3">
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: t.chip, color: t.value }}>
            {icon}
          </span>
        )}
        {to && <ArrowUpRight size={18} className="ink-subtle transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
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
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const year = new Date().getFullYear();

  const usedAnnual = leaves
    .filter((l) => l.status === 'approved' && (l.leaveType || l.type) === 'annual' && new Date(l.startDate).getFullYear() === year)
    .reduce((sum, l) => sum + dayCount(l.startDate, l.endDate), 0);
  const remaining = Math.max(0, ANNUAL_ALLOWANCE - usedAnnual);
  const pending = leaves.filter((l) => l.status === 'pending').length;
  const mfaOn = !!user?.mfaEnabled;
  const unread = notices.filter((n) => !n.isRead).length;

  const statusCounts = {
    approved: leaves.filter((l) => l.status === 'approved').length,
    pending,
    rejected: leaves.filter((l) => l.status === 'rejected').length,
    cancelled: leaves.filter((l) => l.status === 'cancelled').length,
  };

  const TYPE_TONES: Record<string, string> = { annual: '#1D4ED8', sick: '#B91C1C', emergency: '#B45309', unpaid: '#6D28D9' };

  const typeBreakdown = ['annual', 'sick', 'emergency', 'unpaid'].map((t) => ({
    label: t.charAt(0).toUpperCase() + t.slice(1),
    tone: TYPE_TONES[t],
    value: leaves
      .filter((l) => l.status === 'approved' && (l.leaveType || l.type) === t)
      .reduce((sum, l) => sum + dayCount(l.startDate, l.endDate), 0),
  }));

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          eyebrow={today}
          title={<>{greeting()}, <span className="gradient-text">{name}</span></>}
          action={
            <Link
              to="/leaves"
              className="inline-flex items-center gap-2 rounded-xl bg-[#14110F] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#2B2724]"
            >
              Request leave <ArrowRight size={15} />
            </Link>
          }
        />

        {!loading && !mfaOn && (
          <Link
            to="/profile"
            className="animate-fade-in flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 text-sm text-amber-900 transition-colors hover:bg-amber-50"
          >
            <AlertTriangle size={17} className="flex-shrink-0 text-amber-600" />
            <span className="flex-1 font-medium">Two-factor authentication is off. Turn it on to secure your account.</span>
            <ArrowUpRight size={16} className="text-amber-700" />
          </Link>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-28 text-sm font-medium ink-muted">Loading your dashboard…</div>
        ) : (
          <>
            {/* KPI strip */}
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="animate-slide-up stagger-1">
                <Kpi
                  label={`Leave balance · ${year}`}
                  value={`${remaining} days`}
                  sub={`${usedAnnual} of ${ANNUAL_ALLOWANCE} used`}
                  to="/leaves"
                  tone="info"
                  icon={<CalendarRange size={16} />}
                />
              </div>
              <div className="animate-slide-up stagger-2">
                <Kpi
                  label="Pending requests"
                  value={pending}
                  sub={pending === 0 ? 'Nothing awaiting review' : 'Awaiting manager review'}
                  to="/leaves"
                  tone={pending > 0 ? 'warning' : 'positive'}
                  icon={<Clock3 size={16} />}
                />
              </div>
              <div className="animate-slide-up stagger-3">
                <Kpi label="Payslips" value="View" sub="Download your statements" to="/payslips" tone="violet" icon={<Wallet size={16} />} />
              </div>
            </div>

            {/* Analytics + notices */}
            <div className="grid gap-5 lg:grid-cols-[1.9fr_1fr]">
              <div className="animate-slide-up stagger-4 space-y-5">
                <div className="paper rounded-2xl p-6">
                  <Meter label={`Annual leave · ${year}`} used={usedAnnual} total={ANNUAL_ALLOWANCE} />
                </div>


                <div className="paper rounded-2xl p-6">
                  <p className="eyebrow mb-5">Requests by status</p>
                  <BarList
                    items={[
                      { label: 'Approved', value: statusCounts.approved, tone: '#15803D' },
                      { label: 'Pending', value: statusCounts.pending, tone: '#B45309' },
                      { label: 'Rejected', value: statusCounts.rejected, tone: '#B91C1C' },
                      { label: 'Cancelled', value: statusCounts.cancelled, tone: '#A8A29E' },
                    ]}
                  />
                </div>

                <div className="paper rounded-2xl p-6">
                  <p className="eyebrow mb-5">Days taken by type</p>
                  <BarList items={typeBreakdown} />
                </div>
              </div>

              <aside className="paper animate-slide-up stagger-5 flex flex-col overflow-hidden rounded-2xl">
                <header className="flex items-center justify-between border-b hairline px-6 py-5">
                  <h2 className="font-display text-[17px] font-bold ink">Notices</h2>
                  {unread > 0 && (
                    <span className="rounded-full bg-[#14110F] px-2.5 py-1 text-[10px] font-bold text-white">{unread}</span>
                  )}
                </header>

                {notices.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-6 py-20 text-center">
                    <Inbox size={26} className="ink-subtle" />
                    <p className="text-[13px] ink-muted">You're all caught up.</p>
                  </div>
                ) : (
                  <ul className="max-h-[560px] flex-1 overflow-y-auto">
                    {notices.slice(0, 10).map((n) => (
                      <li key={n._id} className="group relative border-b hairline px-6 py-4 transition-colors last:border-b-0 hover:bg-[#FBFAF8]">
                        {!n.isRead && <span className="absolute left-2.5 top-[26px] h-1.5 w-1.5 rounded-full bg-[#14110F]" />}
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex-shrink-0">{noticeIcon(n.type)}</span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[13px] leading-snug ${n.isRead ? 'ink-muted' : 'font-semibold ink'}`}>{n.title}</p>
                            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed ink-subtle">{n.message}</p>
                            <p className="mt-1.5 text-[11px] ink-subtle">
                              {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </>
  );
};
