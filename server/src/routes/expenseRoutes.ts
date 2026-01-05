import { Router } from 'express';
import { createExpense, deleteExpense } from '../controllers/expenseController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticate);

// CRUD Expense (Hanya Admin)
router.post('/', authorize(['ADMIN']), createExpense);
router.delete('/:id', authorize(['ADMIN']), deleteExpense);

export default router;