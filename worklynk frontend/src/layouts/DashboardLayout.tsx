import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      roles: ['employee', 'hr_manager', 'admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: 'My Profile',
      path: '/profile',
      roles: ['employee', 'hr_manager', 'admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      name: 'Payslips',
      path: '/payslips',
      roles: ['employee', 'hr_manager', 'admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Leave Requests',
      path: '/leaves',
      roles: ['employee', 'hr_manager', 'admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'GDPR Export',
      path: '/gdpr',
      roles: ['employee', 'hr_manager', 'admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
    },
    {
      name: 'Leave Decisions',
      path: '/hr/leaves',
      roles: ['hr_manager', 'admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      name: 'Department Logs',
      path: '/hr/logs',
      roles: ['hr_manager'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: 'Manage Users',
      path: '/admin/users',
      roles: ['admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'System Logs',
      path: '/admin/logs',
      roles: ['admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  const currentRole = user?.role || 'employee';

  const filteredNavItems = navItems.filter((item) => item.roles.includes(currentRole));

  const roleLabels = {
    employee: 'Employee',
    hr_manager: 'HR Manager',
    admin: 'Administrator',
  };

  const roleColors = {
    employee: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    hr_manager: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    admin: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  };

  return (
    <div className="min-h-screen bg-slate-950 flex relative text-slate-100 font-sans">
      {/* Background glow spots */}
      <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[60%] bg-primary-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-30%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-slate-950/40 border-r border-slate-900/80 z-20 backdrop-blur-xl">
        <div className="px-6 py-5.5 border-b border-slate-900/60 flex items-center space-x-3.5">
          <div className="p-2.5 bg-primary-950 rounded-xl border border-primary-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight gradient-text">Worklynk</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item, index) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center space-x-3 px-4.5 py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                  active
                    ? 'bg-primary-500/10 border border-primary-500/20 text-slate-100 shadow-md shadow-primary-500/5'
                    : 'text-slate-400 hover:bg-white/2 hover:text-slate-200 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card info footer */}
        <div className="p-4 border-t border-slate-900/60 bg-slate-950/20 flex flex-col space-y-3">
          <div className="flex flex-col space-y-1.5 pl-1.5">
            <span className="text-xs font-semibold text-slate-300 truncate max-w-[200px]" title={user?.email}>
              {user?.email}
            </span>
            <span className={`inline-flex self-start px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${roleColors[currentRole]}`}>
              {roleLabels[currentRole]}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 border border-slate-800/80 hover:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-300 hover:text-slate-100 transition-colors focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer sidebar backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer sidebar content */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-950/90 border-r border-slate-900 z-40 backdrop-blur-xl md:hidden transition-transform duration-300 transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-5.5 border-b border-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-primary-950 rounded-xl border border-primary-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight gradient-text">Worklynk</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="px-4 py-6 space-y-1.5">
          {filteredNavItems.map((item, index) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-4.5 py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                  active
                    ? 'bg-primary-500/10 border border-primary-500/20 text-slate-100'
                    : 'text-slate-400 hover:bg-white/2 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-900/60 bg-slate-950/20 flex flex-col space-y-3">
          <div className="flex flex-col space-y-1.5 pl-1.5">
            <span className="text-xs font-semibold text-slate-300 truncate max-w-[200px]">
              {user?.email}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${roleColors[currentRole]}`}>
              {roleLabels[currentRole]}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 border border-slate-800/80 rounded-xl text-xs font-bold text-slate-300 transition-colors focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto z-10">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4.5 bg-slate-950/40 border-b border-slate-900/80 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-slate-400 hover:text-slate-200 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-lg font-bold tracking-tight gradient-text">Worklynk</span>
          </div>
        </header>

        {/* Dynamic Inner Page Content */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
