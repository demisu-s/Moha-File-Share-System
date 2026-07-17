// src/routes/fileRoutes.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'File routes - coming soon' });
});

export default router;