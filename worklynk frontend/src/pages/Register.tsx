import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { PasswordStrength } from '../components/PasswordStrength';
import api from '../utils/api';

export const Register: React.FC = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchNewCaptcha = async () => {
    try {
      const res = await api.get('/api/auth/captcha');
      if (res.data?.image) {
        setCaptchaImage(res.data.image);
        setCaptchaKey(res.data.captchaKey);
      }
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err);
    }
  };

  useEffect(() => {
    fetchNewCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register-self', {
        email,
        password,
        captchaText,
        captchaKey
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      fetchNewCaptcha();
      setCaptchaText('');
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h2 className="font-display text-[28px] font-bold tracking-[-0.025em] text-[#1C1917]">
              Request Submitted
            </h2>
            <p className="text-xs text-[#57534E] leading-relaxed font-sans px-4">
              Your registration request has been successfully received and is currently **Pending Approval**. 
              An administrator must review and accept your account request before you can log in.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/login" className="w-full inline-block">
              <Button variant="primary" fullWidth>
                Back to Login
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
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-[-0.025em] text-[#1C1917]">Create your account</h2>
          <p className="mt-2 text-[13.5px] text-[#57534E]">
            Set up access in a minute. Your HR team assigns job and payroll details afterwards.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        <Input
          id="email"
          label="Email Address"
          type="email"
          placeholder="employee@worklynk.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          id="password"
          label="Password"
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

        {/* Text-Based CAPTCHA Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center justify-center bg-[#F7F6F3] rounded-xl border border-[rgba(28,25,23,0.12)] h-11 relative overflow-hidden select-none">
              {captchaImage ? (
                <img
                  src={captchaImage}
                  alt="CAPTCHA"
                  className="h-full object-contain cursor-pointer"
                  onClick={fetchNewCaptcha}
                  title="Click to refresh CAPTCHA"
                />
              ) : (
                <span className="text-xs text-[#8A8580]">Loading...</span>
              )}
            </div>
            <button
              type="button"
              onClick={fetchNewCaptcha}
              className="p-3 bg-white border border-[rgba(28,25,23,0.12)] hover:border-[rgba(28,25,23,0.28)] text-[#57534E] hover:text-[#1C1917] rounded-xl transition-all h-11 flex items-center justify-center focus:outline-none"
              title="Refresh CAPTCHA"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
              </svg>
            </button>
          </div>

          <Input
            id="captchaText"
            label="Verification Code"
            type="text"
            placeholder="Type verification code above"
            value={captchaText}
            onChange={(e) => setCaptchaText(e.target.value.toUpperCase())}
            required
            autoComplete="off"
            className="font-mono uppercase text-center tracking-[0.2em]"
          />
        </div>

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Register Account
        </Button>

        <div className="text-center pt-2">
          <Link to="/login" className="text-[12.5px] font-semibold text-[#57534E] hover:text-[#1C1917] transition-colors">
            Already have an account? Log In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
