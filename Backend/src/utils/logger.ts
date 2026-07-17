// src/utils/logger.ts
import fs from 'fs';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);

export const logger = {
    info: (message: string, ...args: any[]) => {
        const log = `[INFO] ${new Date().toISOString()} - ${message}`;
        console.log(log, ...args);
        fs.appendFileSync(logFile, log + '\n');
    },
    error: (message: string, ...args: any[]) => {
        const log = `[ERROR] ${new Date().toISOString()} - ${message}`;
        console.error(log, ...args);
        fs.appendFileSync(logFile, log + '\n');
    },
    warn: (message: string, ...args: any[]) => {
        const log = `[WARN] ${new Date().toISOString()} - ${message}`;
        console.warn(log, ...args);
        fs.appendFileSync(logFile, log + '\n');
    },
    debug: (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
            const log = `[DEBUG] ${new Date().toISOString()} - ${message}`;
            console.debug(log, ...args);
            fs.appendFileSync(logFile, log + '\n');
        }
    }
};