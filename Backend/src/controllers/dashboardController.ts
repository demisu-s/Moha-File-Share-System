// src/controllers/dashboardController.ts
import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';

export class DashboardController {
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await DashboardService.getStats(req.user!);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
  }

  static async getActivity(req: Request, res: Response) {
    try {
      const activity = await DashboardService.getRecentActivity(req.user!);
      res.json({ success: true, data: activity });
    } catch (error) {
      console.error('Error fetching activity:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch activity' });
    }
  }
}