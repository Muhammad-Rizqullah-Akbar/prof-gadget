// server/src/routes/userRoutes.ts
import { Router } from 'express';
import { getTechnicians, createTechnician, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Semua route di bawah ini HANYA untuk ADMIN
router.get('/', authorize(['ADMIN']), getTechnicians);       // GET /api/users
router.post('/', authorize(['ADMIN']), createTechnician);    // POST /api/users
router.patch('/:id', authorize(['ADMIN']), updateUser);      // PATCH /api/users/1
router.delete('/:id', authorize(['ADMIN']), deleteUser);     // DELETE /api/users/1

export default router;