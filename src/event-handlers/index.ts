import { handleCreateRoom } from './create-room.handler';
import { handleRoomAvailabilityCheck } from './room-availability-check.handler';
import { handleJoinRoom } from './join-room.handler';
import { handleChangeStandbyStatus } from './change-standby-status.handler';
import { handleLeaveRoom } from './leave-room.handler';
import { makeSnakeMove } from './make-snake-move';

export const eventHandlers = {
    CREATE_ROOM: handleCreateRoom,
    ROOM_AVAILABILITY_CHECK: handleRoomAvailabilityCheck,
    JOIN_ROOM: handleJoinRoom,
    CHANGE_STANDBY_STATUS: handleChangeStandbyStatus,
    LEAVE_ROOM: handleLeaveRoom,
    MAKE_SNAKE_MOVE: makeSnakeMove
} as const;

export type EventType = keyof typeof eventHandlers;
