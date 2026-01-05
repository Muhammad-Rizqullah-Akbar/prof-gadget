// server/src/controllers/userController.ts
import { Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Pastikan sudah install: npm install bcryptjs
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

// 1. GET: Ambil Daftar Teknisi + Statistik Kinerja
export const getTechnicians = async (req: AuthRequest, res: Response) => {
  try {
    // Ambil user yang role-nya TECHNICIAN
    const technicians = await prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      select: {
        id: true,
        name: true,
        username: true,
        // Include relasi servis untuk dihitung manual
        services: {
          select: { status: true }
        }
      }
    });

    // Olah data: Hitung statistik kinerja
    const data = technicians.map(tech => {
      const totalJobs = tech.services.filter(s => s.status !== 'CANCELLED').length; // Hanya menghitung yang Valid
      const doneJobs = tech.services.filter(s => s.status === 'DONE').length;
      const pendingJobs = tech.services.filter(s => s.status === 'PENDING' || s.status === 'WORKING').length;
      
      return {
        id: tech.id,
        name: tech.name,
        username: tech.username,
        stats: { total: totalJobs, done: doneJobs, pending: pendingJobs }
      };
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal ambil data teknisi' });
  }
};

// 2. POST: Tambah Teknisi Baru
export const createTechnician = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, username, password } = req.body;
        
        // Cek username kembar
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            res.status(400).json({ message: 'Username sudah dipakai' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        await prisma.user.create({
            data: {
                name, username, 
                password: hashedPassword,
                role: 'TECHNICIAN'
            }
        });

        res.json({ success: true, message: 'Teknisi berhasil ditambahkan' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal tambah teknisi' });
    }
};

// 3. PATCH: Update User (Nama atau Reset Password)
export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { name, password } = req.body;

        let updateData: any = { name };

        // Jika password diisi, update password (hash dulu)
        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({
            where: { id },
            data: updateData
        });

        res.json({ success: true, message: 'Data berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal update user' });
    }
};

// 4. DELETE: Hapus User
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        // Hapus user (Prisma akan error jika user ini punya data servis terkait - Foreign Key)
        // Solusi: Bisa hapus servis dulu, atau biarkan error sebagai pengaman.
        // Disini kita hapus user saja.
        await prisma.user.delete({ where: { id } });
        res.json({ success: true, message: 'User berhasil dihapus' });
    } catch (error) {
        // Biasanya error code P2003 (Foreign key constraint failed)
        res.status(400).json({ success: false, message: 'Gagal hapus. User ini mungkin masih memiliki riwayat servis.' });
    }
};