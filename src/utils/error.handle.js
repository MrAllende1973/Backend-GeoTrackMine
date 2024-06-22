import Log from '../models/Log.js';
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

// Función para registrar errores en la base de datos
const logErrorToDatabase = async (err, context = {}) => {
    try {
        await Log.create({
            level: err.status || 'error',
            message: err.message,
            component: context.path || 'unknown',
            details: {
                method: context.method || 'unknown',
                user: context.user || 'unknown',
                ip: context.ip || 'unknown',
                stack: err.stack,
                statusCode: err.statusCode || 500,
            },
        });
        logger.error(`Logged error to database: ${err.message}`);
    } catch (error) {
        logger.error('Error logging to database:', error);
    }
};

// Clases de Error
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequestError extends AppError {
    constructor(message = "Bad Request") {
        super(message, 400);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

class NotFoundError extends AppError {
    constructor(message = "Not Found") {
        super(message, 404);
    }
}

class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super(message, 409);
    }
}

class InternalServerError extends AppError {
    constructor(message = "Internal Server Error") {
        super(message, 500, false);
    }
}

export {
    logErrorToDatabase,
    AppError,
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
    ConflictError,
    InternalServerError
};