// services/gpsdata.services.js
import GPSData from '../models/GPSData.js';
import { AppError } from '../utils/error.handle.js';

export const processGPSDataFile = async (filePath, fileType) => {
    console.time('service');
    try {
        if (fileType === 'csv') {
            console.log(`Processing CSV file: ${filePath}`);
            await GPSData.loadFromCSV(filePath);
        } else if (fileType === 'excel') {
            console.log(`Processing Excel file: ${filePath}`);
            await GPSData.loadFromXLSX(filePath);
        } else {
            throw new AppError('Unsupported file type', 400);
        }
        console.log('File processed and data stored successfully');
    } catch (error) {
        console.error(`Error processing file: ${error.message}`);
        if (error.errors) {
            console.error('Validation error details:', error.errors);
        }
        throw new AppError(`Error processing file: ${error.message}`, 500, error.errors);
    } finally {
        console.timeEnd('service');
    }
};