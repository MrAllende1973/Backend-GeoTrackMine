// controllers/gpsdata.controller.js
import { processGPSDataFile } from '../services/gpsdata.services.js';
import { createApiResponse } from '../utils/response.handle.js';
import fs from 'fs';

export const uploadGPSDataFile = async (req, res) => {
    console.time('controller');
    if (!req.file) {
        console.timeEnd('controller');
        return res.status(400).json(createApiResponse(false, 'No file uploaded', 400, null));
    }

    const fileType = req.file.mimetype === 'text/csv' ? 'csv' : req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 'excel' : 'unsupported';
    const filePath = req.file.path;

    try {
        if (fileType === 'unsupported') {
            throw new Error('Unsupported file type');
        }
        await processGPSDataFile(filePath, fileType);
        res.status(200).json(createApiResponse(true, 'File processed successfully', 200, null));
    } catch (error) {
        console.error(`Error in controller: ${error.message}`);
        if (error.errors) {
            console.error('Validation error details:', error.errors);
        }
        res.status(500).json(createApiResponse(false, `Error processing file: ${error.message}`, 500, error.errors));
    } finally {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (!err) {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Error deleting file: ${unlinkErr.message}`);
                    }
                });
            } else {
                console.error(`File not found for deletion: ${filePath}`);
            }
        });
        console.timeEnd('controller');
    }
};