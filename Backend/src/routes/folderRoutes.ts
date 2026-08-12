import { Router } from 'express';
import { FolderController } from '../controllers/folderController';
import { authenticate } from '../middleware/auth';

const router = Router();
const folderController = new FolderController();

router.post('/', authenticate, folderController.createFolder);
router.get('/', authenticate, folderController.getFolders);
router.get('/:id', authenticate, folderController.getFolderById);
router.put('/:id', authenticate, folderController.updateFolder);
router.delete('/:id', authenticate, folderController.deleteFolder);

export default router;
