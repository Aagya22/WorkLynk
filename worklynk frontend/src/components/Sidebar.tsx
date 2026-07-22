import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FileSpreadsheet,
  CalendarDays,
  CalendarRange,
  Download,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  user: any;
  logout: () => Promise<void>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

type NavEntry = { name: string; path: string; section: string; roles: string[]; icon: React.ReactNode };

const NAV: NavEntry[] = [
  { name: 'Dashboard', path: '/dashboard', section: 'Menu', roles: ['employee', 'hr_manager', 'admin'], icon: <LayoutDashboard size={18} /> },
  { name: 'Payslips', path: '/payslips', section: 'Menu', roles: ['employee', 'hr_manager'], icon: <FileSpreadsheet size={18} /> },
  { name: 'Leave Requests', path: '/leaves', section: 'Menu', roles: ['employee', 'hr_manager'], icon: <CalendarDays size={18} /> },
  { name: 'Calendar', path: '/calendar', section: 'Menu', roles: ['employee', 'hr_manager', 'admin'], icon: <CalendarRange size={18} /> },
  { name: 'GDPR Export', path: '/gdpr', section: 'Menu', roles: ['employee', 'hr_manager', 'admin'], icon: <Download size={18} /> },
  { name: 'Employee Directory', path: '/hr/employees', section: 'HR Management', roles: ['hr_manager', 'admin'], icon: <Users size={18} /> },
  { name: 'Leave Decisions', path: '/hr/leaves', section: 'HR Management', roles: ['hr_manager', 'admin'], icon: <CheckSquare size={18} /> },
  { name: 'Manage Users', path: '/admin/users', section: 'Administration', roles: ['admin'], icon: <Users size={18} /> },
  { name: 'System Logs', path: '/admin/logs', section: 'Administration', roles: ['admin'], icon: <Settings size={18} /> },
];

const SECTION_ORDER = ['Menu', 'HR Management', 'Administration'];
const ACCOUNT_ITEM: NavEntry = { name: 'My Profile', path: '/profile', section: 'Account', roles: [], icon: <User size={18} /> };

export const Sidebar: React.FC<SidebarProps> = ({ user, logout, mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentRole = (user?.role || 'employee') as 'employee' | 'hr_manager' | 'admin';
  const items = NAV.filter((i) => i.roles.includes(currentRole));
  const groups = SECTION_ORDER.map((s) => ({ section: s, entries: items.filter((i) => i.section === s) })).filter((g) => g.entries.length);

  const NavRow: React.FC<{ item: NavEntry; showLabel: boolean; onNavigate?: () => void }> = ({ item, showLabel, onNavigate }) => {
    const active = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        title={item.name}
        aria-label={item.name}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
        className={`group relative flex h-11 items-center rounded-2xl border transition-all duration-200 ${showLabel ? 'px-3' : 'justify-center px-0'} ${
          active
            ? 'sidebar-active border-accent-500/10 bg-accent-500/10 font-semibold text-strong shadow-glow'
            : 'border-transparent text-slate-400 hover:bg-white/[0.12] hover:text-white'
        }`}
      >
        <span className={`flex-shrink-0 ${active ? 'text-accent-500' : 'text-slate-400 transition-colors group-hover:text-white'}`}>
          {item.icon}
        </span>
        {showLabel && <span className="ml-3 text-[14px] font-medium">{item.name}</span>}
        {!showLabel && (
          <span className="pointer-events-none absolute left-[52px] z-50 whitespace-nowrap rounded-lg border border-[#1B2234] bg-[#0B1226] px-2.5 py-1.5 text-[11px] font-bold text-slate-100 opacity-0 shadow-xl transition-opacity delay-300 duration-150 group-hover:opacity-100">
            {item.name}
          </span>
        )}
      </Link>
    );
  };

  const NavZone: React.FC<{ showLabel: boolean; onNavigate?: () => void }> = ({ showLabel, onNavigate }) => (
    <nav className="scrollbar-none flex-1 overflow-y-auto overflow-x-hidden py-4">
      {groups.map((g, gi) => (
        <div key={g.section} className="space-y-1">
          {showLabel ? (
            <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-white/35">{g.section}</p>
          ) : (
            gi > 0 && <div className="mx-auto my-2 h-px w-6 bg-white/10" />
          )}
          {g.entries.map((item) => (
            <NavRow key={item.path} item={item} showLabel={showLabel} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );

  const AccountZone: React.FC<{ showLabel: boolean; onNavigate?: () => void }> = ({ showLabel, onNavigate }) => (
    <div className="flex-shrink-0 space-y-1 border-t border-white/[0.06] bg-white/[0.02] pb-5 pt-3">
      {showLabel && <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-white/35">Account</p>}
      <NavRow item={ACCOUNT_ITEM} showLabel={showLabel} onNavigate={onNavigate} />
      <button
        onClick={handleLogout}
        title="Sign Out"
        className={`group relative flex h-11 w-full items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-red-500/15 hover:text-red-200 focus:outline-none ${
          showLabel ? 'px-3' : 'justify-center px-0'
        }`}
      >
        <span className="flex-shrink-0 text-slate-500 transition-colors group-hover:text-red-300">
          <LogOut size={18} />
        </span>
        {showLabel && <span className="ml-3 text-[14px] font-medium">Sign Out</span>}
        {!showLabel && (
          <span className="pointer-events-none absolute left-[52px] z-50 whitespace-nowrap rounded-lg border border-[#1B2234] bg-[#0B1226] px-2.5 py-1.5 text-[11px] font-bold text-slate-100 opacity-0 shadow-xl transition-opacity delay-300 duration-150 group-hover:opacity-100">
            Sign Out
          </span>
        )}
      </button>
    </div>
  );

  function handleLogout() {
    setShowLogoutConfirm(true);
  }

  return (
    <>
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`app-sidebar ${expanded ? 'sidebar-expanded' : ''} relative z-40 my-3 ml-3 hidden flex-shrink-0 flex-col overflow-hidden rounded-[26px] bg-[#070B18] transition-[width,padding] duration-300 ease-out md:flex ${
          expanded ? 'w-[236px] px-3.5' : 'w-[72px] px-3'
        }`}
      >
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] py-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white">
            <Shield size={17} />
          </div>
          {expanded && <span className="font-display text-lg font-bold tracking-tight text-slate-100">Worklynk</span>}
        </div>

        <NavZone showLabel={expanded} />
        <AccountZone showLabel={expanded} />
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Mobile drawer */}
      <aside
        className={`app-sidebar sidebar-expanded fixed bottom-0 left-0 top-0 z-40 flex w-64 flex-col border-r border-[#1B2234] bg-[#070B18] px-4 backdrop-blur-xl transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/[0.06] py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white">
              <Shield size={17} />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-100">Worklynk</span>
          </div>
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-slate-400 hover:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <NavZone showLabel onNavigate={() => setMobileOpen(false)} />
        <AccountZone showLabel onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-[#1B2234] bg-[#0B1226] p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-slate-100">Sign Out</h3>
            <p className="mb-6 text-sm text-slate-400">Are you sure you want to sign out of Worklynk?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-xl bg-[#1B2234] px-4 py-2 text-sm font-semibold text-slate-300 transition-all hover:bg-[#1B2234]/80 hover:text-slate-100 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                  navigate('/login');
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/10 transition-all hover:bg-red-500 focus:outline-none"
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
