import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PageHeader, Panel, StatTile, ListRow, BarList, Donut } from '../components/Bento';
import { Users, ShieldAlert, Unlock, ArrowRight, Lock, Activity, Inbox, FileSpreadsheet, PieChart } from 'lucide-react';

interface AuditLogRecord {
  _id: string;
  actionType: string;
  targetResource: string;
  ipAddress: string;
  createdAt: string;
  userId?: { _id: string; email: string; role: string };
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const actionBarTone = (actionType: string) => {
  const act = actionType.toUpperCase();
  if (act.includes('FAIL') || act.includes('LOCK') || act.includes('DELETE') || act.includes('UNAUTHORIZED')) return '#B91C1C';
  if (act.includes('LOGIN_SUCCESS') || act.includes('ENABLED')) return '#15803D';
  if (act.includes('LEAVE')) return '#B45309';
  return '#1D4ED8';
};

const actionTone = (actionType: string) => {
  const act = actionType.toUpperCase();
  if (act.includes('FAIL') || act.includes('LOCK') || act.includes('DELETE') || act.includes('HIJACK') || act.includes('UNAUTHORIZED')) {
    return 'bg-red-50 text-red-700';
  }
  if (act.includes('LOGIN_SUCCESS') || act.includes('ENABLED')) return 'bg-emerald-50 text-emerald-700';
  if (act.includes('LEAVE')) return 'bg-amber-50 text-amber-800';
  return 'bg-[#F2F1ED] text-[#57534E]';
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const name = user?.email.split('@')[0] || 'there';
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, lockedUsers: 0, pendingLeaves: 0, failedLogins24h: 0 });
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([api.get('/api/admin/stats'), api.get('/api/audit-logs?limit=100')]);
        if (statsRes.data?.stats) setStats(statsRes.data.stats);
        if (logsRes.data?.logs) setLogs(logsRes.data.logs);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load system metrics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const topActions = Object.entries(
    logs.reduce<Record<string, number>>((acc, l) => {
      acc[l.actionType] = (acc[l.actionType] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({
      label: label.replace(/_/g, ' ').toLowerCase(),
      value,
      tone: actionBarTone(label),
    }));

  const roleSplit = [
    { label: 'Administrators', key: 'admin', tone: '#1D4ED8' },
    { label: 'HR managers', key: 'hr_manager', tone: '#6D28D9' },
    { label: 'Employees', key: 'employee', tone: '#15803D' },
  ].map((r) => ({ label: r.label, tone: r.tone, value: logs.filter((l) => l.userId?.role === r.key).length }));


  return (
    <>
      <div className="space-y-7">
        <PageHeader
          eyebrow={today}
          title={<>{greeting()}, <span className="gradient-text">{name}</span></>}
          action={
            <Link
              to="/admin/logs"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#2B2724]"
            >
              Audit trail <ArrowRight size={15} />
            </Link>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-28 text-sm font-medium ink-muted">Loading audit ledgers…</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">{error}</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Main column */}
            <div className="space-y-5 lg:col-span-2">
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="animate-slide-up stagger-2">
                  <StatTile
                    label="Directory"
                    value={`${stats.activeUsers}/${stats.totalUsers}`}
                    tone="info"
                    hint="Active accounts"
                    icon={<Users size={16} />}
                  />
                </div>
                <div className="animate-slide-up stagger-3">
                  <StatTile
                    label="Locked"
                    value={stats.lockedUsers}
                    tone={stats.lockedUsers > 0 ? 'critical' : 'positive'}
                    hint={stats.lockedUsers === 0 ? 'No lockouts' : 'Accounts locked'}
                    icon={<Lock size={16} />}
                  />
                </div>
                <div className="animate-slide-up stagger-4">
                  <StatTile
                    label="Failed logins"
                    value={stats.failedLogins24h}
                    tone={stats.failedLogins24h > 0 ? 'warning' : 'positive'}
                    hint="Last 24 hours"
                    icon={<ShieldAlert size={16} />}
                  />
                </div>
              </div>

              <div className="animate-slide-up stagger-5 grid gap-5 sm:grid-cols-3">
                <Link to="/admin/users" className="paper paper-hover flex items-center gap-3 rounded-2xl p-5">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F2F1ED]"><Users size={17} className="ink" /></span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold ink">Manage users</span>
                    <span className="block text-[12px] ink-muted">Roles &amp; access</span>
                  </span>
                </Link>
                <Link to="/admin/users" className="paper paper-hover flex items-center gap-3 rounded-2xl p-5">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F2F1ED]"><Unlock size={17} className="ink" /></span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold ink">Unlock &amp; reset</span>
                    <span className="block text-[12px] ink-muted">Lockouts, MFA, passwords</span>
                  </span>
                </Link>
                <Link to="/hr/employees" className="paper paper-hover flex items-center gap-3 rounded-2xl p-5">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F2F1ED]"><FileSpreadsheet size={17} className="ink" /></span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold ink">Employee records</span>
                    <span className="block text-[12px] ink-muted">Salary, bank &amp; payslips</span>
                  </span>
                </Link>
              </div>

              {/* Analytics */}
              <div className="animate-slide-up stagger-5 grid gap-5 sm:grid-cols-2">
                <Panel title="Most frequent actions" icon={<Activity size={14} className="ink-muted" />} bodyClassName="p-6">
                  {topActions.length === 0 ? (
                    <p className="py-6 text-center text-[13px] ink-subtle">No activity recorded yet.</p>
                  ) : (
                    <BarList items={topActions} />
                  )}
                </Panel>
                <Panel title="Activity by role" icon={<PieChart size={14} className="ink-muted" />} bodyClassName="p-6">
                  <Donut items={roleSplit} centerLabel="events" />
                </Panel>
              </div>
            </div>

            {/* Tall rail */}
            <div className="animate-slide-up stagger-5 lg:col-span-1">
              <Panel
                title="Recent activity"
                icon={<Activity size={14} className="ink-muted" />}
                action={<Link to="/admin/logs" className="text-[11px] font-semibold ink-muted hover:ink">View all</Link>}
                bodyClassName=""
                className="flex h-full flex-col"
              >
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-5 py-16 text-center">
                    <Inbox size={26} className="ink-subtle" />
                    <p className="text-[13px] ink-muted">No audit records yet.</p>
                  </div>
                ) : (
                  <div className="max-h-[520px] overflow-y-auto">
                    {logs.slice(0, 12).map((l) => (
                      <ListRow
                        key={l._id}
                        title={l.userId?.email || 'System'}
                        meta={`${l.ipAddress} · ${new Date(l.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                        trailing={
                          <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold ${actionTone(l.actionType)}`}>
                            {l.actionType}
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
