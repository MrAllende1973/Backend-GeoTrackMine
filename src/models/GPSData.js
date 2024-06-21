import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import ExcelJS from 'exceljs';
import csv from 'csv-parser';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

class GPSData extends Model {
    static async loadFromCSV(filePath) {
        console.time(chalk.magenta('loadFromCSV'));
        const fileID = uuidv4();
        const rows = await this.parseCSV(filePath);
        await this.insertInBatches(fileID, rows);
        console.timeEnd(chalk.magenta('loadFromCSV'));
    }

    static async loadFromXLSX(filePath) {
        console.time(chalk.magenta('loadFromXLSX'));
        const fileID = uuidv4();
        const rows = await this.parseExcel(filePath);
        await this.insertInBatches(fileID, rows);
        console.timeEnd(chalk.magenta('loadFromXLSX'));
    }

    static async parseCSV(filePath) {
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

    static async insertInBatches(fileID, rows) {
        console.time(chalk.magenta('insertInBatches'));
        const batchSize = 8000;

        try {
            await sequelize.transaction(async (t) => {
                for (let i = 0; i < rows.length; i += batchSize) {
                    const batch = rows.slice(i, i + batchSize);
                    const jsonData = JSON.stringify(batch);
                    await this.insertBatch(fileID, jsonData, t);
                }
            });
        } catch (error) {
            console.error(chalk.red('Error inserting batches:', error.message));
            throw error;
        }
        console.timeEnd(chalk.magenta('insertInBatches'));
    }

    static async insertBatch(fileID, jsonData, transaction) {
        try {
            const query = 'CALL InsertGPSData(:fileID, :jsonData)';
            await sequelize.query(query, {
                replacements: { fileID, jsonData },
                raw: true,
                transaction
            });
        } catch (error) {
            console.error(chalk.red('Error during batch insert:', error.message));
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
}, {
    sequelize,
    modelName: 'GPSData',
    timestamps: false,
});

export default GPSData;