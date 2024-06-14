import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class Despachador extends Model {}

Despachador.init({
    dispatcherID: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Despachador',
});

export default Despachador;