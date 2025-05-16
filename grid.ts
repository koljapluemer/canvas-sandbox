import { CanvasNode } from './types';

/**
 * Returns sorted unique Y values (top and bottom) for all nodes.
 */
export function getUniqueYValues(nodes: CanvasNode[]): number[] {
    const yValues = new Set<number>();
    nodes.forEach(node => {
        yValues.add(node.y);
        yValues.add(node.y + node.height);
    });
    return Array.from(yValues).sort((a, b) => a - b);
}

/**
 * Returns sorted unique X values (left and right) for all nodes.
 */
export function getUniqueXValues(nodes: CanvasNode[]): number[] {
    const xValues = new Set<number>();
    nodes.forEach(node => {
        xValues.add(node.x);
        xValues.add(node.x + node.width);
    });
    return Array.from(xValues).sort((a, b) => a - b);
}

/**
 * Expands the grid by adding extra cells between each unique value.
 * @param values The unique x or y values
 * @param cellsBetween Number of cells to add between each value (default 5)
 */
export function expandGridValues(values: number[], cellsBetween = 5): number[] {
    const expanded: number[] = [];
    for (let i = 0; i < values.length; i++) {
        expanded.push(values[i]);
        if (i < values.length - 1) {
            const current = values[i];
            const next = values[i + 1];
            const step = (next - current) / (cellsBetween + 1);
            for (let j = 1; j <= cellsBetween; j++) {
                expanded.push(current + (step * j));
            }
        }
    }
    return expanded;
} 