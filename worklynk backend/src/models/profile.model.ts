import { Schema, model, Document } from 'mongoose';
import { encrypt, decrypt } from '../utils/crypto';

export interface IProfile extends Document {
  userId: Schema.Types.ObjectId;
  fullName: string;
  jobTitle: string;
  dateOfBirth: string; // Encrypted at rest
  phoneNumber: string;
  emergencyContact: string;
  salary: string; // Encrypted at rest
  bankAccount: string; // Encrypted at rest
  employmentStartDate: Date;
  profilePhotoPath: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  emergencyContact: {
    type: String,
    required: true,
    trim: true
  },
  salary: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  bankAccount: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  employmentStartDate: {
    type: Date,
    required: true
  },
  profilePhotoPath: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

export const Profile = model<IProfile>('Profile', ProfileSchema);
