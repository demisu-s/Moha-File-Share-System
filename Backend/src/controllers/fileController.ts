// src/controllers/fileController.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { fileUploadSchema, fileUpdateSchema } from '../validators/fileValidator';
import { successResponse, paginatedResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { FileService } from '../services/fileService';
import path from 'path';
import fs from 'fs';

export class FileController {
    private fileService = new FileService();

    async uploadFile(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                throw new AppError('No file uploaded', 400);
            }

            const validated = fileUploadSchema.parse(req.body);
            
            if (validated.plantId) {
                const hasAccess = await this.fileService.canManagePlant(
                    req.user!.id, 
                    validated.plantId
                );
                if (!hasAccess) {
                    throw new AppError('You do not have permission to upload files to this plant', 403);
                }
            }

            if (validated.departmentId) {
                const department = await prisma.department.findUnique({
                    where: { id: validated.departmentId }
                });
                
                if (department && department.plantId !== validated.plantId) {
                    throw new AppError('Department does not belong to the specified plant', 400);
                }
            }

            const file = await this.fileService.uploadFile({
                file: req.file,
                uploadedBy: req.user!.id,
                plantId: validated.plantId,
                departmentId: validated.departmentId,
                description: validated.description,
                category: validated.category
            });

            await prisma.auditLog.create({
                data: {
                    userId: req.user!.id,
                    action: 'UPLOAD',
                    resourceType: 'FILE',
                    resourceId: file.id,
                    details: {
                        fileName: file.fileName,
                        fileSize: file.fileSize
                    }
                }
            });

            logger.info(`File uploaded: ${file.fileName} (${file.id}) by ${req.user?.employeeId}`);
            res.status(201).json(successResponse(file, 'File uploaded successfully'));
        } catch (error) {
            next(error);
        }
    }

    async getAllFiles(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const plantId = req.query.plantId as string;
            const departmentId = req.query.departmentId as string;
            const category = req.query.category as string;
            
            let where: any = { 
                isDeleted: false,
                isActive: true 
            };
            
            if (plantId) {
                where.plantId = plantId;
            }
            
            if (departmentId) {
                where.departmentId = departmentId;
            }
            
            if (category) {
                where.category = category;
            }
            
            if (req.user?.role === 'PLANT_ADMIN') {
                where.plantId = req.user.plantId;
            }
            
            if (req.user?.role === 'DEPARTMENT_HEAD') {
                where.departmentId = req.user.departmentId;
            }

            if (req.user?.role === 'EMPLOYEE' || req.user?.role === 'VIEWER') {
                where.OR = [
                    { departmentId: req.user.departmentId },
                    { uploadedById: req.user.id }
                ];
            }

            if (req.query.search) {
                const search = req.query.search as string;
                where.fileName = { contains: search };
            }

            const result = await this.fileService.getFiles(where, page, limit);

            res.json(paginatedResponse(result.items, result.total, page, limit));
        } catch (error) {
            next(error);
        }
    }

    async getFileById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const file = await this.fileService.getFileById(id as string);
            
            if (!file) {
                throw new AppError('File not found', 404);
            }

            const hasAccess = await this.fileService.canAccessFile(req.user!.id, file.id);
            if (!hasAccess) {
                throw new AppError('You do not have permission to view this file', 403);
            }

            res.json(successResponse(file));
        } catch (error) {
            next(error);
        }
    }

    async downloadFile(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const file = await this.fileService.getFileById(id as string);
            
            if (!file) {
                throw new AppError('File not found', 404);
            }

            const hasAccess = await this.fileService.canAccessFile(req.user!.id, file.id);
            if (!hasAccess) {
                throw new AppError('You do not have permission to download this file', 403);
            }

            await prisma.fileAccessLog.create({
                data: {
                    fileId: file.id,
                    userId: req.user!.id,
                    action: 'DOWNLOAD',
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });

            const filePath = path.join(__dirname, '../../uploads', file.filePath);
            
            if (!fs.existsSync(filePath)) {
                throw new AppError('File not found on server', 404);
            }

            logger.info(`File downloaded: ${file.fileName} (${file.id}) by ${req.user?.employeeId}`);
            res.download(filePath, file.originalName);
        } catch (error) {
            next(error);
        }
    }

    async updateFile(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const validated = fileUpdateSchema.parse(req.body);

            const file = await prisma.file.findUnique({ where: { id: id as string } });
            if (!file) {
                throw new AppError('File not found', 404);
            }

            const hasAccess = await this.fileService.canManageFile(req.user!.id, file.id);
            if (!hasAccess) {
                throw new AppError('You do not have permission to update this file', 403);
            }

            const updated = await this.fileService.updateFile(id as string, validated);

            logger.info(`File updated: ${id} by ${req.user?.employeeId}`);
            res.json(successResponse(updated, 'File updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    async deleteFile(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const file = await prisma.file.findUnique({ where: { id: id as string } });
            if (!file) {
                throw new AppError('File not found', 404);
            }

            const hasAccess = await this.fileService.canManageFile(req.user!.id, file.id);
            if (!hasAccess) {
                throw new AppError('You do not have permission to delete this file', 403);
            }

            const filePath = path.join(__dirname, '../../uploads', file.filePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await this.fileService.deleteFile(id as string);

            await prisma.auditLog.create({
                data: {
                    userId: req.user!.id,
                    action: 'DELETE',
                    resourceType: 'FILE',
                    resourceId: file.id,
                    details: {
                        fileName: file.fileName,
                        reason: 'File deleted'
                    }
                }
            });

            logger.warn(`File deleted: ${file.fileName} (${id}) by ${req.user?.employeeId}`);
            res.json(successResponse(null, 'File deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}