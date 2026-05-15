import type { WebSocket } from 'ws';
import type { ExtendedWebSocket, Response, ErrorResponse } from './types';

/**
 * WebSocket utility functions for common operations
 */
export class WebSocketUtils {
    /**
     * Send a message to a WebSocket client if connection is open
     */
    static send(ws: WebSocket, message: Response | ErrorResponse): void {
        if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(JSON.stringify(message));
        }
    }

    /**
     * Broadcast to all connected clients except the sender
     */
    static broadcastToAll(
        clients: Set<WebSocket> | WebSocket[],
        message: Response | ErrorResponse,
        excludeWs?: ExtendedWebSocket
    ): void {
        const clientArray = clients instanceof Set ? Array.from(clients) : clients;
        clientArray.forEach((client) => {
            if (client !== excludeWs && client.readyState === 1) {
                client.send(JSON.stringify(message));
            }
        });
    }

    /**
     * Broadcast to participants in a specific room
     */
    static broadcastToRoom(
        participants: ExtendedWebSocket[],
        message: Response | ErrorResponse,
        excludeWs?: ExtendedWebSocket
    ): void {
        participants.forEach((participant) => {
            if (participant !== excludeWs && participant.readyState === 1) {
                participant.send(JSON.stringify(message));
            }
        });
    }

    /**
     * Get list of active WebSocket connections
     */
    static getActiveConnections(connections: WebSocket[]): WebSocket[] {
        return connections.filter((client) => client.readyState === 1);
    }
}



export class GridConverter {
    private static GRID_SIZE = 20;

    static indexToCoords(index:number): {x:number, y:number} {

        return {
            x: index % this.GRID_SIZE,
            y: Math.floor(index / this.GRID_SIZE)
        }

    }

    static coordsToIndex(x:number, y:number): number {
        return (y * this.GRID_SIZE) + x;
    }

    static indicesToCoords(indices:number[]):Array<{x:number, y:number}> {
        return indices.map((idx)=>this.indexToCoords(idx))
    }
}