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

const app = express();
const PORT = process.env.PORT || 3000;

// Logging de solicitudes HTTP
app.use(morgan('combined'));

// Configuración de CORS
app.use(cors());

// Middleware para analizar solicitudes con payloads JSON
app.use(express.json());

// Middleware para medir el tiempo de ejecución de cada solicitud
app.use((req, res, next) => {
    console.time(`Request-Time: ${req.method} ${req.originalUrl}`);
    res.on('finish', () => {
        console.timeEnd(`Request-Time: ${req.method} ${req.originalUrl}`);
    });
    next();
});

// Montaje de las rutas API
app.use('/api', routes);

// Middleware para manejo de errores
app.use(errorHandler);

// Crear el servidor HTTP
const server = createServer(app);

// Inicializar Socket.io
initializeSockets(server);

// Función para iniciar el servidor
const startServer = async () => {
    console.time('Server Initialization');
    try {
        await initModels(); // Inicializar y sincronizar los modelos
        server.listen(PORT, () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
            console.timeEnd('Server Initialization');
        });
    } catch (error) {
        console.error('Error al iniciar la aplicación:', error);
        console.timeEnd('Server Initialization');
    }
};

// Función anónima autoejecutable para iniciar la aplicación
startServer();