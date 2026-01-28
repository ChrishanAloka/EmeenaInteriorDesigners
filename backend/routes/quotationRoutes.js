import express from 'express';
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  getQuotationStats
} from '../controllers/quotationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Quotation CRUD routes
router.post('/', createQuotation);
router.get('/', getAllQuotations);
router.get('/stats', getQuotationStats);
router.get('/:id', getQuotationById);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

// Status update route (supervisor and admin only)
router.patch('/:id/status', authorize('supervisor', 'admin'), updateQuotationStatus);

export default router;