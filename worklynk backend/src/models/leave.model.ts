import { Schema, model, Document } from 'mongoose';

export interface ILeave extends Document {
  employeeId: Schema.Types.ObjectId;
  leaveType: 'annual' | 'sick' | 'emergency' | 'unpaid';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedBy: Schema.Types.ObjectId | null;
  decisionComment: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'emergency', 'unpaid'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  decidedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  decisionComment: {
    type: String,
    default: null
  },
  decidedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export const Leave = model<ILeave>('Leave', LeaveSchema);
