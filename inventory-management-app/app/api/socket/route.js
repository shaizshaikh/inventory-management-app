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

            // Existing broadcast functionality
            socket.on('broadcastEvent', (data) => {
                console.log('Broadcasting data:', data);
                io.emit('dashboardUpdate', data);
            });

            // Dynamic data fetching and sending to the homepage
            socket.on('fetchProductData', async () => {
                console.log('Received request to fetch product data.');
                try {
                    // Fetch product data dynamically (mock implementation)
                    const products = await fetch('/api/get-all-products', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    }).then((res) => res.json());

                    console.log('Sending product data to client:', products);
                    socket.emit('productData', products);
                } catch (error) {
                    console.error('Error fetching product data:', error);
                    socket.emit('error', { message: 'Failed to fetch product data.' });
                }
            });

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
