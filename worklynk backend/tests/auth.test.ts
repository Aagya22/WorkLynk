import request from 'supertest';
import app from '../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from './testDb';
import { createUser, getCaptcha, TEST_PASSWORD } from './helpers';

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

// Silence the SMTP alert path (lockout emails etc.); it is exercised elsewhere.
jest.mock('../src/utils/email', () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
  sendSecurityAlertEmail: jest.fn().mockResolvedValue(undefined),
}));

const EMAIL = 'auth.user@worklynk.local';

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

describe('POST /api/auth/register-self', () => {
  it('accepts a valid self-registration with a generic response', async () => {
    const { captchaText, captchaKey } = await getCaptcha();
    const res = await request(app)
      .post('/api/auth/register-self')
      .send({ email: 'newbie@worklynk.local', password: TEST_PASSWORD, captchaText, captchaKey });

    expect(res.status).toBe(201);
    // No user object is echoed back, and the copy is intentionally non-committal.
    expect(res.body.user).toBeUndefined();
    expect(res.body.message).toMatch(/registration request received/i);
  });

  it('rejects a weak password before any account is created', async () => {
    const { captchaText, captchaKey } = await getCaptcha();
    const res = await request(app)
      .post('/api/auth/register-self')
      .send({ email: 'weak@worklynk.local', password: 'weak', captchaText, captchaKey });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/12 characters/i);
  });

  it('returns the same generic response for an already-registered email (no enumeration)', async () => {
    await createUser({ email: EMAIL });

    const { captchaText, captchaKey } = await getCaptcha();
    const res = await request(app)
      .post('/api/auth/register-self')
      .send({ email: EMAIL, password: TEST_PASSWORD, captchaText, captchaKey });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registration request received/i);
  });

  it('rejects a reused single-use CAPTCHA', async () => {
    const { captchaText, captchaKey } = await getCaptcha();

    const first = await request(app)
      .post('/api/auth/register-self')
      .send({ email: 'first@worklynk.local', password: TEST_PASSWORD, captchaText, captchaKey });
    expect(first.status).toBe(201);

    const replay = await request(app)
      .post('/api/auth/register-self')
      .send({ email: 'second@worklynk.local', password: TEST_PASSWORD, captchaText, captchaKey });
    expect(replay.status).toBe(400);
    expect(replay.body.message).toMatch(/already been used/i);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await createUser({ email: EMAIL });
  });

  it('rejects the wrong password with a generic message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'WrongPassword1!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  it('rejects an unknown email with the identical message (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@worklynk.local', password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  it('logs in and sets HttpOnly, SameSite=Strict session cookies', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];

    const access = cookies.find((c) => c.startsWith('accessToken='));
    const refresh = cookies.find((c) => c.startsWith('refreshToken='));
    expect(access).toBeDefined();
    expect(refresh).toBeDefined();
    expect(access).toContain('HttpOnly');
    expect(access).toMatch(/SameSite=Strict/i);
    expect(refresh).toContain('HttpOnly');
  });

  it('rejects a NoSQL operator-injection payload on the credential fields', async () => {
    // Without the isValidString type-guard, { $ne: null } would match any user.
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('locks the account after 12 failed attempts, even with the correct password afterwards', async () => {
    for (let i = 0; i < 12; i++) {
      // eslint-disable-next-line no-await-in-loop
      await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: 'WrongPassword1!' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/locked/i);
  });
});
