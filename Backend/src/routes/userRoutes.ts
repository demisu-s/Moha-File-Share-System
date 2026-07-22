import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../constants/roles';

const router = Router();
const userController = new UserController();

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/change-password', authenticate, userController.changePassword);

// Admin routes
router.post(
    '/',
    authenticate,
    authorize(ROLES.SUPER_ADMIN, ROLES.PLANT_ADMIN, ROLES.DEPARTMENT_HEAD),
    userController.createUser
);

router.get(
    '/',
    authenticate,
    userController.getAllUsers
);

router.get(
    '/:id',
    authenticate,
    userController.getUserById
);

router.put(
    '/:id',
    authenticate,
    authorize(ROLES.SUPER_ADMIN, ROLES.PLANT_ADMIN, ROLES.DEPARTMENT_HEAD),
    userController.updateUser
);

router.delete(
    '/:id',
    authenticate,
    authorize(ROLES.SUPER_ADMIN, ROLES.PLANT_ADMIN),
    userController.deleteUser
);

export default router;