import { prisma } from '../config/database';

export class SettingsService {
    async getSettings() {
        return prisma.systemSettings.findMany();
    }

    async getSetting(key: string) {
        return prisma.systemSettings.findUnique({ where: { key } });
    }

    async updateSetting(key: string, value: any) {
        return prisma.systemSettings.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
    }
}
