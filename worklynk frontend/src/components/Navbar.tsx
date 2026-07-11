import React from 'react';

interface NavbarProps {
  user: any;
  profile: { profilePhotoPath?: string } | null;
  currentPageTitle: string;
  setMobileOpen: (open: boolean) => void;
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

  return (
    <header className="flex items-center justify-between px-6 md:px-8 py-4 bg-slate-950/40 border-b border-slate-900/80 backdrop-blur-xl">
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

      {/* Right side: Session status & Profile */}
      <div className="flex items-center space-x-4">
        {/* Session Indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-extrabold uppercase tracking-wider">Secure Session</span>
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
