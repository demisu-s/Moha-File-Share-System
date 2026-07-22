import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export class FileService {
    async uploadFile(data: {
        file: Express.Multer.File;
        uploadedBy: string;
        plantId?: string;
        departmentId?: string;
        description?: string;
        category?: string;
    }) {
        // Generate file hash for deduplication
        const fileHash = await this.calculateFileHash(data.file.path);
        
        // Check for duplicate file in same location
        const existingFile = await prisma.file.findFirst({
            where: {
                fileHash: fileHash,
                plantId: data.plantId || null,
                departmentId: data.departmentId || null,
                isDeleted: false
            }
        });

        if (existingFile) {
            // Delete the uploaded file since it's a duplicate
            fs.unlinkSync(data.file.path);
            throw new AppError('File already exists in this location', 409);
        }

        const file = await prisma.file.create({
            data: {
                fileName: data.file.filename,
                originalName: data.file.originalname,
                fileSize: data.file.size,
                fileType: path.extname(data.file.originalname).slice(1),
                mimeType: data.file.mimetype,
                filePath: data.file.filename,
                fileHash: fileHash,
                plantId: data.plantId,
                departmentId: data.departmentId,
                uploadedById: data.uploadedBy,
                description: data.description,
                category: data.category as any || 'OTHER'
            }
        });

        return file;
    }

    async getFiles(where: any, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            prisma.file.findMany({
                where,
                skip,
                take: limit,
                include: {
                    uploadedBy: {
                        select: {
                            id: true,
                            fullName: true,
                            employeeId: true
                        }
                    },
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
                    },
                    shares: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            permission: true,
                            sharedWithAll: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.file.count({ where })
        ]);

        return { items, total };
    }

    async getFileById(id: string) {
        return prisma.file.findUnique({
            where: { id },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeId: true,
                        email: true
                    }
                },
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
                },
                shares: {
                    where: { isActive: true },
                    include: {
                        sharedWithUser: {
                            select: {
                                id: true,
                                fullName: true,
                                employeeId: true
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
                },
                accessLogs: {
                    take: 10,
                    orderBy: { accessedAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                employeeId: true
                            }
                        }
                    }
                }
            }
        });
    }

    async updateFile(id: string, data: {
        description?: string;
        category?: string;
        isActive?: boolean;
    }) {
        const updateData: any = { ...data };
        if (data.category) {
            updateData.category = data.category as any;
        }
        return prisma.file.update({
            where: { id },
            data: updateData
        });
    }

    async deleteFile(id: string) {
        return prisma.file.update({
            where: { id },
            data: { 
                isDeleted: true, 
                isActive: false,
                deletedAt: new Date()
            }
        });
    }

    async canAccessFile(userId: string, fileId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                role: true, 
                plantId: true, 
                departmentId: true,
                id: true
            }
        });

        const file = await prisma.file.findUnique({
            where: { id: fileId },
            include: {
                shares: {
                    where: { isActive: true }
                }
            }
        });

        if (!user || !file) return false;
        
        // Super admin has access to all files
        if (user.role === 'SUPER_ADMIN') return true;
        
        // User is the uploader
        if (file.uploadedById === user.id) return true;
        
        // Check if file is shared with user's plant
        const sharedWithPlant = file.shares.some(s => s.sharedWithPlantId === user.plantId);
        if (sharedWithPlant) return true;
        
        // Check if file is shared with user's department
        const sharedWithDept = file.shares.some(s => s.sharedWithDeptId === user.departmentId);
        if (sharedWithDept) return true;
        
        // Check if file is shared directly with user
        const sharedWithUser = file.shares.some(s => s.sharedWithUserId === userId);
        if (sharedWithUser) return true;
        
        // Check if file is shared with all employees
        const sharedWithAll = file.shares.some(s => s.sharedWithAll === true);
        if (sharedWithAll) return true;

        // Plant admin can access all files in their plant
        if (user.role === 'PLANT_ADMIN' && user.plantId === file.plantId) return true;
        
        // Department head can access all files in their department
        if (user.role === 'DEPARTMENT_HEAD' && user.departmentId === file.departmentId) return true;

        return false;
    }

    async canManageFile(userId: string, fileId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                role: true, 
                plantId: true, 
                departmentId: true,
                id: true
            }
        });

        const file = await prisma.file.findUnique({
            where: { id: fileId },
            select: {
                uploadedById: true,
                plantId: true,
                departmentId: true
            }
        });

        if (!user || !file) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        if (file.uploadedById === user.id) return true;
        if (user.role === 'PLANT_ADMIN' && user.plantId === file.plantId) return true;
        if (user.role === 'DEPARTMENT_HEAD' && user.departmentId === file.departmentId) return true;

        return false;
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

    private async calculateFileHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }
}