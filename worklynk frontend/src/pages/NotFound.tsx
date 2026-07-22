import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background glow spot */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full text-center z-10 space-y-6">
        <div className="p-5 bg-[#F2F1ED] border border-[rgba(28,25,23,0.10)] rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#1C1917]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold text-[#1C1917] tracking-tight">404 Page</h2>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#1C1917]">Page Not Found</p>
        </div>

        <p className="text-sm text-[#57534E] leading-relaxed max-w-sm mx-auto">
          The link you followed may be broken or the page may have been removed. If you believe this is an error, please report it.
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
