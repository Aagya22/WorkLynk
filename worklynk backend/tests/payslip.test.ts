import request from 'supertest';
import app from '../src/app';
import { connectTestDb, disconnectTestDb, clearTestDb } from './testDb';
import { createUser, createAndLogin, loginUser, type SeedUserOverrides } from './helpers';
import { IUser } from '../src/models/user.model';

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

const validPayslip = (employeeId: unknown) => ({
  employeeId,
  month: '2026-01',
  basicSalary: '4000',
  overtimePay: '250',
  bonus: '100',
  taxDeduction: '500',
  niDeduction: '200',
  otherDeductions: '0',
  notes: 'January pay',
});

// Sets up an HR manager (the payroll owner) plus a target employee, returning
// the HR cookie and the employee document.
async function hrAndEmployee(empOverrides: SeedUserOverrides = {}): Promise<{
  hrCookie: string;
  employee: IUser;
}> {
  const employee = await createUser({ email: 'employee@worklynk.local', ...empOverrides });
  const { cookie: hrCookie } = await createAndLogin({ email: 'hr@worklynk.local', role: 'hr_manager' });
  return { hrCookie, employee };
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

describe('POST /api/payslips — create (real endpoint, no replica set required)', () => {
  it('lets HR create a payslip and computes net salary server-side', async () => {
    const { hrCookie, employee } = await hrAndEmployee();

    const res = await request(app)
      .post('/api/payslips')
      .set('Cookie', hrCookie)
      .send(validPayslip(employee.id));

    expect(res.status).toBe(201);
    expect(res.body.payslip).toBeDefined();
    // 4000 + 250 + 100 - (500 + 200 + 0) = 3650
    expect(res.body.payslip.netSalary).toBe('3650.00');
  });

  it('rejects a second payslip for the same employee and month', async () => {
    const { hrCookie, employee } = await hrAndEmployee();

    const first = await request(app)
      .post('/api/payslips')
      .set('Cookie', hrCookie)
      .send(validPayslip(employee.id));
    expect(first.status).toBe(201);

    const dup = await request(app)
      .post('/api/payslips')
      .set('Cookie', hrCookie)
      .send(validPayslip(employee.id));
    expect(dup.status).toBe(400);
    expect(dup.body.message).toMatch(/already exists/i);
  });

  it('rejects an invalid month format', async () => {
    const { hrCookie, employee } = await hrAndEmployee();
    const res = await request(app)
      .post('/api/payslips')
      .set('Cookie', hrCookie)
      .send({ ...validPayslip(employee.id), month: 'Jan-2026' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/month/i);
  });

  it('rejects negative input values', async () => {
    const { hrCookie, employee } = await hrAndEmployee();
    const res = await request(app)
      .post('/api/payslips')
      .set('Cookie', hrCookie)
      .send({ ...validPayslip(employee.id), bonus: '-50' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/negative/i);
  });

  it('rejects deductions that would make net salary negative', async () => {
    const { hrCookie, employee } = await hrAndEmployee();
    const res = await request(app)
      .post('/api/payslips')
      .set('Cookie', hrCookie)
      .send({
        ...validPayslip(employee.id),
        basicSalary: '100',
        overtimePay: '0',
        bonus: '0',
        taxDeduction: '500',
        niDeduction: '0',
        otherDeductions: '0',
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/net salary cannot be negative/i);
  });
});

describe('POST /api/payslips — separation of duties', () => {
  it('blocks an employee from creating a payslip', async () => {
    const { user, cookie } = await createAndLogin({ email: 'emp@worklynk.local', role: 'employee' });
    const res = await request(app)
      .post('/api/payslips')
      .set('Cookie', cookie)
      .send(validPayslip(user.id));
    expect(res.status).toBe(403);
  });

  it('blocks an admin from creating a payslip (payroll is HR-only)', async () => {
    const employee = await createUser({ email: 'employee@worklynk.local' });
    const { cookie } = await createAndLogin({ email: 'admin@worklynk.local', role: 'admin' });
    const res = await request(app)
      .post('/api/payslips')
      .set('Cookie', cookie)
      .send(validPayslip(employee.id));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/payslips/:id — ownership (IDOR)', () => {
  it('lets the owning employee read and download their own payslip', async () => {
    const { hrCookie, employee } = await hrAndEmployee();
    const created = await request(app)
      .post('/api/payslips')
      .set('Cookie', hrCookie)
      .send(validPayslip(employee.id));
    const slipId = created.body.payslip._id ?? created.body.payslip.id;

    const empCookie = await loginUser(employee.email);

    const view = await request(app).get(`/api/payslips/${slipId}`).set('Cookie', empCookie);
    expect(view.status).toBe(200);

    const pdf = await request(app).get(`/api/payslips/${slipId}/pdf`).set('Cookie', empCookie);
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toMatch(/application\/pdf/);
  });

  it("blocks a different employee from reading someone else's payslip", async () => {
    const { hrCookie, employee } = await hrAndEmployee();
    const created = await request(app)
      .post('/api/payslips')
      .set('Cookie', hrCookie)
      .send(validPayslip(employee.id));
    const slipId = created.body.payslip._id ?? created.body.payslip.id;

    const { cookie: attackerCookie } = await createAndLogin({ email: 'attacker@worklynk.local' });

    const view = await request(app).get(`/api/payslips/${slipId}`).set('Cookie', attackerCookie);
    expect(view.status).toBe(403);

    const pdf = await request(app).get(`/api/payslips/${slipId}/pdf`).set('Cookie', attackerCookie);
    expect(pdf.status).toBe(403);
  });
});

describe('PUT /api/payslips/:id — update', () => {
  it('lets HR correct a payslip within the edit window with a mandatory reason', async () => {
    const { hrCookie, employee } = await hrAndEmployee();
    const created = await request(app)
      .post('/api/payslips')
      .set('Cookie', hrCookie)
      .send(validPayslip(employee.id));
    const slipId = created.body.payslip._id ?? created.body.payslip.id;

    const res = await request(app)
      .put(`/api/payslips/${slipId}`)
      .set('Cookie', hrCookie)
      .send({ basicSalary: '4500', reason: 'Corrected base pay' });

    expect(res.status).toBe(200);
    // 4500 + 250 (kept) + 100 (kept) - (500 + 200 + 0) = 4150
    expect(res.body.payslip.netSalary).toBe('4150.00');
  });

  it('rejects an update without a modification reason', async () => {
    const { hrCookie, employee } = await hrAndEmployee();
    const created = await request(app)
      .post('/api/payslips')
      .set('Cookie', hrCookie)
      .send(validPayslip(employee.id));
    const slipId = created.body.payslip._id ?? created.body.payslip.id;

    const res = await request(app)
      .put(`/api/payslips/${slipId}`)
      .set('Cookie', hrCookie)
      .send({ basicSalary: '4500' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/reason/i);
  });
});
