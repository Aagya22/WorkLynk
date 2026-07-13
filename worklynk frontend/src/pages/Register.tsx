import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
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
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500/10 border border-green-500/30">
            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider">
              Request Submitted
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans px-4">
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
        <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider text-center">
          Employee Registration
        </h2>
        
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center">
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
            <div className="flex-1 flex items-center justify-center bg-[#070B18] rounded-xl border border-white/[0.08] h-11 relative overflow-hidden select-none">
              {captchaImage ? (
                <img
                  src={captchaImage}
                  alt="CAPTCHA"
                  className="h-full object-contain cursor-pointer"
                  onClick={fetchNewCaptcha}
                  title="Click to refresh CAPTCHA"
                />
              ) : (
                <span className="text-xs text-slate-500">Loading...</span>
              )}
            </div>
            <button
              type="button"
              onClick={fetchNewCaptcha}
              className="p-3 bg-[#0D1326] border border-white/[0.08] hover:border-[#4F8CFF]/50 text-slate-400 hover:text-slate-200 rounded-xl transition-all h-11 flex items-center justify-center focus:outline-none"
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
          <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-primary-400 transition-colors">
            Already have an account? Log In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
