import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { Table } from '../components/Table';
import { Button } from '../components/Button';

interface LeaveRequest {
  _id: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  reason: string;
  employeeId: {
    _id: string;
    email: string;
  };
}

export const HrDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    pendingLeaves: 0,
    failedLogins24h: 0
  });
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHrDashboardData = async () => {
      try {
        const [statsRes, leavesRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/leaves?limit=5')
        ]);
        
        if (statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        }
        if (leavesRes.data?.leaves) {
          setRecentLeaves(leavesRes.data.leaves.slice(0, 5));
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch HR dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchHrDashboardData();
  }, []);

  const leaveColumns = [
    {
      header: 'Employee Email',
      accessor: (row: LeaveRequest) => row.employeeId?.email || 'N/A'
    },
    {
      header: 'Leave Type',
      accessor: (row: LeaveRequest) => (
        <span className="capitalize font-medium text-slate-300">{row.type || (row as any).leaveType}</span>
      )
    },
    {
      header: 'Duration',
      accessor: (row: LeaveRequest) => {
        const start = new Date(row.startDate).toLocaleDateString();
        const end = new Date(row.endDate).toLocaleDateString();
        return `${start} - ${end}`;
      }
    },
    {
      header: 'Status',
      accessor: (row: LeaveRequest) => {
        const statusColors: Record<string, string> = {
          pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          approved: 'text-green-400 bg-green-500/10 border-green-500/20',
          rejected: 'text-red-400 bg-red-500/10 border-red-500/20'
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[row.status] || ''}`}>
            {row.status}
          </span>
        );
      }
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">HR Operations Center</h1>
          <p className="text-sm text-slate-400 font-medium font-sans">
            Monitor organizational metrics, approve pending leave applications, and manage employee records.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 text-slate-400 font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Compiling HR analytics...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Active Directory"
                value={`${stats.activeUsers} / ${stats.totalUsers}`}
                description="Active employee profiles"
                variant="blue"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                }
              />

              <StatCard
                title="Pending Leaves"
                value={stats.pendingLeaves}
                description="Applications requiring action"
                variant="amber"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />

              <StatCard
                title="Locked Accounts"
                value={stats.lockedUsers}
                description="Failed login lockouts"
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
                description="System security warning log"
                variant="rose"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
              />
            </div>

            {/* Quick Actions & Recent Leaves */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Leaves list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-200">Recent Leave Applications</h3>
                  <Link to="/hr/leaves">
                    <Button variant="secondary">View All approvals</Button>
                  </Link>
                </div>
                
                {recentLeaves.length === 0 ? (
                  <div className="glassmorphism rounded-2xl p-8 border border-white/5 text-center text-slate-500 text-xs">
                    No active or historical leave records found.
                  </div>
                ) : (
                  <div className="glassmorphism rounded-2xl border border-white/5 overflow-hidden">
                    <Table data={recentLeaves} columns={leaveColumns} />
                  </div>
                )}
              </div>

              {/* Operations Quick Actions */}
              <div className="glassmorphism rounded-2xl p-6 border border-white/5 space-y-4 h-fit">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-900 pb-3">Operations Directory</h3>
                <div className="space-y-3">
                  <Link to="/hr/employees" className="block">
                    <Button variant="primary" fullWidth>
                      Employee Directory
                    </Button>
                  </Link>
                  <Link to="/hr/leaves" className="block">
                    <Button variant="secondary" fullWidth>
                      Leave Approvals Center
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
