import { Response } from 'express'
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

// 1. GET: Ambil Daftar Servis (FILTER BERDASARKAN ROLE)
export const getAllServices = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    
    // 1. Ambil Parameter
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const statusFilter = req.query.status as string;
    const technicianFilter = req.query.technicianId as string;
    const search = req.query.search as string;
    
    // PARAMETER BARU: Bulan & Tahun
    const month = req.query.month as string;
    const year = req.query.year as string;

    const skip = (page - 1) * limit;

    // 2. Base Condition (Security: Role)
    let baseWhere: any = {};
    if (user.role === 'TECHNICIAN') {
      baseWhere.technicianId = user.id;
    }

    // --- BAGIAN A: HITUNG STATISTIK ---
    const statsRaw = await prisma.service.groupBy({
      by: ['status'],
      _count: { status: true },
      where: baseWhere 
    });

    const stats = { pending: 0, working: 0, done: 0, cancelled: 0 };
    statsRaw.forEach(item => {
      if (item.status === 'PENDING') stats.pending = item._count.status;
      if (item.status === 'WORKING') stats.working = item._count.status;
      if (item.status === 'DONE') stats.done = item._count.status;
      if (item.status === 'CANCELLED') stats.cancelled = item._count.status;
    });

    // --- BAGIAN B: FILTER PENCARIAN & TABEL ---
    let whereCondition = { ...baseWhere };

    if (user.role === 'ADMIN' && technicianFilter && technicianFilter !== 'ALL') {
      whereCondition.technicianId = parseInt(technicianFilter);
    }
    if (statusFilter && statusFilter !== 'ALL') {
      whereCondition.status = statusFilter;
    }
    
    // LOGIKA FILTER TANGGAL (BARU)
    if (year && year !== 'ALL') {
        const selectedYear = parseInt(year);
        let start, end;

        if (month && month !== 'ALL') {
            // Filter per Bulan Tertentu
            const selectedMonth = parseInt(month);
            start = new Date(selectedYear, selectedMonth - 1, 1);
            end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
        } else {
            // Filter Setahun Penuh
            start = new Date(selectedYear, 0, 1);
            end = new Date(selectedYear, 11, 31, 23, 59, 59);
        }

        whereCondition.createdAt = {
            gte: start,
            lte: end
        };
    }

    // Logika Search
    if (search) {
      whereCondition.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { deviceModel: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // --- BAGIAN C: AMBIL DATA TABEL ---
    const [services, totalData] = await prisma.$transaction([
      prisma.service.findMany({
        where: whereCondition,
        include: {
          customer: true,
          technician: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit
      }),
      prisma.service.count({ where: whereCondition })
    ]);
    
    const totalPages = Math.ceil(totalData / limit);

    res.json({ 
      success: true, 
      data: {
        services,
        stats,
        pagination: { currentPage: page, totalPages, totalData }
      } 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

// 2. POST: Input Servis Baru (Updated: Support Date & Status)
export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      customerAddress, 
      deviceType, 
      deviceModel, 
      complaint, 
      createdAt, // Tanggal manual
      status     // Status manual (optional)
    } = req.body;
    
    const technicianId = req.user.id; 

    // 1. Validasi Tanggal
    const entryDate = createdAt ? new Date(createdAt) : new Date();

    // 2. Generate Nomor Tiket (Timestamp-based)
    const ticketNumber = `SRV-${entryDate.getTime()}`;

    // 3. Simpan ke Database
    const newService = await prisma.service.create({
      data: {
        ticketNumber,
        deviceType,
        deviceModel,
        complaint,
        
        // GUNAKAN STATUS DARI INPUT ATAU DEFAULT 'PENDING'
        status: status || 'PENDING',
        
        // GUNAKAN TANGGAL DARI INPUT ATAU DEFAULT NOW
        createdAt: entryDate, 
        
        technician: { connect: { id: technicianId } },
        customer: {
          connectOrCreate: {
            where: { phone: customerPhone },
            create: { name: customerName, phone: customerPhone, address: customerAddress }
          }
        }
      }
    });

    res.status(201).json({ success: true, message: 'Servis berhasil dibuat', data: newService });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Gagal membuat servis' });
  }
};

// 3. POST: Tambah Item Biaya (Sparepart/Jasa) ke Servis Tertentu
export const addServiceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const serviceId = parseInt(req.params.id); // Ambil ID dari URL (misal: /services/1/items)
    const { itemName, category, buyPrice, sellPrice } = req.body;

    // Cek apakah servis ada?
    const serviceExists = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!serviceExists) {
      res.status(404).json({ message: 'Servis tidak ditemukan' });
      return;
    }

    // 1. Simpan Item ke Database
    const newItem = await prisma.serviceItem.create({
      data: {
        serviceId,
        itemName,      // Contoh: "LCD Samsung A50"
        category,      // "PART" atau "SERVICE"
        buyPrice,      // Modal: 300000
        sellPrice,     // Jual: 500000
      }
    });

    // 2. Otomatis ubah status servis jadi 'WORKING' (Sedang Dikerjakan)
    // karena kalau sudah input barang, berarti sedang dikerjakan.
    await prisma.service.update({
      where: { id: serviceId },
      data: { status: 'WORKING' }
    });

    res.status(201).json({ success: true, message: 'Item berhasil ditambahkan', data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambahkan item' });
  }
};

// Ambil Detail 1 Servis (DENGAN PROTEKSI)
export const getServiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const serviceId = parseInt(req.params.id);
    const user = req.user;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        customer: true,
        technician: { select: { name: true } },
        items: true
      }
    });

    if (!service) {
      res.status(404).json({ success: false, message: 'Servis tidak ditemukan' });
      return;
    }

    // --- PROTEKSI TAMBAHAN ---
    // Jika user adalah TEKNISI, dan servis ini BUKAN punya dia -> Tolak Akses
    if (user.role === 'TECHNICIAN' && service.technicianId !== user.id) {
      res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke servis ini.' });
      return;
    }

    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil detail servis' });
  }
};

