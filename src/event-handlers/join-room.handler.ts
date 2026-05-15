import type { EventHandler } from '../types';
import { MessageFormatter } from '../message-formatter';
import { GridConverter, WebSocketUtils } from '../websocket-utils';

const GRID_SIZE = 20;

export const handleJoinRoom: EventHandler = (data, ws, context) => {
    try {
        const { roomId } = data.payload;

        const room = context.roomManager.getRoom(roomId);
        
        if(!room) return;

        if(room?.gameStatus === "in-progress"){
            WebSocketUtils.send(ws, MessageFormatter.gameAlreadyInProgress(roomId));
            return;
        }


        // Create a set of cordinates of all participants
        const allParticipantsSnakeState = room.participants.map(
            (p)=> p.snake!.body ?? {})
            .flat(1)
            .map((val)=> GridConverter.coordsToIndex(val.x, val.y));

        const uniqueIndexSet = new Set(allParticipantsSnakeState);
        
        const snakeState = context.snakeManager.generateSnakePosition(uniqueIndexSet, 3);

        const body = GridConverter.indicesToCoords(snakeState.snake);
  
        ws.snake = {
            body,
            direction: snakeState.direction
        }; 

        const result = context.roomManager.addParticipant(roomId, ws);
        
        if ('status' in result && !result.status) {
            WebSocketUtils.send(ws, MessageFormatter.createErrorResponse(result.message || 'Failed to join room'));
            return;
        }
        
        if (room) {
            context.broadcastToRoom(roomId, MessageFormatter.joinedRoom(roomId, result as any));
        }

        WebSocketUtils.send(ws, MessageFormatter.joinedRoom(roomId, result as any));
    } catch (error: unknown) {
        console.log(error)
        const message = error instanceof Error ? error.message : 'Unknown error';
        WebSocketUtils.send(ws, MessageFormatter.createErrorResponse(message));
    }
};
