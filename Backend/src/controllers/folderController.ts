import { Request, Response, NextFunction } from 'express';
import { FolderService } from '../services/folderService';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export class FolderController {
    private folderService = new FolderService();

    constructor() {
        this.createFolder = this.createFolder.bind(this);
        this.getFolders = this.getFolders.bind(this);
        this.getFolderById = this.getFolderById.bind(this);
        this.updateFolder = this.updateFolder.bind(this);
        this.deleteFolder = this.deleteFolder.bind(this);
    }

    async createFolder(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, description, plantId, departmentId, sectionId, parentFolderId } = req.body;
            if (!name) {
                throw new AppError('Name is required', 400);
            }
            // Add permission check to see if user can upload (Level 6) in this scope. For now, checking later.
            const folder = await this.folderService.createFolder({
                name, description, plantId, departmentId, sectionId, parentFolderId, createdById: req.user!.id
            });
            res.status(201).json(successResponse(folder, 'Folder created successfully'));
        } catch (error) {
            next(error);
        }
    }

    async getFolders(req: Request, res: Response, next: NextFunction) {
        try {
            const { plantId, departmentId, sectionId, parentFolderId } = req.query;
            let where: any = {};
            if (plantId) where.plantId = plantId;
            if (departmentId) where.departmentId = departmentId;
            if (sectionId) where.sectionId = sectionId;
            
            // If parentFolderId is explicitly passed as null or undefined string, handle it
            if (parentFolderId === 'null') {
                where.parentFolderId = null;
            } else if (parentFolderId) {
                where.parentFolderId = parentFolderId;
            }
            
            const folders = await this.folderService.getFolders(where);
            res.json(successResponse(folders));
        } catch (error) {
            next(error);
        }
    }

    async getFolderById(req: Request, res: Response, next: NextFunction) {
        try {
            const folder = await this.folderService.getFolderById(req.params.id as string);
            if (!folder) throw new AppError('Folder not found', 404);
            res.json(successResponse(folder));
        } catch (error) {
            next(error);
        }
    }

    async updateFolder(req: Request, res: Response, next: NextFunction) {
        try {
            const folder = await this.folderService.updateFolder(req.params.id as string, req.body);
            res.json(successResponse(folder, 'Folder updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    async deleteFolder(req: Request, res: Response, next: NextFunction) {
        try {
            await this.folderService.deleteFolder(req.params.id as string);
            res.json(successResponse(null, 'Folder deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}
