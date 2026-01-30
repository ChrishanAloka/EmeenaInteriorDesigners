import express from 'express';
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  getInvoiceStats
} from '../controllers/invoiceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Invoice CRUD routes
router.post('/', createInvoice);
router.get('/', getAllInvoices);
router.get('/stats', getInvoiceStats);
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

// Status update route (supervisor and admin only)
router.patch('/:id/status', authorize('supervisor', 'admin'), updateInvoiceStatus);

export default router;