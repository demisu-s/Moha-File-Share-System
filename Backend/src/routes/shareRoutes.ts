// src/routes/shareRoutes.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'Share routes - coming soon' });
});

export default router;