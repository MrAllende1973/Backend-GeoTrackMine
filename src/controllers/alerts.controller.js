// controllers/anomalyAlert.controller.js
import { getAnomalyAlerts } from '../services/alerts.services.js';
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
        new transports.File({ filename: 'logs/alerts.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        )})
    ]
});

export const fetchAnomalyAlerts = async (req, res) => {
    try {
        const alerts = await getAnomalyAlerts();
        res.json(createApiResponse(true, 'Fetched anomaly alerts successfully', 200, alerts));
    } catch (error) {
        logger.error('Error fetching anomaly alerts:', error.message);
        res.status(500).json(createApiResponse(false, 'Error fetching anomaly alerts', 500, null));
    }
};