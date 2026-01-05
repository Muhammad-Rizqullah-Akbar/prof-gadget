import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

// 1. POST: Tambah Pengeluaran
export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { name, amount, date } = req.body;
    
    // Pastikan date di-parse dengan benar
    const expenseDate = date ? new Date(date) : new Date();

    await prisma.expense.create({
      data: {
        name,
        amount: Number(amount),
        date: expenseDate
      }
    });

    res.json({ success: true, message: 'Pengeluaran berhasil dicatat' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal catat pengeluaran' });
  }
};

// 2. DELETE: Hapus Pengeluaran
export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true, message: 'Pengeluaran dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal hapus pengeluaran' });
  }
};