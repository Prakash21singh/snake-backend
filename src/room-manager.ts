import type { ExtendedWebSocket, Room } from './types';

/**
 * RoomManager handles all room-related operations
 * - Creating and retrieving rooms
 * - Managing participants in rooms
 * - Updating room states
 */
export class RoomManager {
    private rooms: Map<string, Room>;
    private readonly MAX_ROOM_SIZE = 4;

    constructor() {
        this.rooms = new Map();
    }

    /**
     * Create a new room
     * @throws Error if room already exists
     */
    createRoom(roomId: string, organizer: ExtendedWebSocket): Room {
        if (this.rooms.has(roomId)) {
            throw new Error('Room already exists');
        }

        const room: Room = {
            id: roomId,
            organizer,
            participants: [],
            roomSize: this.MAX_ROOM_SIZE,
            gameStatus: "waiting",
        };

        this.rooms.set(roomId, room);
        return room;
    }

    /**
     * Get a room by ID
     */
    getRoom(roomId: string): Room | null {
        return this.rooms.get(roomId) ?? null;
    }

    /**
     * Add a participant to a room
     * @returns participants array or error object
     */
    addParticipant(
        roomId: string,
        participant: ExtendedWebSocket
    ): { status: boolean; message?: string } | ExtendedWebSocket[] {
        const room = this.rooms.get(roomId);

        if (!room) {
            return { status: false, message: 'Room not found' };
        }

        if (room.participants.length >= room.roomSize) {
            return { status: false, message: 'Room is full' };
        }

        const alreadyParticipant = room.participants.some(p => p.user.id === participant.user.id);
        if (alreadyParticipant) {
            return { status: false, message: 'User is already in the room' };
        }

        participant.standByStatus = "waiting";
        participant.status = "alive";
        room.participants.push(participant);

        return room.participants;
    }

    /**
     * Remove a participant from a room
     * Deletes the room if it's empty
     */
    removeParticipant(roomId: string, participant: ExtendedWebSocket): boolean {
        const room = this.rooms.get(roomId);

        if (!room) {
            return false;
        }

        room.participants = room.participants.filter(p => p !== participant);

        // Delete empty rooms
        if (room.participants.length === 0) {
            this.rooms.delete(roomId);
        }

        return true;
    }

    /**
     * Change a participant's standby status
     * Starts game when all participants are ready
     */
    changeStandbyStatus(
        roomId: string,
        participant: ExtendedWebSocket,
        standByStatus: string
    ): boolean {
        const room = this.rooms.get(roomId);

        if (!room) {
            return false;
        }

        const participantInRoom = room.participants.find(p => p === participant);
        if (!participantInRoom) {
            return false;
        }

        participantInRoom.standByStatus = standByStatus as any;

        // Check if all participants are ready
        // TODO: Move game start logic to a separate function for better separation of concerns
        // const allReady = room.participants.every(p => p.standByStatus === "ready");
        // if (allReady) {
        //     setTimeout(() => {
        //         room.gameStatus = "in-progress";
        //     }, 3000);
        // }

        return true;
    }

    /**
     * Remove a participant from all rooms
     * Useful for cleanup on disconnect
     */
    removeFromAllRooms(participant: ExtendedWebSocket): void {
        for (const room of this.rooms.values()) {
            room.participants = room.participants.filter(p => p !== participant);
            if (room.participants.length === 0) {
                // this.rooms.delete(room.id);
            }
        }
    }

    /**
     * Delete a room by ID
     */
    deleteRoom(roomId: string): boolean {
        return this.rooms.delete(roomId);
    }

}

