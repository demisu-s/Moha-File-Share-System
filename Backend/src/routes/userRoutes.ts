// src/routes/userRoutes.ts
import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'PLANT_ADMIN', 'DEPARTMENT_HEAD'),
  UserController.getAllUsers
);

router.get(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'PLANT_ADMIN', 'DEPARTMENT_HEAD'),
  UserController.getUserById
);

router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'PLANT_ADMIN'),
  UserController.createUser
);

export default router;