// src/routes/userRoutes.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'User routes - coming soon' });
});

export default router;