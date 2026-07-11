import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';

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
    latestPayslipNet: 'N/A'
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [leavesRes, payslipsRes] = await Promise.all([
          api.get('/api/leaves/me?limit=5'),
          api.get('/api/payslips?limit=1')
        ]);
        
        // Calculate leave metrics
        const leaves = leavesRes.data.leaves || [];
        const approved = leaves.filter((l: any) => l.status === 'approved').length;
        const pending = leaves.filter((l: any) => l.status === 'pending').length;
        
        // Latest payslip info
        const payslips = payslipsRes.data.payslips || [];
        const latestMonth = payslips[0]?.month || 'N/A';
        const latestNet = payslips[0]?.netSalary ? `Rs. ${payslips[0].netSalary}` : 'N/A';

        setStats({
          totalLeaves: leaves.length,
          approvedLeaves: approved,
          pendingLeaves: pending,
          latestPayslipMonth: latestMonth,
          latestPayslipNet: latestNet
        });
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header Section */}
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-[36px] font-extrabold tracking-tight text-[#F8FAFC]">
              Welcome back, <span className="gradient-text">{user?.email.split('@')[0]}</span>
            </h1>
            <p className="text-[14px] text-[#94A3B8] font-medium font-sans mt-0.5">
              Here is your account overview and quick security stats for today.
            </p>
          </div>
          <div className="flex items-center space-x-2.5 text-xs bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 px-3.5 py-2 rounded-xl text-[#4F8CFF] font-bold uppercase tracking-wider h-fit">
            <span className="h-2 w-2 rounded-full bg-[#4F8CFF] animate-pulse"></span>
            <span>All systems secure</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 text-slate-400 font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching dashboard telemetry...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Summary cards row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Pending Leaves"
                value={stats.pendingLeaves}
                variant="amber"
                description="Awaiting review by manager"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Approved Leaves"
                value={stats.approvedLeaves}
                variant="green"
                description="Booked time off this year"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title={`Payslip (${stats.latestPayslipMonth})`}
                value={stats.latestPayslipNet}
                variant="blue"
                description="Net payout for latest cycle"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-6 2h6m2 6H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
            </div>

            {/* Quick Actions and System status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-[#0D1326] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider border-b border-white/[0.08] pb-3.5">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3.5">
                  <Link
                    to="/leaves"
                    className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/[0.05] bg-[#070B18]/50 hover:bg-[#4F8CFF]/10 hover:border-[#4F8CFF]/30 transition-all duration-200 group text-slate-300 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4F8CFF] group-hover:scale-110 transition-transform mb-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold">Leave Request</span>
                  </Link>

                  <Link
                    to="/payslips"
                    className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/[0.05] bg-[#070B18]/50 hover:bg-[#4F8CFF]/10 hover:border-[#4F8CFF]/30 transition-all duration-200 group text-slate-300 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4F8CFF] group-hover:scale-110 transition-transform mb-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-bold">View Payslips</span>
                  </Link>

                  <Link
                    to="/profile"
                    className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/[0.05] bg-[#070B18]/50 hover:bg-[#4F8CFF]/10 hover:border-[#4F8CFF]/30 transition-all duration-200 group text-slate-300 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4F8CFF] group-hover:scale-110 transition-transform mb-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs font-bold">Manage Profile</span>
                  </Link>

                  <Link
                    to="/gdpr"
                    className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/[0.05] bg-[#070B18]/50 hover:bg-[#4F8CFF]/10 hover:border-[#4F8CFF]/30 transition-all duration-200 group text-slate-300 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4F8CFF] group-hover:scale-110 transition-transform mb-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-xs font-bold">GDPR Data Export</span>
                  </Link>
                </div>
              </div>

              <div className="bg-[#0D1326] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider border-b border-white/[0.08] pb-3.5">
                  Security Log Status
                </h3>
                <div className="space-y-4 text-xs font-medium text-slate-400">
                  <div className="flex justify-between items-center bg-[#070B18]/50 p-3 rounded-xl border border-white/[0.05]">
                    <span>Field Level Encryption</span>
                    <span className="text-green-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                      <span>AES-256-GCM</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-[#070B18]/50 p-3 rounded-xl border border-white/[0.05]">
                    <span>Session Isolation</span>
                    <span className="text-green-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                      <span>IP Bound Cookies</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-[#070B18]/50 p-3 rounded-xl border border-white/[0.05]">
                    <span>Multi-Factor Authentication</span>
                    <span className="text-blue-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                      <span>Active (TOTP)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
