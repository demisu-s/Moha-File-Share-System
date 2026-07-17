// src/routes/plantRoutes.ts
import { Router } from 'express';
const router = Router();

// Basic placeholder
router.get('/', (req, res) => {
    res.json({ message: 'Plant routes - coming soon' });
});

export default router;