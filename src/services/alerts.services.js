// services/alerts.services.js
import AnomalyAlert from '../models/AnomalyAlert.js';

export const getAnomalyAlerts = async () => {
    try {
        const alerts = await AnomalyAlert.findAll();
        return alerts;
    } catch (error) {
        throw new Error('Error fetching anomaly alerts');
    }
};
