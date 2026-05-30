const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const MAX_WIDTH = 1920;
const QUALITY = 80;
const SIZE_THRESHOLD = 500 * 1024; // 500 KB

async function optimizeImage(filePath, size) {
    console.log(`Optimizing: ${filePath} (${(size / 1024 / 1024).toFixed(2)} MB)`);
    try {
        const image = await Jimp.read(filePath);
        let changed = false;

        if (image.bitmap.width > MAX_WIDTH) {
            image.resize(MAX_WIDTH, Jimp.AUTO);
            changed = true;
        }

        // Always apply quality down to 80 to reduce file size
        image.quality(QUALITY);
        
        await image.writeAsync(filePath);
        
        const newSize = fs.statSync(filePath).size;
        console.log(`[Success] -> New Size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
    } catch (err) {
        console.error(`[Error] processing ${filePath}:`, err.message);
    }
}

async function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            await processDirectory(fullPath);
        } else if (/\.(png|jpe?g)$/i.test(fullPath)) {
            // Only optimize if file size > 500KB
            if (stat.size > SIZE_THRESHOLD) {
                await optimizeImage(fullPath, stat.size);
            }
        }
    }
}

const publicDir = path.join(__dirname, '../public');
console.log(`Starting image optimization in ${publicDir}...`);

processDirectory(publicDir).then(() => {
    console.log('All eligible images optimized!');
}).catch(err => {
    console.error('Fatal Error:', err);
});
