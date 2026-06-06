const mm = require('music-metadata');
const fs = require('fs');

(async () => {
  const dir = './public/audio';
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f.endsWith('.mp3')) {
      const metadata = await mm.parseFile(dir + '/' + f);
      console.log(`${f} | TITLE: ${metadata.common.title} | ARTIST: ${metadata.common.artist}`);
    }
  }
})();
