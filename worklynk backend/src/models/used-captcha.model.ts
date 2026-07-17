import { Schema, model, Document } from 'mongoose';

export interface IUsedCaptcha extends Document {
  signature: string;
  expiresAt: Date;
}

const UsedCaptchaSchema = new Schema<IUsedCaptcha>({
  signature: {
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

export const UsedCaptcha = model<IUsedCaptcha>('UsedCaptcha', UsedCaptchaSchema);
