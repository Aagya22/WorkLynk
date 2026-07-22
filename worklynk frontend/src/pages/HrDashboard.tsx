import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PageHeader, Panel, StatTile, ListRow, BarList, Donut } from '../components/Bento';
import { Users, CalendarDays, ArrowRight, Clock3, Inbox, CheckSquare, PieChart } from 'lucide-react';

interface LeaveRequest {
  _id: string;
  startDate: string;
  endDate: string;
  type?: string;
  leaveType?: string;
  status: string;
  reason: string;
  employeeId: { _id: string; email: string; role?: string };
}

const statusTone: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  approved: 'bg-emerald-50 text-emerald-800',
  rejected: 'bg-red-50 text-red-800',
  cancelled: 'bg-[#F2F1ED] text-[#8A8580]',
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export const HrDashboard: React.FC = () => {
  const { user } = useAuth();
  const name = user?.email.split('@')[0] || 'there';
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, pendingLeaves: 0 });
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, leavesRes] = await Promise.all([api.get('/api/admin/stats'), api.get('/api/leaves?limit=100')]);
        if (statsRes.data?.stats) setStats(statsRes.data.stats);
        if (leavesRes.data?.leaves) setRecentLeaves(leavesRes.data.leaves);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load HR metrics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const leaveStatus = {
    pending: recentLeaves.filter((l) => l.status === 'pending').length,
    approved: recentLeaves.filter((l) => l.status === 'approved').length,
    rejected: recentLeaves.filter((l) => l.status === 'rejected').length,
    cancelled: recentLeaves.filter((l) => l.status === 'cancelled').length,
  };

  const typeSplit = [
    { label: 'Annual', key: 'annual', tone: '#1D4ED8' },
    { label: 'Sick', key: 'sick', tone: '#B91C1C' },
    { label: 'Emergency', key: 'emergency', tone: '#B45309' },
    { label: 'Unpaid', key: 'unpaid', tone: '#6D28D9' },
  ].map((t) => ({
    label: t.label,
    tone: t.tone,
    value: recentLeaves.filter((l) => (l.leaveType || l.type) === t.key).length,
  }));

  return (
    <>
      <div className="space-y-7">
        <PageHeader
          eyebrow={today}
          title={<>{greeting()}, <span className="gradient-text">{name}</span></>}
          action={
            <Link
              to="/hr/leaves"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#2B2724]"
            >
              Review approvals <ArrowRight size={15} />
            </Link>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-28 text-sm font-medium ink-muted">Loading HR analytics…</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">{error}</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Main column */}
            <div className="space-y-5 lg:col-span-2">
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="animate-slide-up stagger-1">
                  <StatTile
                    label="Pending approvals"
                    value={stats.pendingLeaves}
                    tone={stats.pendingLeaves > 0 ? 'warning' : 'positive'}
                    hint={stats.pendingLeaves === 0 ? 'Queue is clear.' : 'Awaiting review.'}
                    icon={<Clock3 size={16} />}
                  />
                </div>
                <div className="animate-slide-up stagger-2">
                  <StatTile
                    label="Active directory"
                    value={`${stats.activeUsers}/${stats.totalUsers}`}
                    tone="info"
                    hint="Active employee profiles."
                    icon={<Users size={16} />}
                  />
                </div>
                <div className="animate-slide-up stagger-3">
                  <StatTile
                    label="Approved"
                    value={leaveStatus.approved}
                    tone="positive"
                    hint="Requests signed off."
                    icon={<CheckSquare size={16} />}
                  />
                </div>
              </div>

              <div className="animate-slide-up stagger-4 grid gap-5 sm:grid-cols-2">
                <Link to="/hr/employees" className="paper paper-hover flex items-center gap-4 rounded-2xl p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2F1ED]"><Users size={17} className="ink" /></span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold ink">Employee directory</span>
                    <span className="block text-[12px] ink-muted">Manage profiles &amp; payslips</span>
                  </span>
                </Link>
                <Link to="/hr/leaves" className="paper paper-hover flex items-center gap-4 rounded-2xl p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2F1ED]"><CheckSquare size={17} className="ink" /></span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold ink">Approvals centre</span>
                    <span className="block text-[12px] ink-muted">Review leave requests</span>
                  </span>
                </Link>
              </div>

              {/* Analytics */}
              <div className="animate-slide-up stagger-5 grid gap-5 sm:grid-cols-2">
                <Panel title="Requests by status" icon={<CheckSquare size={14} className="ink-muted" />} bodyClassName="p-6">
                  <BarList
                    items={[
                      { label: 'Pending', value: leaveStatus.pending, tone: '#B45309' },
                      { label: 'Approved', value: leaveStatus.approved, tone: '#15803D' },
                      { label: 'Rejected', value: leaveStatus.rejected, tone: '#B91C1C' },
                      { label: 'Cancelled', value: leaveStatus.cancelled, tone: '#A8A29E' },
                    ]}
                  />
                </Panel>
                <Panel title="Requests by type" icon={<PieChart size={14} className="ink-muted" />} bodyClassName="p-6">
                  <Donut items={typeSplit} centerLabel="requests" />
                </Panel>
              </div>
            </div>

            {/* Tall rail */}
            <div className="animate-slide-up stagger-5 lg:col-span-1">
              <Panel
                title="Recent leave applications"
                icon={<CalendarDays size={14} className="ink-muted" />}
                action={<Link to="/hr/leaves" className="text-[11px] font-semibold ink-muted hover:ink">View all</Link>}
                bodyClassName=""
                className="flex h-full flex-col"
              >
                {recentLeaves.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-5 py-16 text-center">
                    <Inbox size={26} className="ink-subtle" />
                    <p className="text-[13px] ink-muted">No leave records yet.</p>
                  </div>
                ) : (
                  <div className="max-h-[520px] overflow-y-auto">
                    {recentLeaves.slice(0, 12).map((l) => (
                      <ListRow
                        key={l._id}
                        title={l.employeeId?.email || 'Unknown'}
                        meta={`${l.leaveType || l.type || 'leave'} · ${new Date(l.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(l.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                        trailing={
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusTone[l.status] || ''}`}>
                            {l.status}
                          </span>
                        }
                      />
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
