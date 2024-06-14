import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

console.time('Database Initialization');
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        dialect: 'mysql',
        pool: {
            max: 200,
            min: 0,
            acquire: 60000,
            idle: 10000,
        },
        logging: false, // Desactivar el logging
    }
);
console.timeEnd('Database Initialization');

const connectToDatabase = async () => {
    console.time('Database Connection');
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        console.timeEnd('Database Connection');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        console.timeEnd('Database Connection');
        process.exit(1);
    }
};

export { sequelize, connectToDatabase };