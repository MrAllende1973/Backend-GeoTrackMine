// models/GPSData.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import ExcelJS from 'exceljs';
import csv from 'csv-parser';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

class GPSData extends Model {
    static async loadFromCSV(filePath) {
        console.time('loadFromCSV');
        const fileID = uuidv4(); // Generar un ID único para todo el archivo
        const rows = await this.parseCSV(filePath);
        await this.insertInBatches(fileID, rows);
        console.timeEnd('loadFromCSV');
    }

    static async loadFromXLSX(filePath) {
        console.time('loadFromXLSX');
        const fileID = uuidv4(); // Generar un ID único para todo el archivo
        const rows = await this.parseExcel(filePath);
        await this.insertInBatches(fileID, rows);
        console.timeEnd('loadFromXLSX');
    }

    static async parseCSV(filePath) {
        console.time('parseCSV');
        return new Promise((resolve, reject) => {
            const rows = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    rows.push(row);
                })
                .on('end', () => {
                    console.timeEnd('parseCSV');
                    resolve(rows);
                })
                .on('error', (error) => {
                    console.timeEnd('parseCSV');
                    reject(error);
                });
        });
    }

    static async parseExcel(filePath) {
        console.time('parseExcel');
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

        console.timeEnd('parseExcel');
        return rows;
    }

    static async insertInBatches(fileID, rows) {
        console.time('insertInBatches');
        const batchSize = 8000; // Tamaño del lote

        try {
            await sequelize.transaction(async (t) => {
                for (let i = 0; i < rows.length; i += batchSize) {
                    const batch = rows.slice(i, i + batchSize);
                    const jsonData = JSON.stringify(batch);
                    await this.insertBatch(fileID, jsonData, t);
                }
            });
        } catch (error) {
            console.error('Error inserting batches:', error.message);
            throw error; // Rethrow the error after logging it
        }
        console.timeEnd('insertInBatches');
    }

    static async insertBatch(fileID, jsonData, transaction) {
        //console.time('insertBatch');
        try {
            const query = 'CALL InsertGPSData(:fileID, :jsonData)';
            await sequelize.query(query, {
                replacements: { fileID, jsonData },
                raw: true,
                transaction
            });
        } catch (error) {
            console.error('Error during batch insert:', error.message);
            throw error; // Rethrow the error after logging it
        }
        //console.timeEnd('insertBatch');
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