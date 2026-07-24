import request from 'supertest';
import app from '../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from './testDb';
import { createUser, createAndLogin } from './helpers';
import { Profile } from '../src/models/profile.model';
import { Leave } from '../src/models/leave.model';

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

// Seeds a full profile for a user id (encrypted fields go through model setters).
async function seedProfile(userId: unknown) {
  return Profile.create({
    userId,
    fullName: 'Test Person',
    jobTitle: 'Analyst',
    dateOfBirth: '1990-01-01',
    phoneNumber: `+44 7700 9${Math.floor(100000 + Math.random() * 899999)}`,
    emergencyContact: 'Next Of Kin, Sibling, +44 7700 900123',
    salary: '50000',
    bankAccount: 'Sort Code: 11-22-33, Account: 12345678',
    employmentStartDate: new Date('2025-01-01'),
  });
}

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

describe('IDOR on GET /api/profile/:userId', () => {
  it('lets an employee read their own profile (including salary/bank)', async () => {
    const { user, cookie } = await createAndLogin({ email: 'owner@worklynk.local' });
    await seedProfile(user.id);

    const res = await request(app).get(`/api/profile/${user.id}`).set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.profile.salary).toBeDefined();
    expect(res.body.profile.bankAccount).toBeDefined();
  });

  it("blocks an employee from reading another employee's profile", async () => {
    const victim = await createUser({ email: 'victim@worklynk.local' });
    await seedProfile(victim.id);
    const { cookie } = await createAndLogin({ email: 'attacker@worklynk.local' });

    const res = await request(app).get(`/api/profile/${victim.id}`).set('Cookie', cookie);
    expect(res.status).toBe(403);
  });

  it("blocks an employee from updating another employee's profile", async () => {
    const victim = await createUser({ email: 'victim@worklynk.local' });
    await seedProfile(victim.id);
    const { cookie } = await createAndLogin({ email: 'attacker@worklynk.local' });

    const res = await request(app)
      .put(`/api/profile/${victim.id}`)
      .set('Cookie', cookie)
      .send({ fullName: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('still lets HR read any profile', async () => {
    const employee = await createUser({ email: 'employee@worklynk.local' });
    await seedProfile(employee.id);
    const { cookie } = await createAndLogin({ email: 'hr@worklynk.local', role: 'hr_manager' });

    const res = await request(app).get(`/api/profile/${employee.id}`).set('Cookie', cookie);
    expect(res.status).toBe(200);
  });
});

describe('Leave authorization', () => {
  it('blocks an approver from deciding their own leave request', async () => {
    const { user, cookie } = await createAndLogin({
      email: 'hr@worklynk.local',
      role: 'hr_manager',
    });
    const leave = await Leave.create({
      employeeId: user.id,
      leaveType: 'annual',
      startDate: new Date('2027-06-01'),
      endDate: new Date('2027-06-05'),
      reason: 'Holiday',
    });

    const res = await request(app)
      .patch(`/api/leaves/${leave.id}/decision`)
      .set('Cookie', cookie)
      .send({ status: 'approved', decisionComment: 'Looks fine to me' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/your own leave/i);
  });

  it("blocks an employee from cancelling another employee's leave", async () => {
    const victim = await createUser({ email: 'victim@worklynk.local' });
    const leave = await Leave.create({
      employeeId: victim.id,
      leaveType: 'annual',
      startDate: new Date('2027-07-01'),
      endDate: new Date('2027-07-05'),
      reason: 'Holiday',
    });
    const { cookie } = await createAndLogin({ email: 'attacker@worklynk.local' });

    const res = await request(app)
      .post(`/api/leaves/${leave.id}/cancel`)
      .set('Cookie', cookie);

    expect(res.status).toBe(403);
  });

  it('lets the owner cancel their own pending leave', async () => {
    const { user, cookie } = await createAndLogin({ email: 'owner@worklynk.local' });
    const leave = await Leave.create({
      employeeId: user.id,
      leaveType: 'annual',
      startDate: new Date('2027-08-01'),
      endDate: new Date('2027-08-05'),
      reason: 'Holiday',
    });

    const res = await request(app)
      .post(`/api/leaves/${leave.id}/cancel`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.leave.status).toBe('cancelled');
  });
});
