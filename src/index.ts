import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import type { ExtendedWebSocket, Message, HandlerContext } from './types';
import { RoomManager,  } from './room-manager';
import { EventDispatcher } from './event-dispatcher';
import { WebSocketUtils } from './websocket-utils';
import { MessageFormatter } from './message-formatter';
import { SnakeManager } from './snake-manager';

// Initialize Express and WebSocket server
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Initialize managers
const roomManager = new RoomManager();
const snakeManager = new SnakeManager();
const eventDispatcher = new EventDispatcher();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// WebSocket Connection Handling
// ============================================

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const userId = url.searchParams.get('userId') || '';
        const name = url.searchParams.get('name') || '';

        console.log('New connection:', { userId, name });

        // Initialize WebSocket with user data
        (ws as ExtendedWebSocket).user = { id: userId, name };

        wss.emit('connection', ws, request);
    });
});

wss.on('error', (error) => {
    console.error('WebSocket Server error:', error);
});

// ============================================
// Client Message Handling
// ============================================

wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log(`User ${ws.user.name} connected`);

    ws.on('error', (error) => {
        console.error(`WebSocket error from ${ws.user.id}:`, error);
    });

    ws.on('message', (rawMessage) => {
        try {
            const data: Message = JSON.parse(rawMessage.toString());
            console.log(`Message from ${ws.user.id}:`, data.type);

            // Create handler context for broadcasting
            const context: HandlerContext = {
                roomManager,
                snakeManager,
                broadcastToRoom: (roomId, message, excludeWs) => {
                    const room = roomManager.getRoom(roomId);
                    if (room) {
                        WebSocketUtils.broadcastToRoom(room.participants, message, excludeWs);
                    }
                },
                broadcastToAll: (message, excludeWs) => {
                    WebSocketUtils.broadcastToAll(wss.clients, message, excludeWs);
                },
            };

            // Dispatch event to appropriate handler
            eventDispatcher.dispatch(data, ws, context);
        } catch (error) {
            console.error('Error processing message:', error);
            WebSocketUtils.send(
                ws,
                MessageFormatter.createErrorResponse('Invalid message format')
            );
        }
    });

    ws.on('close', () => {
        console.log(`User ${ws.user.name} disconnected`);
        const roomId = roomManager.removeFromAllRooms(ws);
        if(!roomId) return;
        const room = roomManager.getRoom(roomId);
        if(!!room){
            WebSocketUtils.broadcastToRoom(room.participants, MessageFormatter.participantLeft(roomId, ws.user.id), ws)
        }
    });
});

// ============================================
// Server Setup
// ============================================

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


// todos
// 1. on game play start moving them up on their frontend.