import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { initModels } from './models/index.js';
import morgan from 'morgan';
import routes from './routes/index.routes.js';
import cors from 'cors';
import { errorHandler } from './middleware/error.middleware.js';
import { initializeSockets } from './sockets/index.sockets.js';
import { initializeQueue } from './services/gpsdata.services.js';
import { logMiddleware } from './middleware/log.middleware.js';
import { createLogger, transports, format } from 'winston';
import chalk from 'chalk';

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(logMiddleware);  // Añadir el middleware de logging

app.use((req, res, next) => {
    console.log(chalk.blue('----------------------------------------------------------------------------------------------------------'));
    console.time(`Request-Time: ${req.method} ${req.originalUrl}`);
    res.on('finish', () => {
        console.timeEnd(`Request-Time: ${req.method} ${req.originalUrl}`);
        console.log(chalk.blue('----------------------------------------------------------------------------------------------------------\n'));
    });
    next();
});

app.use('/api', routes);
app.use(errorHandler);

const server = createServer(app);
initializeSockets(server);

const startServer = async () => {
    logger.info('Starting server initialization...');
    console.log(chalk.blue('----------------------------------------------------------------------------------------------------------'));
    console.time('Server Initialization');
    try {
        await initModels();
        initializeQueue(); // Inicializar la cola de Bull
        server.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            console.timeEnd('Server Initialization');
            console.log(chalk.blue('----------------------------------------------------------------------------------------------------------\n'));
        });
    } catch (error) {
        logger.error('Error starting server:', error);
        console.timeEnd('Server Initialization');
        console.log(chalk.blue('----------------------------------------------------------------------------------------------------------\n'));
    }
};

startServer();