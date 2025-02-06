import { Server } from 'socket.io';

let io;

export function GET(req, { res }) {
    if (!io) {
        console.log('Initializing Socket.IO...');
        io = new Server(res.socket.server, {
            cors: { origin: '*' }, // Adjust CORS settings for your needs
        });

        io.on('connection', (socket) => {
            console.log('A client connected:', socket.id);

            // Broadcast when a user clicks 'View Cart'
            socket.on('viewCart', (data) => {
                console.log('User clicked on View Cart:', data);
                io.emit('dashboardUpdate', { action: 'viewCart' });
            });

            // Broadcast when a user clicks 'Back to Products'
            socket.on('backToProducts', (data) => {
                console.log('User clicked on Back to Products:', data);
                io.emit('dashboardUpdate', { action: 'backToProducts' });
            });

            // Disconnect handler
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        res.socket.server.io = io;
    } else {
        console.log('Socket.IO already initialized');
    }

    res.end();
}
