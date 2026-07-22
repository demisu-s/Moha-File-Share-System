// src/routes/dashboardRoutes.ts
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, DashboardController.getStats);
router.get('/activity', authenticate, DashboardController.getActivity);

export default router;