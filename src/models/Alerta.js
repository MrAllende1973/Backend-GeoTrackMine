import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class Alerta extends Model {}

Alerta.init({
    alertID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    alertType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    dispatcherID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Alerta',
    timestamps: false,
});

export default Alerta;