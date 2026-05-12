import type { EventHandler, UserStandByStatus } from '../types';
import { MessageFormatter } from '../message-formatter';
import { WebSocketUtils } from '../websocket-utils';

export const handleChangeStandbyStatus: EventHandler = (data, ws, context) => {
    try {
        const { roomId, standByStatus } = data.payload as { roomId: string; standByStatus: UserStandByStatus};
        const statusChanged = context.roomManager.changeStandbyStatus(roomId, ws, standByStatus);
        
        const room = context.roomManager.getRoom(roomId);

        if(!room) return null;

        if(room.gameStatus === "in-progress" && standByStatus === "ready"){
            WebSocketUtils.send(ws, MessageFormatter.createErrorResponse('Game already in progress'));
            return;
        }

        if(standByStatus === "waiting" && room?.startTime){
            if(room.countDownTimer){
                clearTimeout(room.countDownTimer);
                room.countDownTimer = undefined;
            }
            room.startTime = undefined;
            context.broadcastToAll(MessageFormatter.gameReset(roomId));
        }
        
        const everyOneIsReady = room?.participants.every(p => p.standByStatus === "ready");

        if(
            everyOneIsReady && 
            room.participants.length > 2 && 
            room?.gameStatus !== "in-progress"
        ){
            if(room.countDownTimer){
                clearTimeout(room.countDownTimer);
            }
            const startTime = Date.now() + 6000;
            room.startTime = startTime;
            WebSocketUtils.broadcastToAll(room.participants, MessageFormatter.gameStartCountdown(roomId, startTime));
            room.countDownTimer = setTimeout(() => {
                const stillValid = 
                    room.startTime === startTime &&
                    room.gameStatus !== "in-progress" &&
                    room.participants.length > 2 &&
                    room.participants.every(p => p.standByStatus === "ready");

                if(stillValid){
                    room.gameStatus = "in-progress";
                    context.broadcastToAll(MessageFormatter.changeGameStatus(roomId, "in-progress"));
                }
            }, 6000);
        }

        if (!statusChanged) {
            WebSocketUtils.send(ws, MessageFormatter.createErrorResponse('Room not found'));
            return;
        }

        // Notify sender
        WebSocketUtils.send(
            ws,
            MessageFormatter.standbyStatusUpdated(roomId, standByStatus)
        );

        // Notify others in the room
        context.broadcastToRoom(
            roomId,
            MessageFormatter.standbyStatusChanged(roomId, ws.user.id, standByStatus),
            ws
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        WebSocketUtils.send(ws, MessageFormatter.createErrorResponse(message));
    }
};
