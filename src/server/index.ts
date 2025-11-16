import { WebSocketServer, WebSocket } from 'ws';
import { handleMessage } from '../commands/handler'

export const wsServer = new WebSocketServer({ port: 3000 });

wsServer.on('listening', () => {
    console.log('WebSocket server is listening on ws://localhost:3000');
});

wsServer.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    
    ws.on('message', (message: string | Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received data:', data);

        handleMessage(ws, data);
      } catch (error) {
        console.error('Invalid JSON:', error);
      }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});