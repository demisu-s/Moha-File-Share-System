// src/controllers/dashboardController.ts
import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';
import { successResponse } from '../utils/response';

export class DashboardController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await DashboardService.getStats(req.user!);
      res.json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }

  static async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const activity = await DashboardService.getRecentActivity(req.user!);
      res.json(successResponse(activity));
    } catch (error) {
      next(error);
    }
  }
}