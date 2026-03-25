const fs = require('fs');
const path = require('path');

function stripComments(content) {
    // Matches both single-line (//) and multi-line (/* */) comments
    // This regex is basic and might struggle with some edge cases (like comments inside strings)
    // but for this codebase it should be fine.
    return content
        .replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|(?<![:])\/\/.*$/gm, '')
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .replace(/\n\s*\n\n+/g, '\n\n'); // Clean up excessive blank lines
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            console.log(`Processing ${fullPath}`);
            const content = fs.readFileSync(fullPath, 'utf8');
            const stripped = stripComments(content);
            fs.writeFileSync(fullPath, stripped, 'utf8');
        }
    }
}

const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
    processDirectory(srcDir);
    console.log('Finished stripping comments.');
} else {
    console.error('src directory not found in', __dirname);
}
