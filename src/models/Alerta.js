import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import Despachador from './Despachador.js';
import GPSData from './GPSData.js';
import AlertManager from './AlertManager.js';

class Alerta extends Model {}

Alerta.init({
    alertID: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    alertType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    dispatcherID: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: Despachador,
            key: 'dispatcherID',
        },
        onDelete: 'SET NULL',
    },
    fileID: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: GPSData,
            key: 'fileID',
        },
        onDelete: 'SET NULL',
    },
    batchID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: GPSData,
            key: 'batchID',
        },
        onDelete: 'CASCADE',
    },
    managerID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: AlertManager,
            key: 'managerID',
        },
        onDelete: 'SET NULL',
    },
    additionalInfo: {
        type: DataTypes.JSON,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'Alerta',
    tableName: 'Alertas', // Asegúrate de que el nombre de la tabla coincida
    timestamps: false,
});

// Definir relaciones
Alerta.belongsTo(Despachador, { foreignKey: 'dispatcherID' });
Alerta.belongsTo(GPSData, { foreignKey: 'fileID' });
Alerta.belongsTo(GPSData, { foreignKey: 'batchID' });
Alerta.belongsTo(AlertManager, { foreignKey: 'managerID' });

export default Alerta;