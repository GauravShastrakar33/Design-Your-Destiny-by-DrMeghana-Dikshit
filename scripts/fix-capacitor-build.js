import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('dist/public/index.html');

if (fs.existsSync(indexPath)) {
    console.log('🛠️ Stripping modern attributes for WebView compatibility...');
    let content = fs.readFileSync(indexPath, 'utf-8');

    // 1. Remove modulepreload links
    content = content.replace(/<link rel="modulepreload"[^>]*>/g, '');

    // 2. Remove all crossorigin and integrity attributes
    content = content.replace(/ crossorigin(="")?/g, '');
    content = content.replace(/ integrity="[^"]*"/g, '');

    // 3. DO NOT touch paths - let Vite's base: "./" handle it

    fs.writeFileSync(indexPath, content);
    console.log('✅ index.html finalized.');
} else {
    console.error('❌ index.html not found.');
    process.exit(1);
}
