import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ShieldCheck } from 'lucide-react';

export const GDPR: React.FC = () => {
  const { user } = useAuth();

  const [consentToken, setConsentToken] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenTimeLeft, setTokenTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Export states
  const [exporting, setExporting] = useState(false);
  const [exportSuccessModalOpen, setExportSuccessModalOpen] = useState(false);
  const [zipPassword, setZipPassword] = useState('');
  const [zipFileName, setZipFileName] = useState('');

  // Countdown timer for consent token
  useEffect(() => {
    if (tokenTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setTokenTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [tokenTimeLeft]);

  const handleGenerateConsentToken = async () => {
    if (!user) return;
    setError('');
    setSuccess('');
    setTokenLoading(true);

    try {
      const response = await api.post(`/api/profile/${user.id}/export-token`);
      if (response.data?.consentToken) {
        setConsentToken(response.data.consentToken);
        setTokenTimeLeft(15 * 60); // 15 minutes
        setSuccess('One-time consent token generated successfully.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate consent token.');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    if (!window.confirm('This will compile all your profile, leaves, and payslips data into a password-protected zip file. Do you wish to proceed?')) return;

    setError('');
    setSuccess('');
    setExporting(true);

    try {
      const response = await api.post(`/api/profile/${user.id}/export`, {});
      if (response.data?.zipData) {
        const { zipData, password, fileName } = response.data;
        setZipPassword(password);
        setZipFileName(fileName);


        const byteCharacters = atob(zipData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/zip' });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setExportSuccessModalOpen(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to compile and export your GDPR archive.');
    } finally {
      setExporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <div className="animate-slide-up flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 shadow-glow">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">GDPR Compliance Portal</h1>
            <p className="text-sm font-medium text-slate-400">
              Manage your right to data portability — export your archive or authorize an administrator.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold rounded-xl text-center">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card 1: Data Portability (Export) */}
          <div className="animate-slide-up stagger-1 flex flex-col justify-between space-y-6 rounded-2xl border border-white/[0.08] bg-[#0D1326] p-6 shadow-xl transition-all duration-300 hover:border-white/15">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-100">Download Data Archive</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Under Article 20 of the GDPR (Right to Data Portability), you have the right to request a copy of your personal data in a structured, commonly used, and machine-readable format.
              </p>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/50 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">What is included in the export:</h4>
                <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4 font-medium">
                  <li>Personal profile, emergency contact & job details (`profile.json`)</li>
                  <li>Complete leave and vacation history ledger (`leaves.json`)</li>
                  <li>All historical monthly payslips compiled in secure PDF formats</li>
                </ul>
              </div>
            </div>
            <div>
              <Button variant="primary" fullWidth onClick={handleExportData} loading={exporting}>
                Request Portability Export
              </Button>
            </div>
          </div>

          {/* Card 2: Admin Consent Authorization */}
          <div className="animate-slide-up stagger-2 flex flex-col justify-between space-y-6 rounded-2xl border border-white/[0.08] bg-[#0D1326] p-6 shadow-xl transition-all duration-300 hover:border-white/15">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-5 4a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-100">Authorize Admin Export</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                If you require assistance or need a physical copy printed by HR, you can generate a secure **one-time consent token**. An IT Administrator can use this token to perform the GDPR export on your behalf.
              </p>

              {consentToken && tokenTimeLeft > 0 ? (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-900 text-center space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">One-time Consent Token</span>
                    <div className="text-lg font-mono font-extrabold text-amber-400 tracking-wider bg-slate-900 border border-slate-800 p-2.5 rounded-lg select-all">
                      {consentToken}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                    <span>Valid for: <strong className="text-slate-400 font-bold">{formatTime(tokenTimeLeft)}</strong></span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(consentToken);
                        alert('Token copied to clipboard!');
                      }}
                      className="text-primary-400 hover:text-primary-300 font-bold transition-colors"
                    >
                      Copy Token
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-900/50 text-center text-xs text-slate-500 italic py-6">
                  No active consent authorization token.
                </div>
              )}
            </div>
            <div>
              <Button
                variant="secondary"
                fullWidth
                onClick={handleGenerateConsentToken}
                loading={tokenLoading}
                disabled={tokenTimeLeft > 0}
              >
                {tokenTimeLeft > 0 ? `Token Active (${formatTime(tokenTimeLeft)})` : 'Generate Consent Token'}
              </Button>
            </div>
          </div>
        </div>

        {/* Export Success Info Modal */}
        <Modal
          isOpen={exportSuccessModalOpen}
          onClose={() => setExportSuccessModalOpen(false)}
          title="GDPR Export Successfully Downloaded"
        >
          <div className="space-y-5 text-center py-2">
            <div className="mx-auto w-12 h-12 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-200">Archive Compiled: {zipFileName}</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                For security compliance, the data archive is encrypted using AES-256. The password to unlock the archive has been emailed to you and is shown below:
              </p>
            </div>

            <div className="bg-slate-950/80 p-3.5 border border-slate-900 rounded-xl space-y-1 select-all">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Archive Decryption Password</span>
              <div className="text-base font-mono font-extrabold text-green-400 tracking-wider">
                {zipPassword}
              </div>
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[10px] text-amber-500/90 leading-normal max-w-sm mx-auto font-medium">
              ⚠️ Warning: This password will not be shown again and is not saved in the system databases. Please record it safely.
            </div>

            <div className="flex justify-center pt-2">
              <Button variant="primary" onClick={() => setExportSuccessModalOpen(false)}>
                I have saved the password
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
