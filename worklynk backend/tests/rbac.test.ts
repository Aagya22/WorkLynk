import request from 'supertest';
import app from '../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from './testDb';
import { createUser, createAndLogin, loginUser } from './helpers';

jest.mock('../src/middlewares/rateLimit', () => {
  const passthrough = (_req: unknown, _res: unknown, next: () => void) => next();
  return {
    apiLimiter: passthrough,
    authLimiter: passthrough,
    passwordResetLimiter: passthrough,
    registrationLimiter: passthrough,
    mfaSetupLimiter: passthrough,
  };
});

jest.mock('../src/utils/email', () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
  sendSecurityAlertEmail: jest.fn().mockResolvedValue(undefined),
}));

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

describe('Authentication gate', () => {
  it('rejects an unauthenticated request to a protected route', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('lets a logged-in employee read their own identity', async () => {
    const { user, cookie } = await createAndLogin({ email: 'emp@worklynk.local' });
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.role).toBe('employee');
  });

  it('rejects a tampered/garbage token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'accessToken=not-a-real-jwt');
    expect(res.status).toBe(401);
  });
});

describe('Role-based access control', () => {
  it('blocks an employee from the admin user directory', async () => {
    const { cookie } = await createAndLogin({ email: 'emp@worklynk.local', role: 'employee' });
    const res = await request(app).get('/api/admin/users').set('Cookie', cookie);
    expect(res.status).toBe(403);
  });

  it('blocks an employee from the audit log explorer', async () => {
    const { cookie } = await createAndLogin({ email: 'emp@worklynk.local', role: 'employee' });
    const res = await request(app).get('/api/audit-logs').set('Cookie', cookie);
    expect(res.status).toBe(403);
  });

  it('allows an admin to list users', async () => {
    const { cookie } = await createAndLogin({ email: 'admin@worklynk.local', role: 'admin' });
    const res = await request(app).get('/api/admin/users').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('never leaks password hashes or MFA secrets in the user directory', async () => {
    await createUser({ email: 'someone@worklynk.local' });
    const { cookie } = await createAndLogin({ email: 'admin@worklynk.local', role: 'admin' });

    const res = await request(app).get('/api/admin/users').set('Cookie', cookie);
    expect(res.status).toBe(200);
    for (const u of res.body.users) {
      expect(u.passwordHash).toBeUndefined();
      expect(u.mfaSecret).toBeUndefined();
    }
  });

  it('blocks an admin from changing their own role (privilege-lock)', async () => {
    const { user, cookie } = await createAndLogin({ email: 'admin@worklynk.local', role: 'admin' });
    const res = await request(app)
      .put(`/api/admin/users/${user.id}/role`)
      .set('Cookie', cookie)
      .send({ role: 'employee' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/your own role/i);
  });

  it('reflects a role change only after a fresh login (role is bound into the JWT)', async () => {
    // Promote in the DB while holding an old employee cookie.
    const { user, cookie } = await createAndLogin({ email: 'promote@worklynk.local', role: 'employee' });
    const admin = await createAndLogin({ email: 'admin@worklynk.local', role: 'admin' });

    await request(app)
      .put(`/api/admin/users/${user.id}/role`)
      .set('Cookie', admin.cookie)
      .send({ role: 'hr_manager' });

    // The old cookie is now invalid: promoting bumps sessionVersion.
    const stale = await request(app).get('/api/admin/users').set('Cookie', cookie);
    expect(stale.status).toBe(401);

    // A fresh login carries the new role and is admitted to the HR/admin route.
    const freshCookie = await loginUser(user.email);
    const ok = await request(app).get('/api/admin/users').set('Cookie', freshCookie);
    expect(ok.status).toBe(200);
  });
});
