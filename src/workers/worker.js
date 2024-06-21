import dotenv from 'dotenv';
dotenv.config();

import { connectToDatabase } from '../config/db.js';
import { processGPSDataFile } from '../services/gpsdata.services.js';
import Bull from 'bull';
import { logErrorToDatabase } from '../utils/error.handle.js';
import { AppError } from '../utils/error.handle.js';
import fs from 'fs';
import chalk from 'chalk';

const fileProcessingQueue = new Bull('file-processing', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

const startWorker = async () => {
    console.log(chalk.blue('\n-----------------------------------------------------\n'));
    try {
        await connectToDatabase();
    } catch (error) {
        console.error(chalk.red('Database connection error:', error));
        await logErrorToDatabase(new AppError('Database connection error', 500), { path: 'worker', method: 'connectToDatabase' });
        process.exit(1);
    }

    fileProcessingQueue.process(async (job) => {
        const { filePath, fileType, originalFileName, fileDate } = job.data;
        try {
            console.log(chalk.yellow(`Processing file: ${filePath}`));
            await processGPSDataFile(filePath, fileType, originalFileName, fileDate);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(chalk.red('Error deleting file:', err));
                    logErrorToDatabase(new AppError('Error deleting file', 500), { path: 'worker', method: 'unlink' });
                } else {
                    console.log(chalk.yellow(`File deleted: ${filePath}`));
                }
            });
        } catch (error) {
            console.error(chalk.red('Processing error:', error));
            await logErrorToDatabase(new AppError('Processing error', 500), { path: 'worker', method: 'process' });
            throw error;
        }
    });

    console.log(chalk.green('Worker is running'));
    console.log(chalk.blue('\n-----------------------------------------------------\n'));
};

startWorker().catch(async (error) => {
    console.error(chalk.red('Worker initialization error:', error));
    await logErrorToDatabase(new AppError('Worker initialization error', 500), { path: 'worker', method: 'startWorker' });
    console.log(chalk.blue('\n-----------------------------------------------------\n'));
    process.exit(1);
});