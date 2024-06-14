import { processGPSDataXLSX } from '../services/gpsdata.services.js';

export const handleGPSDataSockets = (socket) => {
    socket.on('uploadGPSDataXLSX', async (data) => {
        try {
            const { filePath } = data;
            await processGPSDataXLSX(filePath);
            socket.emit('uploadSuccess', { message: 'File processed successfully' });
        } catch (error) {
            socket.emit('uploadError', { message: 'Error processing file', error: error.message });
        }
    });
};
