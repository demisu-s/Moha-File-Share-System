import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../config/database';
import { ROLE_PERMISSIONS, Role } from '../constants/roles';
import { Permission } from '../constants/permissions';

export const checkPermission = (requiredPermission: Permission) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role as Role;
        
        // Super admin has all permissions
        if (userRole === 'SUPER_ADMIN') {
            return next();
        }

        // Check if role has the required permission
        const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
        if (rolePermissions.includes('*') || rolePermissions.includes(requiredPermission)) {
            return next();
        }

        // Check granular permissions from database
        const granularPermission = await prisma.permission.findFirst({
            where: {
                userId: req.user.id,
                action: requiredPermission,
                allowed: true
            }
        });

        if (granularPermission) {
            return next();
        }

        return res.status(403).json({
            error: 'Insufficient permissions',
            required: requiredPermission,
            current: userRole
        });
    };
};

export const checkResourceAccess = (resourceType: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const resourceId = req.params.id || req.body.id;
        
        if (!resourceId) {
            return res.status(400).json({ error: 'Resource ID required' });
        }

        // Super admin has access to all resources
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        // Check if user has access to this specific resource
        const hasAccess = await prisma.permission.findFirst({
            where: {
                userId: req.user.id,
                resourceType: resourceType as any,
                resourceId: resourceId,
                allowed: true
            }
        });

        if (hasAccess) {
            return next();
        }

        return res.status(403).json({
            error: 'Access denied to this resource'
        });
    };
};