import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const parseList = (value?: string): string[] =>
  (value || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

const blocklist = parseList(process.env.IP_BLOCKLIST);
const allowlist = parseList(process.env.IP_ALLOWLIST);

// Normalize IPv6-mapped IPv4 addresses (e.g. ::ffff:127.0.0.1 -> 127.0.0.1).
const normalize = (ip: string): string => ip.replace(/^::ffff:/, '');

export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = normalize(req.ip || req.socket.remoteAddress || '');

  if (blocklist.includes(clientIP)) {
    return res.status(403).json({ message: 'Access denied: your IP address has been blocked.' });
  }

  // When an allow-list is configured, only listed IPs may reach the API.
  if (allowlist.length > 0 && !allowlist.includes(clientIP)) {
    return res.status(403).json({ message: 'Access denied: your IP address is not permitted.' });
  }

  next();
};
