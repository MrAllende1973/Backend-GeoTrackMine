import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import chalk from 'chalk';

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
        logging: false,
        dialectOptions: {
            supportBigNumbers: true,
            bigNumberStrings: true,
        }
    }
);
console.timeEnd('Database Initialization');

const connectToDatabase = async () => {
    console.time('Database Connection');
    try {
        await sequelize.authenticate();
        console.log(chalk.green('Conexión establecida con éxito.'));
        console.timeEnd('Database Connection');
    } catch (error) {
        console.error(chalk.red('No se puede conectar a la base de datos:', error));
        console.timeEnd('Database Connection');
        process.exit(1);
    }
};

export { sequelize, connectToDatabase };