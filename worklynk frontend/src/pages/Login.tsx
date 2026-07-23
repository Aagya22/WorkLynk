import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import api from '../utils/api';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:5001';

const OAUTH_ERRORS: Record<string, string> = {
  oauth_unavailable: 'Google sign-in is not configured on this server.',
  oauth_denied: 'Google sign-in was cancelled.',
  oauth_failed: 'Google sign-in failed. Please try again.',
  oauth_state: 'Google sign-in could not be verified. Please try again.',
  oauth_email: 'Your Google account has no verified email address.',
  oauth_nouser: 'No Worklynk account matches that Google address. Ask an administrator to create one first.',
  oauth_pending: 'Your account is still pending administrator approval.',
  oauth_rejected: 'Your registration request was rejected.',
  oauth_inactive: 'This account has been deactivated.',
  oauth_mismatch: 'This email is already linked to a different Google account.'
};

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const [searchParams] = useSearchParams();
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetchNewCaptcha();
  }, []);

  // Surface any error or notice the OAuth callback bounced back with.
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setError(OAUTH_ERRORS[err] || 'Sign-in failed. Please try again.');
    const info = searchParams.get('notice');
    if (info === 'oauth_signup_pending') {
      setNotice('Your Google sign-up request has been received and is awaiting administrator approval.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password, captchaText, captchaKey);
      
      if (data.mfaRequired) {
        navigate('/verify-mfa', { state: { tempToken: data.tempToken } });
      } else if (data.passwordExpired) {
        navigate('/force-change-password', { state: { userId: data.userId, email } });
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
      fetchNewCaptcha();
      setCaptchaText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-[-0.025em] text-[#1C1917]">Welcome back</h2>
          <p className="mt-2 text-[13.5px] text-[#57534E]">Sign in to your Worklynk account to continue.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {notice && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-xl text-center">
            {notice}
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
          Log In
        </Button>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-[rgba(28,25,23,0.10)]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A8A29E]">or</span>
          <span className="h-px flex-1 bg-[rgba(28,25,23,0.10)]" />
        </div>

        {/* Full-page redirect, not an XHR: the browser must follow Google's flow. */}
        <a
          href={`${API_BASE}/api/auth/google`}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[rgba(28,25,23,0.14)] bg-white py-2.5 text-[13.5px] font-semibold text-[#1C1917] transition-colors hover:bg-[#FBFAF8]"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 43.5c5.4 0 10.3-2.1 14-5.4l-6.5-5.5c-2 1.5-4.6 2.4-7.5 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39 16.2 43.5 24 43.5z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.5 5.5c-.5.4 7-5 7-15 0-1.2-.1-2.3-.4-3.5z" />
          </svg>
          Continue with Google
        </a>

        <div className="flex items-center justify-between pt-1">
          <Link to="/forgot-password" className="text-[12.5px] font-semibold text-[#57534E] transition-colors hover:text-[#1C1917]">
            Forgot password?
          </Link>
        </div>

        <div className="border-t border-[rgba(28,25,23,0.08)] pt-5 text-center text-[13px] text-[#57534E]">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#1C1917] underline-offset-4 hover:underline">
            Create one
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
