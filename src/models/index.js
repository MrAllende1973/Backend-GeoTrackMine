import { sequelize } from '../config/db.js';
import Log from './Log.js';
import Alerta from './Alerta.js';
import AlertManager from './AlertManager.js';
import Despachador from './Despachador.js';
import GPSData from './GPSData.js';

const initModels = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection established successfully.');

        await sequelize.sync();
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Unable to initialize models:', error);
    }
};

export { initModels, Log, Alerta, AlertManager, Despachador, GPSData };