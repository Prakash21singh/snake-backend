import { MessageFormatter } from "../message-formatter";
import { Direction, EventHandler } from "../types";
import { GridConverter, WebSocketUtils } from "../websocket-utils";


export const makeSnakeMove: EventHandler = (data, ws, context) =>{
    try {
      
        const {
            direction,
            roomId
        } = data.payload as {
            roomId: string;
            direction: Direction
        };

        const TICK_SIZE = 100;

        const makeMove = () => {
            if(ws.snake === undefined) return;

            const snakeBody = ws.snake.body;
            const tempHeadIndex = context.snakeManager.getDirectionStep(direction);
            const room = context.roomManager.getRoom(roomId);
            const nextHeadIndex = GridConverter.coordsToIndex(snakeBody[0].x, snakeBody[0].y) + tempHeadIndex;;
            const nextHeadCoords = GridConverter.indexToCoords(nextHeadIndex);
            
            if(!room) return;

            const isWallCollision = context.snakeManager.isCollision(nextHeadCoords);
            
            if(!isWallCollision) {
                ws.status = "dead"

                context.broadcastToRoom(
                    roomId, 
                    MessageFormatter.participantDead(roomId, ws.status, ws.user.id), 
                )

                return;
            }

            const isSelfCollision = context.snakeManager.isSelfCollision(nextHeadCoords, snakeBody.slice(1));

            if(isSelfCollision){
                ws.status = "dead"

                context.broadcastToRoom(
                    roomId, 
                    MessageFormatter.participantDead(roomId, ws.status, ws.user.id), 
                )

                return;
            }

            const otherParticipants = room.participants.filter((p) => p.user.id !== ws.user.id);
            const otherParticipantSnake = otherParticipants.map((p)=> p.snake?.body);
            

            

        }

        // 1. Read current direction
        // 2. Calculate new head
        // 3. Check wall collision
        // 4. Check self collision
        // 5. Check player collision
        // 6. Check fruit collision
        // 7. If fruit eaten:
        //     grow snake
        //     spawn new fruit
        // else:
        //     pop tail
        // 8. Broadcast updated state

        const room = context.roomManager.getRoom(roomId);

        if(!room) {
            console.log(`Room not found for the user ${ws.user.name}, RoomId: ${roomId}`)
            return;
        }

        if(room.fruitPosition === undefined){
            console.error(`Room has no fruitPosition right now. RoomId : ${roomId}`)
            return;
        }

        const fruitPosition = room.fruitPosition;
        const nextMovingIndex = context.snakeManager.updateSnakePosition(roomId, ws.user.id, direction)

        // you'll have the body and also have the direction.

    } catch (error:unknown) {
        console.error('Error:', error);
        const message = error instanceof Error ? error.message : "Something went wrong while making move.";
        WebSocketUtils.send(ws, MessageFormatter.createErrorResponse(message));
    }
}