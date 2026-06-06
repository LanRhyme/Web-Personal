const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');

async function downloadSong(query, filename) {
    console.log(`Searching for: ${query}`);
    const r = await yts(query);
    const video = r.videos[0];
    if (!video) {
        console.log(`No results for ${query}`);
        return;
    }
    console.log(`Found: ${video.title} (${video.url})`);

    const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
    stream.pipe(fs.createWriteStream(filename));

    return new Promise((resolve, reject) => {
        stream.on('end', () => {
            console.log(`Finished downloading: ${filename}`);
            resolve();
        });
        stream.on('error', (err) => {
            console.error(`Error downloading ${filename}:`, err);
            reject(err);
        });
    });
}

(async () => {
    try {
        await downloadSong("Haggstrom C418 soundtrack", "public/audio/Haggstrom.mp3");
        await downloadSong("Old Memory Yosuga no Sora ost", "public/audio/Old Memory.mp3");
        console.log("All done!");
    } catch (e) {
        console.error(e);
    }
})();
