// sockets/index.sockets.js
import { Server } from 'socket.io';
import { logErrorToDatabase } from '../utils/error.handle.js';

let io;

export const initializeSockets = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        }
    });

    io.on('connection', (socket) => {
        console.log('Usuario conectado:', socket.id);

        socket.on('disconnect', () => {
            console.log('Usuario desconectado:', socket.id);
        });

        socket.on('error', async (error) => {
            await logErrorToDatabase(error, socket.handshake);
            console.error('Error de Socket.io:', error);
        });
    });
};

export { io };