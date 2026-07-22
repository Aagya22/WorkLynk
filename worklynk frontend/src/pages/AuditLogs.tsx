import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatTile } from '../components/Bento';
import { Activity, Clock, ShieldAlert, Users } from 'lucide-react';

interface AuditLogRecord {
  _id: string;
  actionType: string;
  targetResource: string;
  ipAddress: string;
  createdAt: string;
  userAgent?: string;
  metadata?: any;
  userId?: {
    _id: string;
    email: string;
    role: string;
  };
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logFilter, setLogFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 15; // 15 records per page

  const fetchAuditLogs = async (targetPage: number) => {
    try {
      setLoading(true);
      const url = logFilter
        ? `/api/audit-logs?limit=${limit}&page=${targetPage}&actionType=${logFilter}`
        : `/api/audit-logs?limit=${limit}&page=${targetPage}`;
      const response = await api.get(url);
      if (response.data) {
        setLogs(response.data.logs || []);
        if (response.data.pagination) {
          setPage(response.data.pagination.page);
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalRecords(response.data.pagination.total || 0);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1);
  }, [logFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchAuditLogs(newPage);
    }
  };

  const auditColumns = [
    {
      header: 'Timestamp',
      accessor: (row: AuditLogRecord) => new Date(row.createdAt).toLocaleString()
    },
    {
      header: 'Operator',
      accessor: (row: AuditLogRecord) => row.userId?.email || 'System'
    },
    {
      header: 'Action Event',
      accessor: (row: AuditLogRecord) => (
        <span className="font-mono text-xs px-2 py-1 bg-[#F2F1ED] border hairline rounded ink-muted">
          {row.actionType}
        </span>
      )
    },
    {
      header: 'Target Resource',
      accessor: (row: AuditLogRecord) => (
        <span className="ink-muted font-mono text-xs">{row.targetResource}</span>
      )
    },
    {
      header: 'Client IP',
      accessor: (row: AuditLogRecord) => (
        <span className="ink-muted font-mono text-xs">{row.ipAddress}</span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: AuditLogRecord) => (
        <Button variant="secondary" onClick={() => setSelectedLog(row)}>
          Details
        </Button>
      )
    }
  ];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayCount = logs.filter((l) => new Date(l.createdAt) >= startOfToday).length;
  const alertCount = logs.filter((l) => /FAIL|UNAUTHORIZED|HIJACK|LOCK/i.test(l.actionType)).length;
  const actorCount = new Set(logs.map((l) => l.userId?._id).filter(Boolean)).size;

  return (
    <>
      <div className="space-y-8">
        {!loading && !error && (
          <div className="grid gap-5 sm:grid-cols-4">
            <div className="animate-slide-up stagger-1">
              <StatTile label="Events shown" value={logs.length} tone="info" hint="In the current view" icon={<Activity size={16} />} />
            </div>
            <div className="animate-slide-up stagger-2">
              <StatTile label="Today" value={todayCount} tone="violet" hint="Recorded since midnight" icon={<Clock size={16} />} />
            </div>
            <div className="animate-slide-up stagger-3">
              <StatTile
                label="Security alerts"
                value={alertCount}
                tone={alertCount > 0 ? 'critical' : 'positive'}
                hint={alertCount === 0 ? 'Nothing flagged' : 'Failures & denials'}
                icon={<ShieldAlert size={16} />}
              />
            </div>
            <div className="animate-slide-up stagger-4">
              <StatTile label="Unique actors" value={actorCount} tone="positive" hint="Distinct accounts" icon={<Users size={16} />} />
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="flex justify-end">
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="paper cursor-pointer rounded-xl px-3.5 py-2.5 text-[13px] font-medium ink focus:outline-none"
            >
              <option value="">All security events</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
              <option value="SESSION_HIJACK_ATTEMPT">SESSION_HIJACK_ATTEMPT</option>
              <option value="UNAUTHORIZED_ACCESS_ATTEMPT">UNAUTHORIZED_ACCESS_ATTEMPT</option>
              <option value="GDPR_DATA_EXPORT">GDPR_DATA_EXPORT</option>
              <option value="ADMIN_USER_ROLE_UPDATE">ADMIN_USER_ROLE_UPDATE</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 ink-muted font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 ink-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching audit logs...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="paper rounded-2xl p-14 text-center ink-subtle text-sm">
            No matching audit records found.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="paper paper-hover rounded-2xl overflow-hidden">
              <Table data={logs} columns={auditColumns} />
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#FBFAF8] p-4 border hairline rounded-2xl">
              <div className="text-xs ink-muted font-medium font-sans">
                Showing logs <span className="ink font-bold">{Math.min(totalRecords, (page - 1) * limit + 1)}</span> to{' '}
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

        {/* Detailed Metadata Modal */}
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Security Event Details"
        >
          {selectedLog && (
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="ink-subtle block uppercase font-bold tracking-wider">Event ID</span>
                  <span className="ink-muted font-mono">{selectedLog._id}</span>
                </div>
                <div>
                  <span className="ink-subtle block uppercase font-bold tracking-wider">Event Type</span>
                  <span className="ink-muted font-mono">{selectedLog.actionType}</span>
                </div>
                <div>
                  <span className="ink-subtle block uppercase font-bold tracking-wider">Operator</span>
                  <span className="ink-muted">{selectedLog.userId?.email || 'System'}</span>
                </div>
                <div>
                  <span className="ink-subtle block uppercase font-bold tracking-wider">Timestamp</span>
                  <span className="ink-muted">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="ink-subtle block uppercase font-bold tracking-wider">IP Address</span>
                  <span className="ink-muted font-mono">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="ink-subtle block uppercase font-bold tracking-wider">Target Resource</span>
                  <span className="ink-muted font-mono">{selectedLog.targetResource}</span>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <span className="text-xs ink-subtle block uppercase font-bold tracking-wider mb-1">User Agent</span>
                  <p className="p-2.5 bg-[#F7F6F3] border hairline ink-muted font-mono text-xs rounded-xl break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-xs ink-subtle block uppercase font-bold tracking-wider mb-1">Event Metadata</span>
                  <pre className="p-4 bg-[#F7F6F3] border hairline ink-muted font-mono text-xs rounded-xl overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t hairline">
                <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                  Close Details
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};
