// src/routes/authRoutes.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginSchema } from '../validators/authValidator';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';

const router = Router();

router.post('/login', async (req, res, next) => {
    try {
        const validated = loginSchema.parse(req.body);
        
        const user = await prisma.user.findUnique({
            where: { email: validated.email }
        });

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const isValidPassword = await bcrypt.compare(validated.password, user.password);
        if (!isValidPassword) {
            throw new AppError('Invalid credentials', 401);
        }

        if (!user.isActive) {
            throw new AppError('User account is deactivated', 401);
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                plantId: user.plantId,
                departmentId: user.departmentId
            },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        res.json(successResponse({
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                plantId: user.plantId,
                departmentId: user.departmentId
            }
        }));
    } catch (error) {
        next(error);
    }
});

export default router;