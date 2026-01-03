// src/controllers/authController.ts
import { Request, Response } from 'express';
import { loginUser } from '../services/authService';

export const login = async (req: Request, res: Response): Promise<void> => { // Ubah return type jadi Promise<void>
  try {
    const { username, password } = req.body;

    // Panggil Service
    const result = await loginUser(username, password);

    // Kirim respon sukses
    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: result,
    });
  } catch (error: any) {
    // Kirim respon gagal
    res.status(401).json({
      success: false,
      message: error.message || 'Login gagal',
    });
  }
};