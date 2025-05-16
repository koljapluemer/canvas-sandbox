import { CanvasNode } from './types';
import * as path from 'path';

/**
 * Returns the HTML content for a node, based on its type.
 */
export function getNodeContent(node: CanvasNode): string {
    switch (node.type) {
        case 'text':
            return node.text || '';
        case 'file':
            return path.basename(node.file || '');
        default:
            return `[${node.type} node]`;
    }
}

/**
 * Returns the grid placement CSS for a node.
 * @param node The node to place
 * @param xValues The expanded grid x values
 * @param yValues The expanded grid y values
 */
export function getNodeGridPlacement(node: CanvasNode, xValues: number[], yValues: number[]): { yIndex: number, xIndex: number, rowSpan: number, colSpan: number } {
    const yIndex = yValues.findIndex(y => y >= node.y) + 1;
    const xIndex = xValues.findIndex(x => x >= node.x) + 1;
    const rowSpan = yValues.findIndex(y => y >= node.y + node.height) - yValues.findIndex(y => y >= node.y);
    const colSpan = xValues.findIndex(x => x >= node.x + node.width) - xValues.findIndex(x => x >= node.x);
    return { yIndex, xIndex, rowSpan, colSpan };
}

/**
 * Generates the HTML <section> for a node, with grid placement and class.
 */
export function nodeSectionHtml(node: CanvasNode, xValues: number[], yValues: number[]): string {
    const { yIndex, xIndex, rowSpan, colSpan } = getNodeGridPlacement(node, xValues, yValues);
    return `
        <section class="node ${node.type}" 
                 style="grid-row: ${yIndex} / span ${rowSpan}; 
                        grid-column: ${xIndex} / span ${colSpan};">
            ${getNodeContent(node)}
        </section>`;
} 