// 4. PATCH: Update Status Servis
export const updateServiceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const serviceId = parseInt(req.params.id);
    const { status } = req.body; // Status baru yang dikirim dari frontend

    // Validasi status yang boleh dipilih
    const allowedStatuses = ['PENDING', 'WORKING', 'DONE', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ message: 'Status tidak valid' });
      return;
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: { status }
    });

    res.json({ success: true, message: 'Status berhasil diubah', data: updatedService });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal update status' });
  }
};

// 5. PATCH: Edit Item Belanja/Servis
export const updateServiceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { itemName, buyPrice, sellPrice } = req.body;

    await prisma.serviceItem.update({
      where: { id: itemId },
      data: {
        itemName,
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice)
      }
    });

    res.json({ success: true, message: 'Item berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal update item' });
  }
};

// 6. DELETE: Hapus Item
export const deleteServiceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const itemId = parseInt(req.params.itemId);

    await prisma.serviceItem.delete({
      where: { id: itemId }
    });

    res.json({ success: true, message: 'Item berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal hapus item' });
  }
};

// 7. DELETE: Hapus Satu Servis (Beserta Item-nya)
export const deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const serviceId = parseInt(req.params.id);

    // 1. Cek apakah servis ada
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      res.status(404).json({ success: false, message: 'Servis tidak ditemukan' });
      return;
    }

    // 2. Hapus Transaksi (Database Transaction)
    // Kita gunakan $transaction untuk memastikan ServiceItem terhapus dulu, baru Service-nya
    await prisma.$transaction([
      // Hapus semua item sparepart/jasa terkait servis ini
      prisma.serviceItem.deleteMany({ where: { serviceId } }),
      // Hapus servis itu sendiri
      prisma.service.delete({ where: { id: serviceId } })
    ]);

    res.json({ success: true, message: 'Servis dan data terkait berhasil dihapus permanen' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menghapus servis' });
  }
};