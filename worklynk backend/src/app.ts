import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { apiLimiter } from './middlewares/rateLimit';
import { ipFilter } from './middlewares/ipFilter';

dotenv.config();

const app = express();

const trustProxy = process.env.TRUST_PROXY;
if (trustProxy !== undefined) {
  if (trustProxy === 'true' || trustProxy === 'false') {
    app.set('trust proxy', trustProxy === 'true');
  } else if (!isNaN(Number(trustProxy))) {
    app.set('trust proxy', Number(trustProxy));
  } else {
    app.set('trust proxy', trustProxy);
  }
} else {
  app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
}

// Hardened Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

const allowedOrigins = ['http://localhost:5000', 'http://127.0.0.1:5000'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

app.use(ipFilter);
app.use(apiLimiter);
app.use(express.json());

// Custom cookie-parsing middleware to avoid external dependencies
app.use((req: any, res, next) => {
  const cookieHeader = req.headers.cookie;
  const cookies: Record<string, string> = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie: string) => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  req.cookies = cookies;
  next();
});

// Import Routes
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import payslipRoutes from './routes/payslipRoutes';
import leaveRoutes from './routes/leaveRoutes';
import auditRoutes from './routes/auditRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import holidayRoutes from './routes/holidayRoutes';

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/holidays', holidayRoutes);

import { protect } from './middlewares/authMiddleware';

// Serve static profile photos securely
const uploadFolder = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', protect, express.static(path.join(__dirname, '..', uploadFolder)));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'worklynk-backend'
  });
});

// Default API route
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Worklynk Secure API' });
});

export default app;
