// services/anomalyAlert.services.js
import AnomalyAlert from '../models/AnomalyAlert.js';

export const getAnomalyAlerts = async () => {
    try {
        const alerts = await AnomalyAlert.findAll({
            order: [['fecha', 'ASC']]
        });
        return alerts;
    } catch (error) {
        throw new Error('Error fetching anomaly alerts: ' + error.message);
    }
};