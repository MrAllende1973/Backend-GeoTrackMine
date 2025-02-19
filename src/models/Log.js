import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class Log extends Model {}

Log.init({
    logId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    level: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    component: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    details: {
        type: DataTypes.JSON,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Log',
    timestamps: false,
});

export default Log;