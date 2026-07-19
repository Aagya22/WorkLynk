import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<{ profilePhotoPath?: string } | null>(null);

  useEffect(() => {
    const fetchLayoutProfile = async () => {
      if (!user) return;
      try {
        const response = await api.get(`/api/profile/${user.id}`);
        if (response.data?.profile) {
          setProfile(response.data.profile);
        }
      } catch (err) {
        console.error('Failed to load profile for dashboard layout:', err);
      }
    };
    fetchLayoutProfile();
  }, [user]);

  return (
    <div
      data-theme={user?.role === 'admin' ? 'admin' : 'staff'}
      className="h-screen w-screen overflow-hidden bg-slate-950 flex relative text-slate-100 font-sans"
    >
      {/* Background glow spots */}
      <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[60%] bg-accent-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-30%] left-[-10%] w-[60%] h-[60%] bg-accent-600/[0.04] rounded-full blur-[150px] pointer-events-none" />

      {/* Sidebar Component */}
      <Sidebar
        user={user}
        logout={logout}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10">
        {/* Navbar Component */}
        <Navbar
          user={user}
          profile={profile}
          setMobileOpen={setMobileOpen}
        />

        {/* Dynamic Inner Page Content - Only this container scrolls */}
        <main className="content-scope flex-1 overflow-y-auto p-6 md:p-8 w-full">
          <div className="max-w-7xl mx-auto w-full pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
