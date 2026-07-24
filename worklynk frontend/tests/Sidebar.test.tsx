import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../src/components/Sidebar';

function renderSidebar(role: 'employee' | 'hr_manager' | 'admin') {
  return render(
    <MemoryRouter>
      <Sidebar
        user={{ role }}
        logout={vi.fn().mockResolvedValue(undefined)}
        mobileOpen={false}
        setMobileOpen={vi.fn()}
      />
    </MemoryRouter>
  );
}

const has = (name: string) => screen.queryAllByRole('link', { name }).length > 0;

describe('Sidebar role-based navigation', () => {
  it('shows an employee only their own menu, and no HR or admin sections', () => {
    renderSidebar('employee');
    expect(has('Dashboard')).toBe(true);
    expect(has('Payslips')).toBe(true);
    expect(has('Leave Requests')).toBe(true);
    // HR-only and admin-only entries must not be present.
    expect(has('Employee Directory')).toBe(false);
    expect(has('Leave Decisions')).toBe(false);
    expect(has('Manage Users')).toBe(false);
    expect(has('System Logs')).toBe(false);
  });

  it('adds the HR Management section for an HR manager, but no admin section', () => {
    renderSidebar('hr_manager');
    expect(has('Payslips')).toBe(true);
    expect(has('Employee Directory')).toBe(true);
    expect(has('Leave Decisions')).toBe(true);
    expect(has('Manage Users')).toBe(false);
    expect(has('System Logs')).toBe(false);
  });

  it('gives admin the Administration section but excludes payroll and leave', () => {
    renderSidebar('admin');
    expect(has('Manage Users')).toBe(true);
    expect(has('System Logs')).toBe(true);
    // Admin is deliberately kept out of payslips and leave (separation of duties).
    expect(has('Payslips')).toBe(false);
    expect(has('Leave Requests')).toBe(false);
  });
});
