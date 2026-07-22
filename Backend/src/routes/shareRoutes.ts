import { Router } from 'express';
import { ShareController } from '../controllers/shareController';
import { authenticate } from '../middleware/auth';

const router = Router();
const shareController = new ShareController();

router.post(
    '/',
    authenticate,
    shareController.createShare
);

router.get(
    '/',
    authenticate,
    shareController.getAllShares
);

router.get(
    '/:id',
    authenticate,
    shareController.getShareById
);

router.put(
    '/:id',
    authenticate,
    shareController.updateShare
);

router.delete(
    '/:id',
    authenticate,
    shareController.revokeShare
);

export default router;