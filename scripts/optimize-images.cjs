const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const MAX_WIDTH = 1920;
const QUALITY = 80;
const SIZE_THRESHOLD = 500 * 1024; // 500 KB

const CACHE_FILE = path.join(__dirname, '.optimization-cache.json');
let optimizedCache = {};
if (fs.existsSync(CACHE_FILE)) {
    try {
        optimizedCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch (e) {
        optimizedCache = {};
    }
}

function saveCache() {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(optimizedCache, null, 2));
}

async function optimizeImage(filePath, size) {
    console.log(`Optimizing: ${filePath} (${(size / 1024 / 1024).toFixed(2)} MB)`);
    try {
        const image = await Jimp.read(filePath);
        let changed = false;

        if (image.bitmap.width > MAX_WIDTH) {
            image.resize(MAX_WIDTH, Jimp.AUTO);
            changed = true;
        }

        image.quality(QUALITY);
        await image.writeAsync(filePath);
        
        const newSize = fs.statSync(filePath).size;
        console.log(`[Success] -> New Size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
        
        // Record the file size after optimization to prevent re-running
        optimizedCache[filePath] = newSize;
        saveCache();
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
            if (stat.size > SIZE_THRESHOLD) {
                // Skip if this exact file size is already in our cache (meaning we already compressed it)
                if (optimizedCache[fullPath] === stat.size) {
                    continue;
                }
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
