import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Bell, ShieldAlert, DollarSign, CalendarRange, BellRing, CheckCheck, Trash2, Inbox, Search, Menu } from 'lucide-react';
import api from '../utils/api';

interface NavbarProps {
  user: any;
  profile: { profilePhotoPath?: string } | null;
  setMobileOpen: (open: boolean) => void;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'security' | 'payslip' | 'leave' | 'system';
  isRead: boolean;
  createdAt: string;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profile': 'My Profile',
  '/payslips': 'Payslips',
  '/leaves': 'Leave Requests',
  '/calendar': 'Calendar',
  '/gdpr': 'GDPR Export',
  '/hr/dashboard': 'HR Dashboard',
  '/hr/employees': 'Employee Directory',
  '/hr/leaves': 'Leave Decisions',
  '/hr/logs': 'Department Logs',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'Manage Users',
  '/admin/logs': 'System Logs',
};

const SEARCH_PAGES = [
  { name: 'Dashboard', path: '/dashboard', roles: ['employee', 'hr_manager', 'admin'] },
  { name: 'Payslips', path: '/payslips', roles: ['employee', 'hr_manager', 'admin'] },
  { name: 'Leave Requests', path: '/leaves', roles: ['employee', 'hr_manager'] },
  { name: 'Calendar', path: '/calendar', roles: ['employee', 'hr_manager', 'admin'] },
  { name: 'GDPR Export', path: '/gdpr', roles: ['employee', 'hr_manager', 'admin'] },
  { name: 'My Profile', path: '/profile', roles: ['employee', 'hr_manager', 'admin'] },
  { name: 'Employee Directory', path: '/hr/employees', roles: ['hr_manager', 'admin'] },
  { name: 'Leave Decisions', path: '/hr/leaves', roles: ['hr_manager', 'admin'] },
  { name: 'Department Logs', path: '/hr/logs', roles: ['hr_manager'] },
  { name: 'Manage Users', path: '/admin/users', roles: ['admin'] },
  { name: 'System Logs', path: '/admin/logs', roles: ['admin'] },
];

export const Navbar: React.FC<NavbarProps> = ({ user, profile, setMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentRole = user?.role || 'employee';
  const pageTitle = PAGE_TITLES[location.pathname] || 'Worklynk';

  const roleLabels: Record<string, string> = { employee: 'Employee', hr_manager: 'HR Manager', admin: 'Administrator' };

  // Global quick search
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const results = SEARCH_PAGES.filter((p) => p.roles.includes(currentRole) && p.name.toLowerCase().includes(query.toLowerCase()));
  const go = (path: string) => {
    navigate(path);
    setQuery('');
    setSearchOpen(false);
  };

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter((n: NotificationItem) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };
  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };
  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security':
        return <ShieldAlert size={16} className="text-rose-500" />;
      case 'payslip':
        return <DollarSign size={16} className="text-emerald-600" />;
      case 'leave':
        return <CalendarRange size={16} className="text-[#10367D]" />;
      default:
        return <BellRing size={16} className="text-slate-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    } catch {
      return '';
    }
  };

  const apiBase = (import.meta as any).env.VITE_API_URL || 'http://localhost:5001';

  return (
    <header className="app-navbar flex items-center gap-4 px-4 py-3 md:px-8">
      {/* Left */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="text-slate-500 hover:text-slate-800 md:hidden">
          <Menu size={22} />
        </button>
        <h1 className="font-display text-lg font-bold text-slate-900">{pageTitle}</h1>
      </div>

      {/* Search */}
      <div ref={searchRef} className="relative ml-2 hidden max-w-sm flex-1 md:block">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) go(results[0].path);
            if (e.key === 'Escape') setSearchOpen(false);
          }}
          placeholder="Search pages…"
          aria-label="Search pages"
          className="w-full rounded-full border border-black/[0.06] bg-black/[0.035] py-2.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#10367D]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10367D]/10"
        />
        {searchOpen && query && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-xl">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-xs text-slate-500">No pages match "{query}".</p>
            ) : (
              results.map((r) => (
                <button
                  key={r.path}
                  onClick={() => go(r.path)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-[#10367D]/[0.06]"
                >
                  <Search size={14} className="text-slate-400" />
                  {r.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-black/[0.05] hover:text-slate-800 focus:outline-none"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 z-50 mt-3 w-80 space-y-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className="flex items-center gap-1 text-[10px] font-bold text-[#10367D] transition-colors hover:text-[#0C2A63] focus:outline-none">
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="scrollbar-none max-h-64 space-y-2 overflow-y-auto pr-0.5">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <Inbox size={24} className="text-slate-300" />
                    <span className="text-xs font-medium text-slate-500">No notifications yet</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                      className={`group relative flex cursor-pointer gap-3 rounded-xl p-3 transition-colors ${notif.isRead ? '' : 'bg-[#10367D]/[0.05]'}`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-black/[0.05] bg-slate-50">
                        {getTypeIcon(notif.type)}
                      </div>
                      <div className="min-w-0 flex-1 pr-6">
                        <p className={`truncate text-xs font-bold leading-tight ${notif.isRead ? 'text-slate-600' : 'text-slate-900'}`}>{notif.title}</p>
                        <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-relaxed text-slate-500">{notif.message}</p>
                        <span className="mt-1.5 block text-[9px] font-bold uppercase text-slate-400">{formatTime(notif.createdAt)}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteNotification(notif._id, e)}
                        aria-label="Delete notification"
                        className="absolute right-2 top-2 p-1.5 text-slate-400 opacity-0 transition-colors hover:text-rose-500 focus:outline-none group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link
          to="/profile"
          className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-black/[0.05]"
        >
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-[#10367D]/10">
            {profile?.profilePhotoPath ? (
              <img src={`${apiBase}${profile.profilePhotoPath}`} alt="" className="h-full w-full object-cover" crossOrigin="use-credentials" />
            ) : (
              <span className="text-xs font-black uppercase text-[#10367D]">{user?.email ? user.email.charAt(0) : 'U'}</span>
            )}
          </div>
          <div className="hidden flex-col text-left leading-tight md:flex">
            <span className="max-w-[120px] truncate text-xs font-bold text-slate-800">{user?.email?.split('@')[0]}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{roleLabels[currentRole]}</span>
          </div>
        </Link>
      </div>
    </header>
  );
};
