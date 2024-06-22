import { processGPSDataFile, getFileProcessingQueue } from '../services/gpsdata.services.js';
import { createApiResponse } from '../utils/response.handle.js';
import { createLogger, transports, format } from 'winston';
import chalk from 'chalk';

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
        new transports.File({ filename: 'logs/controller.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        )})
    ]
});

const formatDateForMySQL = (date) => {
    const d = new Date(date);
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const uploadGPSDataFile = async (req, res) => {
    console.time(chalk.cyan('controller'));
    logger.info('Uploading GPS data file');
    if (!req.file) {
        console.timeEnd(chalk.cyan('controller'));
        return res.status(400).json(createApiResponse(false, 'No se ha subido ningún archivo', 400, null));
    }

    const fileType = req.file.mimetype === 'text/csv' ? 'csv' : 
                     req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 'excel' : 
                     'unsupported';
    const filePath = req.file.path;
    const originalFileName = req.file.originalname;
    const fileDate = formatDateForMySQL(new Date());

    try {
        if (fileType === 'unsupported') {
            throw new Error('Tipo de archivo no soportado');
        }
        
        const queue = getFileProcessingQueue();
        const job = await queue.add({ filePath, fileType, originalFileName, fileDate });

        res.status(202).json(createApiResponse(true, `Archivo en cola para procesamiento. ID de trabajo: ${job.id}`, 202, { jobId: job.id }));
    } catch (error) {
        logger.error(`Error in controller: ${error.message}`);
        if (error.errors) {
            logger.error('Validation error details:', error.errors);
        }
        res.status(500).json(createApiResponse(false, `Error al procesar el archivo: ${error.message}`, 500, error.errors));
    } finally {
        console.timeEnd(chalk.cyan('controller'));
    }
};

export const getJobStatus = async (req, res) => {
    const jobId = req.params.id;
    const queue = getFileProcessingQueue();
    const job = await queue.getJob(jobId);

    if (job === null) {
        res.status(404).json(createApiResponse(false, 'Trabajo no encontrado', 404, null));
    } else {
        const state = await job.getState();
        const progress = job._progress;
        res.json(createApiResponse(true, 'Estado del trabajo recuperado', 200, { jobId, state, progress }));
    }
};