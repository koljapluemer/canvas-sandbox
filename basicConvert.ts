import * as fs from 'fs';
import * as path from 'path';

interface CanvasNode {
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

interface CanvasEdge {
    id: string;
    fromNode: string;
    toNode: string;
    color?: string;
}

interface Canvas {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

interface GridCell {
    x: number;
    y: number;
    occupied: boolean;
    edge?: {
        direction: 'N' | 'S' | 'E' | 'W';
        color: string;
    };
}

function ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function getUniqueYValues(nodes: CanvasNode[]): number[] {
    const yValues = new Set<number>();
    nodes.forEach(node => {
        yValues.add(node.y);
        yValues.add(node.y + node.height);
    });
    return Array.from(yValues).sort((a, b) => a - b);
}

function getUniqueXValues(nodes: CanvasNode[]): number[] {
    const xValues = new Set<number>();
    nodes.forEach(node => {
        xValues.add(node.x);
        xValues.add(node.x + node.width);
    });
    return Array.from(xValues).sort((a, b) => a - b);
}

function expandGridValues(values: number[]): number[] {
    const expanded: number[] = [];
    const CELLS_BETWEEN = 5;

    for (let i = 0; i < values.length; i++) {
        expanded.push(values[i]);
        if (i < values.length - 1) {
            const current = values[i];
            const next = values[i + 1];
            const step = (next - current) / (CELLS_BETWEEN + 1);
            
            for (let j = 1; j <= CELLS_BETWEEN; j++) {
                expanded.push(current + (step * j));
            }
        }
    }
    return expanded;
}

function getNodeContent(node: CanvasNode): string {
    switch (node.type) {
        case 'text':
            return node.text || '';
        case 'file':
            return path.basename(node.file || '');
        default:
            return `[${node.type} node]`;
    }
}

function findAvailableCell(
    grid: GridCell[][],
    startX: number,
    startY: number,
    direction: 'N' | 'S' | 'E' | 'W'
): { x: number, y: number } | null {
    const width = grid[0].length;
    const height = grid.length;

    switch (direction) {
        case 'N':
            for (let y = startY - 1; y >= 0; y--) {
                if (!grid[y][startX].occupied) {
                    return { x: startX, y };
                }
            }
            break;
        case 'S':
            for (let y = startY + 1; y < height; y++) {
                if (!grid[y][startX].occupied) {
                    return { x: startX, y };
                }
            }
            break;
        case 'E':
            for (let x = startX + 1; x < width; x++) {
                if (!grid[startY][x].occupied) {
                    return { x, y: startY };
                }
            }
            break;
        case 'W':
            for (let x = startX - 1; x >= 0; x--) {
                if (!grid[startY][x].occupied) {
                    return { x, y: startY };
                }
            }
            break;
    }
    return null;
}

function getPreferredDirection(fromNode: CanvasNode, toNode: CanvasNode): 'N' | 'S' | 'E' | 'W' {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    
    // If horizontal distance is greater, prefer horizontal direction
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'E' : 'W';
    }
    // Otherwise prefer vertical direction
    return dy > 0 ? 'S' : 'N';
}

function createEdgeStub(direction: 'N' | 'S' | 'E' | 'W', color: string): string {
    const strokeWidth = 2;
    let path = '';
    
    switch (direction) {
        case 'N':
            path = `M50 100 L50 0`;
            break;
        case 'S':
            path = `M50 0 L50 100`;
            break;
        case 'E':
            path = `M0 50 L100 50`;
            break;
        case 'W':
            path = `M100 50 L0 50`;
            break;
    }
    
    return `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>`;
}

function convertCanvasToHtml(canvas: Canvas): string {
    const baseYValues = getUniqueYValues(canvas.nodes);
    const baseXValues = getUniqueXValues(canvas.nodes);
    
    const yValues = expandGridValues(baseYValues);
    const xValues = expandGridValues(baseXValues);
    
    // Create grid for edge routing
    const grid: GridCell[][] = Array(yValues.length - 1).fill(null)
        .map(() => Array(xValues.length - 1).fill(null)
            .map(() => ({ x: 0, y: 0, occupied: false })));

    // Process edges
    const edgeStubs: { x: number, y: number, svg: string }[] = [];
    
    canvas.edges.forEach(edge => {
        const fromNode = canvas.nodes.find(n => n.id === edge.fromNode);
        const toNode = canvas.nodes.find(n => n.id === edge.toNode);
        
        if (!fromNode || !toNode) return;

        const fromX = xValues.findIndex(x => x >= fromNode.x);
        const fromY = yValues.findIndex(y => y >= fromNode.y);
        
        // Try preferred direction first
        let direction = getPreferredDirection(fromNode, toNode);
        let cell = findAvailableCell(grid, fromX, fromY, direction);
        
        // If preferred direction fails, try other directions
        if (!cell) {
            const directions: ('N' | 'S' | 'E' | 'W')[] = ['N', 'S', 'E', 'W'];
            for (const dir of directions) {
                if (dir !== direction) {
                    cell = findAvailableCell(grid, fromX, fromY, dir);
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
    
    const nodes = canvas.nodes.map(node => {
        const yIndex = yValues.findIndex(y => y >= node.y) + 1;
        const xIndex = xValues.findIndex(x => x >= node.x) + 1;
        const rowSpan = yValues.findIndex(y => y >= node.y + node.height) - yValues.findIndex(y => y >= node.y);
        const colSpan = xValues.findIndex(x => x >= node.x + node.width) - xValues.findIndex(x => x >= node.x);
        
        return `
            <section class="node ${node.type}" 
                     style="grid-row: ${yIndex} / span ${rowSpan}; 
                            grid-column: ${xIndex} / span ${colSpan};">
                ${getNodeContent(node)}
            </section>`;
    }).join('\n');

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
        ${nodes}
    </div>
</body>
</html>`;
}

function processCanvasFile(inputPath: string, outputPath: string) {
    const canvasData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    const html = convertCanvasToHtml(canvasData);
    fs.writeFileSync(outputPath, html);
}

// Main execution
const inputDir = 'data/in';
const outputDir = 'data/out';

ensureDirectoryExists(outputDir);

const canvasFiles = fs.readdirSync(inputDir)
    .filter(file => file.endsWith('.canvas'));

canvasFiles.forEach(file => {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace('.canvas', '.html'));
    processCanvasFile(inputPath, outputPath);
    console.log(`Converted ${file} to HTML`);
});
