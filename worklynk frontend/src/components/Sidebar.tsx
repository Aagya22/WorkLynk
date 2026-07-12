import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  LayoutDashboard,
  User,
  FileSpreadsheet,
  CalendarDays,
  Download,
  CheckSquare,
  History,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield
} from 'lucide-react';

interface SidebarProps {
  user: any;
  logout: () => Promise<void>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  logout,
  mobileOpen,
  setMobileOpen,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Collapsed Sidebar State (persisted locally)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const [profile, setProfile] = useState<{ profilePhotoPath?: string; fullName?: string } | null>(null);

  useEffect(() => {
    const fetchSidebarProfile = async () => {
      if (!user) return;
      try {
        const response = await api.get(`/api/profile/${user.id}`);
        if (response.data?.profile) {
          setProfile(response.data.profile);
        }
      } catch (err) {
        console.error('Failed to load profile for sidebar:', err);
      }
    };
    fetchSidebarProfile();
  }, [user]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const navItems = [
    // General Group
    {
      name: 'Dashboard',
      path: '/dashboard',
      section: 'General',
      roles: ['employee', 'hr_manager', 'admin'],
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: 'My Profile',
      path: '/profile',
      section: 'General',
      roles: ['employee', 'hr_manager', 'admin'],
      icon: <User size={18} />,
    },
    {
      name: 'Payslips',
      path: '/payslips',
      section: 'General',
      roles: ['employee', 'hr_manager', 'admin'],
      icon: <FileSpreadsheet size={18} />,
    },
    {
      name: 'Leave Requests',
      path: '/leaves',
      section: 'General',
      roles: ['employee', 'hr_manager', 'admin'],
      icon: <CalendarDays size={18} />,
    },
    {
      name: 'GDPR Export',
      path: '/gdpr',
      section: 'General',
      roles: ['employee', 'hr_manager', 'admin'],
      icon: <Download size={18} />,
    },
    // HR Management Group
    {
      name: 'Leave Decisions',
      path: '/hr/leaves',
      section: 'HR Management',
      roles: ['hr_manager', 'admin'],
      icon: <CheckSquare size={18} />,
    },
    {
      name: 'Department Logs',
      path: '/hr/logs',
      section: 'HR Management',
      roles: ['hr_manager'],
      icon: <History size={18} />,
    },
    // Administration Group
    {
      name: 'Manage Users',
      path: '/admin/users',
      section: 'Administration',
      roles: ['admin'],
      icon: <Users size={18} />,
    },
    {
      name: 'System Logs',
      path: '/admin/logs',
      section: 'Administration',
      roles: ['admin'],
      icon: <Settings size={18} />,
    },
  ];

  const currentRole = (user?.role || 'employee') as 'employee' | 'hr_manager' | 'admin';
  const filteredNavItems = navItems.filter((item) => item.roles.includes(currentRole));

  const roleLabels = {
    employee: 'Employee',
    hr_manager: 'HR Manager',
    admin: 'Administrator',
  };

  const roleColors = {
    employee: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    hr_manager: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    admin: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  };

  const renderNavLinks = (isMobile: boolean) => {
    return filteredNavItems.map((item, index) => {
      const active = location.pathname === item.path;
      return (
        <Link
          key={index}
          to={item.path}
          onClick={isMobile ? () => setMobileOpen(false) : undefined}
          className={`relative flex items-center h-11 px-[14px] rounded-[12px] transition-all duration-200 group ${active
              ? 'bg-[#4F8CFF]/10 text-white font-semibold shadow-[0_0_12px_rgba(79,140,255,0.12)] border border-[#4F8CFF]/10'
              : 'text-slate-400 hover:bg-[#1B2234]/40 hover:text-white'
            }`}
        >
          {active && (
            <div className="absolute left-0 top-[8px] bottom-[8px] w-[3px] bg-[#4F8CFF] rounded-r-md" />
          )}

          <div className={`flex-shrink-0 ${active ? 'text-[#4F8CFF]' : 'text-slate-500 group-hover:text-slate-200 transition-colors'}`}>
            {item.icon}
          </div>

          {!isCollapsed && (
            <span className="text-[15px] font-medium ml-3 transition-colors duration-200">
              {item.name}
            </span>
          )}

          {item.name === 'Leave Requests' && !isCollapsed && (
            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">
              3
            </span>
          )}

          {isCollapsed && (
            <div className="absolute left-[84px] px-2.5 py-1.5 bg-[#0B1226] border border-[#1B2234] text-[11px] font-bold uppercase tracking-wider text-slate-200 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
              {item.name}
            </div>
          )}
        </Link>
      );
    });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#070B18] border-r border-[#1B2234] z-20 backdrop-blur-xl h-screen sticky top-0 transition-all duration-300 relative ${isCollapsed ? 'w-[70px] px-2.5' : 'w-[240px] px-5'
          }`}
      >
        {/* Border-floating collapse toggle button */}
        <button
          onClick={toggleCollapse}
          className="absolute top-[32px] -right-[11px] h-[22px] w-[22px] bg-[#070B18] border border-[#1B2234] hover:border-[#4F8CFF]/50 text-slate-500 hover:text-slate-300 rounded-full flex items-center justify-center transition-all z-30 shadow-md"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Brand Header */}
        <div className="pt-7 pb-10 flex items-center flex-shrink-0">
          <div className={`flex items-center space-x-3.5 ${isCollapsed ? 'mx-auto' : ''}`}>
            <div className="p-1.5 bg-[#4F8CFF]/10 rounded-lg border border-[#4F8CFF]/20 flex items-center justify-center text-[#4F8CFF] flex-shrink-0">
              <Shield size={18} />
            </div>
            {!isCollapsed && (
              <span className="text-2xl font-semibold tracking-tight text-slate-100 font-sans">
                Worklynk
              </span>
            )}
          </div>
        </div>

        {/* Navigation links list - Static, non-scrollable */}
        <nav className="flex-1 overflow-hidden space-y-1.5 pb-6">
          {renderNavLinks(false)}
        </nav>

        {/* Sticky User Profile Card Footer */}
        <div className="sticky bottom-0 pt-3 pb-6 flex-shrink-0 z-20 bg-[#070B18]">
          {isCollapsed ? (
            <div className="flex flex-col items-center space-y-4 py-3 bg-[#0B1226]/80 border border-[#1B2234] rounded-[16px] shadow-lg">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-[#1B2234] overflow-hidden flex items-center justify-center relative group">
                {profile?.profilePhotoPath ? (
                  <img
                    src={`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5001'}${profile.profilePhotoPath}`}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                    crossOrigin="use-credentials"
                  />
                ) : (
                  <div className="w-full h-full bg-[#4F8CFF]/10 flex items-center justify-center text-[#4F8CFF] text-sm font-black uppercase">
                    {user?.email ? user.email.charAt(0) : 'U'}
                  </div>
                )}
                {/* Tooltip for profile info */}
                <div className="absolute left-[60px] px-2.5 py-1.5 bg-[#0B1226] border border-[#1B2234] text-[11px] font-bold text-slate-200 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
                  {user?.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-transparent rounded-lg transition-all focus:outline-none flex-shrink-0"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="p-3 bg-[#0B1226]/80 border border-[#1B2234] rounded-[16px] shadow-lg flex items-center space-x-3">
              {/* Avatar circle */}
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-[#1B2234] overflow-hidden flex items-center justify-center flex-shrink-0">
                {profile?.profilePhotoPath ? (
                  <img
                    src={`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5001'}${profile.profilePhotoPath}`}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                    crossOrigin="use-credentials"
                  />
                ) : (
                  <div className="w-full h-full bg-[#4F8CFF]/10 flex items-center justify-center text-[#4F8CFF] text-sm font-black uppercase">
                    {user?.email ? user.email.charAt(0) : 'U'}
                  </div>
                )}
              </div>
              {/* Profile Details */}
              <div className="flex flex-col text-left min-w-0 flex-1">
                <span className="text-[13px] font-bold text-slate-200 truncate">
                  {profile?.fullName || user?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-slate-500 truncate mt-0.5">
                  {user?.email}
                </span>
                <span className={`inline-flex px-1.5 py-0.5 mt-1.5 rounded text-[8px] font-extrabold uppercase tracking-wider w-fit ${roleColors[currentRole]}`}>
                  {roleLabels[currentRole]}
                </span>
                {/* Red Text Sign Out option */}
                <button
                  onClick={handleLogout}
                  className="mt-2 flex items-center space-x-1.5 text-[11px] font-bold text-red-500 hover:text-red-400 transition-colors focus:outline-none w-fit"
                >
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
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
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#070B18] border-r border-[#1B2234] z-40 backdrop-blur-xl md:hidden transition-transform duration-300 transform flex flex-col px-6 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="pt-7 pb-6 border-b border-slate-900/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="p-1.5 bg-[#4F8CFF]/10 rounded-lg border border-[#4F8CFF]/20 flex items-center justify-center text-[#4F8CFF] flex-shrink-0">
              <Shield size={18} />
            </div>
            <span className="text-2xl font-semibold tracking-tight text-slate-100 font-sans">
              Worklynk
            </span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1.5 overflow-hidden">
          {renderNavLinks(true)}
        </nav>

        {/* Mobile bottom profile */}
        <div className="pt-3 pb-6 flex-shrink-0 bg-[#070B18]">
          <div className="p-3 bg-[#0B1226]/80 border border-[#1B2234] rounded-[16px] shadow-lg flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-[#1B2234] overflow-hidden flex items-center justify-center flex-shrink-0">
              {profile?.profilePhotoPath ? (
                <img
                  src={`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5001'}${profile.profilePhotoPath}`}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  crossOrigin="use-credentials"
                />
              ) : (
                <div className="w-full h-full bg-[#4F8CFF]/10 flex items-center justify-center text-[#4F8CFF] text-sm font-black uppercase">
                  {user?.email ? user.email.charAt(0) : 'U'}
                </div>
              )}
            </div>
            <div className="flex flex-col text-left min-w-0 flex-1">
              <span className="text-[13px] font-bold text-slate-200 truncate">
                {profile?.fullName || user?.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-slate-500 truncate mt-0.5">
                {user?.email}
              </span>
              <span className={`inline-flex px-1.5 py-0.5 mt-1.5 rounded text-[8px] font-extrabold uppercase tracking-wider w-fit ${roleColors[currentRole]}`}>
                {roleLabels[currentRole]}
              </span>
              {/* Red Text Sign Out option */}
              <button
                onClick={handleLogout}
                className="mt-2 flex items-center space-x-1.5 text-[11px] font-bold text-red-500 hover:text-red-400 transition-colors focus:outline-none w-fit"
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#0B1226] border border-[#1B2234] rounded-2xl p-6 shadow-2xl relative z-10 mx-4">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Sign Out</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to sign out of Worklynk?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-[#1B2234] hover:bg-[#1B2234]/80 text-slate-300 hover:text-slate-100 text-sm font-semibold rounded-xl transition-all focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                  navigate('/login');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-red-600/10 focus:outline-none"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
