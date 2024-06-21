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
import chalk from 'chalk';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(logMiddleware);  // Añadir el middleware de logging

app.use((req, res, next) => {
    console.log(chalk.blue('-----------------------------------------------------'));
    console.time(`Request-Time: ${req.method} ${req.originalUrl}`);
    res.on('finish', () => {
        console.timeEnd(`Request-Time: ${req.method} ${req.originalUrl}`);
        console.log(chalk.blue('-----------------------------------------------------'));
    });
    next();
});

app.use('/api', routes);
app.use(errorHandler);

const server = createServer(app);
initializeSockets(server);

const startServer = async () => {
    console.log(chalk.blue('-----------------------------------------------------'));
    console.time('Server Initialization');
    try {
        await initModels();
        initializeQueue(); // Inicializar la cola de Bull
        server.listen(PORT, () => {
            console.log(chalk.green(`Servidor corriendo en puerto ${PORT}`));
            console.timeEnd('Server Initialization');
        });
    } catch (error) {
        console.error(chalk.red('Error al iniciar la aplicación:', error));
        console.timeEnd('Server Initialization');
    }
    console.log(chalk.blue('-----------------------------------------------------'));
};

startServer();