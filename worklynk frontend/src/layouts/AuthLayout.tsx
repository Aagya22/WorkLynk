import React from 'react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative gradient glow spots */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Centered layout card */}
      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 bg-primary-950 rounded-2xl border border-primary-500/20 mb-4 shadow-xl shadow-primary-500/5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Worklynk</h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1.5">Secure HR Management System</p>
        </div>
        
        <div className="glassmorphism rounded-2xl p-8 border border-white/5 shadow-2xl flex flex-col w-full relative">
          {children}
        </div>
      </div>
    </div>
  );
};
