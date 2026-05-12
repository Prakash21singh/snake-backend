import type { Message, EventHandler } from '../types';
import { MessageFormatter } from '../message-formatter';
import { WebSocketUtils } from '../websocket-utils';

export const handleCreateRoom: EventHandler = (data, ws, context) => {
    try {
        const { roomId, organizer } = data.payload;
        const room = context.roomManager.createRoom(roomId, ws);
        
        const response = MessageFormatter.roomCreated(
            room.id,
            ws.user.id,
            ws.user.name
        );
        WebSocketUtils.send(ws, response);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        WebSocketUtils.send(ws, MessageFormatter.createErrorResponse(message));
    }
};
