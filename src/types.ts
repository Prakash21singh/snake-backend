import type { WebSocket } from 'ws';
import type { RoomManager } from './room-manager';
import type { SnakeManager } from './snake-manager';

// Game and Room Types
export type GameStatus = "waiting" | "in-progress" | "finished";
export type ParticipantStatus = "alive" | "dead";
export type UserStandByStatus = "waiting" | "ready" | "playing";

export interface User {
    id: string;
    name: string;
}
export type Direction = 'U' | 'D' | 'L' | 'R';

export interface SnakePosition {
    body: number[];
    direction: Direction;
}
export interface SnakeState {
    direction: Direction;
    body: { x: number; y: number }[];
}


export interface ExtendedWebSocket extends WebSocket {
    user: User;
    snake?: SnakeState;
    color: string;
    standByStatus: UserStandByStatus;
    status: ParticipantStatus;
}

export interface Room {
    id: string;
    organizer: ExtendedWebSocket;
    participants: ExtendedWebSocket[];
    roomSize: number;
    gameStatus: GameStatus;
    startTime?: number;
    countDownTimer?: ReturnType<typeof setTimeout>;
    fruitPosition?: number;
}

// Message Types
export interface Message {
    type: string;
    payload: Record<string, any>;
}

export interface Response {
    type: string;
    payload: Record<string, any>;
}

export interface ErrorResponse {
    type: 'ERROR';
    payload: {
        message: string;
    };
}

// Event Handler Type
export type EventHandler = (data: Message, ws: ExtendedWebSocket, context: HandlerContext) => void;

export interface HandlerContext {
    roomManager: RoomManager; // RoomManager type
    snakeManager: SnakeManager; // SnakeManager type
    broadcastToRoom: (roomId: string, message: Response, excludeWs?: ExtendedWebSocket) => void;
    broadcastToAll: (message: Response, excludeWs?: ExtendedWebSocket) => void;
}
