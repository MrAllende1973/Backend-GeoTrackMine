import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class AlertManager extends Model {}

AlertManager.init({
    managerID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    alertThresholds: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    dataBuffer: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    alertsGenerated: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    lastProcessedTimestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    processingInterval: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'AlertManager',
});

export default AlertManager;