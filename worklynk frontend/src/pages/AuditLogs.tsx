import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

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

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const url = logFilter ? `/api/audit-logs?limit=50&actionType=${logFilter}` : '/api/audit-logs?limit=50';
      const response = await api.get(url);
      if (response.data?.logs) {
        setLogs(response.data.logs);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [logFilter]);

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
        <span className="font-mono text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300">
          {row.actionType}
        </span>
      )
    },
    {
      header: 'Target Resource',
      accessor: (row: AuditLogRecord) => (
        <span className="text-slate-400 font-mono text-xs">{row.targetResource}</span>
      )
    },
    {
      header: 'Client IP',
      accessor: (row: AuditLogRecord) => (
        <span className="text-slate-400 font-mono text-xs">{row.ipAddress}</span>
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Immutable Security Audit Logs</h1>
            <p className="text-sm text-slate-400 font-medium font-sans">
              Review history of critical activities, logs access, and unauthorized attempts.
            </p>
          </div>
          
          <select
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-900 focus:border-primary-500/50 text-slate-400 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500/50 cursor-pointer h-fit w-fit"
          >
            <option value="">All Security Events</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
            <option value="SESSION_HIJACK_ATTEMPT">SESSION_HIJACK_ATTEMPT</option>
            <option value="UNAUTHORIZED_ACCESS_ATTEMPT">UNAUTHORIZED_ACCESS_ATTEMPT</option>
            <option value="GDPR_DATA_EXPORT">GDPR_DATA_EXPORT</option>
            <option value="ADMIN_USER_ROLE_UPDATE">ADMIN_USER_ROLE_UPDATE</option>
          </select>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 text-slate-400 font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching audit logs...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="glassmorphism rounded-2xl p-12 border border-white/5 text-center text-slate-500 text-sm">
            No matching audit records found.
          </div>
        ) : (
          <div className="glassmorphism rounded-2xl border border-white/5 overflow-hidden">
            <Table data={logs} columns={auditColumns} />
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
                  <span className="text-slate-500 block uppercase font-bold tracking-wider">Event ID</span>
                  <span className="text-slate-300 font-mono">{selectedLog._id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold tracking-wider">Event Type</span>
                  <span className="text-slate-300 font-mono">{selectedLog.actionType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold tracking-wider">Operator</span>
                  <span className="text-slate-300">{selectedLog.userId?.email || 'System'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold tracking-wider">Timestamp</span>
                  <span className="text-slate-300">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold tracking-wider">IP Address</span>
                  <span className="text-slate-300 font-mono">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold tracking-wider">Target Resource</span>
                  <span className="text-slate-300 font-mono">{selectedLog.targetResource}</span>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider mb-1">User Agent</span>
                  <p className="p-2.5 bg-slate-950/60 border border-slate-900 text-slate-400 font-mono text-xs rounded-xl break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider mb-1">Event Metadata</span>
                  <pre className="p-4 bg-slate-950/60 border border-slate-900 text-slate-300 font-mono text-xs rounded-xl overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-900">
                <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                  Close Details
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};
