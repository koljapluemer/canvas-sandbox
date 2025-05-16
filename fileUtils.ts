import * as fs from 'fs';

/**
 * Ensures a directory exists, creating it recursively if needed.
 */
export function ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Reads a file as UTF-8 text.
 */
export function readFileUtf8(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Writes text to a file (UTF-8).
 */
export function writeFileUtf8(filePath: string, data: string) {
    fs.writeFileSync(filePath, data);
} 