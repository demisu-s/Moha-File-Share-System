// src/routes/departmentRoutes.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'Department routes - coming soon' });
});

export default router;