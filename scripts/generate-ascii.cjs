const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const imagePath = path.join(__dirname, '../public/img/avatar.png');
const outputPath = path.join(__dirname, '../src/data/avatar-ascii.json');

// ASCII characters from dark to light - added more spaces for sparseness
const density = '        .:-=+*#%@';

async function run() {
  try {
    const image = await Jimp.read(imagePath);
    
    // Reduce target width to make the ASCII art sparser/less dense
    const targetWidth = 50; 
    const targetHeight = Math.floor((image.bitmap.height / image.bitmap.width) * targetWidth * 0.5);
    
    image.resize(targetWidth, targetHeight);
    image.greyscale();
    image.contrast(0.4); // stronger contrast
    
    let asciiArt = '';
    
    for (let y = 0; y < image.bitmap.height; y++) {
      let line = '';
      for (let x = 0; x < image.bitmap.width; x++) {
        const hex = image.getPixelColor(x, y);
        const rgba = Jimp.intToRGBA(hex);
        const avg = (rgba.r + rgba.g + rgba.b) / 3;
        
        const charIndex = Math.floor((avg / 255) * (density.length - 1));
        // Remove the extra space to prevent flattening
        line += density[charIndex];
      }
      asciiArt += line + '\n';
    }
    
    fs.writeFileSync(outputPath, JSON.stringify({ ascii: asciiArt }));
    console.log('ASCII Art generated successfully at src/data/avatar-ascii.json');
  } catch (err) {
    console.error('Error generating ASCII art:', err);
  }
}

run();
