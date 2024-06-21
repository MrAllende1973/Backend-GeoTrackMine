import GPSData from '../models/GPSData.js';
import { AppError } from '../utils/error.handle.js';
import Bull from 'bull';
import chalk from 'chalk';

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

export const processGPSDataFile = async (filePath, fileType) => {
    console.time(chalk.cyan('service'));
    try {
        console.log(chalk.magenta(`Procesando archivo ${fileType === 'csv' ? 'CSV' : 'Excel'}: ${filePath}`));
        if (fileType === 'csv') {
            await GPSData.loadFromCSV(filePath);
        } else if (fileType === 'excel') {
            await GPSData.loadFromXLSX(filePath);
        } else {
            throw new AppError('Tipo de archivo no soportado', 400);
        }
        console.log(chalk.green('Archivo procesado y datos almacenados con éxito'));
    } catch (error) {
        console.error(chalk.red(`Error al procesar el archivo: ${error.message}`));
        if (error.errors) {
            console.error(chalk.red('Detalles del error de validación:', error.errors));
        }
        throw new AppError(`Error al procesar el archivo: ${error.message}`, 500, error.errors);
    } finally {
        console.timeEnd(chalk.cyan('service'));
    }
};