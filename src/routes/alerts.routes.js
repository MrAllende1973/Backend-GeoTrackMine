import { Router } from 'express';
import { fetchAnomalyAlerts, resolveAlert, reopenAlert } from '../controllers/alerts.controller.js';
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
            customFormat
        )})
    ]
});

const router = Router();

router.get('/getAlerts', fetchAnomalyAlerts);
router.put('/resolveAlert/:id', resolveAlert);
router.put('/reopenAlert/:id', reopenAlert);

export default router;