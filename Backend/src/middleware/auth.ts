// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        plantId?: string;
        departmentId?: string;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            id: string;
            email: string;
            role: string;
        };

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                role: true,
                plantId: true,
                departmentId: true,
                isActive: true
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

// Role-based authorization
export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: roles,
                current: req.user.role
            });
        }
        
        next();
    };
};

// Plant-level authorization
export const requirePlantAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const plantId = req.params.plantId || req.body.plantId;
    
    if (!plantId) {
        return res.status(400).json({ error: 'Plant ID required' });
    }

    // Super admin has access to all plants
    if (req.user.role === 'SUPER_ADMIN') {
        return next();
    }

    // Check if user belongs to the plant
    if (req.user.plantId !== plantId) {
        return res.status(403).json({ error: 'Access denied to this plant' });
    }

    next();
};

// Department-level authorization
export const requireDepartmentAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const departmentId = req.params.departmentId || req.body.departmentId;
    
    if (!departmentId) {
        return res.status(400).json({ error: 'Department ID required' });
    }

    // Super admin has access to all departments
    if (req.user.role === 'SUPER_ADMIN') {
        return next();
    }

    // Plant admin can access all departments in their plant
    if (req.user.role === 'PLANT_ADMIN') {
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            select: { plantId: true }
        });
        
        if (department && department.plantId === req.user.plantId) {
            return next();
        }
    }

    // Department head can only access their own department
    if (req.user.role === 'DEPARTMENT_HEAD' && req.user.departmentId === departmentId) {
        return next();
    }

    return res.status(403).json({ error: 'Access denied to this department' });
};