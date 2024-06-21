import { Router } from 'express';
import multer from 'multer';
import { uploadGPSDataFile, getJobStatus } from '../controllers/gpsdata.controller.js';
import chalk from 'chalk';

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

const upload = multer({ storage: storage });

router.post('/upload', (req, res, next) => {
    console.log(chalk.green(`Petición recibida: ${req.method} ${req.originalUrl}`));
    upload.single('file')(req, res, (err) => {
        if (err) {
            return next(err);
        }
        uploadGPSDataFile(req, res, next);
    });
});

router.get('/job/:id', (req, res, next) => {
    console.log(chalk.green(`Petición recibida: ${req.method} ${req.originalUrl}`));
    getJobStatus(req, res, next);
});

export default router;