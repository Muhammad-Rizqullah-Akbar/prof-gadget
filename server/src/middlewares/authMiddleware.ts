import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_negara';

// Perluas tipe Request biar bisa nyimpan data user
export interface AuthRequest extends Request {
  user?: any;
}

// 1. Middleware Cek Token (Login atau Belum?)
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Simpan data user (id, role, dll) ke request
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Token tidak valid' });
  }
};

// 2. Middleware Cek Role (ADMIN atau TECHNICIAN?) - INI YANG BARU
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Pastikan user sudah login (lewat authenticate dulu)
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Cek apakah role user ada di dalam daftar yang diizinkan
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: 'Akses Ditolak: Anda tidak memiliki izin.' 
      });
      return;
    }

    next();
  };
};