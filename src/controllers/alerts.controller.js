// controllers/alerts.controller.js
import { getAnomalyAlerts } from '../services/alerts.services.js';
import { createApiResponse } from '../utils/response.handle.js';
import { io } from '../sockets/index.sockets.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';
import { createLogger, transports, format } from 'winston';
import chalk from 'chalk';
import { format as formatDate } from 'date-fns';

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
        new transports.File({ filename: 'logs/alerts.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            customFormat
        )})
    ]
});

const formatAlerts = (alerts) => {
    return alerts.map(alert => ({
        ...alert.toJSON(),
        fecha: formatDate(new Date(alert.fecha), 'yyyy-MM-dd HH:mm:ss')
    }));
};

export const fetchAnomalyAlerts = async (req, res) => {
    try {
        const alerts = await getAnomalyAlerts();
        const formattedAlerts = formatAlerts(alerts);
        res.json(createApiResponse(true, 'Fetched anomaly alerts successfully', 200, formattedAlerts));
        
        // Emit event to all connected clients
        io.emit('alerts-update', formattedAlerts);

        // Enviar mensaje de WhatsApp solo con la última alerta
        if (formattedAlerts.length > 0) {
            const latestAlert = formattedAlerts[formattedAlerts.length - 1];
            const message = `Alerta de Anomalía:\nCAEX: ${latestAlert.caex}\nFlota: ${latestAlert.flota}\nGrupo: ${latestAlert.grupo}\nLocalización: ${latestAlert.localizacion}\nEstado: ${latestAlert.estado}\nRazón: ${latestAlert.razon}\nFecha: ${latestAlert.fecha}`;
            await sendWhatsAppMessage(message);
        }
    } catch (error) {
        logger.error('Error fetching anomaly alerts:', error.message);
        res.status(500).json(createApiResponse(false, 'Error fetching anomaly alerts', 500, null));
    }
};