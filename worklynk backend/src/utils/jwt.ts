import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET or JWT_REFRESH_SECRET is not defined in the environment variables.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export interface ITokenPayload {
  userId: string;
  role: 'employee' | 'hr_manager' | 'admin';
  sessionVersion: number;
  ip: string;
  exp?: number;
  iat?: number;
}

export const generateAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): ITokenPayload => {
  return jwt.verify(token, JWT_SECRET) as ITokenPayload;
};

export const verifyRefreshToken = (token: string): ITokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as ITokenPayload;
};
