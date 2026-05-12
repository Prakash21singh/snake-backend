import type { WebSocket } from 'ws';
import { RoomManager } from './room-manager';

// Game and Room Types
export type GameStatus = "waiting" | "in-progress" | "finished";
export type ParticipantStatus = "alive" | "dead";
export type UserStandByStatus = "waiting" | "ready" | "playing";

export interface User {
    id: string;
    name: string;
}

export interface SnakeState {
    direction: string;
    body: { x: number; y: number }[];
}

export interface GameState {
    score: number;
    isAlive: boolean;
}

export interface ExtendedWebSocket extends WebSocket {
    user: User;
    snake: SnakeState;
    color: string;
    gameState: GameState;
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
    broadcastToRoom: (roomId: string, message: Response, excludeWs?: ExtendedWebSocket) => void;
    broadcastToAll: (message: Response, excludeWs?: ExtendedWebSocket) => void;
}
