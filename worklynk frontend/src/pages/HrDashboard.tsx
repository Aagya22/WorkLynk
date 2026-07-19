import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { Table } from '../components/Table';
import { Users, CalendarDays } from 'lucide-react';

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
          <div className="text-xs font-semibold text-[#4F8CFF] uppercase tracking-[0.15em] mb-1">HR Management</div>
          <h1 className="font-display text-[36px] font-bold tracking-tight text-[#F8FAFC]">HR Operations Center</h1>
          <p className="text-[14px] text-[#94A3B8] font-medium font-sans mt-0.5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                description={stats.pendingLeaves === 0 ? "Approval queue cleared" : "Leaves requiring review"}
                variant="amber"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />

            </div>

            {/* Quick Actions & Recent Leaves */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Leaves list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-[26px] font-semibold text-[#F8FAFC]">Recent Leave Applications</h2>
                  <Link
                    to="/hr/leaves"
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800/80 text-[#94A3B8] hover:text-[#F8FAFC] text-[10px] font-bold rounded-lg transition-all focus:outline-none"
                  >
                    View All Approvals
                  </Link>
                </div>
                
                {recentLeaves.length === 0 ? (
                  <div className="bg-[#0D1326] border border-white/[0.08] rounded-2xl p-8 text-center text-[#94A3B8] text-xs">
                    No active or historical leave records found.
                  </div>
                ) : (
                  <div className="bg-[#0D1326] border border-white/[0.08] rounded-2xl overflow-hidden">
                    <Table data={recentLeaves} columns={leaveColumns} />
                  </div>
                )}
              </div>

              {/* Operations Quick Actions */}
              <div className="bg-[#0D1326] border border-white/[0.08] rounded-2xl p-6 space-y-4 h-fit">
                <h3 className="text-lg font-bold text-slate-200 border-b border-white/[0.08] pb-3">Operations Directory</h3>
                <div className="space-y-3">
                  <Link
                    to="/hr/employees"
                    className="p-3 bg-[#070B18]/50 hover:bg-[#4F8CFF]/10 border border-white/[0.05] hover:border-[#4F8CFF]/30 text-slate-300 hover:text-slate-100 rounded-xl flex items-center space-x-3 transition-all group"
                  >
                    <div className="text-[#94A3B8] group-hover:text-[#4F8CFF] transition-colors">
                      <Users size={16} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] group-hover:text-[#F8FAFC]">Employee Directory</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">Manage profiles & records</span>
                    </div>
                  </Link>

                  <Link
                    to="/hr/leaves"
                    className="p-3 bg-[#070B18]/50 hover:bg-[#F59E0B]/10 border border-white/[0.05] hover:border-[#F59E0B]/30 text-slate-300 hover:text-slate-100 rounded-xl flex items-center space-x-3 transition-all group"
                  >
                    <div className="text-[#94A3B8] group-hover:text-[#F59E0B] transition-colors">
                      <CalendarDays size={16} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] group-hover:text-[#F8FAFC]">Approvals Center</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">Review leave requests</span>
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
