import { Router } from 'express';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginSchema } from '../validators/authValidator';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { registerSchema, changePasswordSchema } from '../validators/authValidator';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res, next) => {
    try {
        const validated = loginSchema.parse(req.body);
        
        const user = await prisma.user.findUnique({
            where: { employeeId: validated.employeeId }
        });

        // Check user exists and is active first — same error to prevent enumeration
        if (!user || !user.isActive) {
            throw new AppError('Invalid credentials', 401);
        }

        const isValidPassword = await bcrypt.compare(validated.password, user.password);
        if (!isValidPassword) {
            throw new AppError('Invalid credentials', 401);
        }

        const token = jwt.sign(
            {
                id: user.id,
                employeeId: user.employeeId,
                role: user.role,
                plantId: user.plantId,
                departmentId: user.departmentId
            },
            process.env.JWT_SECRET!,
            { expiresIn: '90d' }
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
                employeeId: user.employeeId,
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
router.post('/register', async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: validated.email }, { employeeId: validated.employeeId }],
      },
    });
    if (existing) {
      throw new AppError('Email or Employee ID already in use', 409);
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        fullName: validated.fullName,
        employeeId: validated.employeeId,
        plantId: validated.plantId,
        departmentId: validated.departmentId,
        role: validated.role,
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        employeeId: user.employeeId,
        role: user.role,
        plantId: user.plantId,
        departmentId: user.departmentId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '90d' }
    );

    res.status(201).json(
      successResponse({
        token,
        user: {
          id: user.id,
          employeeId: user.employeeId,
          fullName: user.fullName,
          role: user.role,
          plantId: user.plantId,
          departmentId: user.departmentId,
        },
      })
    );
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const validated = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('User not found', 404);

    const isCurrentValid = await bcrypt.compare(validated.currentPassword, user.password);
    if (!isCurrentValid) throw new AppError('Current password is incorrect', 401);

    const newHashed = await bcrypt.hash(validated.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHashed },
    });

    res.json(successResponse({ message: 'Password updated successfully' }));
  } catch (error) {
    next(error);
  }
});

export default router;