import morgan from 'morgan';
import HTTPLog from '../models/HTTPLog.js';
import { createLogger, transports, format } from 'winston';
import chalk from 'chalk';

// Configuración de tokens personalizados
morgan.token('ip', (req) => req.ip);
morgan.token('referer', (req) => req.headers['referer'] || req.headers['referrer'] || '-');
morgan.token('user-agent', (req) => req.headers['user-agent']);
morgan.token('response-time', (req, res, digits) => {
    const start = req._startAt || [0, 0];
    const diff = process.hrtime(start);
    const time = diff[0] * 1e3 + diff[1] * 1e-6;
    return time.toFixed(digits);
});

// Formato personalizado para Morgan
const morganFormat = ':method|:url|:status|:response-time ms|:ip|:referer|:user-agent|';

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
        new transports.File({ filename: 'logs/app.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        )})
    ]
});

export const logMiddleware = morgan(morganFormat, {
    immediate: false,
    stream: {
        write: async (message) => {
            const [method, url, status, responseTime, ip, referer, userAgent] = message.trim().split('|');
            let logLevel = determineLogLevel(parseInt(status, 10));
            let errorMessage = parseInt(status, 10) >= 400 ? 'Error en la solicitud' : '';

            logger.info(`Logging HTTP request: ${message}`);  // Para depuración

            try {
                await HTTPLog.create({
                    requestMethod: method,
                    requestURL: url,
                    clientIP: ip,
                    referer: referer,
                    userAgent: userAgent,
                    logLevel: logLevel,
                    httpStatus: parseInt(status, 10),
                    responseTime: parseFloat(responseTime),
                    errorMessage: errorMessage
                });
            } catch (error) {
                logger.error("Error al insertar log en la base de datos:", error);
            }

            // Añadir línea de separación después de cada registro de solicitud
            console.log(chalk.blue('----------------------------------------------------------------------------------------------------------\n'));
        }
    }
});

function determineLogLevel(statusCode) {
    if (statusCode >= 500) return 'CRITICAL'; // O 'FATAL' dependiendo de la gravedad
    if (statusCode >= 400) return 'ERROR';
    if (statusCode >= 300) return 'WARN';
    return 'INFO'; // O 'DEBUG' para más detalles en respuestas exitosas
}