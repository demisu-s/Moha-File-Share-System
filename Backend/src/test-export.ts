import { PrismaClient } from './generated/prisma';
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!user) {
    console.log('No super admin found');
    return;
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, plantId: user.plantId },
    process.env.JWT_SECRET || 'your-secret-key-change-it-in-production',
    { expiresIn: '1d' }
  );

  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/bulk-export?status=active',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }, res => {
    console.log('STATUS:', res.statusCode);
    let chunks: any[] = [];
    res.on('data', d => chunks.push(d));
    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log('RESPONSE LENGTH:', buffer.length);
      if (res.statusCode !== 200) {
          console.log('RESPONSE:', buffer.toString());
      }
    });
  });
  req.on('error', e => console.error(e));
  req.end();
}
test();
