// src/services/userService.ts
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import { Role } from '../generated/prisma';

export class UserService {
  static async getAllUsers(filters?: { plantId?: string; departmentId?: string }) {
    return prisma.user.findMany({
      where: {
        plantId: filters?.plantId,
        departmentId: filters?.departmentId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        employeeId: true,
        role: true,
        isActive: true,
        plantId: true,
        departmentId: true,
        createdAt: true,
      },
    });
  }

  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        employeeId: true,
        role: true,
        isActive: true,
        plantId: true,
        departmentId: true,
        createdAt: true,
      },
    });
  }
  static async createUser(data: {
    email: string;
    password: string;
    fullName: string;
    employeeId: string;
    role: Role;
    plantId?: string;
    departmentId?: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        employeeId: data.employeeId,
        role: data.role,
        plantId: data.plantId,
        departmentId: data.departmentId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        employeeId: true,
        role: true,
        plantId: true,
        departmentId: true,
      },
    });
  }
}