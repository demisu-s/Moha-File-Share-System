import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class ShareService {
    async createShare(data: {
        fileId: string;
        sharedBy: string;
        sharedWithUserId?: string;
        sharedWithPlantId?: string;
        sharedWithDeptId?: string;
        sharedWithAll?: boolean;
        permission?: string;
        expiresAt?: string;
    }) {
        // Verify the file exists
        const file = await prisma.file.findUnique({
            where: { id: data.fileId }
        });

        if (!file) {
            throw new AppError('File not found', 404);
        }

        // Check if a share already exists
        const existingShare = await prisma.fileShare.findFirst({
            where: {
                fileId: data.fileId,
                sharedWithUserId: data.sharedWithUserId || undefined,
                sharedWithPlantId: data.sharedWithPlantId || undefined,
                sharedWithDeptId: data.sharedWithDeptId || undefined,
                sharedWithAll: data.sharedWithAll || false,
                isActive: true
            }
        });

        if (existingShare) {
            throw new AppError('This share already exists', 409);
        }

        return prisma.fileShare.create({
            data: {
                fileId: data.fileId,
                sharedBy: data.sharedBy,
                sharedWithUserId: data.sharedWithUserId,
                sharedWithPlantId: data.sharedWithPlantId,
                sharedWithDeptId: data.sharedWithDeptId,
                sharedWithAll: data.sharedWithAll || false,
                permission: data.permission as any || 'VIEW',
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
            },
            include: {
                file: {
                    select: {
                        id: true,
                        fileName: true,
                        originalName: true
                    }
                },
                sharedWithUser: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                sharedWithPlant: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                sharedWithDept: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
    }

    async getShares(where: any, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            prisma.fileShare.findMany({
                where,
                skip,
                take: limit,
                include: {
                    file: {
                        select: {
                            id: true,
                            fileName: true,
                            originalName: true,
                            fileSize: true,
                            uploadedBy: {
                                select: {
                                    fullName: true,
                                    employeeId: true
                                }
                            }
                        }
                    },
                    sharedWithUser: {
                        select: {
                            id: true,
                            fullName: true,
                            employeeId: true,
                            email: true
                        }
                    },
                    sharedWithPlant: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    sharedWithDept: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.fileShare.count({ where })
        ]);

        return { items, total };
    }

    async getShareById(id: string) {
        return prisma.fileShare.findUnique({
            where: { id },
            include: {
                file: {
                    include: {
                        uploadedBy: {
                            select: {
                                id: true,
                                fullName: true,
                                employeeId: true
                            }
                        }
                    }
                },
                sharedWithUser: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeId: true,
                        email: true
                    }
                },
                sharedWithPlant: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                sharedWithDept: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
    }

    async updateShare(id: string, data: {
        permission?: string;
        expiresAt?: Date;
    }) {
        return prisma.fileShare.update({
            where: { id },
            data: {
                permission: data.permission as any,
                expiresAt: data.expiresAt
            }
        });
    }

    async revokeShare(id: string) {
        return prisma.fileShare.update({
            where: { id },
            data: { 
                isActive: false 
            }
        });
    }

    async canShareFile(userId: string, fileId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, plantId: true, departmentId: true }
        });

        const file = await prisma.file.findUnique({
            where: { id: fileId },
            select: { uploadedById: true, plantId: true, departmentId: true }
        });

        if (!user || !file) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        if (file.uploadedById === userId) return true;
        if (user.role === 'PLANT_ADMIN' && user.plantId === file.plantId) return true;
        if (user.role === 'DEPARTMENT_HEAD' && user.departmentId === file.departmentId) return true;

        return false;
    }

    async canManageShare(userId: string, shareId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, plantId: true, departmentId: true }
        });

        const share = await prisma.fileShare.findUnique({
            where: { id: shareId },
            include: {
                file: {
                    select: {
                        uploadedById: true,
                        plantId: true,
                        departmentId: true
                    }
                }
            }
        });

        if (!user || !share) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        if (share.sharedBy === userId) return true;
        if (user.role === 'PLANT_ADMIN' && user.plantId === share.file.plantId) return true;

        return false;
    }

    async canAccessShare(userId: string, shareId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, plantId: true, departmentId: true }
        });

        const share = await prisma.fileShare.findUnique({
            where: { id: shareId }
        });

        if (!user || !share) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        if (share.sharedBy === userId) return true;
        if (share.sharedWithUserId === userId) return true;
        if (share.sharedWithPlantId && share.sharedWithPlantId === user.plantId) return true;
        if (share.sharedWithDeptId && share.sharedWithDeptId === user.departmentId) return true;
        if (share.sharedWithAll) return true;

        return false;
    }

    async createShareNotifications(shareId: string) {
        const share = await prisma.fileShare.findUnique({
            where: { id: shareId },
            include: {
                file: true,
                sharedWithUser: true,
                sharedWithPlant: {
                    include: {
                        users: {
                            where: { isActive: true },
                            select: { id: true }
                        }
                    }
                },
                sharedWithDept: {
                    include: {
                        users: {
                            where: { isActive: true },
                            select: { id: true }
                        }
                    }
                }
            }
        });

        if (!share) return;

        let userIds: string[] = [];

        // Add specific user
        if (share.sharedWithUserId) {
            userIds.push(share.sharedWithUserId);
        }

        // Add all users in plant
        if (share.sharedWithPlantId && share.sharedWithPlant) {
            userIds.push(...share.sharedWithPlant.users.map(u => u.id));
        }

        // Add all users in department
        if (share.sharedWithDeptId && share.sharedWithDept) {
            userIds.push(...share.sharedWithDept.users.map(u => u.id));
        }

        // Add all users if shared with all
        if (share.sharedWithAll) {
            const allUsers = await prisma.user.findMany({
                where: { isActive: true },
                select: { id: true }
            });
            userIds.push(...allUsers.map(u => u.id));
        }

        // Remove duplicates
        userIds = [...new Set(userIds)];

        // Create notifications
        const notifications = userIds.map(userId => ({
            userId,
            title: 'New File Shared',
            message: `${share.file.fileName} has been shared with you`,
            type: 'FILE_SHARED' as any,
            link: `/files/${share.fileId}`
        }));

        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications
            });
        }
    }
}