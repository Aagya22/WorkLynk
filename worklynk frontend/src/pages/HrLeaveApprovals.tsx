import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

interface LeaveRequest {
  _id: string;
  startDate: string;
  endDate: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  managerComment?: string;
  employeeId: {
    _id: string;
    email: string;
  };
  createdAt: string;
}

export const HrLeaveApprovals: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Decision processing states
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [modalError, setModalError] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  const fetchAllLeaves = async (targetPage: number = 1) => {
    try {
      const response = await api.get(`/api/leaves?limit=${limit}&page=${targetPage}`);
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
  }, []);

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
      fetchAllLeaves();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to submit leave request decision.');
    } finally {
      setProcessing(false);
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
      header: 'Employee',
      accessor: (row: LeaveRequest) => row.employeeId?.email || 'N/A'
    },
    {
      header: 'Type',
      accessor: (row: LeaveRequest) => (
        <span className="capitalize font-medium text-slate-300">{row.type || (row as any).leaveType}</span>
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
          {row.status === 'pending' ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedLeave(row);
                  setDecision('approved');
                }}
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedLeave(row);
                  setDecision('rejected');
                }}
              >
                Reject
              </Button>
            </div>
          ) : row.managerComment ? (
            <span className="text-xs text-slate-500 italic max-w-xs truncate block" title={row.managerComment}>
              Comment: {row.managerComment}
            </span>
          ) : (
            <span className="text-xs text-slate-600">Decision completed</span>
          )}
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Leave Approvals Center</h1>
          <p className="text-sm text-slate-400 font-medium">
            Review submitted leave requests, write assessment comments, and grant or deny time-off requests.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 text-slate-400 font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching leave applications...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : leaves.length === 0 ? (
          <div className="glassmorphism rounded-2xl p-12 border border-white/5 text-center text-slate-500 text-xs">
            No active or historical leave records found in database.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glassmorphism rounded-2xl border border-white/5 overflow-hidden">
              <Table data={leaves} columns={columns} />
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/20 p-4 border border-white/5 rounded-2xl">
              <div className="text-xs text-slate-400 font-medium font-sans">
                Showing leaves <span className="text-slate-200 font-bold">{Math.min(totalRecords, (page - 1) * limit + 1)}</span> to{' '}
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
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center">
                  {modalError}
                </div>
              )}

              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/50 space-y-2.5 text-sm text-slate-300">
                <div>
                  <span className="text-xs text-slate-500 block">Applicant:</span>
                  <strong className="text-slate-200">{selectedLeave.employeeId?.email}</strong>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Start Date:</span>
                    <strong>{new Date(selectedLeave.startDate).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">End Date:</span>
                    <strong>{new Date(selectedLeave.endDate).toLocaleDateString()}</strong>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Leave Reason:</span>
                  <p className="text-xs text-slate-400 italic font-mono p-2 bg-slate-900 border border-slate-800/80 rounded-md mt-1">
                    "{selectedLeave.reason}"
                  </p>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Decision Comment (Mandatory)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  disabled={processing}
                  rows={3}
                  placeholder="Explain the rationale for this leave decision..."
                  className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-900/60 focus:border-primary-500/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/50 placeholder-slate-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-900">
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
    </DashboardLayout>
  );
};
