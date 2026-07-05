import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const App = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="glassmorphism max-w-md w-full rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        <div className="p-4 bg-primary-950 rounded-full border border-primary-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Worklynk</h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">Secure HR Management System</p>
        </div>
        <div className="w-full h-[1px] bg-slate-800"></div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Frontend and backend environments initialized successfully. Running under containerized local host orchestration.
        </p>
        <div className="flex items-center space-x-2 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 font-mono">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          <span>Security Controls Active</span>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
