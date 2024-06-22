import dotenv from 'dotenv';
dotenv.config();

import { connectToDatabase } from '../config/db.js';
import { processGPSDataFile } from '../services/gpsdata.services.js';
import Bull from 'bull';
import { logErrorToDatabase, AppError } from '../utils/error.handle.js';
import fs from 'fs';
import { createLogger, transports, format } from 'winston';
import { Mutex } from 'async-mutex';
import chalk from 'chalk';

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(({ timestamp, level, message }) => {
            let colorizer = level === 'info' ? chalk.green :
                            level === 'warn' ? chalk.yellow :
                            level === 'error' ? chalk.red : chalk.blue;
            return `${chalk.blue(timestamp)} [${colorizer(level)}]: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/worker.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        )})
    ]
});

const fileProcessingQueue = new Bull('file-processing', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

const fileProcessingMutex = new Mutex();

const startWorker = async () => {
    logger.info('-----------------------------------------------------');
    logger.info('Starting worker initialization...');
    try {
        await connectToDatabase();
        logger.info('Database connected successfully.');
    } catch (error) {
        logger.error('Database connection error:', error);
        await logErrorToDatabase(new AppError('Database connection error', 500), { path: 'worker', method: 'connectToDatabase' });
        process.exit(1);
    }

    fileProcessingQueue.process(async (job) => {
        const { filePath, fileType, originalFileName, fileDate } = job.data;
        await fileProcessingMutex.runExclusive(async () => {
            try {
                if (!fs.existsSync(filePath)) {
                    throw new AppError(`File not found: ${filePath}`, 404);
                }

                logger.info(`Processing file: ${filePath}`);
                await processGPSDataFile(filePath, fileType, originalFileName, fileDate);

                // Verificar existencia del archivo antes de intentar eliminarlo
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            logger.error('Error deleting file:', err);
                            logErrorToDatabase(new AppError('Error deleting file', 500), { path: 'worker', method: 'unlink' });
                        } else {
                            logger.info(`File deleted: ${filePath}`);
                        }
                    });
                } else {
                    logger.warn(`File already deleted: ${filePath}`);
                }
            } catch (error) {
                if (error.code === 'ENOENT' || error.statusCode === 404) {
                    logger.error(`File not found: ${filePath}`);
                    await logErrorToDatabase(new AppError(`File not found: ${filePath}`, 404), { path: 'worker', method: 'process' });
                } else {
                    logger.error('Processing error:', error);
                    await logErrorToDatabase(new AppError('Processing error', 500), { path: 'worker', method: 'process' });
                    throw error;
                }
            }
        });
    });

    logger.info('Worker is running');
    logger.info('-----------------------------------------------------');
};

startWorker().catch(async (error) => {
    logger.error('Worker initialization error:', error);
    await logErrorToDatabase(new AppError('Worker initialization error', 500), { path: 'worker', method: 'startWorker' });
    logger.info('-----------------------------------------------------');
    process.exit(1);
});