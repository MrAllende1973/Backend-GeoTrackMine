import { Router } from 'express';
import multer from 'multer';
import { uploadGPSDataFile, getJobStatus } from '../controllers/gpsdata.controller.js';
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
        new transports.File({ filename: 'logs/routes.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        )})
    ]
});

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

const upload = multer({ storage: storage });

router.post('/upload', (req, res, next) => {
    logger.info(`Request received: ${req.method} ${req.originalUrl}`);
    upload.single('file')(req, res, (err) => {
        if (err) {
            return next(err);
        }
        uploadGPSDataFile(req, res, next);
    });
});

router.get('/job/:id', (req, res, next) => {
    logger.info(`Request received: ${req.method} ${req.originalUrl}`);
    getJobStatus(req, res, next);
});

export default router;