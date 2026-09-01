import { prisma } from './src/config/database';
async function test() {
    const SA = await prisma.user.findFirst({where: {role: 'SUPER_ADMIN'}});
    console.log("Super admin:", SA?.employeeId);
    try {
        const res = await fetch('http://localhost:5000/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({employeeId: SA?.employeeId, password: 'password123'})});
        const data = await res.json();
        const token = data.data.token;
        const usersRes = await fetch('http://localhost:5000/api/users?limit=1000&status=inactive', {headers: {Authorization: 'Bearer ' + token}});
        const usersData = await usersRes.json();
        console.log('Users res:', JSON.stringify(usersData, null, 2));
    } catch(e) { console.error(e); }
}
test().finally(() => prisma.$disconnect());
