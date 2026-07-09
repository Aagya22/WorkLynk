import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<any>(null);

  useEffect(() => {
    // Poll for the global hcaptcha object injected by the script in index.html
    const interval = setInterval(() => {
      if ((window as any).hcaptcha) {
        clearInterval(interval);
        if (captchaRef.current && captchaWidgetId.current === null) {
          try {
            captchaWidgetId.current = (window as any).hcaptcha.render(captchaRef.current, {
              sitekey: (import.meta as any).env.VITE_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001',
              theme: 'dark',
              callback: (token: string) => {
                setCaptchaToken(token);
                setError('');
              },
              'expired-callback': () => {
                setCaptchaToken('');
              }
            });
          } catch (e) {
            console.error('Failed to render hCaptcha widget:', e);
          }
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (captchaWidgetId.current !== null && (window as any).hcaptcha) {
        try {
          (window as any).hcaptcha.reset(captchaWidgetId.current);
        } catch (e) {}
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password, captchaToken);
      
      if (data.mfaRequired) {
        navigate('/verify-mfa', { state: { tempToken: data.tempToken } });
      } else if (data.passwordExpired) {
        navigate('/force-change-password', { state: { userId: data.userId, email } });
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
      // Reset hCaptcha widget on error to force a new check
      if (captchaWidgetId.current !== null && (window as any).hcaptcha) {
        try {
          (window as any).hcaptcha.reset(captchaWidgetId.current);
          setCaptchaToken('');
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5">
        <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider text-center">
          Account Login
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

        {/* hCaptcha placeholder wrapper */}
        <div className="flex justify-center py-1">
          <div ref={captchaRef}></div>
        </div>

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Log In
        </Button>
      </form>
    </AuthLayout>
  );
};
