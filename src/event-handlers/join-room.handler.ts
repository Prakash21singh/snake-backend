import type { EventHandler } from '../types';
import { MessageFormatter } from '../message-formatter';
import { WebSocketUtils } from '../websocket-utils';

export const handleJoinRoom: EventHandler = (data, ws, context) => {
    try {
        const { roomId } = data.payload;
        const result = context.roomManager.addParticipant(roomId, ws);
        
        // Check if it's an error response
        if ('status' in result && !result.status) {
            WebSocketUtils.send(ws, MessageFormatter.createErrorResponse(result.message || 'Failed to join room'));
            return;
        }

        // Broadcast to all in room that a new participant joined
        const room = context.roomManager.getRoom(roomId);
        if (room) {
            context.broadcastToRoom(roomId, MessageFormatter.joinedRoom(roomId, result as any));
        }

        WebSocketUtils.send(ws, MessageFormatter.joinedRoom(roomId, result as any));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        WebSocketUtils.send(ws, MessageFormatter.createErrorResponse(message));
    }
};
