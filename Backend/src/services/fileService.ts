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
        sectionId?: string;
        folderId?: string;
        description?: string;
        category?: string;
    }) {
        const fileHash = await this.calculateFileHash(data.file.path);
        
        // Check if file with same original name exists in the same location
        const existingFile = await prisma.file.findFirst({
            where: {
                originalName: data.file.originalname,
                folderId: data.folderId || null,
                sectionId: data.sectionId || null,
                departmentId: data.departmentId || null,
                plantId: data.plantId || null,
                isDeleted: false
            }
        });

        if (existingFile) {
            // Version bump
            await prisma.fileVersion.create({
                data: {
                    fileId: existingFile.id,
                    versionNumber: existingFile.version,
                    filePath: existingFile.filePath,
                    fileSize: existingFile.fileSize,
                    originalName: existingFile.originalName,
                    uploadedById: existingFile.uploadedById
                }
            });
            
            return prisma.file.update({
                where: { id: existingFile.id },
                data: {
                    fileName: data.file.filename,
                    fileSize: data.file.size,
                    fileType: path.extname(data.file.originalname).slice(1),
                    mimeType: data.file.mimetype,
                    filePath: data.file.filename,
                    fileHash: fileHash,
                    version: existingFile.version + 1,
                    uploadedById: data.uploadedBy,
                    description: data.description || existingFile.description,
                    category: data.category as any || existingFile.category,
                    updatedAt: new Date()
                }
            });
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
                sectionId: data.sectionId,
                folderId: data.folderId,
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
                        select: { id: true, fullName: true, employeeId: true }
                    },
                    plant: { select: { id: true, name: true } },
                    department: { select: { id: true, name: true } },
                    section: { select: { id: true, name: true } },
                    folder: { select: { id: true, name: true } },
                    shares: {
                        where: { isActive: true },
                        select: { id: true, permission: true, sharedWithAll: true }
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
                uploadedBy: { select: { id: true, fullName: true, employeeId: true, email: true } },
                plant: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
                folder: { select: { id: true, name: true } },
                shares: {
                    where: { isActive: true },
                    include: {
                        sharedWithUser: { select: { id: true, fullName: true, employeeId: true } },
                        sharedWithPlant: { select: { id: true, name: true } },
                        sharedWithDept: { select: { id: true, name: true } }
                    }
                },
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    include: { uploadedBy: { select: { id: true, fullName: true } } }
                },
                accessLogs: {
                    take: 10,
                    orderBy: { accessedAt: 'desc' },
                    include: { user: { select: { id: true, fullName: true } } }
                }
            }
        });
    }

    async updateFile(id: string, data: any) {
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

    async resolveEffectivePermission(userId: string, fileId: string): Promise<string> {
        // Here we evaluate the user's hierarchy and explicit shares
        // For simplicity, we fallback to the old role checks if not overridden.
        // Returning PermissionLevel string like 'VIEW', 'DOWNLOAD', 'MODIFY', 'UPLOAD', 'DELETE', 'MODIFY_ONLINE'
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, plantId: true, departmentId: true, sectionId: true, id: true }
        });

        const file = await prisma.file.findUnique({
            where: { id: fileId },
            include: { shares: { where: { isActive: true } } }
        });

        if (!user || !file) return 'NONE';

        // Base cases
        if (user.role === 'SUPER_ADMIN') return 'UPLOAD'; // Highest
        if (file.uploadedById === user.id) return 'UPLOAD';
        
        // Evaluate shares
        let maxPermLevel = -1;
        const levels = ['VIEW', 'DOWNLOAD', 'MODIFY', 'MODIFY_ONLINE', 'DELETE', 'UPLOAD'];
        
        const updateMax = (perm: string) => {
            const idx = levels.indexOf(perm);
            if (idx > maxPermLevel) maxPermLevel = idx;
        };

        for (const share of file.shares) {
            if (share.sharedWithAll || 
                share.sharedWithUserId === user.id ||
                share.sharedWithPlantId === user.plantId ||
                share.sharedWithDeptId === user.departmentId) {
                updateMax(share.permission);
            }
        }

        // Implicit hierarchical permissions based on roles
        if (user.role === 'PLANT_ADMIN' && user.plantId === file.plantId) updateMax('UPLOAD');
        if (user.role === 'DEPARTMENT_HEAD' && user.departmentId === file.departmentId) updateMax('UPLOAD');

        if (maxPermLevel === -1) return 'NONE';
        return levels[maxPermLevel];
    }

    async canAccessFile(userId: string, fileId: string): Promise<boolean> {
        const perm = await this.resolveEffectivePermission(userId, fileId);
        return perm !== 'NONE';
    }

    async canDownloadFile(userId: string, fileId: string): Promise<boolean> {
        const perm = await this.resolveEffectivePermission(userId, fileId);
        // MODIFY_ONLINE cannot download
        if (perm === 'MODIFY_ONLINE') return false; 
        const levels = ['VIEW', 'DOWNLOAD', 'MODIFY', 'MODIFY_ONLINE', 'DELETE', 'UPLOAD'];
        return perm !== 'NONE' && levels.indexOf(perm) >= 1; 
    }

    async canManageFile(userId: string, fileId: string): Promise<boolean> {
        const perm = await this.resolveEffectivePermission(userId, fileId);
        return ['MODIFY', 'DELETE', 'UPLOAD'].includes(perm);
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