import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { PasswordStrength } from '../components/PasswordStrength';
import api from '../utils/api';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Password reset token is missing. Please request a new recovery link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        token,
        password
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200">
            <svg className="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h2 className="font-display text-[28px] font-bold tracking-[-0.025em] text-[#1C1917]">
              Password Restored
            </h2>
            <p className="text-xs text-[#57534E] leading-relaxed font-sans px-4">
              Your password has been successfully reset. 
              All existing active sessions have been invalidated. You can now log in with your new credentials.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/login" className="w-full inline-block">
              <Button variant="primary" fullWidth>
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center space-y-1">
          <h2 className="font-display text-[28px] font-bold tracking-[-0.025em] text-[#1C1917]">
            Reset Password
          </h2>
          <p className="text-[10px] text-[#57534E] font-medium">
            Define a strong credentials key for your secure profile.
          </p>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {!token && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl text-center">
            Warning: Reset token was not detected in URL parameters. Please check your recovery link.
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
          disabled={!token}
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
          disabled={!token}
        />

        <Button type="submit" variant="primary" fullWidth loading={loading} disabled={!token}>
          Save New Password
        </Button>

        <div className="text-center pt-2">
          <Link to="/login" className="text-[12.5px] font-semibold text-[#57534E] hover:text-[#1C1917] transition-colors">
            Cancel and Return
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
