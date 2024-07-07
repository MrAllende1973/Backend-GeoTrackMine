// models/AnomalyAlert.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class AnomalyAlert extends Model {}

AnomalyAlert.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    localizacion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    grupo: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    caex: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    flota: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    tpo: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    estado: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    razon: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    este: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    norte: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    cota: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    }
}, {
    sequelize,
    modelName: 'AnomalyAlert',
    tableName: 'anomaly_alerts',
    timestamps: false,
});

export default AnomalyAlert;