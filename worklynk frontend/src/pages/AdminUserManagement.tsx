import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { StatTile } from '../components/Bento';
import { Users, UserCheck, Lock, ShieldCheck } from 'lucide-react';

interface UserRecord {
  _id: string;
  email: string;
  role: 'employee' | 'hr_manager' | 'admin';
  isActive: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  createdAt: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Register user states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employee' | 'hr_manager' | 'admin'>('employee');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  // Manage user states
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  const fetchUsers = async (targetPage: number = 1) => {
    try {
      const response = await api.get(`/api/admin/users?limit=${limit}&page=${targetPage}`);
      if (response.data) {
        setUsers(response.data.users || []);
        if (response.data.pagination) {
          setPage(response.data.pagination.page);
          setTotalPages(response.data.pagination.pages || 1);
          setTotalRecords(response.data.pagination.total || 0);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user records directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchUsers(newPage);
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    if (!email || !password || !role) {
      setRegisterError('All registration fields are required.');
      return;
    }

    setRegisterSubmitting(true);
    try {
      await api.post('/api/auth/register', {
        email,
        password,
        role
      });

      setRegisterSuccess('User registered successfully.');
      setEmail('');
      setPassword('');
      setRole('employee');
      fetchUsers(1);

      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegisterSuccess('');
      }, 1500);
    } catch (err: any) {
      setRegisterError(err.response?.data?.message || 'Failed to register new account credentials.');
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this user account?`)) return;
    setProcessingId(id);
    try {
      await api.put(`/api/admin/users/${id}/status`, { isActive: !currentStatus });
      fetchUsers(page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user account status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReviewApproval = async (id: string, status: 'approved' | 'rejected') => {
    if (!window.confirm(`Are you sure you want to ${status} this user registration?`)) return;
    setProcessingId(id);
    try {
      await api.put(`/api/admin/users/${id}/approval`, { status });
      fetchUsers(page);
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${status} user registration request.`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    setProcessingId(id);
    try {
      await api.put(`/api/admin/users/${id}/role`, { role: newRole });
      fetchUsers(page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user role assignment.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleForceUnlock = async (id: string) => {
    setProcessingId(id);
    try {
      await api.post(`/api/admin/users/${id}/unlock`);
      alert('User login attempts have been reset and account unlocked.');
      fetchUsers(page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unlock user account.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleForcePasswordReset = async (id: string) => {
    if (!window.confirm('This will immediately expire the user\'s password. They will be forced to choose a new password upon their next login. Proceed?')) return;
    setProcessingId(id);
    try {
      await api.post(`/api/admin/users/${id}/force-password-reset`);
      alert('Force password reset triggered successfully.');
      fetchUsers(page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to trigger password reset.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetMfa = async (id: string) => {
    if (!window.confirm('Reset this user\'s two-factor authentication? They will need to set it up again from their profile. Use this to rescue a user who lost their authenticator.')) return;
    setProcessingId(id);
    try {
      await api.post(`/api/admin/users/${id}/reset-mfa`);
      alert('User MFA has been reset.');
      fetchUsers(page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset user MFA.');
    } finally {
      setProcessingId(null);
    }
  };

  const columns = [
    {
      header: 'Account Email',
      accessor: (row: UserRecord) => row.email
    },
    {
      header: 'Role Privilege',
      accessor: (row: UserRecord) => (
        <select
          value={row.role}
          onChange={(e) => handleChangeRole(row._id, e.target.value)}
          disabled={processingId === row._id || row.approvalStatus === 'pending'}
          className="px-2 py-1 bg-[#F7F6F3] border hairline focus:border-[rgba(28,25,23,0.25)] ink-muted text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[rgba(28,25,23,0.10)] cursor-pointer capitalize disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="employee">Employee</option>
          <option value="hr_manager">HR Manager</option>
          <option value="admin">Admin</option>
        </select>
      )
    },
    {
      header: 'Status',
      accessor: (row: UserRecord) => {
        const isLocked = row.lockedUntil && new Date(row.lockedUntil) > new Date();
        return (
          <div className="flex flex-col space-y-1">
            {row.approvalStatus === 'pending' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 w-fit">
                Pending Approval
              </span>
            ) : row.approvalStatus === 'rejected' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 w-fit">
                Rejected
              </span>
            ) : (
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit ${
                row.isActive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              }`}>
                {row.isActive ? 'Active' : 'Suspended'}
              </span>
            )}
            {isLocked && (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 w-fit">
                LOCKED
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Actions Control',
      accessor: (row: UserRecord) => {
        const isLocked = row.lockedUntil && new Date(row.lockedUntil) > new Date();
        
        if (row.approvalStatus === 'pending') {
          return (
            <div className="flex items-center space-x-2">
              <Button
                variant="primary"
                onClick={() => handleReviewApproval(row._id, 'approved')}
                disabled={processingId === row._id}
                className="!bg-green-600 hover:!bg-green-700 text-white border-transparent"
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleReviewApproval(row._id, 'rejected')}
                disabled={processingId === row._id}
                className="!bg-red-950/40 hover:!bg-red-900/60 border-red-200 text-red-700"
              >
                Reject
              </Button>
            </div>
          );
        }

        return (
          <div className="flex items-center space-x-2">
            <Button
              variant={row.isActive ? 'secondary' : 'primary'}
              onClick={() => handleToggleStatus(row._id, row.isActive)}
              disabled={processingId === row._id}
            >
              {row.isActive ? 'Suspend' : 'Activate'}
            </Button>
            {isLocked && (
              <Button
                variant="primary"
                onClick={() => handleForceUnlock(row._id)}
                disabled={processingId === row._id}
              >
                Force Unlock
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => handleForcePasswordReset(row._id)}
              disabled={processingId === row._id}
            >
              Reset PW
            </Button>
            {(row as any).mfaEnabled && (
              <Button
                variant="secondary"
                onClick={() => handleResetMfa(row._id)}
                disabled={processingId === row._id}
              >
                Reset MFA
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  const activeCount = users.filter((u) => u.isActive).length;
  const lockedCount = users.filter((u) => u.lockedUntil && new Date(u.lockedUntil) > new Date()).length;
  const privilegedCount = users.filter((u) => u.role === 'admin' || u.role === 'hr_manager').length;

  return (
    <>
      <div className="space-y-8">
        {!loading && !error && (
          <div className="grid gap-5 sm:grid-cols-4">
            <div className="animate-slide-up stagger-1">
              <StatTile label="Accounts" value={users.length} tone="info" hint="Total registered" icon={<Users size={16} />} />
            </div>
            <div className="animate-slide-up stagger-2">
              <StatTile label="Active" value={activeCount} tone="positive" hint="Able to sign in" icon={<UserCheck size={16} />} />
            </div>
            <div className="animate-slide-up stagger-3">
              <StatTile
                label="Locked"
                value={lockedCount}
                tone={lockedCount > 0 ? 'critical' : 'positive'}
                hint={lockedCount === 0 ? 'No lockouts' : 'Awaiting unlock'}
                icon={<Lock size={16} />}
              />
            </div>
            <div className="animate-slide-up stagger-4">
              <StatTile label="Privileged" value={privilegedCount} tone="violet" hint="Admin & HR roles" icon={<ShieldCheck size={16} />} />
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setIsRegisterModalOpen(true)}>
              Register New Account
            </Button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 ink-muted font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 ink-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading user directory database...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="paper rounded-2xl p-14 text-center ink-subtle text-xs">
            No system user directory records found.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="paper paper-hover rounded-2xl overflow-hidden">
              <Table data={users} columns={columns} />
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#FBFAF8] p-4 border hairline rounded-2xl">
              <div className="text-xs ink-muted font-medium font-sans">
                Showing users <span className="ink font-bold">{Math.min(totalRecords, (page - 1) * limit + 1)}</span> to{' '}
                <span className="ink font-bold">{Math.min(totalRecords, page * limit)}</span> of{' '}
                <span className="ink font-bold">{totalRecords}</span> entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </Button>
                <div className="text-xs ink-muted font-medium px-4 py-2 bg-[#F2F1ED] border hairline rounded-xl">
                  Page {page} / {totalPages}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Register New User Modal */}
        <Modal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          title="Register New Account Credentials"
        >
          <form onSubmit={handleRegisterUser} className="space-y-4">
            {registerError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                {registerError}
              </div>
            )}

            {registerSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl text-center">
                {registerSuccess}
              </div>
            )}

            <Input
              id="reg-email"
              label="Email Address"
              type="email"
              placeholder="e.g. employee@worklynk.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={registerSubmitting}
            />

            <Input
              id="reg-password"
              label="Initial Password"
              type="password"
              placeholder="Minimum 12 chars, upper, lower, number, symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={registerSubmitting}
            />

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider ink-subtle">
                System Role Assignment
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                disabled={registerSubmitting}
                className="w-full px-4 py-2.5 bg-[#F7F6F3] border hairline focus:border-[rgba(28,25,23,0.25)] ink rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(28,25,23,0.10)]"
              >
                <option value="employee" className="bg-[#F7F6F3] ink">Employee</option>
                <option value="hr_manager" className="bg-[#F7F6F3] ink">HR Manager</option>
                <option value="admin" className="bg-[#F7F6F3] ink">Admin</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t hairline">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                disabled={registerSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={registerSubmitting}>
                Register Account
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
};
