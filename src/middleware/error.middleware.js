import { logErrorToDatabase } from '../utils/error.handle.js';
import { createApiResponse } from '../utils/response.handle.js';

// Middleware para manejar errores
const errorHandler = async (err, req, res, next) => {
    // Log el error en la base de datos
    await logErrorToDatabase(err, req);

    // Crear la respuesta del API
    const response = createApiResponse(false, err.message, err.statusCode || 500, null);

    // Enviar la respuesta al cliente
    res.status(err.statusCode || 500).json(response);
};

export { errorHandler };