import dotenv from 'dotenv';
dotenv.config();

// Importaciones de módulos necesarios
import express from 'express';
import { pool } from './config/db.js';
import morgan from 'morgan';
import routes from './routes/index.routes.js';
import cors from 'cors';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware Configuration
 */
// Logging de solicitudes HTTP
app.use(morgan('combined'));

/**
 * Configuración de CORS para controlar los dominios permitidos
 */
app.use(cors());

// Middleware para analizar solicitudes con payloads JSON
app.use(express.json());

// Montaje de las rutas API
app.use('/api', routes);

// Middleware para manejo de errores
app.use(errorHandler);

/**
 * Función para inicializar conexión con la base de datos.
 * @async
 * @throws {AppError} Lanza un error si no puede conectarse a la base de datos en producción.
 * @throws {Error} Lanza un error si no puede conectarse a la base de datos en desarrollo.
 */
const initializeDatabaseConnection = async() => {
    try {
        const connection = await pool.getConnection();
        console.log('Conexion exitosa a la base de datos');
        connection.release();
    } catch (error) {
        if (process.env.NODE_ENV === 'production') {
            console.error('Error al conectar a la base de datos');
            throw new AppError('Error de servidor', 500);
        } else {
            console.error('Error al conectar a la base de datos:', error);
            throw error;
        }
    }
};

/**
 * Función para iniciar el servidor.
 */
const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
};

/**
 * Función anónima autoejecutable para iniciar la aplicación.
 * @async
 */
(async () => {
    try {
        await initializeDatabaseConnection();
        startServer();
    } catch (error) {
        console.error('Error al iniciar la aplicación:', error);
    }
})();