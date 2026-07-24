import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { User, IUser } from '../src/models/user.model';

// A password that satisfies the app's strength policy (12+ chars, upper, lower,
// digit, special) so it is accepted anywhere the real endpoints validate it.
export const TEST_PASSWORD = 'Str0ng!Passw0rd12';

export interface SeedUserOverrides {
  email?: string;
  password?: string;
  role?: 'employee' | 'hr_manager' | 'admin';
  department?: string | null;
  isActive?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

// Creates a login-ready user straight through the model. This deliberately
// bypasses the admin-approval / activation-link onboarding flow so RBAC and
// IDOR suites can get an authenticated cookie without that ceremony.
export async function createUser(overrides: SeedUserOverrides = {}): Promise<IUser> {
  const password = overrides.password ?? TEST_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 12);

  return User.create({
    email: overrides.email ?? 'user@worklynk.local',
    passwordHash,
    role: overrides.role ?? 'employee',
    department: overrides.department ?? null,
    isActive: overrides.isActive ?? true,
    approvalStatus: overrides.approvalStatus ?? 'approved'
  });
}


export async function loginUser(email: string, password: string = TEST_PASSWORD): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  const cookies = res.headers['set-cookie'] as unknown as string[];
  const accessTokenCookie = cookies?.find((c) => c.startsWith('accessToken='));
  if (!accessTokenCookie) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return accessTokenCookie.split(';')[0];
}

export async function createAndLogin(
  overrides: SeedUserOverrides = {}
): Promise<{ user: IUser; cookie: string }> {
  const user = await createUser(overrides);
  const cookie = await loginUser(user.email, overrides.password ?? TEST_PASSWORD);
  return { user, cookie };
}

export async function getCaptcha(): Promise<{ captchaText: string; captchaKey: string }> {
  const res = await request(app).get('/api/auth/captcha');
  const captchaKey: string = res.body.captchaKey;
  const decoded = Buffer.from(captchaKey, 'base64').toString('utf-8');
  const captchaText = decoded.split('.')[0];
  return { captchaText, captchaKey };
}
