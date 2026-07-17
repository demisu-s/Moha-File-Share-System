// src/seed.ts
import { PrismaClient } from "./generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...');
    
    try {
        // Create Super Admin
        const superAdmin = await prisma.user.upsert({
            where: { email: 'superadmin@moha.com' },
            update: {},
            create: {
                email: 'superadmin@moha.com',
                password: await bcrypt.hash('SuperAdmin123!', 10),
                fullName: 'Super Admin',
                employeeId: 'SA001',
                role: 'SUPER_ADMIN'
            }
        });
        console.log('✅ Super Admin created');

        // Create Plant
        const plant1 = await prisma.plant.create({
            data: {
                name: 'Main Factory',
                code: 'PLT-001',
                location: 'Addis Ababa',
                address: 'Bole Road, Addis Ababa, Ethiopia',
                phone: '+251-111-234567',
                email: 'mainfactory@moha.com',
                createdBy: superAdmin.id
            }
        });
        console.log('✅ Plant created');

        // Create Department
        const dept1 = await prisma.department.create({
            data: {
                name: 'Human Resources',
                code: 'DEPT-001',
                description: 'HR Department',
                plantId: plant1.id,
                createdBy: superAdmin.id
            }
        });
        console.log('✅ Department created');

        // Create Plant Admin
        await prisma.user.create({
            data: {
                email: 'admin@factory.moha.com',
                password: await bcrypt.hash('PlantAdmin123!', 10),
                fullName: 'Plant Admin',
                employeeId: 'PA001',
                plantId: plant1.id,
                role: 'PLANT_ADMIN',
                createdBy: superAdmin.id
            }
        });
        console.log('✅ Plant Admin created');

        // Create Department Head
        await prisma.user.create({
            data: {
                email: 'hrhead@factory.moha.com',
                password: await bcrypt.hash('DeptHead123!', 10),
                fullName: 'HR Department Head',
                employeeId: 'DH001',
                plantId: plant1.id,
                departmentId: dept1.id,
                role: 'DEPARTMENT_HEAD',
                createdBy: superAdmin.id
            }
        });
        console.log('✅ Department Head created');

        // Create Employee
        await prisma.user.create({
            data: {
                email: 'employee1@factory.moha.com',
                password: await bcrypt.hash('Employee123!', 10),
                fullName: 'John Doe',
                employeeId: 'EMP001',
                plantId: plant1.id,
                departmentId: dept1.id,
                role: 'EMPLOYEE',
                createdBy: superAdmin.id
            }
        });
        console.log('✅ Employee created');

        console.log('✅ Seed completed successfully!');
    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    }
}

seed()
    .catch((error) => {
        console.error('❌ Seed process failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });