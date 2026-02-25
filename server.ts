/**
 * Custom Next.js Server with Socket.io Integration
 * 
 * This server wraps Next.js to enable WebSocket support for real-time
 * collaborative attendance marking across multiple facilitators.
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { initializeAttendanceRooms } from './src/lib/realtime/attendanceRoom';
import { initializeDataIntegrityCron } from './src/lib/validation/dataIntegrityCron';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  initializeDataIntegrityCron().catch((error) => {
    console.error('Failed to initialize data integrity cron:', error);
  });

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : `http://${hostname}:${port}`,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling'], // WebSocket first, polling fallback
  });

  // Initialize attendance room management
  initializeAttendanceRooms(io);

  // Global connection logging
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);
    
    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error(`⚠️  Socket error for ${socket.id}:`, error);
    });
  });

  // Make io instance available globally for API routes
  (global as any).io = io;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🚀 Server Ready with WebSocket Support                   ║
║                                                            ║
║  URL:        http://${hostname}:${port}                           ║
║  WebSocket:  ws://${hostname}:${port}/socket.io/                 ║
║  Mode:       ${dev ? 'Development' : 'Production'}                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
});
