// src/services/authService.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'rahasia';

export const loginUser = async (username: string, pass: string) => {
  // 1. Cari user di database
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new Error('User tidak ditemukan');
  }

  // 2. Cek password
  const isMatch = await bcrypt.compare(pass, user.password);
  if (!isMatch) {
    throw new Error('Password salah');
  }

  // 3. Buat Token (Kartu Akses)
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name }, // Data yang disimpan di token
    SECRET_KEY,
    { expiresIn: '1d' } // Token berlaku 1 hari
  );

  // 4. Kembalikan data user (tanpa password) dan token
  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
    token,
  };
};