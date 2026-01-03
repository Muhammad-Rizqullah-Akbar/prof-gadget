// server/src/routes/reportRoutes.ts
import { Router } from 'express';
import { getFinancialReport } from '../controllers/reportController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// HANYA ADMIN YANG BOLEH LIHAT DUIT!
router.get('/', authorize(['ADMIN']), getFinancialReport);

export default router;