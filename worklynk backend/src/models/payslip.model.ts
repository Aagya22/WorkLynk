import { Schema, model, Document } from 'mongoose';
import { encrypt, decrypt } from '../utils/crypto';

export interface IPayslip extends Document {
  employeeId: Schema.Types.ObjectId;
  month: string; // Format: YYYY-MM
  basicSalary: string; // Encrypted
  overtimePay: string; // Encrypted
  bonus: string; // Encrypted
  taxDeduction: string; // Encrypted
  niDeduction: string; // Encrypted
  otherDeductions: string; // Encrypted
  netSalary: string; // Encrypted
  notes: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
}

const PayslipSchema = new Schema<IPayslip>({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  month: {
    type: String,
    required: true,
    index: true
  },
  basicSalary: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  overtimePay: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  bonus: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  taxDeduction: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  niDeduction: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  otherDeductions: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  netSalary: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { getters: true },
  toObject: { getters: true }
});

PayslipSchema.index({ employeeId: 1, month: 1 }, { unique: true });

export const Payslip = model<IPayslip>('Payslip', PayslipSchema);
