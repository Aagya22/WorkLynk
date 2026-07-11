import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';

interface UserRecord {
  _id: string;
  email: string;
  role: 'employee' | 'hr_manager' | 'admin';
  isActive: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  createdAt: string;
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
          disabled={processingId === row._id}
          className="px-2 py-1 bg-slate-950 border border-slate-900 focus:border-primary-500/50 text-slate-300 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500/50 cursor-pointer capitalize"
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
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit ${
              row.isActive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
            }`}>
              {row.isActive ? 'Active' : 'Suspended'}
            </span>
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
          </div>
        );
      }
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">User Account Directory</h1>
            <p className="text-sm text-slate-400 font-medium">
              Create credentials, toggle system access status, force password updates, and manage user roles.
            </p>
          </div>
          <div>
            <Button variant="primary" onClick={() => setIsRegisterModalOpen(true)}>
              Register New Account
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 text-slate-400 font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading user directory database...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="glassmorphism rounded-2xl p-12 border border-white/5 text-center text-slate-500 text-xs">
            No system user directory records found.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glassmorphism rounded-2xl border border-white/5 overflow-hidden">
              <Table data={users} columns={columns} />
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/20 p-4 border border-white/5 rounded-2xl">
              <div className="text-xs text-slate-400 font-medium font-sans">
                Showing users <span className="text-slate-200 font-bold">{Math.min(totalRecords, (page - 1) * limit + 1)}</span> to{' '}
                <span className="text-slate-200 font-bold">{Math.min(totalRecords, page * limit)}</span> of{' '}
                <span className="text-slate-200 font-bold">{totalRecords}</span> entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </Button>
                <div className="text-xs text-slate-400 font-medium px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
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
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center">
                {registerError}
              </div>
            )}

            {registerSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-xl text-center">
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
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                System Role Assignment
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                disabled={registerSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-900/60 focus:border-primary-500/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/50"
              >
                <option value="employee" className="bg-slate-950 text-slate-200">Employee</option>
                <option value="hr_manager" className="bg-slate-950 text-slate-200">HR Manager</option>
                <option value="admin" className="bg-slate-950 text-slate-200">Admin</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-900">
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
    </DashboardLayout>
  );
};
