import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background glow spot */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full text-center z-10 space-y-6">
        <div className="p-5 bg-red-950/30 border border-red-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-2xl shadow-red-500/5 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold text-[#1C1917] tracking-tight">403 Forbidden</h2>
          <p className="text-sm font-semibold uppercase tracking-wider text-red-700">Access Denied</p>
        </div>

        <p className="text-sm text-[#57534E] leading-relaxed max-w-sm mx-auto">
          You do not have the necessary permissions to access this screen. This unauthorized access attempt has been logged in our immutable security audit logs.
        </p>

        <div className="flex items-center justify-center space-x-4 pt-4">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
