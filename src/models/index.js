import { sequelize } from '../config/db.js';
import Log from './Log.js';
import Alerta from './Alerta.js';
import AlertManager from './AlertManager.js';
import Despachador from './Despachador.js';
import GPSData from './GPSData.js';
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
        new transports.File({ filename: 'logs/models.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        )})
    ]
});

const initModels = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Connection established successfully.');

        await sequelize.sync();
        logger.info('All models were synchronized successfully.');
    } catch (error) {
        logger.error('Unable to initialize models:', error);
    }
};

export { initModels, Log, Alerta, AlertManager, Despachador, GPSData };