import { Schema, model, Document } from 'mongoose';

export interface IHoliday extends Document {
  title: string;
  date: Date;
  type: 'holiday' | 'event';
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
}

const HolidaySchema = new Schema<IHoliday>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['holiday', 'event'],
    default: 'holiday'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const Holiday = model<IHoliday>('Holiday', HolidaySchema);
