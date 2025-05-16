import { CanvasNode, CanvasEdge, GridCell } from './types';

/**
 * Returns the preferred direction (N/S/E/W) from one node to another.
 */
export function getPreferredDirection(fromNode: CanvasNode, toNode: CanvasNode): 'N' | 'S' | 'E' | 'W' {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'E' : 'W';
    }
    return dy > 0 ? 'S' : 'N';
}

/**
 * Returns all possible cells on the given side of a node, ordered by proximity to the center.
 */
export function getSideCells(
    node: CanvasNode,
    xValues: number[],
    yValues: number[],
    direction: 'N' | 'S' | 'E' | 'W'
): { x: number, y: number }[] {
    const xStart = xValues.findIndex(x => x >= node.x);
    const xEnd = xValues.findIndex(x => x >= node.x + node.width);
    const yStart = yValues.findIndex(y => y >= node.y);
    const yEnd = yValues.findIndex(y => y >= node.y + node.height);
    let cells: { x: number, y: number }[] = [];
    if (direction === 'N') {
        for (let x = xStart; x < xEnd; x++) cells.push({ x, y: yStart - 1 });
    } else if (direction === 'S') {
        for (let x = xStart; x < xEnd; x++) cells.push({ x, y: yEnd });
    } else if (direction === 'E') {
        for (let y = yStart; y < yEnd; y++) cells.push({ x: xEnd, y });
    } else if (direction === 'W') {
        for (let y = yStart; y < yEnd; y++) cells.push({ x: xStart - 1, y });
    }
    if (cells.length > 1) {
        const mid = Math.floor(cells.length / 2);
        return [cells[mid], ...cells.slice(0, mid).reverse(), ...cells.slice(mid + 1)];
    }
    return cells;
}

/**
 * Finds the first available cell on the given side of a node.
 */
export function findAvailableCellOnSide(
    grid: GridCell[][],
    node: CanvasNode,
    xValues: number[],
    yValues: number[],
    direction: 'N' | 'S' | 'E' | 'W'
): { x: number, y: number } | null {
    const candidates = getSideCells(node, xValues, yValues, direction);
    for (const cell of candidates) {
        if (
            cell.x >= 0 && cell.x < grid[0].length &&
            cell.y >= 0 && cell.y < grid.length &&
            !grid[cell.y][cell.x].occupied
        ) {
            return cell;
        }
    }
    return null;
}

/**
 * Creates an SVG path for an edge stub in a cell, in the given direction and color.
 */
export function createEdgeStub(direction: 'N' | 'S' | 'E' | 'W', color: string): string {
    const strokeWidth = 2;
    let path = '';
    switch (direction) {
        case 'N': path = `M50 100 L50 0`; break;
        case 'S': path = `M50 0 L50 100`; break;
        case 'E': path = `M0 50 L100 50`; break;
        case 'W': path = `M100 50 L0 50`; break;
    }
    return `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>`;
} 