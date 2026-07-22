import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatTile } from '../components/Bento';
import { Clock3, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';

interface LeaveRequest {
  _id: string;
  startDate: string;
  endDate: string;
  type?: string;
  leaveType?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  decisionComment?: string | null;
  decidedAt?: string | null;
  decidedBy?: { _id: string; email: string; role: string } | null;
  employeeId: {
    _id: string;
    email: string;
    role?: string;
  };
  createdAt: string;
}

const roleLabels: Record<string, string> = { employee: 'Employee', hr_manager: 'HR Manager', admin: 'Administrator' };

export const HrLeaveApprovals: React.FC = () => {
  const { user } = useAuth();
  const currentRole = user?.role;
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Decision processing states
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [modalError, setModalError] = useState('');

  // Pagination and filtering states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'decided'>('all');
  const limit = 10;

  const fetchAllLeaves = async (targetPage: number = 1) => {
    try {
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const response = await api.get(`/api/leaves?limit=${limit}&page=${targetPage}${statusParam}`);
      if (response.data) {
        setLeaves(response.data.leaves || []);
        if (response.data.pagination) {
          setPage(response.data.pagination.page);
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalRecords(response.data.pagination.total || 0);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve leave requests database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLeaves(1);
  }, [statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchAllLeaves(newPage);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave || !decision) return;
    
    setModalError('');
    if (!comment.trim()) {
      setModalError('A decision explanation comment is required.');
      return;
    }

    setProcessing(true);
    try {
      await api.patch(`/api/leaves/${selectedLeave._id}/decision`, {
        status: decision,
        decisionComment: comment
      });

      // Reset modal state & reload
      setSelectedLeave(null);
      setDecision(null);
      setComment('');
      fetchAllLeaves(page);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to submit leave request decision.');
    } finally {
      setProcessing(false);
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
      header: 'Employee',
      accessor: (row: LeaveRequest) => (
        <span className="flex items-center gap-2">
          <span className="truncate">{row.employeeId?.email || 'N/A'}</span>
          {row.employeeId?.role === 'hr_manager' && (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">HR</span>
          )}
        </span>
      )
    },
    {
      header: 'Type',
      accessor: (row: LeaveRequest) => (
        <span className="capitalize font-medium ink-muted">{row.type || (row as any).leaveType}</span>
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
      header: 'Decision',
      accessor: (row: LeaveRequest) => {
        if (row.status === 'pending') {
          const isHrRequest = row.employeeId?.role === 'hr_manager';
          const canAct = !isHrRequest || currentRole === 'admin';
          if (!canAct) {
            return <span className="text-xs font-semibold text-amber-800">Requires admin approval</span>;
          }
          return (
            <div className="flex items-center space-x-2">
              <Button variant="primary" onClick={() => { setSelectedLeave(row); setDecision('approved'); }}>
                Approve
              </Button>
              <Button variant="secondary" onClick={() => { setSelectedLeave(row); setDecision('rejected'); }}>
                Reject
              </Button>
            </div>
          );
        }

        if (row.status === 'approved' || row.status === 'rejected') {
          return (
            <div className="flex flex-col">
              <span className="text-xs ink-muted">
                {row.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                <span className="font-semibold ink">{row.decidedBy?.email || 'Unknown'}</span>
                {row.decidedBy?.role ? ` · ${roleLabels[row.decidedBy.role] || row.decidedBy.role}` : ''}
              </span>
              {row.decisionComment && (
                <span className="max-w-[220px] truncate text-[11px] italic ink-subtle" title={row.decisionComment}>
                  "{row.decisionComment}"
                </span>
              )}
            </div>
          );
        }

        return <span className="text-xs ink-subtle">-</span>;
      }
    }
  ];

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length;
  const pendingDays = leaves
    .filter((l) => l.status === 'pending')
    .reduce((sum, l) => sum + Math.max(1, Math.round((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / 86400000) + 1), 0);

  return (
    <>
      <div className="space-y-8">
        {!loading && !error && (
          <div className="grid gap-5 sm:grid-cols-4">
            <div className="animate-slide-up stagger-1">
              <StatTile
                label="Awaiting review"
                value={pendingCount}
                tone={pendingCount > 0 ? 'warning' : 'positive'}
                hint={pendingCount === 0 ? 'Queue is clear' : 'Needs a decision'}
                icon={<Clock3 size={16} />}
              />
            </div>
            <div className="animate-slide-up stagger-2">
              <StatTile label="Approved" value={approvedCount} tone="positive" hint="Signed off" icon={<CheckCircle2 size={16} />} />
            </div>
            <div className="animate-slide-up stagger-3">
              <StatTile label="Rejected" value={rejectedCount} tone="critical" hint="Declined requests" icon={<XCircle size={16} />} />
            </div>
            <div className="animate-slide-up stagger-4">
              <StatTile label="Days requested" value={pendingDays} tone="violet" hint="Across pending requests" icon={<CalendarDays size={16} />} />
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="flex justify-end">
            <div className="paper flex items-center gap-1 rounded-xl p-1">
              {(['all', 'pending', 'decided'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold capitalize transition-all duration-200 ${
                    statusFilter === f ? 'bg-[#1C1917] text-white' : 'ink-muted hover:bg-[#F2F1ED]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 ink-muted font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 ink-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching leave applications...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : leaves.length === 0 ? (
          <div className="paper rounded-2xl p-16 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-3 bg-[#F2F1ED] border hairline rounded-2xl ink-subtle">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="ink-muted font-bold text-base">All Caught Up!</p>
              <p className="text-xs ink-subtle max-w-sm">
                No leave requests found matching the "{statusFilter}" filter selection.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="paper paper-hover rounded-2xl overflow-hidden">
              <Table data={leaves} columns={columns} />
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#FBFAF8] p-4 border hairline rounded-2xl">
              <div className="text-xs ink-muted font-medium font-sans">
                Showing leaves <span className="ink font-bold">{Math.min(totalRecords, (page - 1) * limit + 1)}</span> to{' '}
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

        {/* Process Leave Decision Modal */}
        <Modal
          isOpen={!!selectedLeave}
          onClose={() => {
            setSelectedLeave(null);
            setDecision(null);
            setComment('');
          }}
          title={decision === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
        >
          {selectedLeave && (
            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                  {modalError}
                </div>
              )}

              <div className="bg-[#F7F6F3] p-4 rounded-xl border hairline space-y-2.5 text-sm ink-muted">
                <div>
                  <span className="text-xs ink-subtle block">Applicant:</span>
                  <strong className="ink">{selectedLeave.employeeId?.email}</strong>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs ink-subtle block">Start Date:</span>
                    <strong>{new Date(selectedLeave.startDate).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-xs ink-subtle block">End Date:</span>
                    <strong>{new Date(selectedLeave.endDate).toLocaleDateString()}</strong>
                  </div>
                </div>
                <div>
                  <span className="text-xs ink-subtle block">Leave Reason:</span>
                  <p className="text-xs ink-muted italic font-mono p-2 bg-[#F2F1ED] border hairline/80 rounded-md mt-1">
                    "{selectedLeave.reason}"
                  </p>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider ink-subtle">
                  Decision Comment (Mandatory)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  disabled={processing}
                  rows={3}
                  placeholder="Explain the rationale for this leave decision..."
                  className="w-full px-4 py-2.5 bg-[#F7F6F3] border hairline focus:border-[rgba(28,25,23,0.25)] ink rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(28,25,23,0.10)] placeholder-[#A8A29E]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t hairline">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setSelectedLeave(null);
                    setDecision(null);
                    setComment('');
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  loading={processing}
                >
                  {decision === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </>
  );
};
