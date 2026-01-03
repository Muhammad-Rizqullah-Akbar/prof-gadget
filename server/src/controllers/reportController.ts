// server/src/controllers/reportController.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

export const getFinancialReport = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query; // string: '1'-'12' atau 'ALL'
    
    let startDate: Date;
    let endDate: Date;
    let mode: 'MONTHLY' | 'YEARLY' | 'ALL_TIME' = 'MONTHLY';

    // 1. TENTUKAN RENTANG TANGGAL UTAMA (Untuk Tabel & Summary)
    const currentYear = new Date().getFullYear();
    const selectedYear = year === 'ALL' ? 'ALL' : parseInt(year as string) || currentYear;

    if (selectedYear === 'ALL') {
        // MODE: SEMUA WAKTU
        mode = 'ALL_TIME';
        startDate = new Date(2020, 0, 1); 
        endDate = new Date(); // Sampai hari ini
    } else if (month === 'ALL') {
        // MODE: TAHUNAN (1 Jan - 31 Des)
        mode = 'YEARLY';
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
    } else {
        // MODE: BULANAN (Default)
        mode = 'MONTHLY';
        const m = parseInt(month as string) || (new Date().getMonth() + 1);
        startDate = new Date(selectedYear, m - 1, 1);
        endDate = new Date(selectedYear, m, 0, 23, 59, 59);
    }

    // 2. QUERY TRANSAKSI (Sesuai Rentang)
    const transactions = await prisma.serviceItem.findMany({
      where: {
        service: {
          createdAt: { gte: startDate, lte: endDate },
          status: { not: 'CANCELLED' }
        }
      },
      include: {
        service: { 
          select: { 
            ticketNumber: true, 
            createdAt: true, // Penting untuk tabel Frontend
            status: true,
            customer: { select: { name: true } },
            technician: { select: { name: true } } // Penting untuk Pie Chart Teknisi
          } 
        }
      },
      orderBy: { id: 'desc' }
    });

    // 3. QUERY PENGELUARAN (Sesuai Rentang)
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'desc' }
    });

    // 4. HITUNG RINGKASAN
    let totalRevenue = 0; 
    let totalCogs = 0;    
    transactions.forEach(item => {
      totalRevenue += Number(item.sellPrice);
      totalCogs += Number(item.buyPrice);
    });

    let totalOpEx = 0;
    expenses.forEach(item => {
      totalOpEx += Number(item.amount);
    });

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalOpEx;

    // 5. DATA GRAFIK (PERBAIKAN JAM AKHIR DI SINI!)
    const chartData = [];

    if (mode === 'ALL_TIME') {
        // Grafik: TREN TAHUNAN (5 Tahun Terakhir)
        for (let i = 4; i >= 0; i--) {
            const y = currentYear - i;
            const start = new Date(y, 0, 1);
            const end = new Date(y, 11, 31, 23, 59, 59); // <-- PERBAIKAN: Set jam ke akhir hari
            
            const revAgg = await prisma.serviceItem.aggregate({
                _sum: { sellPrice: true },
                where: { service: { createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } } }
            });
            chartData.push({ name: String(y), omzet: Number(revAgg._sum.sellPrice || 0) });
        }
    } else if (mode === 'YEARLY') {
        // Grafik: TREN BULANAN (Jan - Des tahun itu)
        for (let i = 0; i < 12; i++) {
            const start = new Date(selectedYear as number, i, 1);
            const end = new Date(selectedYear as number, i + 1, 0, 23, 59, 59); // <-- PERBAIKAN

            const revAgg = await prisma.serviceItem.aggregate({
                _sum: { sellPrice: true },
                where: { service: { createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } } }
            });
            chartData.push({ 
                name: start.toLocaleString('id-ID', { month: 'short' }), 
                omzet: Number(revAgg._sum.sellPrice || 0) 
            });
        }
    } else {
        // Grafik: 6 BULAN TERAKHIR (Mode Bulanan)
        for (let i = 5; i >= 0; i--) {
            // Mundur dari bulan terpilih
            const d = new Date(selectedYear as number, (parseInt(month as string) || 1) - 1 - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            
            const start = new Date(y, m, 1);
            const end = new Date(y, m + 1, 0, 23, 59, 59); // <-- PERBAIKAN: Penting agar tanggal 30/31 ikut terhitung!

            const revAgg = await prisma.serviceItem.aggregate({
                _sum: { sellPrice: true },
                where: { service: { createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } } }
            });
            chartData.push({ 
                name: d.toLocaleString('id-ID', { month: 'short' }), 
                omzet: Number(revAgg._sum.sellPrice || 0) 
            });
        }
    }

    res.json({
      success: true,
      data: {
        mode,
        period: { month, year: selectedYear },
        summary: { totalRevenue, totalCogs, grossProfit, totalOpEx, netProfit },
        transactions,
        expenses,
        chartData
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal membuat laporan' });
  }
};