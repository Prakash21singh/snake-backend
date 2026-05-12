import type { Message, ExtendedWebSocket, HandlerContext, Response, ErrorResponse } from './types';
import { eventHandlers, type EventType } from './event-handlers';
import { MessageFormatter } from './message-formatter';
import { WebSocketUtils } from './websocket-utils';

/**
 * Central event dispatcher
 * Routes incoming messages to appropriate handlers
 */
export class EventDispatcher {
    dispatch(
        message: Message,
        ws: ExtendedWebSocket,
        context: HandlerContext
    ): void {
        const eventType = message.type as EventType;
        const handler = eventHandlers[eventType];

        if (!handler) {
            console.warn(`Unknown event type: ${message.type}`);
            WebSocketUtils.send(
                ws,
                MessageFormatter.createErrorResponse(`Unknown event type: ${message.type}`)
            );
            return;
        }

        try {
            handler(message, ws, context);
        } catch (error: unknown) {
            console.error(`Error handling ${eventType}:`, error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            WebSocketUtils.send(ws, MessageFormatter.createErrorResponse(message));
        }
    }
}
