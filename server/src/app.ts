// src/app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';            // 1. IMPORT HELMET
import rateLimit from 'express-rate-limit'; // 2. IMPORT RATE LIMIT

import serviceRoutes from './routes/serviceRoutes';
import userRoutes from './routes/userRoutes';
import reportRoutes from './routes/reportRoutes';
import authRoutes from './routes/authRoutes';
import expenseRoutes from './routes/expenseRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// --- A. KEAMANAN: HELMET (Sembunyikan Identitas Server) ---
// Ini akan memanipulasi header HTTP agar hacker sulit menebak teknologi server.
app.use(helmet());

// --- B. KEAMANAN: CORS (Batasi Pintu Masuk) ---
// Ubah cors() biasa menjadi konfigurasi spesifik
app.use(cors({
  origin: ['http://localhost:3000', 'https://prof-gadget-v2.vercel.app'], // Hanya izinkan Frontend Next.js Anda
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true // Izinkan kirim cookie/token
}));

// --- C. KEAMANAN: RATE LIMIT (Cegah Serangan Brutal) ---
// Membatasi IP yang melakukan spam request berlebihan
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Durasi: 15 Menit
  max: 100, // Maksimal: 100 request per IP dalam 15 menit
  message: {
    success: false,
    message: 'Terlalu banyak request dari IP ini, silakan coba 15 menit lagi.'
  },
  standardHeaders: true, // Info limit di header `RateLimit-*`
  legacyHeaders: false,  // Nonaktifkan header `X-RateLimit-*`
});

// Pasang limiter di seluruh aplikasi
app.use(limiter);

// --- D. MIDDLEWARE WAJIB LAINNYA ---
app.use(express.json()); // Membaca JSON body

// --- DAFTARKAN ROUTES ---
app.use('/api/auth', authRoutes); 
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/expenses', expenseRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Server Professor Gadget is Running securely! 🛡️🚀');
});

app.listen(PORT, () => {
  console.log(`Server berjalan aman di http://localhost:${PORT}`);
});