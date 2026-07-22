// src/controllers/userController.ts
import { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  // GET /api/users
  static async getAllUsers(req: Request, res: Response) {
    try {
      const { plantId, departmentId } = req.query;

      const users = await UserService.getAllUsers({
        plantId: plantId as string | undefined,
        departmentId: departmentId as string | undefined,
      });

      res.json({ success: true, data: users });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  }

// GET /api/users/:id
static async getUserById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const user = await UserService.getUserById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
  }
  static async createUser(req: Request, res: Response) {
    try {
      const user = await UserService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Email or employee ID already exists' });
      }
      console.error('Error creating user:', error);
      res.status(500).json({ success: false, message: 'Failed to create user' });
    }
  }
}