import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: Schema.Types.ObjectId;
  actionType: string;
  targetResource: string | null;
  ipAddress: string;
  userAgent: string;
  metadata: Schema.Types.Mixed | null;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  actionType: {
    type: String,
    required: true,
    index: true
  },
  targetResource: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Immutability Hook
AuditLogSchema.pre('save', function(next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable and cannot be updated.'));
  }
  next();
});

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
