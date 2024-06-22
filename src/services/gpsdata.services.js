import GPSData from '../models/GPSData.js';
import { AppError } from '../utils/error.handle.js';
import Bull from 'bull';
import chalk from 'chalk';
import fs from 'fs';
import { createLogger, transports, format } from 'winston';

const customFormat = format.printf(({ timestamp, level, message }) => {
    let colorizer = level === 'info' ? chalk.green :
                    level === 'warn' ? chalk.yellow :
                    level === 'error' ? chalk.red : chalk.blue;
    return `${chalk.blue(timestamp)} [${colorizer(level)}]: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        customFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/services.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        )})
    ]
});

let fileProcessingQueue;

export const initializeQueue = () => {
    fileProcessingQueue = new Bull('file-processing', {
        redis: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        }
    });
};

export const getFileProcessingQueue = () => {
    if (!fileProcessingQueue) {
        initializeQueue();
    }
    return fileProcessingQueue;
};

export const processGPSDataFile = async (filePath, fileType, originalFileName, fileDate) => {
    console.time(chalk.cyan('service'));
    try {
        if (!fs.existsSync(filePath)) {
            throw new AppError(`File not found: ${filePath}`, 404);
        }

        logger.info(`Processing file ${fileType === 'csv' ? 'CSV' : 'Excel'}: ${filePath}`);
        if (fileType === 'csv') {
            await GPSData.loadFromCSV(filePath, originalFileName, fileDate);
        } else if (fileType === 'excel') {
            await GPSData.loadFromXLSX(filePath, originalFileName, fileDate);
        } else {
            throw new AppError('Tipo de archivo no soportado', 400);
        }
        logger.info('Archivo procesado y datos almacenados con éxito');
    } catch (error) {
        if (error.code === 'ENOENT' || error.statusCode === 404) {
            logger.error(`File not found: ${filePath}`);
            throw new AppError(`File not found: ${filePath}`, 404);
        } else {
            logger.error(`Error al procesar el archivo: ${error.message}`);
            throw new AppError(`Error al procesar el archivo: ${error.message}`, 500, error.errors);
        }
    } finally {
        console.timeEnd(chalk.cyan('service'));
    }
};