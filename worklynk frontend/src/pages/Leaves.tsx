import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';

interface LeaveRequest {
  _id: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
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
        <span className="capitalize font-medium text-slate-300">{row.type}</span>
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
          {row.managerComment && (
            <span className="text-xs text-slate-500 italic" title={row.managerComment}>
              Commented
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Leave Requests</h1>
            <p className="text-sm text-slate-400 font-medium">
              Submit new leave requests, monitor approvals status, and check your vacation balance.
            </p>
          </div>
          <div>
            <Button variant="primary" onClick={() => setIsRequestModalOpen(true)}>
              Request Leave
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
              <span>Fetching leave ledger...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : leaves.length === 0 ? (
          <div className="glassmorphism rounded-2xl p-12 border border-white/5 text-center space-y-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-400 font-semibold text-sm">No leave requests found.</p>
            <p className="text-xs text-slate-500">Need some rest? Click the "Request Leave" button above to submit a new application.</p>
          </div>
        ) : (
          <div className="glassmorphism rounded-2xl border border-white/5 overflow-hidden">
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
