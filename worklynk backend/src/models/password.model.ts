import { Schema, model, Document } from 'mongoose';

export interface IPasswordHistory extends Document {
  userId: Schema.Types.ObjectId;
  passwordHash: string;
  createdAt: Date;
}

const PasswordHistorySchema = new Schema<IPasswordHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Password = model<IPasswordHistory>('Password', PasswordHistorySchema);
