// routes/gpsdata.routes.js
import { Router } from 'express';
import multer from 'multer';
import { uploadGPSDataFile } from '../controllers/gpsdata.controller.js';

const router = Router();

// Configuración de multer
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
    console.time('routeHandler');
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.timeEnd('routeHandler');
            return next(err);
        }
        uploadGPSDataFile(req, res).finally(() => {
            console.timeEnd('routeHandler');
        });
    });
});

export default router;