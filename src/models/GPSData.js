import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import ExcelJS from 'exceljs';
import csv from 'csv-parser';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';
import { logErrorToDatabase, AppError } from '../utils/error.handle.js';
import { Mutex } from 'async-mutex';
import crypto from 'crypto';
import { createLogger, transports, format } from 'winston';

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
        new transports.File({ filename: 'logs/gpsdata.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        )})
    ]
});

const insertBatchMutex = new Mutex();

class GPSData extends Model {
    static async loadFromCSV(filePath, originalFileName, fileDate) {
        if (!fs.existsSync(filePath)) {
            throw new AppError(`File not found: ${filePath}`, 404);
        }

        logger.info(`Loading data from CSV: ${filePath}`);
        console.time(chalk.magenta('loadFromCSV'));
        const fileID = uuidv4();
        const rows = await this.parseCSV(filePath);
        const originalHash = this.calculateHash(rows);

        await this.insertInBatches(fileID, rows, originalFileName, fileDate, originalHash);
        console.timeEnd(chalk.magenta('loadFromCSV'));
    }

    static async loadFromXLSX(filePath, originalFileName, fileDate) {
        if (!fs.existsSync(filePath)) {
            throw new AppError(`File not found: ${filePath}`, 404);
        }

        logger.info(`Loading data from XLSX: ${filePath}`);
        console.time(chalk.magenta('loadFromXLSX'));
        const fileID = uuidv4();
        const rows = await this.parseExcel(filePath);
        const originalHash = this.calculateHash(rows);

        await this.insertInBatches(fileID, rows, originalFileName, fileDate, originalHash);
        console.timeEnd(chalk.magenta('loadFromXLSX'));
    }

    static async parseCSV(filePath) {
        logger.info(`Parsing CSV: ${filePath}`);
        console.time(chalk.magenta('parseCSV'));
        return new Promise((resolve, reject) => {
            const rows = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    rows.push(row);
                })
                .on('end', () => {
                    console.timeEnd(chalk.magenta('parseCSV'));
                    resolve(rows);
                })
                .on('error', (error) => {
                    console.timeEnd(chalk.magenta('parseCSV'));
                    reject(error);
                });
        });
    }

    static async parseExcel(filePath) {
        logger.info(`Parsing Excel: ${filePath}`);
        console.time(chalk.magenta('parseExcel'));
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];
        const rows = [];
        const headers = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    headers[colNumber - 1] = cell.value;
                });
            } else {
                const rowData = {};
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    rowData[headers[colNumber - 1]] = cell.value;
                });
                rows.push(rowData);
            }
        });

        console.timeEnd(chalk.magenta('parseExcel'));
        return rows;
    }

    static calculateHash(rows) {
        const hash = crypto.createHash('sha256');
        rows.forEach(row => {
            hash.update(JSON.stringify(row));
        });
        return hash.digest('hex');
    }

    static async insertInBatches(fileID, rows, originalFileName, fileDate, originalHash) {
        logger.info('Inserting data in batches');
        console.time(chalk.magenta('insertInBatches'));
        const batchSize = 8000;
        const maxRetries = 3;
        let combinedHash = crypto.createHash('sha256');

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const jsonData = JSON.stringify(batch);
            let success = false;
            let retries = 0;

            while (!success && retries < maxRetries) {
                try {
                    await insertBatchMutex.runExclusive(async () => {
                        await sequelize.transaction(async (t) => {
                            await this.insertBatch(fileID, jsonData, originalFileName, fileDate, t);
                        });
                    });

                    batch.forEach(row => combinedHash.update(JSON.stringify(row)));
                    logger.info(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(rows.length / batchSize)}`);
                    success = true;
                } catch (error) {
                    retries += 1;
                    await logErrorToDatabase(new AppError(error.message, 500), { path: 'insertInBatches', method: 'insertBatch' });
                    logger.error(`Error inserting batch ${i / batchSize + 1}, retrying (${retries}/${maxRetries}):`, error.message);
                    if (retries >= maxRetries) {
                        logger.error('Max retries reached, aborting batch insert.');
                        throw error;
                    }
                }
            }
        }

        const finalHash = combinedHash.digest('hex');
        if (finalHash !== originalHash) {
            logger.error('Data verification failed: hashes do not match');
            throw new AppError('Data verification failed: hashes do not match', 500);
        }

        console.timeEnd(chalk.magenta('insertInBatches'));
        logger.info('Data inserted successfully and verified');
    }

    static async insertBatch(fileID, jsonData, originalFileName, fileDate, transaction) {
        try {
            const query = 'CALL InsertGPSData(:fileID, :jsonData, :originalFileName, :fileDate)';
            await sequelize.query(query, {
                replacements: { fileID, jsonData, originalFileName, fileDate },
                raw: true,
                transaction
            });
        } catch (error) {
            logger.error('Error during batch insert:', error.message);
            throw error;
        }
    }
}

GPSData.init({
    fileID: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    batchID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    data: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    originalFileName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fileDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'GPSData',
    timestamps: false,
});

export default GPSData;