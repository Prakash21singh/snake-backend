import type { Response, ErrorResponse, ParticipantStatus } from './types';

/**
 * Centralized message formatting for WebSocket responses
 * Ensures consistency across all message types
 */
export class MessageFormatter {
    static participantDead(roomId: string, status : "dead", userId?: string){
        let obj = {
            roomId,
            status,
            userId
        }

        return this.createResponse("PARTICIPANT_DEAD", obj);
    }
    static changeGameStatus(roomId: string, gameStatus: string): Response {
        return this.createResponse('GAME_STATUS_CHANGED', { roomId, gameStatus });
    }

    static gameAlreadyInProgress(roomId: string): Response {
        return this.createResponse('GAME_ALREADY_IN_PROGRESS', { roomId });
    }

    static gameStartCountdown(roomId: string, countdown: number): Response {
        return this.createResponse('GAME_START_COUNTDOWN', { roomId, countdown });
    }

    static gameReset(roomId: string): Response {
        return this.createResponse('GAME_RESET', { roomId });
    }

    static createResponse(type: string, payload: Record<string, any>): Response {
        return {
            type,
            payload,
        };
    }

    static createErrorResponse(message: string): ErrorResponse {
        return {
            type: 'ERROR',
            payload: { message },
        };
    }

    static roomCreated(roomId: string, organizerId: string, organizerName: string): Response {
        return this.createResponse('ROOM_CREATED', {
            roomId,
            organizer: { id: organizerId, name: organizerName },
        });
    }

    static roomAvailability(room: any): Response {
        return this.createResponse('ROOM_AVAILABILITY', { room });
    }

    static joinedRoom(roomId: string, participants: any[]): Response {
        return this.createResponse('JOINED_ROOM', { roomId, participants });
    }

    static standbyStatusUpdated(roomId: string, standByStatus: string): Response {
        return this.createResponse('STANDBY_STATUS_UPDATED', { roomId, standByStatus });
    }

    static standbyStatusChanged(roomId: string, userId: string, standByStatus: string): Response {
        return this.createResponse('STANDBY_STATUS_CHANGED', {
            roomId,
            userId,
            standByStatus,
        });
    }

    static leftRoom(roomId: string): Response {
        return this.createResponse('LEFT_ROOM', { roomId });
    }

    static participantLeft(roomId: string, userId: string): Response {
        return this.createResponse('PARTICIPANT_LEFT', { roomId, userId });
    }
}

export function toJSON(message: Response | ErrorResponse): string {
    return JSON.stringify(message);
}
