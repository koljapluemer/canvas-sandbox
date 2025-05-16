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

interface Canvas {
    nodes: CanvasNode[];
    edges: any[]; // We're ignoring edges for now
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
    const CELLS_BETWEEN = 5; // Number of cells to add between each value

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

function convertCanvasToHtml(canvas: Canvas): string {
    const baseYValues = getUniqueYValues(canvas.nodes);
    const baseXValues = getUniqueXValues(canvas.nodes);
    
    // Expand the grid with extra cells
    const yValues = expandGridValues(baseYValues);
    const xValues = expandGridValues(baseXValues);
    
    const gridTemplateRows = `repeat(${yValues.length - 1}, auto)`;
    const gridTemplateColumns = `repeat(${xValues.length - 1}, auto)`;
    
    const nodes = canvas.nodes.map(node => {
        // Find the closest expanded grid positions
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
