import { Request, Response, NextFunction } from 'express';
import { SectionService } from '../services/sectionService';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export class SectionController {
    private sectionService = new SectionService();

    constructor() {
        this.createSection = this.createSection.bind(this);
        this.getSections = this.getSections.bind(this);
        this.getSectionById = this.getSectionById.bind(this);
        this.updateSection = this.updateSection.bind(this);
        this.deleteSection = this.deleteSection.bind(this);
    }

    async createSection(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, departmentId, description } = req.body;
            if (!name || !departmentId) {
                throw new AppError('Name and departmentId are required', 400);
            }
            const section = await this.sectionService.createSection({ name, departmentId, description });
            res.status(201).json(successResponse(section, 'Section created successfully'));
        } catch (error) {
            next(error);
        }
    }

    async getSections(req: Request, res: Response, next: NextFunction) {
        try {
            const { departmentId } = req.query;
            let where: any = { isActive: true };
            if (departmentId) where.departmentId = departmentId as string;
            
            const sections = await this.sectionService.getSections(where);
            res.json(successResponse(sections));
        } catch (error) {
            next(error);
        }
    }

    async getSectionById(req: Request, res: Response, next: NextFunction) {
        try {
            const section = await this.sectionService.getSectionById(req.params.id as string);
            if (!section) throw new AppError('Section not found', 404);
            res.json(successResponse(section));
        } catch (error) {
            next(error);
        }
    }

    async updateSection(req: Request, res: Response, next: NextFunction) {
        try {
            const section = await this.sectionService.updateSection(req.params.id as string, req.body);
            res.json(successResponse(section, 'Section updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    async deleteSection(req: Request, res: Response, next: NextFunction) {
        try {
            await this.sectionService.deleteSection(req.params.id as string);
            res.json(successResponse(null, 'Section deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}
