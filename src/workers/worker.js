// worker.js
import { parentPort, workerData } from 'worker_threads';
import { sequelize } from '../config/db.js';

const { fileID, jsonData } = workerData;

async function insertBatch(fileID, jsonData) {
    const data = JSON.parse(jsonData);

    try {
        await sequelize.transaction(async (t) => {
            for (const record of data) {
                await sequelize.query(
                    'INSERT INTO GPSData (fileID, data) VALUES (:fileID, :data)',
                    {
                        replacements: { fileID, data: JSON.stringify(record) },
                        transaction: t
                    }
                );
            }
        });

        parentPort.postMessage('Batch inserted successfully');
    } catch (error) {
        console.error('Error during transaction:', error.message);
        parentPort.postMessage(`Error inserting batch: ${error.message}`);
        throw error;
    }
}

insertBatch(fileID, jsonData).catch((error) => {
    console.error('Worker error:', error);
});