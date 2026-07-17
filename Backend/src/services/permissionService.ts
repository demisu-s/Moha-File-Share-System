// src/services/permissionService.ts
import { prisma } from '../config/database';

export class PermissionService {
  static async canManagePlant(userId: string, plantId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plant: true }
    });
    
    if (!user) return false;
    
    // Super admin can manage all plants
    if (user.role === 'SUPER_ADMIN') return true;
    
    // Plant admin can only manage their own plant
    if (user.role === 'PLANT_ADMIN' && user.plantId === plantId) return true;
    
    return false;
  }
  
  static async canManageDepartment(userId: string, departmentId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plant: true, department: true }
    });
    
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'PLANT_ADMIN' && user.plant?.departments?.some(d => d.id === departmentId)) {
      return true;
    }
    if (user.role === 'DEPARTMENT_HEAD' && user.departmentId === departmentId) return true;
    
    return false;
  }
  
  static async canAccessFile(userId: string, fileId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plant: true, department: true }
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
    if (user.role === 'SUPER_ADMIN') return true;
    
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
    
    return false;
  }
}