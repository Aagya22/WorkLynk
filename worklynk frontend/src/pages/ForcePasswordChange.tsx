import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { PasswordStrength } from '../components/PasswordStrength';

export const ForcePasswordChange: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const email = location.state?.email;
  const userId = location.state?.userId;

  useEffect(() => {
    if (!email || !userId) {
      navigate('/login');
    }
  }, [email, userId, navigate]);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':",./<>?~`|\\-]).{12,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError('Confirm password does not match.');
    }

    if (!passwordRegex.test(newPassword)) {
      return setError(
        'Password must be at least 12 characters and include uppercase, lowercase, numbers, and symbols.'
      );
    }

    setLoading(true);

    try {
      await api.post('/api/auth/force-change-password', {
        email,
        currentPassword,
        newPassword,
      });

      setSuccess('Password updated successfully. Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center space-y-1.5">
          <h2 className="font-display text-[28px] font-bold tracking-[-0.025em] text-[#1C1917]">
            Password Expired
          </h2>
          <p className="text-xs text-[#57534E]">
            Your account password has expired (90-day security policy). You must update it to proceed.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl text-center animate-pulse">
            {success}
          </div>
        )}

        <Input
          id="current-password"
          label="Current Password"
          type="password"
          placeholder="••••••••••••"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          disabled={loading}
        />

        <Input
          id="new-password"
          label="New Password"
          type="password"
          placeholder="Min 12 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={loading}
          helperText="Requires uppercase, lowercase, numbers, and symbols."
        />

        <PasswordStrength password={newPassword} />

        <Input
          id="confirm-password"
          label="Confirm New Password"
          type="password"
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />

        <div className="flex flex-col space-y-2.5 pt-2">
          <Button type="submit" variant="primary" fullWidth loading={loading}>
            Update Password
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
