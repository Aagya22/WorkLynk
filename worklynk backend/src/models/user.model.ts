import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { encrypt, decrypt } from '../utils/crypto';
import { Password } from './password.model';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'employee' | 'hr_manager' | 'admin';
  isActive: boolean;
  lockedUntil: Date | null;
  failedLoginCount: number;
  passwordChangedAt: Date;
  mfaSecret: string | null;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  sessionVersion: number;
  lastLogin: Date | null;
  lastLoginIP: string | null;
  lastLogout: Date | null;
  lastFailedLogin: Date | null;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  department: string | null;
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
  matchPassword(enteredPassword: string): Promise<boolean>;
  isPasswordExpired(): boolean;
  isPasswordReused(newPassword: string): Promise<boolean>;
  incrementLoginAttempts(): Promise<IUser>;
  resetLoginAttempts(): Promise<IUser>;
  addToPasswordHistory(newPasswordHash: string): Promise<void>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['employee', 'hr_manager', 'admin'],
    default: 'employee'
  },
  department: {
    type: String,
    default: null,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  failedLoginCount: {
    type: Number,
    default: 0
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  mfaSecret: {
    type: String,
    default: null,
    get: decrypt,
    set: encrypt
  },
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaVerified: {
    type: Boolean,
    default: false
  },
  sessionVersion: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastLoginIP: {
    type: String,
    default: null
  },
  lastLogout: {
    type: Date,
    default: null
  },
  lastFailedLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { getters: true, virtuals: true },
  toObject: { getters: true, virtuals: true }
});

// Virtual for checking lockout state dynamically
UserSchema.virtual('isLocked').get(function (this: IUser) {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
});

// Compare password hashes using bcrypt
UserSchema.methods.matchPassword = async function (this: IUser, enteredPassword: string): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

// Check if password age is past 90 days
UserSchema.methods.isPasswordExpired = function (this: IUser): boolean {
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  return (Date.now() - this.passwordChangedAt.getTime()) > ninetyDays;
};

// Check password history to reject reuse of last 5 passwords
UserSchema.methods.isPasswordReused = async function (this: IUser, newPassword: string): Promise<boolean> {
  const matchesCurrent = await bcrypt.compare(newPassword, this.passwordHash);
  if (matchesCurrent) return true;

  const history = await Password.find({ userId: this._id })
    .sort({ createdAt: -1 })
    .limit(5);

  for (const entry of history) {
    const matchesOld = await bcrypt.compare(newPassword, entry.passwordHash);
    if (matchesOld) return true;
  }

  return false;
};

// Handle failed login lockouts
UserSchema.methods.incrementLoginAttempts = async function (this: IUser): Promise<IUser> {
  this.failedLoginCount += 1;
  this.lastFailedLogin = new Date();

  if (this.failedLoginCount >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
  }

  return this.save();
};

// Reset login attempts
UserSchema.methods.resetLoginAttempts = async function (this: IUser): Promise<IUser> {
  this.failedLoginCount = 0;
  this.lockedUntil = null;
  return this.save();
};

// Save current password hash to history
UserSchema.methods.addToPasswordHistory = async function (this: IUser, newPasswordHash: string): Promise<void> {
  await Password.create({
    userId: this._id,
    passwordHash: this.passwordHash
  });

  const historyCount = await Password.countDocuments({ userId: this._id });
  if (historyCount > 5) {
    const oldestRecords = await Password.find({ userId: this._id })
      .sort({ createdAt: 1 })
      .limit(historyCount - 5);

    const idsToDelete = oldestRecords.map(doc => doc._id);
    await Password.deleteMany({ _id: { $in: idsToDelete } });
  }
};

export const User = model<IUser>('User', UserSchema);
