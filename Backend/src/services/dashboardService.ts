// src/services/dashboardService.ts
import { prisma } from '../config/database';

export class DashboardService {
  // Scoped stats — a SUPER_ADMIN sees everything, others see only their plant/department
  static async getStats(user: { role: string; plantId?: string | null; departmentId?: string | null }) {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isPlantAdmin = user.role === 'PLANT_ADMIN';

    // Build a Prisma "where" filter based on who's asking
    const plantFilter = isSuperAdmin ? {} : { plantId: user.plantId ?? undefined };
    const deptFilter =
      isSuperAdmin || isPlantAdmin
        ? plantFilter
        : { departmentId: user.departmentId ?? undefined };

    const [totalUsers, totalFiles, totalPlants, totalDepartments, recentFiles] =
      await Promise.all([
        prisma.user.count({ where: isSuperAdmin ? {} : plantFilter }),
        prisma.file.count({ where: { isDeleted: false, ...deptFilter } }),
        isSuperAdmin ? prisma.plant.count() : Promise.resolve(null),
        isSuperAdmin || isPlantAdmin
          ? prisma.department.count({ where: plantFilter })
          : Promise.resolve(null),
        prisma.file.findMany({
          where: { isDeleted: false, ...deptFilter },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            originalName: true,
            fileSize: true,
            createdAt: true,
            uploadedBy: { select: { fullName: true } },
          },
        }),
      ]);

    return {
      totalUsers,
      totalFiles,
      totalPlants,
      totalDepartments,
      recentFiles,
    };
  }

  // Recent activity feed, scoped the same way
  static async getRecentActivity(user: { role: string; id: string }, limit = 10) {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    return prisma.auditLog.findMany({
      where: isSuperAdmin ? {} : { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        resourceType: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
    });
  }
}