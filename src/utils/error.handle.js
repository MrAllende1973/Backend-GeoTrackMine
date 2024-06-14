import Log from '../models/Log.js';

// Función para registrar errores en la base de datos
const logErrorToDatabase = async (err, req) => {
    try {
        await Log.create({
            level: err.status || 'error',
            message: err.message,
            component: req.path,
            details: {
                method: req.method,
                stack: err.stack,
                statusCode: err.statusCode || 500,
            },
        });
    } catch (error) {
        console.error('Error logging to database:', error);
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