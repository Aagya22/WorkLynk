import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Plus, CalendarDays, Clock3, CheckCircle2, XCircle } from 'lucide-react';

interface LeaveRequest {
  _id: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  decisionComment?: string;
  managerComment?: string;
  createdAt: string;
}

export const Leaves: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create leave request state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('annual');
  const [reason, setReason] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cancellation state
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/api/leaves/me');
      if (response.data?.leaves) {
        setLeaves(response.data.leaves);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch leave history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError('');
    setRequestSuccess('');

    if (!startDate || !endDate || !reason) {
      setRequestError('All fields are required.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setRequestError('Start date cannot be in the past.');
      return;
    }

    if (end < start) {
      setRequestError('End date cannot be before the start date.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/leaves', {
        startDate,
        endDate,
        leaveType: type,
        reason
      });

      setRequestSuccess('Leave request submitted successfully.');
      setStartDate('');
      setEndDate('');
      setType('annual');
      setReason('');
      fetchLeaves();
      
      // Auto close modal after brief delay
      setTimeout(() => {
        setIsRequestModalOpen(false);
        setRequestSuccess('');
      }, 1500);
    } catch (err: any) {
      setRequestError(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    setCancellingId(id);
    try {
      await api.post(`/api/leaves/${id}/cancel`);
      fetchLeaves();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel leave request.');
    } finally {
      setCancellingId(null);
    }
  };

  const statusColors = {
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    approved: 'text-green-400 bg-green-500/10 border-green-500/20',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
    cancelled: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  };

  const columns = [
    {
      header: 'Submitted',
      accessor: (row: LeaveRequest) => new Date(row.createdAt).toLocaleDateString()
    },
    {
      header: 'Type',
      accessor: (row: LeaveRequest) => (
        <span className="capitalize font-medium text-slate-300">{(row as any).leaveType || row.type}</span>
      )
    },
    {
      header: 'Duration',
      accessor: (row: LeaveRequest) => {
        const start = new Date(row.startDate).toLocaleDateString();
        const end = new Date(row.endDate).toLocaleDateString();
        return `${start} - ${end}`;
      }
    },
    {
      header: 'Reason',
      accessor: (row: LeaveRequest) => (
        <span className="text-slate-400 max-w-xs truncate block" title={row.reason}>
          {row.reason}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row: LeaveRequest) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[row.status] || ''}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: LeaveRequest) => (
        <div className="flex items-center space-x-3">
          {row.status === 'pending' && (
            <Button
              variant="secondary"
              onClick={() => handleCancelLeave(row._id)}
              loading={cancellingId === row._id}
            >
              Cancel
            </Button>
          )}
          {row.decisionComment && (
            <span className="text-xs text-slate-500 italic" title={row.decisionComment}>
              Comment: {row.decisionComment}
            </span>
          )}
        </div>
      )
    }
  ];

  const summary = [
    { label: 'Total Requests', value: leaves.length, icon: CalendarDays, color: '#4F8CFF' },
    { label: 'Pending', value: leaves.filter((l) => l.status === 'pending').length, icon: Clock3, color: '#F59E0B' },
    { label: 'Approved', value: leaves.filter((l) => l.status === 'approved').length, icon: CheckCircle2, color: '#22C55E' },
    { label: 'Rejected', value: leaves.filter((l) => l.status === 'rejected').length, icon: XCircle, color: '#EF4444' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <div className="animate-slide-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-accent-500/20 bg-accent-500/10 text-accent-400 shadow-glow">
              <CalendarDays size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Leave Requests</h1>
              <p className="text-sm font-medium text-slate-400">
                Submit requests, track approvals, and keep an eye on your balance.
              </p>
            </div>
          </div>
          <Button variant="primary" onClick={() => setIsRequestModalOpen(true)}>
            <span className="flex items-center gap-2">
              <Plus size={16} />
              Request Leave
            </span>
          </Button>
        </div>

        {!loading && !error && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {summary.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className={`animate-slide-up stagger-${i + 1} group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1326] p-4 transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.color }} />
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">{s.value}</span>
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${s.color}1A`, color: s.color }}
                    >
                      <Icon size={17} />
                    </div>
                  </div>
                  <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 text-slate-400 font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching leave ledger...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : leaves.length === 0 ? (
          <div className="animate-fade-in flex flex-col items-center space-y-4 rounded-2xl border border-white/[0.08] bg-[#0D1326] p-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-500/20 bg-accent-500/10 text-accent-400">
              <CalendarDays size={28} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-200">No leave requests yet</p>
              <p className="mx-auto max-w-sm text-xs text-slate-500">
                Need some rest? Submit your first application and track its approval right here.
              </p>
            </div>
            <Button variant="primary" onClick={() => setIsRequestModalOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus size={16} />
                Request Leave
              </span>
            </Button>
          </div>
        ) : (
          <div className="animate-slide-up stagger-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1326] shadow-xl">
            <Table data={leaves} columns={columns} />
          </div>
        )}

        {/* Request Leave Modal */}
        <Modal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          title="Submit Leave Request"
        >
          <form onSubmit={handleRequestLeave} className="space-y-4">
            {requestError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center">
                {requestError}
              </div>
            )}

            {requestSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-xl text-center">
                {requestSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="start-date"
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={submitting}
              />

              <Input
                id="end-date"
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Leave Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-900/60 focus:border-primary-500/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/50"
              >
                <option value="annual" className="bg-slate-950 text-slate-200">Annual Leave (Vacation)</option>
                <option value="sick" className="bg-slate-950 text-slate-200">Sick Leave</option>
                <option value="emergency" className="bg-slate-950 text-slate-200">Emergency Leave</option>
                <option value="unpaid" className="bg-slate-950 text-slate-200">Unpaid Leave</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Reason / Details
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                disabled={submitting}
                rows={3}
                placeholder="Please describe the reason for your leave request..."
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-900/60 focus:border-primary-500/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/50 placeholder-slate-600"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-900">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Submit Application
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
