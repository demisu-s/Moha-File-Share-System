import { prisma } from '../config/database';
import { ROLES } from '../constants/roles';

export class UserService {
    async createUser(data: {
        email: string;
        password: string;
        fullName: string;
        employeeId: string;
        plantId?: string;
        departmentId?: string;
        role?: string;
        createdBy: string;
    }) {
        return prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                fullName: data.fullName,
                employeeId: data.employeeId,
                plantId: data.plantId,
                departmentId: data.departmentId,
                role: data.role as any || 'EMPLOYEE',
                createdBy: data.createdBy
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                employeeId: true,
                plantId: true,
                departmentId: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });
    }

    async getUsers(where: any, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    employeeId: true,
                    phone: true,
                    profileImage: true,
                    role: true,
                    isActive: true,
                    lastLogin: true,
                    createdAt: true,
                    plant: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    department: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        return { items, total };
    }

    async getUserById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                fullName: true,
                employeeId: true,
                phone: true,
                profileImage: true,
                role: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                plant: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        location: true
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                uploadedFiles: {
                    where: { isDeleted: false },
                    take: 5,
                    select: {
                        id: true,
                        fileName: true,
                        fileSize: true,
                        createdAt: true
                    }
                }
            }
        });
    }

    async updateUser(id: string, data: any) {
        return prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                fullName: true,
                employeeId: true,
                phone: true,
                profileImage: true,
                role: true,
                isActive: true,
                plantId: true,
                departmentId: true,
                updatedAt: true
            }
        });
    }

    async deleteUser(id: string) {
        return prisma.user.update({
            where: { id },
            data: { isActive: false }
        });
    }

    async canManagePlant(userId: string, plantId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, plantId: true }
        });

        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        if (user.role === 'PLANT_ADMIN' && user.plantId === plantId) return true;

        return false;
    }

    async canManageUser(userId: string, targetUserId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, plantId: true, departmentId: true }
        });

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { plantId: true, departmentId: true }
        });

        if (!user || !targetUser) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        if (user.role === 'PLANT_ADMIN' && user.plantId === targetUser.plantId) return true;
        if (user.role === 'DEPARTMENT_HEAD' && user.departmentId === targetUser.departmentId) return true;

        return false;
    }

    async canAccessUser(userId: string, targetUserId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, plantId: true, departmentId: true }
        });

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { plantId: true, departmentId: true }
        });

        if (!user || !targetUser) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        if (user.role === 'PLANT_ADMIN' && user.plantId === targetUser.plantId) return true;
        if (user.role === 'DEPARTMENT_HEAD' && user.departmentId === targetUser.departmentId) return true;
        if (user.id === targetUserId) return true;

        return false;
    }

    async canAssignRole(userId: string, role: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        if (user.role === 'PLANT_ADMIN' && role !== 'SUPER_ADMIN' && role !== 'PLANT_ADMIN') return true;
        if (user.role === 'DEPARTMENT_HEAD' && (role === 'EMPLOYEE' || role === 'VIEWER')) return true;

        return false;
    }
}