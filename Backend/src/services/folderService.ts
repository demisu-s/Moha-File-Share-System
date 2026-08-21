import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class FolderService {
    async createFolder(data: {
        name: string;
        description?: string;
        plantId?: string;
        departmentId?: string;
        sectionId?: string;
        parentFolderId?: string;
        createdById: string;
    }) {
        return prisma.folder.create({ data });
    }

    async getFolders(where: any) {
        return prisma.folder.findMany({
            where,
            include: { createdBy: { select: { id: true, fullName: true } } }
        });
    }

    async getFolderById(id: string) {
        return prisma.folder.findUnique({
            where: { id },
            include: { subFolders: true, files: true }
        });
    }

    async updateFolder(id: string, data: any) {
        return prisma.folder.update({
            where: { id },
            data
        });
    }

    async deleteFolder(id: string) {
        return prisma.folder.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date()
            }
        });
    }

    async restoreFolder(id: string) {
        return prisma.folder.update({
            where: { id },
            data: {
                isDeleted: false,
                deletedAt: null
            }
        });
    }

    async hardDeleteFolder(id: string) {
        return prisma.folder.delete({ where: { id } });
    }
}
