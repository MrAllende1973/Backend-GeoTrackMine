import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class HTTPLog extends Model {}

HTTPLog.init({
    logId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    requestMethod: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    requestURL: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    clientIP: {
        type: DataTypes.STRING,
    },
    referer: {
        type: DataTypes.STRING,
    },
    logLevel: {
        type: DataTypes.STRING,
        defaultValue: 'INFO',
    },
    httpStatus: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    responseTime: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    errorMessage: {
        type: DataTypes.TEXT,
    },
}, {
    sequelize,
    modelName: 'HTTPLog',
    timestamps: false,
});

export default HTTPLog;