import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { StatTile } from '../components/Bento';
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
    pending: 'text-amber-800 bg-amber-50 border-amber-200',
    approved: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    rejected: 'text-red-700 bg-red-50 border-red-200',
    cancelled: 'ink-muted bg-[#F2F1ED] hairline'
  };

  const columns = [
    {
      header: 'Submitted',
      accessor: (row: LeaveRequest) => new Date(row.createdAt).toLocaleDateString()
    },
    {
      header: 'Type',
      accessor: (row: LeaveRequest) => (
        <span className="capitalize font-medium ink-muted">{(row as any).leaveType || row.type}</span>
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
        <span className="ink-muted max-w-xs truncate block" title={row.reason}>
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
            <span className="text-xs ink-subtle italic" title={row.decisionComment}>
              Comment: {row.decisionComment}
            </span>
          )}
        </div>
      )
    }
  ];

  const summary: Array<{ label: string; value: number; icon: any; tone: 'info' | 'positive' | 'warning' | 'critical' }> = [
    { label: 'Total requests', value: leaves.length, icon: CalendarDays, tone: 'info' },
    { label: 'Pending', value: leaves.filter((l) => l.status === 'pending').length, icon: Clock3, tone: 'warning' },
    { label: 'Approved', value: leaves.filter((l) => l.status === 'approved').length, icon: CheckCircle2, tone: 'positive' },
    { label: 'Rejected', value: leaves.filter((l) => l.status === 'rejected').length, icon: XCircle, tone: 'critical' },
  ];

  return (
    <>
      <div className="space-y-7">
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {summary.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`animate-slide-up stagger-${i + 1}`}>
                  <StatTile label={s.label} value={s.value} tone={s.tone} icon={<Icon size={16} />} />
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && (
          <div className="flex justify-end">
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#2B2724]"
            >
              <Plus size={15} /> Request leave
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 ink-muted font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 ink-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching leave ledger...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : leaves.length === 0 ? (
          <div className="paper animate-fade-in flex flex-col items-center space-y-4 rounded-2xl p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2F1ED]">
              <CalendarDays size={24} className="ink-muted" />
            </div>
            <div className="space-y-1">
              <p className="text-[15px] font-bold ink">No leave requests yet</p>
              <p className="mx-auto max-w-sm text-[13px] ink-muted">
                Need some rest? Submit your first application and track its approval right here.
              </p>
            </div>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#2B2724]"
            >
              <Plus size={15} /> Request leave
            </button>
          </div>
        ) : (
          <div className="paper paper-hover animate-slide-up stagger-4 overflow-hidden rounded-2xl">
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
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                {requestError}
              </div>
            )}

            {requestSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl text-center">
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
              <label className="text-xs font-semibold uppercase tracking-wider ink-subtle">
                Leave Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-2.5 bg-[#F7F6F3] border hairline focus:border-[rgba(28,25,23,0.25)] ink rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(28,25,23,0.10)]"
              >
                <option value="annual" className="bg-[#F7F6F3] ink">Annual Leave (Vacation)</option>
                <option value="sick" className="bg-[#F7F6F3] ink">Sick Leave</option>
                <option value="emergency" className="bg-[#F7F6F3] ink">Emergency Leave</option>
                <option value="unpaid" className="bg-[#F7F6F3] ink">Unpaid Leave</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider ink-subtle">
                Reason / Details
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                disabled={submitting}
                rows={3}
                placeholder="Please describe the reason for your leave request..."
                className="w-full px-4 py-2.5 bg-[#F7F6F3] border hairline focus:border-[rgba(28,25,23,0.25)] ink rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(28,25,23,0.10)] placeholder-[#A8A29E]"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t hairline">
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
    </>
  );
};
