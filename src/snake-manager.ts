import { Direction, ExtendedWebSocket, SnakePosition, SnakeState } from "./types";

/**
 * SnakeManager handles game snake logic:
 * - Generating initial snake positions
 * - Updating snake movement
 * - Collision detection
 */
export class SnakeManager {
    private snakeStates: Map<string, SnakePosition> = new Map();
    private readonly GRID_WIDTH = 20;
    private readonly GRID_HEIGHT = 20;
    private readonly GRID_SIZE = this.GRID_WIDTH * this.GRID_HEIGHT; // 400

    constructor() {
        this.snakeStates = new Map();
    }

    /**
     * Generate a random valid snake position for a participant
     * @param occupiedCells - Set of cells already occupied by other snakes
     * @param length - Snake length (default 3)
     * @returns Array of cell indices representing the snake body
     * @throws Error if unable to generate valid position after max attempts
     */
    generateSnakePosition(occupiedCells: Set<number>, length: number = 3): {
        snake:number[]
        direction: Direction
    } {
        const maxAttempts = 100;
        let attempts = 0;


        while (attempts < maxAttempts) {
            const direction = this.getRandomDirection();
            const startPos = this.getRandomValidStartPosition(direction, length, occupiedCells);

            if (startPos !== null) {
                const snake = this.buildSnakeBody(startPos, direction, length, occupiedCells);
                if (snake && snake.length === length) {
                    return {
                        direction,
                        snake
                    };
                }
            }

            attempts++;
        }

        throw new Error(
            `Failed to generate valid snake position after ${maxAttempts} attempts. ` +
            'Board may be too crowded.'
        );
    }

