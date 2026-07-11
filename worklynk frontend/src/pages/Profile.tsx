import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

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
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Photo upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/api/profile/${user.id}`);
      if (response.data?.profile) {
        const p = response.data.profile;
        setProfile(p);
        setFullName(p.fullName || '');
        setPhoneNumber(p.phoneNumber || '');
        setEmergencyContact(p.emergencyContact || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
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
      if (response.data?.profile) {
        setProfile(response.data.profile);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Profile Details</h1>
          <p className="text-sm text-slate-400 font-medium">
            Manage your personal contact information and upload your profile photo.
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
        ) : !profile ? (
          <div className="p-6 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold rounded-xl text-center">
            {error || 'No profile records found. Please contact an HR administrator to initialize your profile.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Photo Upload and MFA */}
            <div className="space-y-6">
              {/* Photo Upload Card */}
              <div className="glassmorphism rounded-2xl p-6 border border-white/5 flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full border border-slate-800 bg-slate-900 overflow-hidden flex items-center justify-center relative shadow-2xl">
                    {profile.profilePhotoPath ? (
                      <img
                        src={`${apiBaseURL}${profile.profilePhotoPath}`}
                        alt="Profile Photo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = ''; // Clear source to fallback
                        }}
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-100">{profile.fullName}</h3>
                  <p className="text-xs px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-full font-bold uppercase tracking-wider inline-block">
                    {profile.jobTitle}
                  </p>
                </div>

                {/* Upload Photo Form */}
                <form onSubmit={handlePhotoUpload} className="w-full pt-4 border-t border-slate-900 space-y-4">
                  <div className="text-left space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Upload New Photo
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="photo-file"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="photo-file"
                      className="w-full flex items-center justify-center px-4 py-2.5 border border-dashed border-slate-800 hover:border-slate-700/80 bg-slate-950/20 hover:bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-300 cursor-pointer transition-colors"
                    >
                      {selectedFile ? selectedFile.name : 'Select JPG or PNG'}
                    </label>
                    <span className="text-[10px] text-slate-500 pl-0.5">Maximum size 2MB</span>
                  </div>

                  {uploadError && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl">
                      {uploadError}
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-xl">
                      {uploadSuccess}
                    </div>
                  )}

                  {selectedFile && (
                    <Button type="submit" variant="primary" fullWidth loading={uploading}>
                      Apply Photo
                    </Button>
                  )}
                </form>
              </div>

              {/* MFA Card */}
              <div className="glassmorphism rounded-2xl p-6 border border-white/5 space-y-4">
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
            </div>

            {/* Right Column: Edit Profile Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glassmorphism rounded-2xl p-6 border border-white/5">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-900 pb-3 uppercase tracking-wider">
                    Contact & Personal Information
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
                      disabled={saving}
                    />

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={profile.jobTitle}
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-900/60 text-slate-500 rounded-xl text-sm cursor-not-allowed"
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Date of Birth
                      </label>
                      <input
                        type="text"
                        value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-900/60 text-slate-500 rounded-xl text-sm cursor-not-allowed"
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Employment Start Date
                      </label>
                      <input
                        type="text"
                        value={profile.employmentStartDate ? new Date(profile.employmentStartDate).toLocaleDateString() : 'N/A'}
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-900/60 text-slate-500 rounded-xl text-sm cursor-not-allowed"
                      />
                    </div>

                    <Input
                      id="phone-number"
                      label="Phone Number"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      disabled={saving}
                    />

                    <Input
                      id="emergency-contact"
                      label="Emergency Contact"
                      type="text"
                      placeholder="Name, Relationship, Phone"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  {/* Restrict showing sensitive salary/bank info on standard profile screen to hr/admin roles only */}
                  {(user?.role === 'hr_manager' || user?.role === 'admin') && (profile.salary || profile.bankAccount) && (
                    <div className="pt-6 border-t border-slate-900 space-y-5">
                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                        HR Administration Fields
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Salary (Encrypted)
                          </label>
                          <input
                            type="text"
                            value={profile.salary ? `Rs. ${profile.salary}` : 'N/A'}
                            disabled
                            className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-900/60 text-slate-500 rounded-xl text-sm cursor-not-allowed font-mono"
                          />
                        </div>

                        <div className="flex flex-col space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Bank Account Details (Encrypted)
                          </label>
                          <input
                            type="text"
                            value={profile.bankAccount || 'N/A'}
                            disabled
                            className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-900/60 text-slate-500 rounded-xl text-sm cursor-not-allowed font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-slate-900">
                    <Button type="submit" variant="primary" loading={saving}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
