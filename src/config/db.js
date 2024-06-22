import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { createLogger, transports, format } from 'winston';
import chalk from 'chalk';

dotenv.config();

const customFormat = format.printf(({ timestamp, level, message }) => {
    let colorizer = level === 'info' ? chalk.green :
                    level === 'warn' ? chalk.yellow :
                    level === 'error' ? chalk.red : chalk.blue;
    return `${chalk.blue(timestamp)} [${colorizer(level)}]: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        customFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/db.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        )})
    ]
});

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
        logger.info('Conexión establecida con éxito.');
        console.timeEnd('Database Connection');
    } catch (error) {
        logger.error('No se puede conectar a la base de datos:', error);
        console.timeEnd('Database Connection');
        process.exit(1);
    }
};

export { sequelize, connectToDatabase };