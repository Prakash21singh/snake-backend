import type { EventHandler } from '../types';
import { MessageFormatter } from '../message-formatter';
import { WebSocketUtils } from '../websocket-utils';

export const handleRoomAvailabilityCheck: EventHandler = (data, ws, context) => {
    try {
        const { roomId } = data.payload;
        const room = context.roomManager.getRoom(roomId);
        
        const response = MessageFormatter.roomAvailability(room);
        WebSocketUtils.send(ws, response);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        WebSocketUtils.send(ws, MessageFormatter.createErrorResponse(message));
    }
};
