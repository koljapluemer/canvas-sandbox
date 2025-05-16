// Types and interfaces for the Canvas to HTML converter

/**
 * Represents a node in the canvas (text, file, link, group).
 */
export interface CanvasNode {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
    text?: string;
    file?: string;
}

/**
 * Represents an edge/connection between two nodes.
 */
export interface CanvasEdge {
    id: string;
    fromNode: string;
    toNode: string;
    color?: string;
}

/**
 * Represents the full canvas structure.
 */
export interface Canvas {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

/**
 * Represents a cell in the grid for node/edge placement.
 */
export interface GridCell {
    x: number;
    y: number;
    occupied: boolean;
    edge?: {
        direction: 'N' | 'S' | 'E' | 'W';
        color: string;
    };
} 