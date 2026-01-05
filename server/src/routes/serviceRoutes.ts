// src/routes/serviceRoutes.ts
import { Router } from 'express';
import { createService, getAllServices, addServiceItem, getServiceById, updateServiceStatus, updateServiceItem, deleteServiceItem } from '../controllers/serviceController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { deleteService } from '../controllers/serviceController';

const router = Router();

// Semua rute di bawah ini DILINDUNGI oleh "authenticate"
router.use(authenticate);

router.patch('/items/:itemId', updateServiceItem); // URL: /api/services/items/10

router.delete('/items/:itemId', deleteServiceItem); // URL: /api/services/items/10

// DELETE Service (Hanya Admin)
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteService);

// GET /api/services -> Lihat semua servis
router.get('/', getAllServices);

// POST /api/services -> Tambah servis baru
router.post('/', createService);

router.get('/:id', getServiceById);

router.post('/:id/items', addServiceItem);

router.patch('/:id/status', updateServiceStatus);

export default router;