import { ensureDirectoryExists, readFileUtf8, writeFileUtf8 } from './fileUtils.js';
import { getUniqueXValues, getUniqueYValues, expandGridValues } from './grid.js';
import { nodeSectionHtml } from './nodePlacement.js';
import { getPreferredDirection, findAvailableCellOnSide, createEdgeStub } from './edgeRouting.js';
import { Canvas, GridCell } from './types.js';
import * as path from 'path';
import * as fs from 'fs';

function generateHtml(canvasData: Canvas): string {
    const baseYValues = getUniqueYValues(canvasData.nodes);
    const baseXValues = getUniqueXValues(canvasData.nodes);
    const yValues = expandGridValues(baseYValues);
    const xValues = expandGridValues(baseXValues);

    // Create grid for edge routing
    const grid: GridCell[][] = Array(yValues.length - 1).fill(null)
        .map(() => Array(xValues.length - 1).fill(null)
            .map(() => ({ x: 0, y: 0, occupied: false })));

    // Process edges
    const edgeStubs: { x: number, y: number, svg: string }[] = [];
    canvasData.edges.forEach(edge => {
        const fromNode = canvasData.nodes.find(n => n.id === edge.fromNode);
        const toNode = canvasData.nodes.find(n => n.id === edge.toNode);
        if (!fromNode || !toNode) return;
        let direction = getPreferredDirection(fromNode, toNode);
        let cell = findAvailableCellOnSide(grid, fromNode, xValues, yValues, direction);
        if (!cell) {
            const directions: ('N' | 'S' | 'E' | 'W')[] = ['N', 'S', 'E', 'W'];
            for (const dir of directions) {
                if (dir !== direction) {
                    cell = findAvailableCellOnSide(grid, fromNode, xValues, yValues, dir);
                    if (cell) {
                        direction = dir;
                        break;
                    }
                }
            }
        }
        if (cell) {
            grid[cell.y][cell.x].occupied = true;
            grid[cell.y][cell.x].edge = {
                direction,
                color: edge.color || '#666'
            };
            edgeStubs.push({
                x: cell.x,
                y: cell.y,
                svg: createEdgeStub(direction, edge.color || '#666')
            });
        }
    });

    const gridTemplateRows = `repeat(${yValues.length - 1}, minmax(8px, auto))`;
    const gridTemplateColumns = `repeat(${xValues.length - 1}, minmax(8px, auto))`;
    const nodesHtml = canvasData.nodes.map(node => nodeSectionHtml(node, xValues, yValues)).join('\n');
    const edgeCells = edgeStubs.map(stub => `
        <div class="edge-cell" 
             style="grid-row: ${stub.y + 1}; 
                    grid-column: ${stub.x + 1};">
            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                ${stub.svg}
            </svg>
        </div>
    `).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canvas View</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .canvas-grid {
            display: grid;
            grid-template-rows: ${gridTemplateRows};
            grid-template-columns: ${gridTemplateColumns};
            gap: 2px;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            background: #eee;
        }
        .node {
            padding: 15px;
            border-radius: 8px;
            background: #f5f5f5;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .edge-cell {
            min-width: 8px;
            min-height: 8px;
            background: white;
        }
        .text {
            background: #e3f2fd;
        }
        .file {
            background: #f3e5f5;
        }
        .link {
            background: #e8f5e9;
        }
        .group {
            background: #fff3e0;
        }
    </style>
</head>
<body>
    <div class="canvas-grid">
        ${edgeCells}
        ${nodesHtml}
    </div>
</body>
</html>`;
}

// Main execution
const inputDir = 'data/in';
const outputDir = 'data/out';
ensureDirectoryExists(outputDir);
const canvasFiles = fs.readdirSync(inputDir).filter(file => file.endsWith('.canvas'));
canvasFiles.forEach(file => {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace('.canvas', '.html'));
    const canvasData: Canvas = JSON.parse(readFileUtf8(inputPath));
    const html = generateHtml(canvasData);
    writeFileUtf8(outputPath, html);
    console.log(`Converted ${file} to HTML`);
}); 