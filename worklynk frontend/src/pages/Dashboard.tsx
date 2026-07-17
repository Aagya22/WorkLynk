import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import {
  CalendarDays,
  FileText,
  UserCog,
  Download,
  ArrowUpRight,
  ShieldCheck,
  Fingerprint,
  Lock,
  Clock3,
  CheckCircle2,
  Wallet,
  Sparkles,
} from 'lucide-react';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const quickActions = [
  { to: '/leaves', label: 'Leave Request', desc: 'Book time off', icon: CalendarDays, color: '#4F8CFF' },
  { to: '/payslips', label: 'View Payslips', desc: 'Download PDFs', icon: FileText, color: '#22C55E' },
  { to: '/profile', label: 'Manage Profile', desc: 'Update details', icon: UserCog, color: '#818CF8' },
  { to: '/gdpr', label: 'GDPR Export', desc: 'Export your data', icon: Download, color: '#F59E0B' },
];

const securityItems = [
  { label: 'Field-Level Encryption', value: 'AES-256-GCM', icon: Lock, tone: 'text-green-400' },
  { label: 'Session Isolation', value: 'IP-Bound Cookies', icon: ShieldCheck, tone: 'text-green-400' },
  { label: 'Multi-Factor Auth', value: 'Active (TOTP)', icon: Fingerprint, tone: 'text-accent-400' },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'hr_manager') {
        navigate('/hr/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const [stats, setStats] = useState({
    totalLeaves: 0,
    approvedLeaves: 0,
    pendingLeaves: 0,
    latestPayslipMonth: 'N/A',
    latestPayslipNet: 'N/A',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [leavesRes, payslipsRes] = await Promise.all([
          api.get('/api/leaves/me?limit=5'),
          api.get('/api/payslips?limit=1'),
        ]);

        const leaves = leavesRes.data.leaves || [];
        const approved = leaves.filter((l: any) => l.status === 'approved').length;
        const pending = leaves.filter((l: any) => l.status === 'pending').length;

        const payslips = payslipsRes.data.payslips || [];
        const latestMonth = payslips[0]?.month || 'N/A';
        const latestNet = payslips[0]?.netSalary ? `Rs. ${payslips[0].netSalary}` : 'N/A';

        setStats({
          totalLeaves: leaves.length,
          approvedLeaves: approved,
          pendingLeaves: pending,
          latestPayslipMonth: latestMonth,
          latestPayslipNet: latestNet,
        });
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const name = user?.email.split('@')[0] || 'there';
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <DashboardLayout>
      <div className="space-y-7">
        {/* Hero banner */}
        <div className="animate-slide-up relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0D1326] via-[#0B1020] to-[#0A0E1C] p-7 shadow-xl">
          <div className="grid-texture pointer-events-none absolute inset-0 opacity-70" />
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent-500/20 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-[90px]" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative hidden h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-accent-500/10 text-2xl font-black uppercase text-accent-400 shadow-glow sm:flex">
                {name.charAt(0)}
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0B1020] bg-green-500">
                  <CheckCircle2 size={11} className="text-white" />
                </span>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-400">
                  <Sparkles size={13} className="text-accent-400" />
                  {greeting()} · {today}
                </p>
                <h1 className="mt-1 text-[34px] font-extrabold leading-tight tracking-tight text-[#F8FAFC]">
                  Welcome back, <span className="gradient-text">{name}</span>
                </h1>
                <p className="mt-1 text-[14px] font-medium text-[#94A3B8]">
                  Here's your account overview and security posture for today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-green-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-green-400" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
              </span>
              All systems secure
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center space-x-3 text-sm font-semibold text-slate-400">
              <svg className="h-5 w-5 animate-spin text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching your dashboard…</span>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="animate-slide-up stagger-1">
                <StatCard
                  title="Pending Leaves"
                  value={stats.pendingLeaves}
                  variant="amber"
                  description="Awaiting manager review"
                  icon={<Clock3 size={20} />}
                />
              </div>
              <div className="animate-slide-up stagger-2">
                <StatCard
                  title="Approved Leaves"
                  value={stats.approvedLeaves}
                  variant="green"
                  description="Booked time off this year"
                  icon={<CheckCircle2 size={20} />}
                />
              </div>
              <div className="animate-slide-up stagger-3">
                <StatCard
                  title={`Latest Payslip (${stats.latestPayslipMonth})`}
                  value={stats.latestPayslipNet}
                  variant="blue"
                  description="Net payout for latest cycle"
                  icon={<Wallet size={20} />}
                />
              </div>
            </div>

            {/* Quick actions + security */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
              <div className="animate-slide-up stagger-4 rounded-2xl border border-white/[0.08] bg-[#0D1326] p-6 shadow-xl lg:col-span-3">
                <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Quick Actions</h3>
                  <span className="text-[11px] font-medium text-slate-500">Jump right in</span>
                </div>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {quickActions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <Link
                        key={a.to}
                        to={a.to}
                        className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-white/[0.06] bg-[#070B18]/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#111a30]"
                      >
                        <div
                          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 transition-transform duration-200 group-hover:scale-110"
                          style={{ background: `${a.color}1A`, color: a.color }}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-200 group-hover:text-white">{a.label}</p>
                          <p className="text-[11px] font-medium text-slate-500">{a.desc}</p>
                        </div>
                        <ArrowUpRight
                          size={16}
                          className="flex-shrink-0 text-slate-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-300"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="animate-slide-up stagger-5 rounded-2xl border border-white/[0.08] bg-[#0D1326] p-6 shadow-xl lg:col-span-2">
                <div className="mb-5 flex items-center gap-2 border-b border-white/[0.06] pb-4">
                  <ShieldCheck size={16} className="text-accent-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Security Status</h3>
                </div>
                <div className="space-y-3">
                  {securityItems.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#070B18]/60 p-3.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={15} className="text-slate-500" />
                          <span className="text-xs font-medium text-slate-400">{s.label}</span>
                        </div>
                        <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${s.tone}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {s.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