    /**
     * Get a random direction (up, down, left, right)
     */
    private getRandomDirection(): Direction {
        const directions: Direction[] = ['U', 'D', 'L', 'R'];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    /**
     * Find a random valid starting position for a snake in a given direction
     * Ensures the entire snake can fit without wrapping or going out of bounds
     */
    private getRandomValidStartPosition(
        direction: Direction,
        length: number,
        occupiedCells: Set<number>
    ): number | null {
        const validPositions: number[] = [];

        for (let pos = 0; pos < this.GRID_SIZE; pos++) {
            if (occupiedCells.has(pos)) continue;
            if (this.canSnakeFitFromPosition(pos, direction, length)) {
                validPositions.push(pos);
            }
        }

        if (validPositions.length === 0) return null;
        return validPositions[Math.floor(Math.random() * validPositions.length)];
    }

    /**
     * Check if a snake can fit in a direction starting from a position
     * without wrapping or going out of bounds
     */
    private canSnakeFitFromPosition(startPos: number, direction: Direction, length: number): boolean {
        const row = Math.floor(startPos / this.GRID_WIDTH);
        const col = startPos % this.GRID_WIDTH;

        switch (direction) {
            case 'L':
                // Need at least 'length' cells to the left
                return col >= length - 1;
            case 'R':
                // Need at least 'length' cells to the right
                return col + length <= this.GRID_WIDTH;
            case 'U':
                // Need at least 'length' cells upward
                return row >= length - 1;
            case 'D':
                // Need at least 'length' cells downward
                return row + length <= this.GRID_HEIGHT;
        }
    }

    /**
     * Build a snake body array starting from a position in a direction
     * Returns null if any cell is occupied or invalid
     */
    private buildSnakeBody(
        startPos: number,
        direction: Direction,
        length: number,
        occupiedCells: Set<number>
    ): number[] | null {
        const snake: number[] = [];
        let currentPos = startPos;
        const step = this.getDirectionStep(direction);

        for (let i = 0; i < length; i++) {
            // Validate position
            if (currentPos < 0 || currentPos >= this.GRID_SIZE) {
                return null;
            }

            // Check if occupied
            if (occupiedCells.has(currentPos)) {
                return null;
            }

            // Check for duplicates in snake
            if (snake.includes(currentPos)) {
                return null;
            }

            // Check for row wrapping (only relevant for left/right)
            if (!this.isValidPosition(currentPos, direction, i > 0 ? snake[i - 1] : null)) {
                return null;
            }

            snake.push(currentPos);
            currentPos += step;
        }

        return snake;
    }

    /**
     * Get the step value for moving in a direction
     * - Right: +1
     * - Left: -1
     * - Down: +20 (next row)
     * - Up: -20 (previous row)
     */
    getDirectionStep(direction: Direction): number {
        switch (direction) {
            case 'R': return 1;
            case 'L': return -1;
            case 'D': return this.GRID_WIDTH;
            case 'U': return -this.GRID_WIDTH;
        }
    }

    /**
     * Validate that position doesn't wrap across rows (for horizontal movement)
     */
    private isValidPosition(pos: number, direction: Direction, prevPos: number | null): boolean {
        if (!prevPos) return true; // First position always valid

        const row = Math.floor(pos / this.GRID_WIDTH);
        const prevRow = Math.floor(prevPos / this.GRID_WIDTH);
        const col = pos % this.GRID_WIDTH;
        const prevCol = prevPos % this.GRID_WIDTH;

        // Horizontal movement should stay on same row
        if (direction === 'L' || direction === 'R') {
            if (row !== prevRow) {
                return false; // Row wrapped
            }
            // Also check for wrap-around (col should only differ by 1)
            if (Math.abs(col - prevCol) !== 1) {
                return false;
            }
        }

        // Vertical movement should be exactly one row apart
        if (direction === 'U' || direction === 'D') {
            if (Math.abs(row - prevRow) !== 1) {
                return false;
            }
            if (col !== prevCol) {
                return false;
            }
        }

        return true;
    }
    /**
     * Update snake position based on user input
     */
    updateSnakePosition(roomId: string, userId: string, direction: Direction): void {
        const key = `${roomId}:${userId}`;
        const snake = this.snakeStates.get(key);

        if (!snake) {
            return;
        }

        // Update direction for next move
        snake.direction = direction;
    }

    /**
     * Get the current state of a user's snake
     */
    getSnakeState(roomId: string, userId: string): SnakePosition | undefined {
        const key = `${roomId}:${userId}`;
        return this.snakeStates.get(key);
    }

    /**
     * Handle collisions between snakes
     * Returns IDs of snakes that collided (dead snakes)
     */
    handleCollisions(roomId: string, snakes: Map<string, SnakePosition>): string[] {
        const deadSnakes: string[] = [];
        const allCells = new Map<number, string>(); // cell -> userId

        // Map all cells to their owner
        snakes.forEach((snake, userId) => {
            snake.body.forEach((cell) => {
                if (allCells.has(cell)) {
                    // Collision detected
                    deadSnakes.push(userId);
                    deadSnakes.push(allCells.get(cell)!);
                } else {
                    allCells.set(cell, userId);
                }
            });
        });

        return [...new Set(deadSnakes)]; // Remove duplicates
    }

    /**
     * Remove a snake from the game
     */
    removeSnake(roomId: string, userId: string): void {
        const key = `${roomId}:${userId}`;
        this.snakeStates.delete(key);
    }

    /**
     * Reset all snakes in a room
     */
    resetSnakes(roomId: string): void {
        const keysToDelete: string[] = [];
        this.snakeStates.forEach((_, key) => {
            if (key.startsWith(`${roomId}:`)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.snakeStates.delete(key));
    }

    getRandomFruitPosition(){
        const randX = Math.floor(Math.random() * this.GRID_SIZE)
        const randY = Math.floor(Math.random() * this.GRID_SIZE)
        return {
            randX,
            randY
        }
    }

    generateFruit(snakePos: SnakeState["body"]){
        let position = this.getRandomFruitPosition()
        let isFruitOverlappingCurrentSnake = snakePos.some((snake)=> snake.x === position.randX && snake.y == position.randY)

        while(isFruitOverlappingCurrentSnake){
            position = this.getRandomFruitPosition();
            isFruitOverlappingCurrentSnake = snakePos.some(({x, y})=> x === position.randX && y === position.randY);
        }

        const pos = (position.randY  * this.GRID_SIZE) + position.randX;
        return pos;
    }


    isCollision(coords:{x: number, y: number}){

        if(
            coords.x < 0 ||
            coords.y < 0 ||
            coords.x > (this.GRID_WIDTH - 1) || 
            coords.y > (this.GRID_HEIGHT - 1)
        ){
            return true;
        }

        return false;
       
    }

    
    isSelfCollision(
        head: { x: number, y: number},
        body: {x: number, y: number}[]
    ): boolean{
        return body.some((b) => b.x === head.x && b.y === head.y)
    }
}