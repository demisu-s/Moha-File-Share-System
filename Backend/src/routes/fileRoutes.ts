import { Router } from 'express';
import { FileController } from '../controllers/fileController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import { ROLES } from '../constants/roles';

const router = Router();
const fileController = new FileController();

router.post(
    '/upload',
    authenticate,
    uploadSingle,
    fileController.uploadFile
);

router.get(
    '/',
    authenticate,
    fileController.getAllFiles
);

router.get(
    '/:id',
    authenticate,
    fileController.getFileById
);

router.get(
    '/:id/download',
    authenticate,
    fileController.downloadFile
);

router.put(
    '/:id',
    authenticate,
    fileController.updateFile
);

router.delete(
    '/:id',
    authenticate,
    fileController.deleteFile
);

export default router;