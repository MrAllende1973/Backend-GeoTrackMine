import AnomalyAlert from '../models/AnomalyAlert.js';

export const getAnomalyAlerts = async () => {
    try {
        const alerts = await AnomalyAlert.findAll();
        return alerts;
    } catch (error) {
        throw new Error('Error fetching anomaly alerts');
    }
};

export const updateAlertState = async (id, newState) => {
    try {
        const alert = await AnomalyAlert.findByPk(id);
        if (!alert) {
            throw new Error('Alert not found');
        }

        const validStates = ['Demora', 'Reserva', 'Resuelta', 'Reabierta'];
        if (!validStates.includes(newState)) {
            throw new Error('Invalid state');
        }

        // Permitir cambios de estado según la lógica requerida
        if ((alert.estado === 'Demora' || alert.estado === 'Reserva') && newState === 'Resuelta') {
            alert.estado = newState;
        } else if (alert.estado === 'Resuelta' && newState === 'Reabierta') {
            alert.estado = 'Reabierta';
        } else if (alert.estado === 'Reabierta' && newState === 'Resuelta') {
            alert.estado = 'Resuelta';
        } else {
            throw new Error('Invalid state transition');
        }

        await alert.save();
        return alert;
    } catch (error) {
        throw new Error('Error updating alert state');
    }
};