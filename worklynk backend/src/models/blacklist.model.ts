import { Schema, model, Document } from 'mongoose';

export interface IBlacklistedToken extends Document {
  token: string;
  expiresAt: Date;
}

const BlacklistedTokenSchema = new Schema<IBlacklistedToken>({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0
  }
}, {
  timestamps: true
});

export const BlacklistedToken = model<IBlacklistedToken>('BlacklistedToken', BlacklistedTokenSchema);
