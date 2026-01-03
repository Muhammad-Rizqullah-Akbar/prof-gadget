// src/app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import serviceRoutes from './routes/serviceRoutes';
import userRoutes from './routes/userRoutes';
import reportRoutes from './routes/reportRoutes';
import authRoutes from './routes/authRoutes';
import expenseRoutes from './routes/expenseRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// --- DAFTARKAN ROUTES DI SINI ---
app.use('/api/auth', authRoutes); 
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/expenses', expenseRoutes);
// Artinya semua URL di authRoutes diawali dengan /api/auth

app.get('/', (req: Request, res: Response) => {
  res.send('Server Professor Gadget is Running! 🚀');
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});