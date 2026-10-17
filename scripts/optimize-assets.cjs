/**
 * 资源优化流水线
 *
 * 1. 把 public 下的大图转成同目录的 .webp（保留原图作为回退）
 * 2. 把 src/data/*.json 里指向已生成 .webp 的路径改写成 .webp
 *
 * 幂等：webp 存在且比源图新时直接跳过。
 * 环境里没有 ImageMagick 时只做路径改写，不阻塞构建。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'src', 'data');

const SCAN_DIRS = ['works', 'img-works', 'img-projects', 'img'];
const ROOT_IMAGE_DIRS = ['']; // public 根目录下的大图

const MAX_WIDTH = 1920;
const QUALITY = 88;
const MIN_BYTES = 60 * 1024;
const IMAGE_RE = /\.(png|jpe?g)$/i;

const rel = (p) => path.relative(PUBLIC_DIR, p).split(path.sep).join('/');

const canConvert = (() => {
  try {
    execFileSync('magick', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execFileSync('convert', ['-version'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
})();

const MAGICK = (() => {
  try {
    execFileSync('magick', ['-version'], { stdio: 'ignore' });
    return 'magick';
  } catch {
    return 'convert';
  }
})();

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** public 相对路径 -> webp 相对路径 */
const webpMap = new Map();

function collectAndConvert() {
  const subdirFiles = SCAN_DIRS.map((d) => path.join(PUBLIC_DIR, d)).flatMap((dir) => walk(dir));
  // public 根目录只取直属文件，避免和上面的目录重复遍历
  const rootFiles = ROOT_IMAGE_DIRS.map((d) => path.join(PUBLIC_DIR, d))
    .flatMap((dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []))
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(PUBLIC_DIR, entry.name));
  const files = [...subdirFiles, ...rootFiles];

  let converted = 0;
  let skipped = 0;
  let savedBytes = 0;

  for (const file of files) {
    if (!IMAGE_RE.test(file)) continue;

    const stat = fs.statSync(file);
    const isRoot = path.dirname(file) === PUBLIC_DIR;
    if (isRoot && stat.size < 500 * 1024) continue; // 根目录只处理大图
    if (!isRoot && stat.size < MIN_BYTES) continue;

    const target = file.replace(IMAGE_RE, '.webp');
    const key = rel(file);
    const webpKey = rel(target);

    const upToDate = fs.existsSync(target) && fs.statSync(target).mtimeMs >= stat.mtimeMs;

    if (upToDate) {
      skipped++;
      webpMap.set(key, webpKey);
      continue;
    }

    if (!canConvert) {
      if (fs.existsSync(target)) webpMap.set(key, webpKey);
      continue;
    }

    try {
      execFileSync(
        MAGICK,
        [file, '-strip', '-resize', `${MAX_WIDTH}x${MAX_WIDTH}>`, '-quality', String(QUALITY), '-define', 'webp:method=6', target],
        { stdio: 'ignore' }
      );
      const newSize = fs.statSync(target).size;
      savedBytes += stat.size - newSize;
      converted++;
      webpMap.set(key, webpKey);
      console.log(
        `[webp] ${key}  ${(stat.size / 1024 / 1024).toFixed(2)}MB -> ${(newSize / 1024).toFixed(0)}KB`
      );
    } catch (err) {
      console.warn(`[webp] 跳过 ${key}: ${err.message}`);
    }
  }

  console.log(
    `[webp] 转换 ${converted} 张，已是最新 ${skipped} 张，节省 ${(savedBytes / 1024 / 1024).toFixed(1)}MB`
  );
}

function rewriteDataFiles() {
  if (!fs.existsSync(DATA_DIR)) return;
  let touched = 0;

  for (const name of fs.readdirSync(DATA_DIR)) {
    if (!name.endsWith('.json')) continue;
    const file = path.join(DATA_DIR, name);
    const before = fs.readFileSync(file, 'utf-8');
    let after = before;

    for (const [src, webp] of webpMap) {
      // 数据里两种写法都出现过："/img-works/a.png" 与 "works/a.png"
      after = after.split(`"/${src}"`).join(`"/${webp}"`);
      after = after.split(`"${src}"`).join(`"${webp}"`);
    }

    if (after !== before) {
      fs.writeFileSync(file, after);
      touched++;
      console.log(`[data] 改写 ${name}`);
    }
  }

  if (touched === 0) console.log('[data] 无需改写');
}

console.log(`[assets] 开始处理 ${PUBLIC_DIR}${canConvert ? '' : '（未检测到 ImageMagick，仅改写路径）'}`);
collectAndConvert();
rewriteDataFiles();
console.log('[assets] 完成');
