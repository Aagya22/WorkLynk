import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { Table } from '../components/Table';
import { CalendarCard } from '../components/CalendarCard';
import { Users, ShieldAlert, FileSpreadsheet, Unlock } from 'lucide-react';

interface AuditLogRecord {
  _id: string;
  actionType: string;
  targetResource: string;
  ipAddress: string;
  createdAt: string;
  userId?: {
    _id: string;
    email: string;
    role: string;
  };
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    pendingLeaves: 0,
    failedLogins24h: 0
  });
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Audit filter state for dashboard quick view
  const [logFilter, setLogFilter] = useState('');

  const fetchAdminDashboard = async () => {
    try {
      const statsUrl = '/api/admin/stats';
      const logsUrl = logFilter ? `/api/audit-logs?limit=5&actionType=${logFilter}` : '/api/audit-logs?limit=5';
      
      const [statsRes, logsRes] = await Promise.all([
        api.get(statsUrl),
        api.get(logsUrl)
      ]);

      if (statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
      if (logsRes.data?.logs) {
        setLogs(logsRes.data.logs);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load system security metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, [logFilter]);

  const getActionTypeClass = (actionType: string) => {
    const act = actionType.toUpperCase();
    if (act.includes('FAIL') || act.includes('LOCK') || act.includes('BLOCK') || act.includes('DELETE') || act.includes('HIJACK') || act.includes('CRITICAL')) {
      return 'bg-red-500/10 border-red-500/20 text-red-400'; // Red for Failure/Delete/Critical
    }
    if (act.includes('LOGIN_SUCCESS')) {
      return 'bg-green-500/10 border-green-500/20 text-green-400'; // Green for Login
    }
    if (act.includes('LEAVE') || act.includes('VACATION')) {
      return 'bg-amber-500/10 border-amber-500/20 text-amber-400'; // Amber for Leave
    }
    if (act.includes('PAYSLIP') || act.includes('SALARY') || act.includes('DOWNLOAD')) {
      return 'bg-blue-500/10 border-blue-500/20 text-blue-400'; // Blue for Payslips
    }
    if (act.includes('PROFILE') || act.includes('AVATAR')) {
      return 'bg-slate-500/10 border-slate-500/20 text-slate-400'; // Gray for Profile
    }
    return 'bg-purple-500/10 border-purple-500/20 text-purple-400'; // Purple for general Audit trail events
  };

  const auditColumns = [
    {
      header: 'Timestamp',
      accessor: (row: AuditLogRecord) => new Date(row.createdAt).toLocaleString()
    },
    {
      header: 'Operator',
      accessor: (row: AuditLogRecord) => (
        <span className="text-[#F8FAFC]/90 font-medium truncate max-w-[150px] block" title={row.userId?.email || 'System'}>
          {row.userId?.email || 'System'}
        </span>
      )
    },
    {
      header: 'Action Event',
      accessor: (row: AuditLogRecord) => (
        <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full border ${getActionTypeClass(row.actionType)}`}>
          {row.actionType}
        </span>
      )
    },
    {
      header: 'Target Resource',
      accessor: (row: AuditLogRecord) => (
        <span className="text-[#94A3B8] font-mono text-xs max-w-[130px] truncate block" title={row.targetResource}>
          {row.targetResource}
        </span>
      )
    },
    {
      header: 'Client IP',
      accessor: (row: AuditLogRecord) => (
        <span className="text-[#94A3B8] font-mono text-xs truncate max-w-[100px] block" title={row.ipAddress}>
          {row.ipAddress}
        </span>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <div className="text-xs font-semibold text-[#4F8CFF] uppercase tracking-[0.15em] mb-1">System Security</div>
          <h1 className="text-[36px] font-extrabold tracking-tight text-[#F8FAFC]">Security Control Center</h1>
          <p className="text-[14px] text-[#94A3B8] font-medium font-sans mt-0.5">
            Monitor authentication audits, locked accounts, and general system activities.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 text-slate-400 font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching audit ledgers...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Active Directory"
                value={`${stats.activeUsers} / ${stats.totalUsers}`}
                description={stats.activeUsers === stats.totalUsers ? "All directories active" : "Directory sync complete"}
                variant="blue"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />

              <StatCard
                title="Locked Accounts"
                value={stats.lockedUsers}
                description={stats.lockedUsers === 0 ? "No lockouts today" : "+1 lockout logged today"}
                variant="rose"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              <StatCard
                title="Failed Logins (24h)"
                value={stats.failedLogins24h}
                description={stats.failedLogins24h === 0 ? "No brute force alerts" : "Failed logins recorded"}
                variant="rose"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
              />

              <StatCard
                title="Pending Leaves"
                value={stats.pendingLeaves}
                description={stats.pendingLeaves === 0 ? "Approval queue cleared" : "Leaves requiring review"}
                variant="amber"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>

            {/* Company calendar — admin can add/remove holidays & events */}
            <CalendarCard canManage />

            {/* Quick Control Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
              {/* Audit Log Table */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-[26px] font-semibold text-[#F8FAFC]">System Audit Trail</h2>
                    <Link
                      to="/admin/logs"
                      className="px-2.5 py-1 bg-slate-900 border border-slate-800/80 text-[#94A3B8] hover:text-[#F8FAFC] text-[10px] font-bold rounded-lg transition-all focus:outline-none"
                    >
                      Show All
                    </Link>
                  </div>
                  
                  {/* Styled Event Filter Select with Icons */}
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-[#94A3B8] pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <select
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      className="pl-9 pr-8 py-2 bg-[#0D1326] border border-white/[0.08] hover:border-[#4F8CFF]/50 text-[#F8FAFC]/90 text-xs font-semibold rounded-xl focus:outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="">All Security Events</option>
                      <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                      <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
                      <option value="SESSION_HIJACK_ATTEMPT">SESSION_HIJACK_ATTEMPT</option>
                      <option value="UNAUTHORIZED_ACCESS_ATTEMPT">UNAUTHORIZED_ACCESS_ATTEMPT</option>
                      <option value="GDPR_DATA_EXPORT">GDPR_DATA_EXPORT</option>
                      <option value="ADMIN_USER_ROLE_UPDATE">ADMIN_USER_ROLE_UPDATE</option>
                    </select>
                    <div className="absolute right-3 text-slate-500 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {logs.length === 0 ? (
                  <div className="bg-[#0D1326] border border-white/[0.08] rounded-2xl p-8 text-center text-[#94A3B8] text-xs">
                    No matching audit records found.
                  </div>
                ) : (
                  <div className="bg-[#0D1326] border border-white/[0.08] rounded-2xl overflow-hidden">
                    <Table data={logs} columns={auditColumns} />
                  </div>
                )}
              </div>

              {/* 2x2 Security Actions Grid Panel */}
              <div className="bg-[#0D1326] border border-white/[0.08] rounded-2xl p-6 space-y-4 h-fit">
                <h3 className="text-lg font-bold text-slate-200 border-b border-white/[0.08] pb-3">Security Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/admin/users"
                    className="p-3 bg-[#070B18]/50 hover:bg-[#4F8CFF]/10 border border-white/[0.05] hover:border-[#4F8CFF]/30 text-slate-300 hover:text-slate-100 rounded-xl flex flex-col justify-between space-y-3 transition-all group"
                  >
                    <div className="text-[#94A3B8] group-hover:text-[#4F8CFF] transition-colors">
                      <Users size={16} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] group-hover:text-[#F8FAFC]">Manage Users</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">Edit roles, lock status</span>
                    </div>
                  </Link>

                  <button
                    onClick={() => setLogFilter('LOGIN_FAILURE')}
                    className="p-3 bg-[#070B18]/50 hover:bg-[#EF4444]/10 border border-white/[0.05] hover:border-[#EF4444]/30 text-slate-300 hover:text-slate-100 rounded-xl flex flex-col justify-between space-y-3 transition-all text-left group focus:outline-none"
                  >
                    <div className="text-[#94A3B8] group-hover:text-[#EF4444] transition-colors">
                      <ShieldAlert size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] group-hover:text-[#F8FAFC]">Failed Logins</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">Filter security failures</span>
                    </div>
                  </button>

                  <Link
                    to="/admin/logs"
                    className="p-3 bg-[#070B18]/50 hover:bg-[#4F8CFF]/10 border border-white/[0.05] hover:border-[#4F8CFF]/30 text-slate-300 hover:text-slate-100 rounded-xl flex flex-col justify-between space-y-3 transition-all group"
                  >
                    <div className="text-[#94A3B8] group-hover:text-[#4F8CFF] transition-colors">
                      <FileSpreadsheet size={16} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] group-hover:text-[#F8FAFC]">System Logs</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">Full paginated trail</span>
                    </div>
                  </Link>

                  <Link
                    to="/admin/users"
                    className="p-3 bg-[#070B18]/50 hover:bg-[#F59E0B]/10 border border-white/[0.05] hover:border-[#F59E0B]/30 text-slate-300 hover:text-slate-100 rounded-xl flex flex-col justify-between space-y-3 transition-all group"
                  >
                    <div className="text-[#94A3B8] group-hover:text-[#F59E0B] transition-colors">
                      <Unlock size={16} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] group-hover:text-[#F8FAFC]">Unlock Accounts</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">Release lockouts</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
