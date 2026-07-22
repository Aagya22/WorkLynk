import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatTile } from '../components/Bento';
import { FileText, Wallet, CalendarClock, TrendingUp } from 'lucide-react';

interface Payslip {
  _id: string;
  month: string;
  basicSalary: string;
  overtimePay: string;
  bonus: string;
  taxDeduction: string;
  niDeduction: string;
  otherDeductions: string;
  netSalary: string;
  notes?: string;
}

export const Payslips: React.FC = () => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchPayslips = async () => {
    try {
      const response = await api.get('/api/payslips');
      if (response.data?.payslips) {
        setPayslips(response.data.payslips);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payslips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleDownloadPDF = async (id: string, month: string) => {
    setDownloadingId(id);
    try {
      const response = await api.get(`/api/payslips/${id}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download payslip PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    {
      header: 'Month',
      accessor: (row: Payslip) => {
        const [year, month] = row.month.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
      }
    },
    {
      header: 'Gross Salary',
      accessor: (row: Payslip) => {
        const gross = parseFloat(row.basicSalary) + parseFloat(row.overtimePay) + parseFloat(row.bonus);
        return `Rs. ${gross.toFixed(2)}`;
      }
    },
    {
      header: 'Deductions',
      accessor: (row: Payslip) => {
        const ded = parseFloat(row.taxDeduction) + parseFloat(row.niDeduction) + parseFloat(row.otherDeductions);
        return `Rs. ${ded.toFixed(2)}`;
      }
    },
    {
      header: 'Net Pay',
      accessor: (row: Payslip) => (
        <span className="font-bold text-emerald-700">Rs. {parseFloat(row.netSalary).toFixed(2)}</span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: Payslip) => (
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={() => setSelectedPayslip(row)}>
            View Breakdown
          </Button>
          <Button
            variant="primary"
            onClick={() => handleDownloadPDF(row._id, row.month)}
            loading={downloadingId === row._id}
          >
            Download PDF
          </Button>
        </div>
      )
    }
  ];

  const latest = payslips[0];
  const latestLabel = latest
    ? (() => {
        const [year, month] = latest.month.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('default', { month: 'long', year: 'numeric' });
      })()
    : null;

  const thisYear = String(new Date().getFullYear());
  const ytd = payslips.filter((p) => p.month.startsWith(thisYear));
  const ytdNet = ytd.reduce((sum, p) => sum + (parseFloat(p.netSalary) || 0), 0);
  const ytdCount = ytd.length;
  const latestDeductions = latest
    ? (parseFloat(latest.taxDeduction) || 0) + (parseFloat(latest.niDeduction) || 0) + (parseFloat(latest.otherDeductions) || 0)
    : 0;

  return (
    <>
      <div className="space-y-7">

        {!loading && !error && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="animate-slide-up stagger-1">
              <StatTile
                label="Latest net pay"
                value={latest ? `Rs. ${parseFloat(latest.netSalary).toFixed(2)}` : '-'}
                tone="positive"
                hint={latestLabel || 'No statements yet'}
                icon={<Wallet size={16} />}
              />
            </div>
            <div className="animate-slide-up stagger-2">
              <StatTile
                label="Statements"
                value={payslips.length}
                tone="info"
                hint="Payslips on record"
                icon={<FileText size={16} />}
              />
            </div>
            <div className="animate-slide-up stagger-3">
              <StatTile
                label="Paid this year"
                value={`Rs. ${ytdNet.toFixed(2)}`}
                tone="violet"
                hint={`Net across ${ytdCount} statement${ytdCount === 1 ? '' : 's'}`}
                icon={<TrendingUp size={16} />}
              />
            </div>
            <div className="animate-slide-up stagger-4">
              <StatTile
                label="Deductions"
                value={latest ? `Rs. ${latestDeductions.toFixed(2)}` : '-'}
                tone="warning"
                hint={latest ? 'Tax, NI & other · latest' : 'No statements yet'}
                icon={<CalendarClock size={16} />}
              />
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
              <span>Fetching payroll history...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : payslips.length === 0 ? (
          <div className="paper animate-fade-in flex flex-col items-center space-y-4 rounded-2xl p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2F1ED]">
              <FileText size={24} className="ink-muted" />
            </div>
            <div className="space-y-1">
              <p className="text-[15px] font-bold ink">No payslips yet</p>
              <p className="mx-auto max-w-sm text-[13px] ink-muted">
                Your monthly statements will appear here once finalised by HR.
              </p>
            </div>
          </div>
        ) : (
          <div className="paper paper-hover animate-slide-up stagger-3 overflow-hidden rounded-2xl">
            <Table data={payslips} columns={columns} />
          </div>
        )}

        {/* Detailed Breakdown Modal */}
        <Modal
          isOpen={!!selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
          title={`Payslip Breakdown: ${
            selectedPayslip
              ? (() => {
                  const [year, month] = selectedPayslip.month.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
                })()
              : ''
          }`}
        >
          {selectedPayslip && (
            <div className="space-y-6">
              {/* Earnings Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold ink-muted uppercase tracking-wider border-b hairline pb-2">
                  Earnings
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="ink-muted">Basic Salary</span>
                    <span className="font-semibold ink">Rs. {parseFloat(selectedPayslip.basicSalary).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="ink-muted">Overtime Pay</span>
                    <span className="font-semibold ink">Rs. {parseFloat(selectedPayslip.overtimePay).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="ink-muted">Bonus</span>
                    <span className="font-semibold ink">Rs. {parseFloat(selectedPayslip.bonus).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold ink-muted uppercase tracking-wider border-b hairline pb-2">
                  Deductions
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="ink-muted">Income Tax</span>
                    <span className="font-semibold text-red-700/90">Rs. {parseFloat(selectedPayslip.taxDeduction).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="ink-muted">National Insurance (NI)</span>
                    <span className="font-semibold text-red-700/90">Rs. {parseFloat(selectedPayslip.niDeduction).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="ink-muted">Other Deductions</span>
                    <span className="font-semibold text-red-700/90">Rs. {parseFloat(selectedPayslip.otherDeductions).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary Summary */}
              <div className="p-4 bg-[#F7F6F3] border hairline rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold ink-muted uppercase tracking-wider">Net Take-Home Pay</span>
                  <span className="text-xl font-extrabold text-emerald-700">
                    Rs. {parseFloat(selectedPayslip.netSalary).toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedPayslip.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold ink-muted uppercase tracking-wider">HR Notes</h4>
                  <p className="text-xs ink-muted leading-relaxed bg-[#F7F6F3] p-3 rounded-lg border hairline">
                    {selectedPayslip.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t hairline">
                <Button variant="secondary" onClick={() => setSelectedPayslip(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};
