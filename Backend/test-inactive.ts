import { prisma } from './src/config/database';
async function main() {
    const inactive = await prisma.user.findMany({where: {isActive: false}, select: {email: true, fullName: true, departmentId: true, plantId: true}});
    console.log(`Inactive users details:`, JSON.stringify(inactive, null, 2));
}
main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
