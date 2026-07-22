import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { StatTile } from '../components/Bento';
import { Users, UserCheck, UserX, UserPlus } from 'lucide-react';

interface UserRecord {
  _id: string;
  email: string;
  role: 'employee' | 'hr_manager' | 'admin';
  isActive: boolean;
  createdAt: string;
}

interface ProfileData {
  fullName: string;
  jobTitle: string;
  dateOfBirth: string;
  phoneNumber: string;
  emergencyContact: string;
  employmentStartDate: string;
  salary: string;
  bankAccount: string;
}

export const HrEmployeeList: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Profile Management states
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<UserRecord | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    jobTitle: '',
    dateOfBirth: '',
    phoneNumber: '',
    emergencyContact: '',
    employmentStartDate: '',
    salary: '',
    bankAccount: ''
  });
  const [profileExists, setProfileExists] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // 2. Payslip Creation states
  const [selectedUserForPayslip, setSelectedUserForPayslip] = useState<UserRecord | null>(null);
  const [payslipMonth, setPayslipMonth] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [overtimePay, setOvertimePay] = useState('0');
  const [bonus, setBonus] = useState('0');
  const [taxDeduction, setTaxDeduction] = useState('0');
  const [niDeduction, setNiDeduction] = useState('0');
  const [otherDeductions, setOtherDeductions] = useState('0');
  const [payslipNotes, setPayslipNotes] = useState('');
  const [payslipSubmitting, setPayslipSubmitting] = useState(false);
  const [payslipError, setPayslipError] = useState('');
  const [payslipSuccess, setPayslipSuccess] = useState('');

  // 3. GDPR Export states
  const [selectedUserForExport, setSelectedUserForExport] = useState<UserRecord | null>(null);
  const [consentToken, setConsentToken] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccessModalOpen, setExportSuccessModalOpen] = useState(false);
  const [zipPassword, setZipPassword] = useState('');
  const [zipFileName, setZipFileName] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 15;

  const fetchUsersList = async (targetPage: number = 1) => {
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
      setError(err.response?.data?.message || 'Failed to retrieve employee directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchUsersList(newPage);
    }
  };

  // Profile Action handlers
  const handleOpenProfileModal = async (user: UserRecord) => {
    setSelectedUserForProfile(user);
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    
    try {
      const response = await api.get(`/api/profile/${user._id}`);
      if (response.data?.profile) {
        const p = response.data.profile;
        setProfileData({
          fullName: p.fullName || '',
          jobTitle: p.jobTitle || '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
          phoneNumber: p.phoneNumber || '',
          emergencyContact: p.emergencyContact || '',
          employmentStartDate: p.employmentStartDate ? p.employmentStartDate.split('T')[0] : '',
          salary: p.salary || '',
          bankAccount: p.bankAccount || ''
        });
        setProfileExists(true);
      } else {
        setProfileExists(false);
      }
    } catch (err: any) {
      // 404 means profile is not initialized yet
      if (err.response?.status === 404) {
        setProfileData({
          fullName: '',
          jobTitle: '',
          dateOfBirth: '',
          phoneNumber: '',
          emergencyContact: '',
          employmentStartDate: '',
          salary: '',
          bankAccount: ''
        });
        setProfileExists(false);
      } else {
        setProfileError(err.response?.data?.message || 'Failed to fetch employee profile.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForProfile) return;

    setProfileError('');
    setProfileSuccess('');
    setProfileSubmitting(true);

    try {
      if (profileExists) {
        await api.put(`/api/profile/${selectedUserForProfile._id}`, profileData);
        setProfileSuccess('Profile updated successfully.');
      } else {
        await api.post('/api/profile', {
          userId: selectedUserForProfile._id,
          ...profileData
        });
        setProfileSuccess('Profile initialized successfully.');
        setProfileExists(true);
      }

      setTimeout(() => {
        setSelectedUserForProfile(null);
        setProfileSuccess('');
      }, 1500);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Payslip Action handlers
  const handleOpenPayslipModal = (user: UserRecord) => {
    setSelectedUserForPayslip(user);
    setPayslipMonth('');
    setBasicSalary('');
    setOvertimePay('0');
    setBonus('0');
    setTaxDeduction('0');
    setNiDeduction('0');
    setOtherDeductions('0');
    setPayslipNotes('');
    setPayslipError('');
    setPayslipSuccess('');
  };

  const handlePayslipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPayslip) return;

    setPayslipError('');
    setPayslipSuccess('');
    setPayslipSubmitting(true);

    try {
      await api.post('/api/payslips', {
        employeeId: selectedUserForPayslip._id,
        month: payslipMonth,
        basicSalary,
        overtimePay,
        bonus,
        taxDeduction,
        niDeduction,
        otherDeductions,
        notes: payslipNotes
      });

      setPayslipSuccess('Payslip generated and securely encrypted.');
      
      // Auto close after brief delay
      setTimeout(() => {
        setSelectedUserForPayslip(null);
      }, 1500);
    } catch (err: any) {
      setPayslipError(err.response?.data?.message || 'Failed to create payslip.');
    } finally {
      setPayslipSubmitting(false);
    }
  };

  // GDPR Export handlers
  const handleGdprExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForExport || !consentToken.trim()) return;

    setExportError('');
    setExporting(true);

    try {
      const response = await api.post(`/api/profile/${selectedUserForExport._id}/export`, {
        consentToken
      });

      if (response.data?.zipData) {
        const { zipData, password, fileName } = response.data;
        setZipPassword(password);
        setZipFileName(fileName);
        
        // Trigger download
        const byteCharacters = atob(zipData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/zip' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setSelectedUserForExport(null);
        setConsentToken('');
        setExportSuccessModalOpen(true);
      }
    } catch (err: any) {
      setExportError(err.response?.data?.message || 'Unauthorized GDPR export. Check the consent token.');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      header: 'Email Address',
      accessor: (row: UserRecord) => row.email
    },
    {
      header: 'System Role',
      accessor: (row: UserRecord) => (
        <span className="capitalize font-medium ink-muted">
          {row.role.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row: UserRecord) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
          row.isActive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
        }`}>
          {row.isActive ? 'Active' : 'Suspended'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: UserRecord) => {
        // Employees are managed by HR and admin; HR records only by an admin.
        const canManage = row.role === 'employee' || (row.role === 'hr_manager' && isAdmin);
        if (!canManage) {
          return <span className="text-xs ink-subtle">-</span>;
        }
        return (
          <div className="flex items-center space-x-2">
            <Button variant="primary" onClick={() => handleOpenProfileModal(row)}>
              Manage Profile
            </Button>
            <Button variant="secondary" onClick={() => handleOpenPayslipModal(row)}>
              Add Payslip
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedUserForExport(row);
                setConsentToken('');
                setExportError('');
              }}
            >
              GDPR Export
            </Button>
          </div>
        );
      }
    }
  ];

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.length - activeCount;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const newThisMonth = users.filter((u) => new Date(u.createdAt) >= monthStart).length;

  return (
    <>
      <div className="space-y-8">

        {!loading && !error && (
          <div className="grid gap-5 sm:grid-cols-4">
            <div className="animate-slide-up stagger-1">
              <StatTile label="Employees" value={users.length} tone="info" hint="In the directory" icon={<Users size={16} />} />
            </div>
            <div className="animate-slide-up stagger-2">
              <StatTile label="Active" value={activeCount} tone="positive" hint="Currently enabled" icon={<UserCheck size={16} />} />
            </div>
            <div className="animate-slide-up stagger-3">
              <StatTile
                label="Inactive"
                value={inactiveCount}
                tone={inactiveCount > 0 ? 'warning' : 'positive'}
                hint={inactiveCount === 0 ? 'Everyone enabled' : 'Access disabled'}
                icon={<UserX size={16} />}
              />
            </div>
            <div className="animate-slide-up stagger-4">
              <StatTile label="Joined this month" value={newThisMonth} tone="violet" hint="New accounts" icon={<UserPlus size={16} />} />
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
              <span>Loading employee index...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="paper rounded-2xl p-14 text-center ink-subtle text-xs">
            No employees registered in the system database.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="paper paper-hover rounded-2xl overflow-hidden">
              <Table data={users} columns={columns} />
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#FBFAF8] p-4 border hairline rounded-2xl">
              <div className="text-xs ink-muted font-medium font-sans">
                Showing employees <span className="ink font-bold">{Math.min(totalRecords, (page - 1) * limit + 1)}</span> to{' '}
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

        {/* 1. Manage Profile Modal */}
        <Modal
          isOpen={!!selectedUserForProfile}
          onClose={() => setSelectedUserForProfile(null)}
          title={selectedUserForProfile ? `Manage Profile: ${selectedUserForProfile.email}` : ''}
        >
          {profileLoading ? (
            <div className="py-10 text-center ink-muted text-xs font-semibold">
              Loading profile record...
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl text-center">
                  {profileSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="fullName"
                  label="Full Name"
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  required
                  disabled={profileSubmitting}
                />
                <Input
                  id="jobTitle"
                  label="Job Title"
                  type="text"
                  value={profileData.jobTitle}
                  onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                  required
                  disabled={profileSubmitting}
                />
                <Input
                  id="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                  required
                  disabled={profileSubmitting}
                />
                <Input
                  id="employmentStartDate"
                  label="Employment Start Date"
                  type="date"
                  value={profileData.employmentStartDate}
                  onChange={(e) => setProfileData({ ...profileData, employmentStartDate: e.target.value })}
                  required
                  disabled={profileSubmitting}
                />
                <Input
                  id="phoneNumber"
                  label="Phone Number"
                  type="tel"
                  value={profileData.phoneNumber}
                  onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                  required
                  disabled={profileSubmitting}
                />
                <Input
                  id="emergencyContact"
                  label="Emergency Contact"
                  type="text"
                  placeholder="Name, Relationship, Phone"
                  value={profileData.emergencyContact}
                  onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                  required
                  disabled={profileSubmitting}
                />
                <Input
                  id="salary"
                  label="Salary (Gross Annual Rs.)"
                  type="number"
                  value={profileData.salary}
                  onChange={(e) => setProfileData({ ...profileData, salary: e.target.value })}
                  required
                  disabled={profileSubmitting}
                />
                <Input
                  id="bankAccount"
                  label="Bank Account Details"
                  type="text"
                  placeholder="Sort Code & Account No."
                  value={profileData.bankAccount}
                  onChange={(e) => setProfileData({ ...profileData, bankAccount: e.target.value })}
                  required
                  disabled={profileSubmitting}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t hairline">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setSelectedUserForProfile(null)}
                  disabled={profileSubmitting}
                >
                  Close
                </Button>
                <Button type="submit" variant="primary" loading={profileSubmitting}>
                  Save Profile details
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* 2. Add Payslip Modal */}
        <Modal
          isOpen={!!selectedUserForPayslip}
          onClose={() => setSelectedUserForPayslip(null)}
          title={selectedUserForPayslip ? `Generate Payslip: ${selectedUserForPayslip.email}` : ''}
        >
          <form onSubmit={handlePayslipSubmit} className="space-y-4">
            {payslipError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                {payslipError}
              </div>
            )}

            {payslipSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl text-center">
                {payslipSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="payslipMonth"
                label="Select Month"
                type="month"
                value={payslipMonth}
                onChange={(e) => setPayslipMonth(e.target.value)}
                required
                disabled={payslipSubmitting}
              />
              <Input
                id="basicSalary"
                label="Basic Salary (Rs.)"
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                required
                disabled={payslipSubmitting}
              />
              <Input
                id="overtimePay"
                label="Overtime Pay (Rs.)"
                type="number"
                value={overtimePay}
                onChange={(e) => setOvertimePay(e.target.value)}
                required
                disabled={payslipSubmitting}
              />
              <Input
                id="bonus"
                label="Bonus (Rs.)"
                type="number"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                required
                disabled={payslipSubmitting}
              />
              <Input
                id="taxDeduction"
                label="Income Tax Deduction (Rs.)"
                type="number"
                value={taxDeduction}
                onChange={(e) => setTaxDeduction(e.target.value)}
                required
                disabled={payslipSubmitting}
              />
              <Input
                id="niDeduction"
                label="National Insurance (NI) (Rs.)"
                type="number"
                value={niDeduction}
                onChange={(e) => setNiDeduction(e.target.value)}
                required
                disabled={payslipSubmitting}
              />
              <Input
                id="otherDeductions"
                label="Other Deductions (Rs.)"
                type="number"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(e.target.value)}
                required
                disabled={payslipSubmitting}
              />
              <Input
                id="payslipNotes"
                label="Payslip Notes"
                type="text"
                placeholder="e.g. Performance bonus included"
                value={payslipNotes}
                onChange={(e) => setPayslipNotes(e.target.value)}
                disabled={payslipSubmitting}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t hairline">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setSelectedUserForPayslip(null)}
                disabled={payslipSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={payslipSubmitting}>
                Save & Issue Payslip
              </Button>
            </div>
          </form>
        </Modal>

        {/* 3. GDPR Consent Authorization Request Modal */}
        <Modal
          isOpen={!!selectedUserForExport}
          onClose={() => setSelectedUserForExport(null)}
          title={selectedUserForExport ? `GDPR Export Authentication: ${selectedUserForExport.email}` : ''}
        >
          <form onSubmit={handleGdprExportSubmit} className="space-y-4">
            {exportError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                {exportError}
              </div>
            )}

            <div className="bg-[#F7F6F3] p-4 rounded-xl border hairline space-y-2 text-xs ink-muted leading-normal">
              <h4 className="font-bold ink-muted uppercase tracking-wider">Third-Party Data Export Compliance:</h4>
              <p>
                To export this employee's GDPR data, you must provide their **one-time consent token**. The employee can generate this token on their dashboard under the GDPR Compliances screen.
              </p>
            </div>

            <Input
              id="consentToken"
              label="One-time Consent Token"
              type="text"
              placeholder="Enter the token provided by the employee"
              value={consentToken}
              onChange={(e) => setConsentToken(e.target.value)}
              required
              disabled={exporting}
            />

            <div className="flex justify-end space-x-3 pt-4 border-t hairline">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setSelectedUserForExport(null)}
                disabled={exporting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={exporting}>
                Verify Token & Export
              </Button>
            </div>
          </form>
        </Modal>

        {/* 4. GDPR Export Success Password Modal */}
        <Modal
          isOpen={exportSuccessModalOpen}
          onClose={() => setExportSuccessModalOpen(false)}
          title="Third-Party GDPR Export Completed"
        >
          <div className="space-y-5 text-center py-2">
            <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-bold ink">Archive Exported: {zipFileName}</h3>
              <p className="text-xs ink-muted leading-relaxed max-w-sm mx-auto">
                The GDPR portability archive has been encrypted using AES-256 and downloaded. Provide the decryption password below to the employee (it has also been emailed to them):
              </p>
            </div>

            <div className="bg-[#F7F6F3]/80 p-3.5 border hairline rounded-xl space-y-1 select-all">
              <span className="text-[10px] ink-subtle uppercase tracking-wider font-bold">Archive Decryption Password</span>
              <div className="text-base font-mono font-extrabold text-emerald-700 tracking-wider">
                {zipPassword}
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button variant="primary" onClick={() => setExportSuccessModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};
