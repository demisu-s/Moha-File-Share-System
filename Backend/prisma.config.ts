// prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
    datasource: {
        url: process.env.DATABASE_URL || 'mysql://appuser:apppassword@localhost:3306/moha_file_share',
    },
});