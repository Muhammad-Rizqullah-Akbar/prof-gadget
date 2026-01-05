// src/routes/authRoutes.ts
import { Router } from 'express';
import { login } from '../controllers/authController';

const router = Router();

// URL: POST /api/auth/login
router.post('/login', login);

export default router;