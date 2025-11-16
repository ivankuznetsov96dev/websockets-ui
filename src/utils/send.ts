import { WebSocket } from 'ws';

export function send(ws: WebSocket, message: any) {
  // ws.send(JSON.stringify(data));
  ws.send(JSON.stringify({
    ...message,
    data: typeof message.data === 'string' ? message.data : JSON.stringify(message.data)
  }))
}