import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AuditLog } from '../models/audit-log.model';
import { Notification } from '../models/notification.model';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';



const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

const isConfigured = () => Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

const loginRedirect = (res: Response, error: string) =>
  res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(error)}`);

/** Sets the signed-in session cookies, matching the password login flow exactly. */
const issueSessionCookies = (res: Response, user: any, clientIP: string) => {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
    sessionVersion: user.sessionVersion,
    ip: clientIP
  };

  res.cookie('accessToken', generateAccessToken(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 24 * 60 * 60 * 1000
  });

  res.cookie('refreshToken', generateRefreshToken(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};

/** Step 1: send the user to Google's consent screen. */
export const googleRedirect = (req: Request, res: Response) => {
  if (!isConfigured()) {
    return loginRedirect(res, 'oauth_unavailable');
  }

  // "signup" may create a pending account for an unknown email; "login" never does.
  const mode = req.query.mode === 'signup' ? 'signup' : 'login';


  const state = `${mode}.${crypto.randomBytes(16).toString('hex')}`;
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',

    sameSite: 'lax',
    maxAge: 10 * 60 * 1000
  });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account'
  });

  return res.redirect(`${AUTH_ENDPOINT}?${params.toString()}`);
};

/** Step 2: Google redirects back here with a code; exchange it and sign the user in. */
export const googleCallback = async (req: Request, res: Response) => {
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const { code, state, error } = req.query as Record<string, string>;
  const stateCookie = req.cookies?.oauth_state;

  // The state cookie is single-use.
  res.clearCookie('oauth_state');

  if (!isConfigured()) return loginRedirect(res, 'oauth_unavailable');
  if (error) return loginRedirect(res, 'oauth_denied');
  if (!code) return loginRedirect(res, 'oauth_failed');
  if (!state || !stateCookie || state !== stateCookie) return loginRedirect(res, 'oauth_state');

  // Intent was bound into the state at redirect time.
  const mode = state.split('.')[0] === 'signup' ? 'signup' : 'login';

  try {
    // Exchange the authorization code for tokens.
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      }).toString()
    });

    if (!tokenRes.ok) return loginRedirect(res, 'oauth_failed');
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) return loginRedirect(res, 'oauth_failed');

    // Read the verified identity from Google over TLS, so no local signature
    // verification is needed and the response is inherently trustworthy.
    const infoRes = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    if (!infoRes.ok) return loginRedirect(res, 'oauth_failed');
    const info = (await infoRes.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean | string;
    };

    const emailVerified = info.email_verified === true || info.email_verified === 'true';
    if (!info.email || !info.sub || !emailVerified) {
      return loginRedirect(res, 'oauth_email');
    }

    const email = info.email.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      if (mode === 'signup') {
        const newUser = await User.create({
          email,
          passwordHash: null, // Google is the credential
          googleId: info.sub,
          role: 'employee', // never granted a privileged role via OAuth
          isActive: false,
          approvalStatus: 'pending'
        });

        await AuditLog.create({
          userId: newUser._id,
          actionType: 'USER_SELF_REGISTRATION',
          targetResource: `user:${newUser._id}`,
          ipAddress: clientIP,
          userAgent,
          metadata: { registeredEmail: email, provider: 'google' }
        });

        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            title: 'New Registration Request',
            message: `A new Google sign-up request from ${email} is pending approval.`,
            type: 'security'
          });
        }

        return res.redirect(`${FRONTEND_URL}/login?notice=oauth_signup_pending`);
      }

      console.warn(`[OAUTH] Rejected sign-in for unprovisioned email: ${email}`);
      return loginRedirect(res, 'oauth_nouser');
    }

    // Same gate as the password flow.
    if (user.approvalStatus === 'pending') return loginRedirect(res, 'oauth_pending');
    if (user.approvalStatus === 'rejected') return loginRedirect(res, 'oauth_rejected');
    if (!user.isActive) return loginRedirect(res, 'oauth_inactive');

    // Bind the Google identity to the account on first use.
    if (!user.googleId) {
      user.googleId = info.sub;
    } else if (user.googleId !== info.sub) {
      return loginRedirect(res, 'oauth_mismatch');
    }

    await user.resetLoginAttempts();


    if (user.mfaEnabled) {
      await user.save();
      const JWT_SECRET = process.env.JWT_SECRET as string;
      const tempToken = jwt.sign(
        { userId: user._id, mfaPending: true, ip: clientIP },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.redirect(`${FRONTEND_URL}/verify-mfa?tempToken=${encodeURIComponent(tempToken)}`);
    }

    user.previousLogin = user.lastLogin;
    user.previousLoginIP = user.lastLoginIP;
    user.lastLogin = new Date();
    user.lastLoginIP = clientIP;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      actionType: 'LOGIN_SUCCESS',
      targetResource: 'auth',
      ipAddress: clientIP,
      userAgent,
      metadata: { provider: 'google' }
    });

    issueSessionCookies(res, user, clientIP);
    return res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return loginRedirect(res, 'oauth_failed');
  }
};
