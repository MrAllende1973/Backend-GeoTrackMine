import { Router } from 'express';
import Alerta from '../models/Alerta.js';
import { createApiResponse } from '../utils/response.handle.js';

const router = Router();

// Ruta para obtener las alertas de prueba
router.get('/', async (req, res) => {
    try {
        const alertas = await Alerta.findAll();
        res.json(createApiResponse(true, 'Fetched alerts successfully', 200, alertas));
    } catch (error) {
        res.status(500).json(createApiResponse(false, 'Error fetching alerts', 500, null));
    }
});

export default router;