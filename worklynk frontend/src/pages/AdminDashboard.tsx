import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { Table } from '../components/Table';
import { Button } from '../components/Button';

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
      const logsUrl = logFilter ? `/api/audit-logs?limit=10&actionType=${logFilter}` : '/api/audit-logs?limit=10';
      
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

  const auditColumns = [
    {
      header: 'Timestamp',
      accessor: (row: AuditLogRecord) => new Date(row.createdAt).toLocaleString()
    },
    {
      header: 'Operator',
      accessor: (row: AuditLogRecord) => row.userId?.email || 'System'
    },
    {
      header: 'Action Event',
      accessor: (row: AuditLogRecord) => (
        <span className="font-mono text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300">
          {row.actionType}
        </span>
      )
    },
    {
      header: 'Target Resource',
      accessor: (row: AuditLogRecord) => (
        <span className="text-slate-400 font-mono text-xs">{row.targetResource}</span>
      )
    },
    {
      header: 'Client IP',
      accessor: (row: AuditLogRecord) => (
        <span className="text-slate-400 font-mono text-xs">{row.ipAddress}</span>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Security Control Center</h1>
          <p className="text-sm text-slate-400 font-medium font-sans">
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
                description="Active users on directory"
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
                description="Brute-force security lockouts"
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
                description="Security failures count"
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
                description="Leaves requiring approval"
                variant="amber"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>

            {/* Quick Control Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Audit Log Table */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <h3 className="text-lg font-bold text-slate-200">System Audit Trail</h3>
                  
                  {/* Event Filter Select */}
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-900 focus:border-primary-500/50 text-slate-400 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500/50 cursor-pointer"
                  >
                    <option value="">All Security Events</option>
                    <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                    <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
                    <option value="SESSION_HIJACK_ATTEMPT">SESSION_HIJACK_ATTEMPT</option>
                    <option value="UNAUTHORIZED_ACCESS_ATTEMPT">UNAUTHORIZED_ACCESS_ATTEMPT</option>
                    <option value="GDPR_DATA_EXPORT">GDPR_DATA_EXPORT</option>
                    <option value="ADMIN_USER_ROLE_UPDATE">ADMIN_USER_ROLE_UPDATE</option>
                  </select>
                </div>

                {logs.length === 0 ? (
                  <div className="glassmorphism rounded-2xl p-8 border border-white/5 text-center text-slate-500 text-xs">
                    No matching audit records found.
                  </div>
                ) : (
                  <div className="glassmorphism rounded-2xl border border-white/5 overflow-hidden">
                    <Table data={logs} columns={auditColumns} />
                  </div>
                )}
              </div>

              {/* Administrative Directories */}
              <div className="glassmorphism rounded-2xl p-6 border border-white/5 space-y-4 h-fit">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-900 pb-3">Security Actions</h3>
                <div className="space-y-3">
                  <Link to="/admin/users" className="block">
                    <Button variant="primary" fullWidth>
                      Manage User Directory
                    </Button>
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
