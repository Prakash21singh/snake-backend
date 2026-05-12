import type { EventHandler } from '../types';
import { MessageFormatter } from '../message-formatter';
import { WebSocketUtils } from '../websocket-utils';

export const handleLeaveRoom: EventHandler = (data, ws, context) => {
    try {
        const { roomId } = data.payload;
        const left = context.roomManager.removeParticipant(roomId, ws);
        
        if (!left) {
            WebSocketUtils.send(ws, MessageFormatter.createErrorResponse('Room not found'));
            return;
        }

        // Notify sender
        WebSocketUtils.send(ws, MessageFormatter.leftRoom(roomId));

        // Notify others in the room
        context.broadcastToRoom(
            roomId,
            MessageFormatter.participantLeft(roomId),
            ws
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        WebSocketUtils.send(ws, MessageFormatter.createErrorResponse(message));
    }
};
