import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FileText, Wallet, CalendarClock } from 'lucide-react';

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
        <span className="font-bold text-green-400">Rs. {parseFloat(row.netSalary).toFixed(2)}</span>
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

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <div className="animate-slide-up flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-400 shadow-glow">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-100">My Payslips</h1>
            <p className="text-sm font-medium text-slate-400">
              View earnings, deductions history, and export secure PDF statements.
            </p>
          </div>
        </div>

        {!loading && !error && latest && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="animate-slide-up stagger-1 group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1326] p-5 transition-all duration-300 hover:-translate-y-1 sm:col-span-2">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-[#22C55E]" />
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[#22C55E]/20 to-transparent opacity-70 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Latest Net Pay · {latestLabel}</span>
                  <p className="mt-1.5 text-[38px] font-extrabold leading-none tracking-tight text-green-400">
                    Rs. {parseFloat(latest.netSalary).toFixed(2)}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-green-500/10 text-green-400">
                  <Wallet size={20} />
                </div>
              </div>
            </div>
            <div className="animate-slide-up stagger-2 group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1326] p-5 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-[#4F8CFF]" />
              <div className="flex items-center justify-between">
                <span className="text-[38px] font-extrabold leading-none tracking-tight text-[#F8FAFC]">{payslips.length}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-accent-500/10 text-accent-400">
                  <CalendarClock size={20} />
                </div>
              </div>
              <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Statements Issued</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 text-slate-400 font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching payroll history...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : payslips.length === 0 ? (
          <div className="animate-fade-in flex flex-col items-center space-y-4 rounded-2xl border border-white/[0.08] bg-[#0D1326] p-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-400">
              <FileText size={28} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-200">No payslips yet</p>
              <p className="mx-auto max-w-sm text-xs text-slate-500">
                Your monthly statements will appear here once finalized by HR.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-slide-up stagger-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1326] shadow-xl">
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
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
                  Earnings
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Basic Salary</span>
                    <span className="font-semibold text-slate-200">Rs. {parseFloat(selectedPayslip.basicSalary).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Overtime Pay</span>
                    <span className="font-semibold text-slate-200">Rs. {parseFloat(selectedPayslip.overtimePay).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Bonus</span>
                    <span className="font-semibold text-slate-200">Rs. {parseFloat(selectedPayslip.bonus).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
                  Deductions
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Income Tax</span>
                    <span className="font-semibold text-red-400/90">Rs. {parseFloat(selectedPayslip.taxDeduction).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">National Insurance (NI)</span>
                    <span className="font-semibold text-red-400/90">Rs. {parseFloat(selectedPayslip.niDeduction).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Other Deductions</span>
                    <span className="font-semibold text-red-400/90">Rs. {parseFloat(selectedPayslip.otherDeductions).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary Summary */}
              <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Take-Home Pay</span>
                  <span className="text-xl font-extrabold text-green-400">
                    Rs. {parseFloat(selectedPayslip.netSalary).toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedPayslip.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">HR Notes</h4>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-900/50">
                    {selectedPayslip.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-900">
                <Button variant="secondary" onClick={() => setSelectedPayslip(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};
