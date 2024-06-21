import { processGPSDataFile, getFileProcessingQueue } from '../services/gpsdata.services.js';
import { createApiResponse } from '../utils/response.handle.js';
import chalk from 'chalk';

export const uploadGPSDataFile = async (req, res) => {
    console.time(chalk.cyan('controller'));
    if (!req.file) {
        console.timeEnd(chalk.cyan('controller'));
        return res.status(400).json(createApiResponse(false, 'No se ha subido ningún archivo', 400, null));
    }

    const fileType = req.file.mimetype === 'text/csv' ? 'csv' : 
                     req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 'excel' : 
                     'unsupported';
    const filePath = req.file.path;

    try {
        if (fileType === 'unsupported') {
            throw new Error('Tipo de archivo no soportado');
        }
        
        const queue = getFileProcessingQueue();
        const job = await queue.add({ filePath, fileType });

        res.status(202).json(createApiResponse(true, `Archivo en cola para procesamiento. ID de trabajo: ${job.id}`, 202, { jobId: job.id }));
    } catch (error) {
        console.error(chalk.red(`Error en el controlador: ${error.message}`));
        if (error.errors) {
            console.error(chalk.red('Detalles del error de validación:', error.errors));
        }
        res.status(500).json(createApiResponse(false, `Error al procesar el archivo: ${error.message}`, 500, error.errors));
    } finally {
        console.timeEnd(chalk.cyan('controller'));
    }
};

export const getJobStatus = async (req, res) => {
    const jobId = req.params.id;
    const queue = getFileProcessingQueue();
    const job = await queue.getJob(jobId);

    if (job === null) {
        res.status(404).json(createApiResponse(false, 'Trabajo no encontrado', 404, null));
    } else {
        const state = await job.getState();
        const progress = job._progress;
        res.json(createApiResponse(true, 'Estado del trabajo recuperado', 200, { jobId, state, progress }));
    }
};