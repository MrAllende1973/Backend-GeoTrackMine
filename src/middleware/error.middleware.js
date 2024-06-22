import { logErrorToDatabase } from '../utils/error.handle.js';
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
        new transports.File({ filename: 'logs/errors.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        )})
    ]
});

// Middleware para manejar errores
const errorHandler = async (err, req, res, next) => {
    // Log el error en la base de datos
    await logErrorToDatabase(err, req);

    // Crear la respuesta del API
    const response = createApiResponse(false, err.message, err.statusCode || 500, null);

    // Enviar la respuesta al cliente
    res.status(err.statusCode || 500).json(response);

    logger.error(`Error: ${err.message}`);
};

export { errorHandler };