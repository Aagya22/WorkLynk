import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { PasswordStrength } from '../components/PasswordStrength';
import api from '../utils/api';

export const Activate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate the link before showing the form so an expired invite fails fast.
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setChecking(false);
        return;
      }
      try {
        const res = await api.get(`/api/auth/activate?token=${encodeURIComponent(token)}`);
        setAccountEmail(res.data?.email || '');
        setTokenValid(true);
      } catch {
        setTokenValid(false);
      } finally {
        setChecking(false);
      }
    };
    verify();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/activate', { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate the account. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <AuthLayout>
        <p className="py-10 text-center text-[13.5px] text-[#57534E]">Checking your activation link...</p>
      </AuthLayout>
    );
  }

  if (!tokenValid) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-red-50">
            <svg className="h-6 w-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-[28px] font-bold tracking-[-0.025em] text-[#1C1917]">Link not valid</h2>
            <p className="px-2 text-[13.5px] leading-relaxed text-[#57534E]">
              This activation link is invalid, has already been used, or has expired. Ask your administrator
              to send you a new invitation.
            </p>
          </div>
          <Link to="/login" className="inline-block w-full">
            <Button variant="primary" fullWidth>
              Back to login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
            <svg className="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-[28px] font-bold tracking-[-0.025em] text-[#1C1917]">Account activated</h2>
            <p className="px-2 text-[13.5px] leading-relaxed text-[#57534E]">
              Your password is set. You can now sign in, and we recommend turning on two-factor
              authentication from your profile.
            </p>
          </div>
          <Link to="/login" className="inline-block w-full">
            <Button variant="primary" fullWidth>
              Go to login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-[-0.025em] text-[#1C1917]">Activate your account</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#57534E]">
            Choose a password for {accountEmail ? <span className="font-semibold text-[#1C1917]">{accountEmail}</span> : 'your account'}.
            Only you will know it.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <Input
          id="password"
          label="New Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <PasswordStrength password={password} />

        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Activate account
        </Button>
      </form>
    </AuthLayout>
  );
};
