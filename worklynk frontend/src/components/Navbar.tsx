import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, DollarSign, CalendarRange, BellRing, CheckCheck, Trash2, Inbox } from 'lucide-react';
import api from '../utils/api';

interface NavbarProps {
  user: any;
  profile: { profilePhotoPath?: string } | null;
  currentPageTitle: string;
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

export const Navbar: React.FC<NavbarProps> = ({
  user,
  profile,
  currentPageTitle,
  setMobileOpen,
}) => {
  const currentRole = user?.role || 'employee';

  const roleLabels: Record<string, string> = {
    employee: 'Employee',
    hr_manager: 'HR Manager',
    admin: 'Administrator',
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
        const unread = res.data.notifications.filter((n: NotificationItem) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
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
        return <ShieldAlert size={16} className="text-red-400" />;
      case 'payslip':
        return <DollarSign size={16} className="text-green-400" />;
      case 'leave':
        return <CalendarRange size={16} className="text-blue-400" />;
      default:
        return <BellRing size={16} className="text-slate-400" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <header className="flex items-center justify-between px-6 md:px-8 py-4 bg-slate-950/40 border-b border-slate-900/80 backdrop-blur-xl z-30">
      <div className="flex items-center space-x-3">
        {/* Hamburger menu for mobile */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden text-slate-400 hover:text-slate-200 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Breadcrumb Path */}
        <div className="flex items-center space-x-2 text-xs md:text-sm">
          <span className="text-slate-500 font-semibold tracking-wider uppercase font-mono">Worklynk</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-200 font-bold tracking-wide">{currentPageTitle}</span>
        </div>
      </div>

      {/* Right side: Session status, Notifications & Profile */}
      <div className="flex items-center space-x-4">
        {/* Session Indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-extrabold uppercase tracking-wider">Secure Session</span>
        </div>

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all relative focus:outline-none"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[8px] font-black text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown Card */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3.5 w-80 bg-[#0D1326] border border-white/5 rounded-2xl shadow-2xl z-50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center space-x-1 text-[10px] font-bold text-primary-400 hover:text-primary-300 transition-colors focus:outline-none"
                  >
                    <CheckCheck size={12} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-w-full max-h-64 overflow-y-auto scrollbar-none space-y-2 pr-0.5">
                {notifications.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                    <Inbox size={24} className="text-slate-600" />
                    <span className="text-xs text-slate-500 font-medium">No notifications yet</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                      className={`flex gap-3 p-3 rounded-xl border transition-all relative group cursor-pointer ${
                        notif.isRead
                          ? 'bg-transparent border-transparent'
                          : 'bg-[#151D35]/30 border-white/[0.04] hover:bg-[#151D35]/50'
                      }`}
                    >
                      {/* Left icon wrapper */}
                      <div className="flex-shrink-0 mt-0.5 p-1.5 bg-slate-950 border border-white/5 rounded-lg flex items-center justify-center h-7 w-7">
                        {getTypeIcon(notif.type)}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={`text-xs font-bold truncate leading-tight ${notif.isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed font-sans line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="text-[8px] text-slate-500 font-bold uppercase mt-1.5 block font-mono">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>

                      {/* Right Delete Trigger */}
                      <button
                        onClick={(e) => handleDeleteNotification(notif._id, e)}
                        className="absolute right-2 top-2 p-1.5 text-slate-600 hover:text-red-400 transition-colors focus:outline-none opacity-0 group-hover:opacity-100"
                        title="Delete notification"
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

        {/* Profile Avatar */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-900">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center relative">
            {profile?.profilePhotoPath ? (
              <img
                src={`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5001'}${profile.profilePhotoPath}`}
                alt="User Profile"
                className="w-full h-full object-cover"
                crossOrigin="use-credentials"
              />
            ) : (
              <div className="w-full h-full bg-primary-500/10 flex items-center justify-center text-primary-400 text-xs font-black uppercase">
                {user?.email ? user.email.charAt(0) : 'U'}
              </div>
            )}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{user?.email?.split('@')[0]}</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{roleLabels[currentRole]}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
