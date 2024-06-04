// Importaciones necesarias
import { Router } from 'express';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AppError } from '../utils/error.handle.js';

// Recreando la funcionalidad de __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Definición de constantes
const PATH_ROUTER = `${__dirname}`;
const router = Router();

/**
 * Limpia el nombre del archivo, eliminando la extensión ".routes.js"
 * @param {string} fileName - Nombre del archivo a limpiar
 * @returns {string} Nombre del archivo sin extensión
 */
const cleanFileName = (fileName) => fileName.replace('.routes.js', '');

/**
 * Intenta importar y montar las rutas de un archivo específico.
 * @param {string} file - Nombre del archivo a importar
 */
const loadRoutesFromFile = async (file) => {
    const cleanName = cleanFileName(file);
    if (cleanName !== 'index') {
        try {
            const module = await import(`./${cleanName}.routes.js`);
            console.log(`Se estan cargando las rutas... /${cleanName}`);
            router.use(`/${cleanName}`, module.default);
        } catch (error) {
            throw new AppError(`Error al cargar rutas de ${cleanName}: ${error.message}`, 500);
        }
    }
};

/**
 * Lee dinámicamente los archivos de rutas en el directorio "src/routes"
 * y registra las rutas en el router.
 */
const loadRoutes = () => {
    const files = readdirSync(PATH_ROUTER);
    files.forEach(loadRoutesFromFile);
};

// Carga las rutas al iniciar el módulo
loadRoutes();

export default router;