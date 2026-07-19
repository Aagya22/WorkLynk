import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { PasswordStrength } from '../components/PasswordStrength';
import { UserCog, Camera, Mail, CalendarDays, ShieldCheck, KeyRound, CheckCircle2, Lock } from 'lucide-react';

interface ProfileData {
  fullName: string;
  jobTitle: string;
  dateOfBirth: string;
  phoneNumber: string;
  emergencyContact: string;
  employmentStartDate: string;
  salary?: string;
  bankAccount?: string;
  profilePhotoPath?: string;
}

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Onboarding (self-service profile setup) state
  const [profileMissing, setProfileMissing] = useState(false);
  const [obFullName, setObFullName] = useState('');
  const [obDob, setObDob] = useState('');
  const [obPhone, setObPhone] = useState('');
  const [obEmergency, setObEmergency] = useState('');
  const [obSubmitting, setObSubmitting] = useState(false);
  const [obError, setObError] = useState('');

  // Editable fields states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Photo upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // MFA states
  const [mfaSecret, setMfaSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSetupLoading, setMfaSetupLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);

  // Change password
  const [pwOpen, setPwOpen] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confPw, setConfPw] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Disable MFA
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePw, setDisablePw] = useState('');
  const [disabling, setDisabling] = useState(false);
  const [disableError, setDisableError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw !== confPw) {
      setPwError('The new passwords do not match.');
      return;
    }
    setPwSubmitting(true);
    try {
      await api.put('/api/auth/change-password', { currentPassword: curPw, newPassword: newPw });
      setPwSuccess('Password changed successfully. Please log in again.');
      // The server invalidated this session — send the user back to login.
      setTimeout(() => {
        updateUser(null);
        navigate('/login');
      }, 1400);
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError('');
    setDisabling(true);
    try {
      await api.post('/api/auth/mfa/disable', { password: disablePw });
      if (user && updateUser) updateUser({ ...user, mfaEnabled: false });
      setDisableOpen(false);
      setDisablePw('');
    } catch (err: any) {
      setDisableError(err.response?.data?.message || 'Failed to disable MFA.');
    } finally {
      setDisabling(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/api/profile/${user.id}`);
      if (response.data?.profile) {
        const p = response.data.profile;
        setProfile(p);
        setProfileMissing(false);
        setFullName(p.fullName || '');
        setPhoneNumber(p.phoneNumber || '');
        setEmergencyContact(p.emergencyContact || '');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No profile yet (typical for self-registered accounts) — offer onboarding.
        setProfileMissing(true);
      } else {
        setError(err.response?.data?.message || 'Failed to load profile details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setObError('');

    if (!obFullName || !obDob || !obPhone || !obEmergency) {
      setObError('All fields are required to set up your profile.');
      return;
    }

    setObSubmitting(true);
    try {
      const response = await api.post('/api/profile/self', {
        fullName: obFullName,
        dateOfBirth: obDob,
        phoneNumber: obPhone,
        emergencyContact: obEmergency,
      });
      if (response.data?.profile) {
        const p = response.data.profile;
        setProfile(p);
        setProfileMissing(false);
        setFullName(p.fullName || '');
        setPhoneNumber(p.phoneNumber || '');
        setEmergencyContact(p.emergencyContact || '');
      }
    } catch (err: any) {
      setObError(err.response?.data?.message || 'Failed to set up your profile.');
    } finally {
      setObSubmitting(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await api.put(`/api/profile/${user.id}`, {
        fullName,
        phoneNumber,
        emergencyContact
      });

      setSuccess('Profile updated successfully.');
      setIsEditing(false);
      if (response.data?.profile) {
        setProfile(response.data.profile);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhoneNumber(profile.phoneNumber || '');
      setEmergencyContact(profile.emergencyContact || '');
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setUploadSuccess('');
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File size exceeds the 2MB limit.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setUploadError('Invalid format. Select a JPG, JPEG, or PNG image.');
      return;
    }

    setSelectedFile(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancelSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setUploadError('');
    setUploadSuccess('');
    const fileInput = document.getElementById('photo-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('photo', selectedFile);

    try {
      const response = await api.post(`/api/profile/${user.id}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadSuccess('Profile photo uploaded.');
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      const fileInput = document.getElementById('photo-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      if (profile) {
        setProfile({
          ...profile,
          profilePhotoPath: response.data.profilePhotoPath
        });
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload profile photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleInitiateMfa = async () => {
    setMfaError('');
    setMfaSuccess('');
    setMfaSetupLoading(true);
    try {
      const response = await api.post('/api/auth/mfa/setup');
      if (response.data?.qrCodeDataUrl) {
        setQrCode(response.data.qrCodeDataUrl);
        setMfaSecret(response.data.secret);
        setIsSettingUpMfa(true);
      }
    } catch (err: any) {
      setMfaError(err.response?.data?.message || 'Failed to initiate MFA setup.');
    } finally {
      setMfaSetupLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError('');
    setMfaSuccess('');
    setMfaSetupLoading(true);
    try {
      await api.post('/api/auth/mfa/enable', { code: mfaCode });
      setMfaSuccess('MFA successfully enabled.');
      if (user && updateUser) {
        updateUser({ ...user, mfaEnabled: true });
      }
      setTimeout(() => {
        setIsSettingUpMfa(false);
        setQrCode('');
        setMfaSecret('');
        setMfaCode('');
      }, 1500);
    } catch (err: any) {
      setMfaError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setMfaSetupLoading(false);
    }
  };

  const apiBaseURL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5001';

  const roleLabels: Record<string, string> = {
    employee: 'Employee',
    hr_manager: 'HR Manager',
    admin: 'Administrator',
  };
  const roleLabel = roleLabels[user?.role || 'employee'];
  const joinedDate = profile?.employmentStartDate
    ? new Date(profile.employmentStartDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : '—';

  const ReadOnlyField = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
    <div className="flex flex-col space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
      <div className={`rounded-xl border border-white/[0.06] bg-slate-950/40 px-4 py-2.5 text-sm text-slate-400 ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <div className="animate-slide-up">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-100">My Profile</h1>
          <p className="text-sm font-medium text-slate-400">
            Manage your personal information, security, and profile photo.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="flex items-center space-x-3 text-slate-400 font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching profile attributes...</span>
            </div>
          </div>
        ) : profileMissing ? (
          <div className="animate-slide-up mx-auto max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0D1326] p-7 shadow-xl">
            <div className="mb-5 flex items-start gap-4 border-b border-white/[0.06] pb-5">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-accent-500/20 bg-accent-500/10 text-accent-400">
                <UserCog size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Finish setting up your profile</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Welcome! Add your details below to activate your profile. Your job title, salary, and
                  bank details will be assigned by HR.
                </p>
              </div>
            </div>

            <form onSubmit={handleInitProfile} className="space-y-5">
              {obError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-semibold text-red-400">
                  {obError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Input
                  id="ob-full-name"
                  label="Full Name"
                  type="text"
                  placeholder="e.g. Aagya Sharma"
                  value={obFullName}
                  onChange={(e) => setObFullName(e.target.value)}
                  required
                  disabled={obSubmitting}
                />
                <Input
                  id="ob-dob"
                  label="Date of Birth"
                  type="date"
                  value={obDob}
                  onChange={(e) => setObDob(e.target.value)}
                  required
                  disabled={obSubmitting}
                />
                <Input
                  id="ob-phone"
                  label="Phone Number"
                  type="tel"
                  placeholder="+44 7700 900000"
                  value={obPhone}
                  onChange={(e) => setObPhone(e.target.value)}
                  required
                  disabled={obSubmitting}
                />
                <Input
                  id="ob-emergency"
                  label="Emergency Contact"
                  type="text"
                  placeholder="Name, Relationship, Phone"
                  value={obEmergency}
                  onChange={(e) => setObEmergency(e.target.value)}
                  required
                  disabled={obSubmitting}
                />
              </div>

              <div className="flex justify-end border-t border-white/[0.06] pt-4">
                <Button type="submit" variant="primary" loading={obSubmitting}>
                  Complete Setup
                </Button>
              </div>
            </form>
          </div>
        ) : !profile ? (
          <div className="p-6 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold rounded-xl text-center">
            {error || 'No profile records found. Please contact an HR administrator to initialize your profile.'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile summary */}
            <div className="animate-slide-up flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-[#0D1326] p-6 shadow-xl sm:flex-row sm:items-center">
              {/* Avatar with upload overlay */}
              <div className="group relative mx-auto sm:mx-0">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : profile.profilePhotoPath ? (
                    <img
                      src={`${apiBaseURL}${profile.profilePhotoPath}`}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      crossOrigin="use-credentials"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-3xl font-bold uppercase text-accent-500">{profile.fullName?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <label
                  htmlFor="photo-file"
                  className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-slate-950/60 opacity-0 transition-opacity group-hover:opacity-100"
                  title="Change photo"
                >
                  <Camera size={20} className="text-white" />
                </label>
                <input id="photo-file" type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" disabled={uploading} />
              </div>

              {/* Identity */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-display text-2xl font-bold text-slate-100">{profile.fullName}</h2>
                <p className="mt-0.5 text-sm font-medium text-slate-400">{profile.jobTitle}</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-400">
                    <Mail size={12} /> {user?.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-500/20 bg-accent-500/10 px-3 py-1 text-[11px] font-bold text-accent-400">
                    {roleLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-400">
                    <CalendarDays size={12} /> Joined {joinedDate}
                  </span>
                </div>
              </div>

              {/* Edit trigger */}
              {!isEditing && (
                <div className="flex justify-center sm:block">
                  <Button variant="primary" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                </div>
              )}
            </div>

            {/* Photo apply bar */}
            {selectedFile && (
              <form onSubmit={handlePhotoUpload} className="animate-fade-in flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0D1326] p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
                <span className="truncate text-xs text-slate-400">Selected photo: <span className="font-semibold text-slate-200">{selectedFile.name}</span> · max 2MB</span>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={handleCancelSelection} disabled={uploading}>Cancel</Button>
                  <Button type="submit" variant="primary" loading={uploading}>Upload Photo</Button>
                </div>
              </form>
            )}
            {uploadError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-400">{uploadError}</div>
            )}
            {uploadSuccess && !selectedFile && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-xs font-semibold text-green-400">{uploadSuccess}</div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Security column */}
              <div className="space-y-6 lg:order-2">
                {/* MFA Card */}
              <div className="animate-slide-up stagger-2 space-y-4 rounded-2xl border border-white/[0.08] bg-[#0D1326] p-6 shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-500/10 border border-primary-500/20 rounded-lg text-primary-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Multi-Factor Auth (MFA)</h4>
                </div>

                {user?.mfaEnabled ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center space-x-3 text-green-400 text-xs font-bold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>MFA is currently active on your account</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Your identity is secured. Next logins will request a 6-digit verification code from your TOTP authenticator device.
                    </p>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => { setDisableError(''); setDisablePw(''); setDisableOpen(true); }}
                    >
                      Disable 2FA
                    </Button>
                  </div>
                ) : isSettingUpMfa ? (
                  <form onSubmit={handleVerifyMfa} className="space-y-4">
                    {mfaError && (
                      <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl">
                        {mfaError}
                      </div>
                    )}
                    {mfaSuccess && (
                      <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-xl">
                        {mfaSuccess}
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl">
                      <img src={qrCode} alt="TOTP QR Code" className="w-40 h-40" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Secret Key</span>
                      <code className="text-xs font-mono font-bold text-slate-300 block bg-slate-950 p-2 rounded-lg text-center break-all select-all">
                        {mfaSecret}
                      </code>
                    </div>

                    <Input
                      id="mfa-code"
                      label="Verification Code"
                      type="text"
                      placeholder="e.g. 123456"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      required
                      disabled={mfaSetupLoading}
                    />

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="secondary"
                        type="button"
                        fullWidth
                        onClick={() => setIsSettingUpMfa(false)}
                        disabled={mfaSetupLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        fullWidth
                        loading={mfaSetupLoading}
                      >
                        Verify & Enable
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Add a secondary layer of protection to secure your personal data records against unauthorized login attempts.
                    </p>
                    {mfaError && (
                      <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl">
                        {mfaError}
                      </div>
                    )}
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleInitiateMfa}
                      loading={mfaSetupLoading}
                    >
                      Setup MFA Controls
                    </Button>
                  </div>
                )}
              </div>

              {/* Account facts */}
              <div className="animate-slide-up rounded-2xl border border-white/[0.08] bg-[#0D1326] p-6 shadow-xl">
                <h3 className="mb-4 border-b border-white/[0.06] pb-4 text-base font-bold text-slate-100">Account</h3>
                <div className="space-y-3.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-slate-500"><Mail size={14} /> Email</span>
                    <span className="truncate font-medium text-slate-200">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-slate-500"><KeyRound size={14} /> Role</span>
                    <span className="font-medium text-slate-200">{roleLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-slate-500"><ShieldCheck size={14} /> 2FA Status</span>
                    <span className={`flex items-center gap-1.5 font-semibold ${user?.mfaEnabled ? 'text-green-400' : 'text-slate-400'}`}>
                      {user?.mfaEnabled ? (<><CheckCircle2 size={13} /> Active</>) : 'Disabled'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { setPwError(''); setPwSuccess(''); setCurPw(''); setNewPw(''); setConfPw(''); setPwOpen(true); }}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/40 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900/70 hover:text-slate-100"
                >
                  <Lock size={14} /> Change Password
                </button>
              </div>
            </div>

            {/* Personal information (main) */}
            <div className="space-y-6 lg:order-1 lg:col-span-2">
              <div className="animate-slide-up rounded-2xl border border-white/[0.08] bg-[#0D1326] p-6 shadow-xl">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <h3 className="border-b border-white/[0.06] pb-4 text-base font-bold text-slate-100">
                    Personal Information
                  </h3>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-xl text-center">
                      {success}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      id="full-name"
                      label="Full Name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={!isEditing || saving}
                    />

                    <ReadOnlyField label="Job Title" value={profile.jobTitle} />
                    <ReadOnlyField
                      label="Date of Birth"
                      value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
                    />
                    <ReadOnlyField
                      label="Employment Start Date"
                      value={profile.employmentStartDate ? new Date(profile.employmentStartDate).toLocaleDateString() : 'N/A'}
                    />

                    <Input
                      id="phone-number"
                      label="Phone Number"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      disabled={!isEditing || saving}
                    />

                    <Input
                      id="emergency-contact"
                      label="Emergency Contact"
                      type="text"
                      placeholder="Name, Relationship, Phone"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      required
                      disabled={!isEditing || saving}
                    />
                  </div>

                  {/* Compensation is returned by the API only for the profile owner and HR/admin. */}
                  {(profile.salary || profile.bankAccount) && (
                    <div className="space-y-5 border-t border-white/[0.06] pt-6">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-200">Compensation &amp; Banking</h4>
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Encrypted · HR managed</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <ReadOnlyField label="Salary" value={profile.salary ? `Rs. ${profile.salary}` : 'N/A'} mono />
                        <ReadOnlyField label="Bank Account" value={profile.bankAccount || 'N/A'} mono />
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-4">
                      <Button type="button" variant="secondary" onClick={handleCancelEdit} disabled={saving}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" loading={saving}>
                        Save Changes
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Change password */}
        <Modal isOpen={pwOpen} onClose={() => setPwOpen(false)} title="Change Password">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-semibold text-red-400">{pwError}</div>
            )}
            {pwSuccess && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-center text-xs font-semibold text-green-400">{pwSuccess}</div>
            )}
            <Input id="cur-pw" label="Current Password" type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} required disabled={pwSubmitting} />
            <Input id="new-pw" label="New Password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required disabled={pwSubmitting} />
            <PasswordStrength password={newPw} />
            <Input id="conf-pw" label="Confirm New Password" type="password" value={confPw} onChange={(e) => setConfPw(e.target.value)} required disabled={pwSubmitting} />
            <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-4">
              <Button type="button" variant="secondary" onClick={() => setPwOpen(false)} disabled={pwSubmitting}>Cancel</Button>
              <Button type="submit" variant="primary" loading={pwSubmitting}>Update Password</Button>
            </div>
          </form>
        </Modal>

        {/* Disable MFA */}
        <Modal isOpen={disableOpen} onClose={() => setDisableOpen(false)} title="Disable Two-Factor Authentication">
          <form onSubmit={handleDisableMfa} className="space-y-4">
            {disableError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-semibold text-red-400">{disableError}</div>
            )}
            <p className="text-sm text-slate-400">Turning off two-factor authentication lowers your account security. Enter your password to confirm — you can re-enable it any time.</p>
            <Input id="disable-pw" label="Current Password" type="password" value={disablePw} onChange={(e) => setDisablePw(e.target.value)} required disabled={disabling} />
            <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-4">
              <Button type="button" variant="secondary" onClick={() => setDisableOpen(false)} disabled={disabling}>Cancel</Button>
              <Button type="submit" variant="danger" loading={disabling}>Disable 2FA</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
