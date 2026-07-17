// src/config/database.ts (for Prisma 6)
import mysql from "mysql2/promise";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'appuser',
    password: process.env.DB_PASSWORD || 'apppassword',
    database: process.env.DB_NAME || 'moha_file_share',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize Prisma Client (works with Prisma 6)
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error']
});

// Test database connection
export const testConnection = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};

export { prisma };
export const db = pool;
export default prisma;