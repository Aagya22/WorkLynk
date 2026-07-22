import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

export const PROFILE_UPDATED_EVENT = 'worklynk:profile-updated';

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

    window.addEventListener(PROFILE_UPDATED_EVENT, fetchLayoutProfile);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, fetchLayoutProfile);
  }, [user]);

  return (
    <div
      data-theme="staff"
      className="app-shell flex h-screen w-screen overflow-hidden font-sans text-slate-100"
    >
      <Sidebar
        user={user}
        logout={logout}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="app-sheet flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          user={user}
          profile={profile}
          setMobileOpen={setMobileOpen}
        />

        <main className="content-scope flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <div className="mx-auto w-full max-w-[1180px] pb-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
