import express from 'express';
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  addInvoicePayment,
  deleteInvoicePayment,
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

// Payment routes (supervisor and admin only)
router.post('/:id/payments', authorize('supervisor', 'admin'), addInvoicePayment);
router.delete('/:id/payments/:paymentId', authorize('supervisor', 'admin'), deleteInvoicePayment);

export default router;