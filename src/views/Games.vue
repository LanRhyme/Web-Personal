<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

type Phase = 'start' | 'playing' | 'transition' | 'results';
type Mode = 'simple' | 'challenge' | 'hell' | 'final';
type AnsState = 'idle' | 'correct' | 'wrong' | 'timeout';
type QuestionType = 'identify' | 'area' | 'reflection' | 'translation';

interface GraphPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
  showCoords?: boolean;
}

interface Question {
  type: QuestionType;
  target?: GraphPoint;
  refs?: GraphPoint[];
  shape?: GraphPoint[];
  reflectionAxis?: 'x' | 'y' | 'origin';
  originalPoint?: GraphPoint;
  reflectedPoint?: GraphPoint;
  translation?: { dx: number; dy: number };
  translatedPoint?: GraphPoint;
  choices: string[];
  correctIdx: number;
  prompt: string;
}

interface QuestionResult {
  question: Question;
  selectedIdx: number | null;
  isCorrect: boolean;
  timeSpent: number;
  mode: Mode;
}

const RANGE = 10;
const MODES: Mode[] = ['simple', 'challenge', 'hell', 'final'];

const MODE_CFG: Record<Mode, { time: number; choices: number; questions: number; grid: boolean; nums: boolean }> = {
  simple: { time: 20, choices: 3, questions: 3, grid: true, nums: true },
  challenge: { time: 10, choices: 5, questions: 3, grid: false, nums: true },
  hell: { time: 10, choices: 7, questions: 3, grid: false, nums: false },
  final: { time: 0, choices: 5, questions: 6, grid: false, nums: false },
};

const POINTS_PER_MODE: Record<Mode, number> = { simple: 10, challenge: 20, hell: 30, final: 50 };

const MODE_LABELS: Record<Mode, string> = { simple: '简单', challenge: '挑战', hell: '地狱', final: '终极挑战' };

const MODE_COLORS: Record<Mode, string> = { simple: 'var(--color-brand)', challenge: '#f59e0b', hell: '#ef4444', final: '#8b5cf6' };

const TRANSITION_MSG: Record<string, { title: string; sub: string }> = {
  challenge: { title: '升级！', sub: '进入挑战模式 — 网格线已移除！' },
  hell: { title: '太棒了！', sub: '欢迎来到地狱模式 — 无网格、无数字标签！' },
  final: { title: '终极挑战！', sub: '混合题型：面积、坐标识别、对称与平移。无时间限制 — 速度越快奖励越多！' },
};

const TIPS: Record<Mode, string[]> = {
  simple: [
    '使用网格线和数字标签帮助识别坐标。',
    '记住：(x, y) 其中 x 是水平方向，y 是垂直方向。',
    '从原点开始数步数：右/左为 x，上/下为 y。',
    '先确认象限（正负号），再计算精确距离。',
  ],
  challenge: [
    '网格线已移除！仔细从坐标轴数起。',
    '使用刻度标记找到精确位置。',
    '从 y 轴水平追踪，再从 x 轴垂直追踪。',
    '按顺序读出坐标：先 x 后 y。',
  ],
  hell: [
    '使用参考点 A 和 B 来推断 P 的位置。',
    '观察共享坐标来缩小答案范围。',
    '如果 A 与 P 共享 x 坐标，只需关注 y 的变化（反之亦然）。',
    '估算刻度间距以避免差一错误。',
  ],
  final: [],
};

const TIPS_BY_TYPE: Record<QuestionType, string[]> = {
  area: ['使用坐标公式计算面积。', '矩形面积：宽度乘以高度（坐标差）。', '三角形面积：底乘以高除以二。'],
  identify: ['使用参考点找到目标坐标。', '用参考点锁定 x 或 y，然后解另一个轴。'],
  reflection: [
    '关于 x 轴对称：(x, y) → (x, -y)',
    '关于 y 轴对称：(x, y) → (-x, y)',
    '关于原点对称：(x, y) → (-x, -y)',
  ],
  translation: [
    '平移会同时改变两个坐标。',
    '向右移动 (+dx) 或向左移动 (-dx) 改变 x 坐标。',
    '向上移动 (+dy) 或向下移动 (-dy) 改变 y 坐标。',
  ],
};

const QUESTION_TYPE_NAMES: Record<QuestionType, string> = {
  identify: '坐标识别',
  reflection: '对称变换',
  translation: '平移变换',
  area: '面积计算',
};

const phase = ref<Phase>('start');
const currentMode = ref<Mode>('simple');
const modeQIdx = ref(0);
const question = ref<Question | null>(null);
const score = ref(0);
const correctCount = ref(0);
const wrongCount = ref(0);
const timeLeft = ref(0);
const maxTime = ref(0);
const selectedIdx = ref<number | null>(null);
const answerState = ref<AnsState>('idle');
const finalStartMs = ref(0);
const finalElapsedSec = ref(0);
const finalElapsedDisplay = ref(0);
const countdownTimer = ref<number | null>(null);
const finalClockTimer = ref<number | null>(null);
const questionStartTime = ref(0);
const questionResults = ref<QuestionResult[]>([]);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const pendingRender = ref(false);

const isDark = ref(false);

const updateTheme = () => {
  isDark.value = document.documentElement.classList.contains('dark');
};

const currentConfig = computed(() => MODE_CFG[currentMode.value]);
const currentLabel = computed(() => MODE_LABELS[currentMode.value]);
const currentColor = computed(() => MODE_COLORS[currentMode.value]);
const currentTips = computed(() => {
  if (currentMode.value === 'final') {
    return [...(TIPS_BY_TYPE[question.value?.type || 'identify'] || TIPS_BY_TYPE.identify), '⚡ 速度奖励：完成越快分数越高！'];
  }
  if (currentMode.value === 'hell') {
    return TIPS_BY_TYPE[question.value?.type || 'identify'] || TIPS_BY_TYPE.identify;
  }
  return TIPS[currentMode.value];
});
const timerPercent = computed(() => maxTime.value > 0 ? (timeLeft.value / maxTime.value) * 100 : 100);
const timerClass = computed(() => {
  if (timeLeft.value <= 3) return 'danger';
  if (timeLeft.value <= 5) return 'warn';
  return '';
});
const accuracy = computed(() => {
  const total = correctCount.value + wrongCount.value;
  return total > 0 ? Math.round((correctCount.value / total) * 100) : 0;
});
const timeBonus = computed(() => Math.max(0, 300 - finalElapsedSec.value));

const typeStats = computed(() => {
  const stats: Record<QuestionType, { total: number; correct: number; time: number }> = {
    identify: { total: 0, correct: 0, time: 0 },
    reflection: { total: 0, correct: 0, time: 0 },
    translation: { total: 0, correct: 0, time: 0 },
    area: { total: 0, correct: 0, time: 0 },
  };
  questionResults.value.forEach(r => {
    stats[r.question.type].total++;
    stats[r.question.type].time += r.timeSpent;
    if (r.isCorrect) stats[r.question.type].correct++;
  });
  return stats;
});

const modeStats = computed(() => {
  const stats: Record<Mode, { total: number; correct: number }> = {
    simple: { total: 0, correct: 0 },
    challenge: { total: 0, correct: 0 },
    hell: { total: 0, correct: 0 },
    final: { total: 0, correct: 0 },
  };
  questionResults.value.forEach(r => {
    stats[r.mode].total++;
    if (r.isCorrect) stats[r.mode].correct++;
  });
  return stats;
});

const avgTime = computed(() => {
  if (questionResults.value.length === 0) return 0;
  return Math.round(questionResults.value.reduce((sum, r) => sum + r.timeSpent, 0) / questionResults.value.length);
});

const maxStreak = computed(() => {
  let max = 0;
  let current = 0;
  questionResults.value.forEach(r => {
    if (r.isCorrect) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  });
  return max;
});

const getGrade = computed(() => {
  const acc = accuracy.value;
  if (acc >= 100) return { grade: 'S+', color: '#FFD700', message: '完美！全部正确！' };
  if (acc >= 90) return { grade: 'S', color: '#FFD700', message: '太棒了！你的表现非常出色！' };
  if (acc >= 80) return { grade: 'A', color: 'var(--color-brand)', message: '很好！继续保持这个水平！' };
  if (acc >= 60) return { grade: 'B', color: 'var(--color-brand)', message: '不错的表现，还有提升空间！' };
  if (acc >= 40) return { grade: 'C', color: '#f59e0b', message: '继续加油，多练习会更好！' };
  return { grade: 'D', color: '#ef4444', message: '别灰心，再试一次吧！' };
});

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i]!, a[j]!] = [a[j]!, a[i]!];
  }
  return a;
}

function setupCanvas(retryCount = 0): boolean {
  const canvas = canvasRef.value;
  if (!canvas) return false;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(Math.floor(rect.width), 200);
  const h = Math.max(Math.floor(rect.height), 200);
  
  if ((rect.width === 0 || rect.height === 0) && retryCount < 5) {
    requestAnimationFrame(() => setupCanvas(retryCount + 1));
    return false;
  }
  
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}

function drawGraph(opts: {
  showGrid: boolean;
  showNumbers: boolean;
  points: GraphPoint[];
  edges?: [GraphPoint, GraphPoint][];
}) {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext('2d');
  if (!ctx || !canvas) return;

  const dark = isDark.value;
  const axisColor = dark ? 'rgba(255,255,255,0.7)' : 'rgba(30,60,50,0.85)';
  const gridColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(30,60,50,0.15)';
  const tickColor = dark ? 'rgba(255,255,255,0.4)' : 'rgba(30,60,50,0.5)';
  const numColor = dark ? 'rgba(255,255,255,0.6)' : 'rgba(30,60,50,0.75)';
  const bgColor = dark ? 'rgba(255,255,255,0.02)' : 'rgba(30,60,50,0.04)';

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const pad = 32;
  const gSize = Math.min(w - pad * 2, h - pad * 2);
  const ox = (w - gSize) / 2;
  const oy = (h - gSize) / 2;
  const unit = gSize / (RANGE * 2);
  const cx = ox + gSize / 2;
  const cy = oy + gSize / 2;
  const toP = (gx: number, gy: number): [number, number] => [cx + gx * unit, cy - gy * unit];

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bgColor;
  ctx.fillRect(ox, oy, gSize, gSize);

  if (opts.showGrid) {
    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = -RANGE; i <= RANGE; i++) {
      if (i === 0) continue;
      const [vx] = toP(i, 0);
      ctx.beginPath(); ctx.moveTo(vx, oy); ctx.lineTo(vx, oy + gSize); ctx.stroke();
      const [, hy] = toP(0, i);
      ctx.beginPath(); ctx.moveTo(ox, hy); ctx.lineTo(ox + gSize, hy); ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(ox, cy); ctx.lineTo(ox + gSize, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx, oy + gSize); ctx.stroke();
  ctx.restore();

  const asz = 7;
  ctx.save();
  ctx.fillStyle = axisColor;
  ctx.beginPath(); ctx.moveTo(ox + gSize, cy); ctx.lineTo(ox + gSize - asz, cy - asz / 2); ctx.lineTo(ox + gSize - asz, cy + asz / 2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx - asz / 2, oy + asz); ctx.lineTo(cx + asz / 2, oy + asz); ctx.closePath(); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = tickColor;
  ctx.lineWidth = 1;
  for (let i = -RANGE; i <= RANGE; i++) {
    if (i === 0) continue;
    const [tx] = toP(i, 0);
    ctx.beginPath(); ctx.moveTo(tx, cy - 4); ctx.lineTo(tx, cy + 4); ctx.stroke();
    const [, ty] = toP(0, i);
    ctx.beginPath(); ctx.moveTo(cx - 4, ty); ctx.lineTo(cx + 4, ty); ctx.stroke();
  }
  ctx.restore();

  if (opts.showNumbers) {
    ctx.save();
    ctx.fillStyle = numColor;
    const fontSize = Math.max(10, Math.min(12, unit * 0.45));
    ctx.font = `${fontSize}px system-ui`;
    for (let i = -RANGE; i <= RANGE; i++) {
      if (i === 0) continue;
      const [nx] = toP(i, 0);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(String(i), nx, cy + 8);
      const [, ny] = toP(0, i);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(String(i), cx - 8, ny);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('O', cx - 6, cy + 6);
    ctx.restore();
  }

  if (opts.edges) {
    ctx.save();
    ctx.strokeStyle = 'rgba(71, 158, 245, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const [p1, p2] of opts.edges) {
      const [x1, y1] = toP(p1.x, p1.y);
      const [x2, y2] = toP(p2.x, p2.y);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.restore();
  }

  for (const pt of opts.points) {
    const [px, py] = toP(pt.x, pt.y);
    const color = pt.color || '#479ef5';
    ctx.save();
    const grad = ctx.createRadialGradient(px, py, 0, px, py, 14);
    grad.addColorStop(0, `${color}55`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = dark ? '#fff' : '#2d4a3e'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    if (pt.label) {
      ctx.save();
      ctx.fillStyle = color; ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(pt.label, px + 10, py - 8);
      ctx.restore();
    }
    if (pt.showCoords) {
      ctx.save();
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(45,74,62,0.85)'; ctx.font = '12px system-ui';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(`(${pt.x}, ${pt.y})`, px + 10, py + 6);
      ctx.restore();
    }
  }
}

function renderQuestion() {
  if (!question.value) return;
  const c = MODE_CFG[currentMode.value];
  const points: GraphPoint[] = [];
  let edges: [GraphPoint, GraphPoint][] | undefined;

  if (question.value.type === 'identify') {
    if (question.value.target) points.push({ ...question.value.target, color: question.value.target.color || '#479ef5' });
    if (question.value.refs) for (const rp of question.value.refs) points.push({ ...rp, color: rp.color || '#ff9800', showCoords: true });
  } else if (question.value.type === 'area' && question.value.shape) {
    for (const sp of question.value.shape) points.push({ ...sp, color: sp.color || '#479ef5', showCoords: true });
    edges = [];
    for (let i = 0; i < question.value.shape.length; i++) {
      const p1 = question.value.shape[i];
      const p2 = question.value.shape[(i + 1) % question.value.shape.length];
      if (p1 && p2) edges.push([p1, p2]);
    }
  } else if (question.value.type === 'reflection') {
    if (question.value.originalPoint) points.push({ ...question.value.originalPoint });
    if (question.value.reflectedPoint) points.push({ ...question.value.reflectedPoint });
  } else if (question.value.type === 'translation') {
    if (question.value.originalPoint) points.push({ ...question.value.originalPoint });
    if (question.value.translatedPoint) points.push({ ...question.value.translatedPoint });
  }
  drawGraph({ showGrid: c.grid, showNumbers: c.nums, points, edges });
}

function makeCoordDistractors(cx: number, cy: number, count: number): string[] {
  const correct = `(${cx}, ${cy})`;
  const seen = new Set<string>([correct]);
  const pool: [number, number][] = ([
    [cy, cx], [-cx, cy], [cx, -cy], [-cx, -cy],
    [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1],
    [cx + 2, cy], [cx - 2, cy], [cx, cy + 2], [cx, cy - 2],
    [cx + 1, cy + 1], [cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1],
    [cx + 2, cy + 1], [cx - 2, cy - 1], [cx + 3, cy], [cx, cy + 3],
  ] as [number, number][]).filter(([x, y]) => Math.abs(x) <= RANGE && Math.abs(y) <= RANGE);

  const result: string[] = [];
  for (const [x, y] of shuffle(pool)) {
    const s = `(${x}, ${y})`;
    if (!seen.has(s)) { result.push(s); seen.add(s); }
    if (result.length >= count) return result;
  }
  while (result.length < count) {
    const rx = randInt(-RANGE + 1, RANGE - 1);
    const ry = randInt(-RANGE + 1, RANGE - 1);
    const s = `(${rx}, ${ry})`;
    if (!seen.has(s)) { result.push(s); seen.add(s); }
  }
  return result;
}

function genIdentifyQ(numChoices: number, hell: boolean): Question {
  let tx = 0, ty = 0;
  while (tx === 0 && ty === 0) {
    tx = randInt(-RANGE + 2, RANGE - 2);
    ty = randInt(-RANGE + 2, RANGE - 2);
  }
  const target: GraphPoint = { x: tx, y: ty, label: 'P', color: '#479ef5' };
  const refs: GraphPoint[] = [];
  if (hell) {
    let ry1 = ty;
    while (Math.abs(ry1 - ty) < 2) ry1 = randInt(-RANGE + 1, RANGE - 1);
    refs.push({ x: tx, y: ry1, label: 'A', color: '#ff9800', showCoords: true });
    let rx2 = tx;
    while (Math.abs(rx2 - tx) < 2) rx2 = randInt(-RANGE + 1, RANGE - 1);
    refs.push({ x: rx2, y: ty, label: 'B', color: '#ff9800', showCoords: true });
  }
  const correctStr = `(${tx}, ${ty})`;
  const distractors = makeCoordDistractors(tx, ty, numChoices - 1);
  const all = shuffle([correctStr, ...distractors]);
  return { type: 'identify', target, refs: refs.length > 0 ? refs : undefined, choices: all, correctIdx: all.indexOf(correctStr), prompt: '点 P 的坐标是什么？' };
}

function genReflectionQ(numChoices: number): Question {
  let ox = 0, oy = 0;
  while (ox === 0 || oy === 0) {
    ox = randInt(-RANGE + 2, RANGE - 2);
    oy = randInt(-RANGE + 2, RANGE - 2);
  }

  const axes: Array<'x' | 'y' | 'origin'> = ['x', 'y', 'origin'];
  const axis = axes[randInt(0, 2)];

  let rx: number, ry: number;
  let axisLabel: string;

  if (axis === 'x') {
    rx = ox;
    ry = -oy;
    axisLabel = 'x 轴';
  } else if (axis === 'y') {
    rx = -ox;
    ry = oy;
    axisLabel = 'y 轴';
  } else {
    rx = -ox;
    ry = -oy;
    axisLabel = '原点';
  }

  const originalPoint: GraphPoint = { x: ox, y: oy, label: 'P', color: '#479ef5', showCoords: true };
  const reflectedPoint: GraphPoint = { x: rx, y: ry, label: "P'", color: '#a855f7' };

  const correctStr = `(${rx}, ${ry})`;
  const distractors = makeCoordDistractors(rx, ry, numChoices - 1);
  const all = shuffle([correctStr, ...distractors]);

  const prompt = axis === 'origin'
    ? `点 P 关于原点对称，P' 的坐标是什么？`
    : `点 P 关于${axisLabel}对称，P' 的坐标是什么？`;

  return {
    type: 'reflection',
    originalPoint,
    reflectedPoint,
    reflectionAxis: axis,
    choices: all,
    correctIdx: all.indexOf(correctStr),
    prompt,
  };
}

function genTranslationQ(numChoices: number): Question {
  let ox = 0, oy = 0;
  while (ox === 0 && oy === 0) {
    ox = randInt(-RANGE + 3, RANGE - 3);
    oy = randInt(-RANGE + 3, RANGE - 3);
  }

  const dx = randInt(-3, 3);
  const dy = randInt(-3, 3);

  if (dx === 0 && dy === 0) {
    return genTranslationQ(numChoices);
  }

  const tx = ox + dx;
  const ty = oy + dy;

  if (Math.abs(tx) > RANGE - 1 || Math.abs(ty) > RANGE - 1) {
    return genTranslationQ(numChoices);
  }

  const originalPoint: GraphPoint = { x: ox, y: oy, label: 'P', color: '#479ef5', showCoords: true };
  const translatedPoint: GraphPoint = { x: tx, y: ty, label: "P'", color: '#a855f7' };

  const correctStr = `(${tx}, ${ty})`;
  const distractors = makeCoordDistractors(tx, ty, numChoices - 1);
  const all = shuffle([correctStr, ...distractors]);

  const dxStr = dx >= 0 ? `+${dx}` : `${dx}`;
  const dyStr = dy >= 0 ? `+${dy}` : `${dy}`;

  return {
    type: 'translation',
    originalPoint,
    translatedPoint,
    translation: { dx, dy },
    choices: all,
    correctIdx: all.indexOf(correctStr),
    prompt: `点 P 平移 (${dxStr}, ${dyStr}) 后，P' 的坐标是什么？`,
  };
}

function buildAreaQ(area: number, shapePoints: GraphPoint[], prompt: string): Question {
  const seen = new Set<number>([area]);
  const pool = [area + 1, area - 1, area + 2, area - 2, area * 2, Math.ceil(area / 2), area + 3, area - 3, area + 5, area + 4].filter((v) => v > 0);
  const dists: number[] = [];
  for (const c of shuffle(pool)) {
    if (!seen.has(c)) { dists.push(c); seen.add(c); }
    if (dists.length >= 4) break;
  }
  let fill = 6;
  while (dists.length < 4) {
    const v = area + fill;
    if (v > 0 && !seen.has(v)) { dists.push(v); seen.add(v); }
    fill++;
  }
  const correctStr = String(area);
  const all = shuffle([correctStr, ...dists.map(String)]);
  return { type: 'area', shape: shapePoints, choices: all, correctIdx: all.indexOf(correctStr), prompt };
}

function genRectAreaQ(): Question {
  const rw = randInt(2, 5), rh = randInt(2, 5);
  const x1 = randInt(-RANGE + 1, RANGE - rw - 1), y1 = randInt(-RANGE + 1, RANGE - rh - 1);
  const area = rw * rh;
  const pts: GraphPoint[] = [
    { x: x1, y: y1, label: 'A', color: '#479ef5', showCoords: true },
    { x: x1 + rw, y: y1, label: 'B', color: '#479ef5', showCoords: true },
    { x: x1 + rw, y: y1 + rh, label: 'C', color: '#479ef5', showCoords: true },
    { x: x1, y: y1 + rh, label: 'D', color: '#479ef5', showCoords: true },
  ];
  return buildAreaQ(area, pts, '计算矩形 ABCD 的面积。');
}

function genTriAreaQ(): Question {
  let base = randInt(2, 6);
  const height = randInt(2, 6);
  if (base % 2 !== 0 && height % 2 !== 0) base += 1;
  const ax = randInt(-RANGE + 1, RANGE - base - 1);
  const ay = randInt(-RANGE + 1, RANGE - height - 1);
  if (ax + base > RANGE - 1 || ay + height > RANGE - 1 || ax < -RANGE + 1 || ay < -RANGE + 1) return genRectAreaQ();
  const area = (base * height) / 2;
  const pts: GraphPoint[] = [
    { x: ax, y: ay, label: 'A', color: '#479ef5', showCoords: true },
    { x: ax + base, y: ay, label: 'B', color: '#479ef5', showCoords: true },
    { x: ax, y: ay + height, label: 'C', color: '#479ef5', showCoords: true },
  ];
  return buildAreaQ(area, pts, '计算三角形 ABC 的面积。');
}

function genFinalQ(idx: number): Question {
  const typeIdx = idx % 6;
  switch (typeIdx) {
    case 0: return genRectAreaQ();
    case 1: return genIdentifyQ(5, true);
    case 2: return genReflectionQ(5);
    case 3: return genTranslationQ(5);
    case 4: return genTriAreaQ();
    case 5: return genReflectionQ(5);
    default: return genIdentifyQ(5, true);
  }
}

function genHellQ(idx: number, numChoices: number): Question {
  const typeIdx = idx % 3;
  switch (typeIdx) {
    case 0: return genIdentifyQ(numChoices, true);
    case 1: return genReflectionQ(numChoices);
    case 2: return genTranslationQ(numChoices);
    default: return genIdentifyQ(numChoices, true);
  }
}

function startCountdown(seconds: number) {
  stopCountdown();
  timeLeft.value = seconds;
  maxTime.value = seconds;
  countdownTimer.value = window.setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      stopCountdown();
      onTimeout();
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownTimer.value !== null) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
}

function startFinalClock() {
  stopFinalClock();
  finalStartMs.value = Date.now();
  finalElapsedDisplay.value = 0;
  finalClockTimer.value = window.setInterval(() => {
    finalElapsedDisplay.value = Math.round((Date.now() - finalStartMs.value) / 1000);
  }, 1000);
}

function stopFinalClock() {
  if (finalClockTimer.value !== null) {
    clearInterval(finalClockTimer.value);
    finalClockTimer.value = null;
  }
}

function showPhase(p: Phase) {
  phase.value = p;
}

function startGame() {
  score.value = 0;
  correctCount.value = 0;
  wrongCount.value = 0;
  currentMode.value = 'simple';
  modeQIdx.value = 0;
  finalElapsedSec.value = 0;
  finalElapsedDisplay.value = 0;
  questionResults.value = [];
  showPhase('playing');
  nextTick(() => {
    loadNextQuestion();
  });
}

function loadNextQuestion() {
  const c = MODE_CFG[currentMode.value];
  if (modeQIdx.value >= c.questions) {
    const mi = MODES.indexOf(currentMode.value);
    if (mi < MODES.length - 1 && mi >= 0) {
      const nextMode = MODES[mi + 1];
      if (nextMode) enterTransition(nextMode);
    }
    else finishGame();
    return;
  }

  selectedIdx.value = null;
  answerState.value = 'idle';
  questionStartTime.value = Date.now();

  if (currentMode.value === 'final') question.value = genFinalQ(modeQIdx.value);
  else if (currentMode.value === 'hell') question.value = genHellQ(modeQIdx.value, c.choices);
  else question.value = genIdentifyQ(c.choices, false);

  modeQIdx.value++;
  pendingRender.value = true;

  nextTick(() => {
    requestAnimationFrame(() => {
      if (!pendingRender.value) return;
      const success = setupCanvas();
      if (success) {
        pendingRender.value = false;
        renderQuestion();
        if (c.time > 0) {
          startCountdown(c.time);
        } else {
          timeLeft.value = 0;
          maxTime.value = 0;
          if (currentMode.value === 'final' && modeQIdx.value === 1) startFinalClock();
        }
      }
    });
  });
}

function pickAnswer(idx: number) {
  if (answerState.value !== 'idle') return;
  selectedIdx.value = idx;
  stopCountdown();

  const timeSpent = currentConfig.value.time > 0 
    ? currentConfig.value.time - timeLeft.value 
    : Math.round((Date.now() - questionStartTime.value) / 1000);

  if (!question.value) return;
  
  const isCorrect = idx === question.value.correctIdx;
  if (isCorrect) {
    answerState.value = 'correct';
    correctCount.value++;
    score.value += POINTS_PER_MODE[currentMode.value];
  } else {
    answerState.value = 'wrong';
    wrongCount.value++;
  }

  questionResults.value.push({
    question: question.value,
    selectedIdx: idx,
    isCorrect,
    timeSpent,
    mode: currentMode.value,
  });

  setTimeout(loadNextQuestion, 1400);
}

function onTimeout() {
  if (answerState.value !== 'idle') return;
  answerState.value = 'timeout';
  wrongCount.value++;
  
  const timeSpent = currentConfig.value.time;

  if (question.value) {
    questionResults.value.push({
      question: question.value,
      selectedIdx: null,
      isCorrect: false,
      timeSpent,
      mode: currentMode.value,
    });
  }

  modeQIdx.value++;
  setTimeout(loadNextQuestion, 1400);
}

function enterTransition(nextMode: Mode) {
  stopCountdown();
  currentMode.value = nextMode;
  showPhase('transition');
}

function continueFromTransition() {
  modeQIdx.value = 0;
  showPhase('playing');
  nextTick(() => {
    loadNextQuestion();
  });
}

function finishGame() {
  stopCountdown();
  stopFinalClock();
  if (finalStartMs.value > 0) {
    finalElapsedSec.value = Math.round((Date.now() - finalStartMs.value) / 1000);
    score.value += timeBonus.value;
  }
  showPhase('results');
}

function restartGame() {
  stopCountdown();
  stopFinalClock();
  showPhase('start');
}

function handleKeydown(e: KeyboardEvent) {
  if (phase.value === 'playing' && answerState.value === 'idle' && question.value) {
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= question.value.choices.length) pickAnswer(num - 1);
  }
  if (phase.value === 'transition' && (e.key === 'Enter' || e.key === ' ')) continueFromTransition();
}

function handleResize() {
  if (phase.value === 'playing') {
    setupCanvas();
    renderQuestion();
  }
}

function onTransitionComplete() {
  if (phase.value === 'playing' && pendingRender.value) {
    pendingRender.value = false;
    requestAnimationFrame(() => {
      setupCanvas();
      renderQuestion();
    });
  }
}

const themeObserver = ref<MutationObserver | null>(null);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  
  updateTheme();
  themeObserver.value = new MutationObserver(() => {
    updateTheme();
    if (phase.value === 'playing') {
      renderQuestion();
    }
  });
  themeObserver.value.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
});

onUnmounted(() => {
  stopCountdown();
  stopFinalClock();
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', handleResize);
  if (themeObserver.value) {
    themeObserver.value.disconnect();
  }
});
</script>

<template>
  <div class="page-container py-8 font-mono text-[var(--color-text)]">
    <div class="max-w-5xl mx-auto w-full">
      <div class="mb-6 flex items-center justify-between border-b border-[var(--color-border)] pb-2 opacity-60">
        <span class="text-[10px] tracking-widest">[SYS.PROC.GAMES.EXE] // GRID_RUNNER_V2.0</span>
        <span class="text-[10px] tracking-widest text-[var(--color-brand)] animate-pulse">STATUS: ONLINE</span>
      </div>

      <!-- Main Terminal Screen Area -->
      <div class="relative overflow-hidden text-[var(--color-text)]">

        <transition name="page" mode="out-in" @after-enter="onTransitionComplete">
          
          <div v-if="phase === 'start'" class="space-y-8 py-4">
            <div class="border-b border-[var(--color-border)] pb-4 mb-8 relative">
              <div class="absolute -top-6 -left-4 font-art text-[80px] leading-none opacity-5 text-[var(--color-text)] pointer-events-none z-[-1] tracking-tighter whitespace-nowrap overflow-hidden">ARCADE</div>
              <div class="flex justify-between items-end">
                <h2 class="text-3xl font-art tracking-widest text-[var(--color-text)] uppercase">> GRID_RUNNER</h2>
                <a href="https://github.com/ChouChiu" target="_blank" class="text-[10px] font-mono tracking-widest text-[var(--color-brand)] hover:underline opacity-80 mb-1 flex items-center gap-2 transition-all hover:opacity-100" title="Visit Author's GitHub">
                  <i class="fab fa-github"></i>
                  AUTHOR: ChouChiu
                </a>
              </div>
              
              <div class="text-[11px] text-[var(--color-text-dim)] max-w-xl leading-relaxed mt-6 mb-6 font-mono opacity-80">
                INITIATING GEOMETRIC TEST SEQUENCE...<br>
                > TASKS INCLUDED:<br>
                > [1] COORDINATE IDENTIFICATION<br>
                > [2] SYMMETRY TRANSFORMATIONS<br>
                > [3] TRANSLATIONAL VECTORS<br>
                > [4] AREA CALCULATIONS
              </div>
              <button class="btn-terminal !text-[12px] !py-2 !px-6" @click="startGame">
                [ SYS.EXECUTE ]
              </button>
            </div>

            <!-- Game Modes Board -->
            <div class="border border-[var(--color-border)] p-4 bg-[var(--color-bg)]">
              <div class="flex items-center gap-4 border-b border-[var(--color-border)] pb-2 mb-4 opacity-80 text-[10px] uppercase tracking-widest text-[var(--color-brand)]">
                <span>> SELECT_DIFFICULTY</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                <div
                  v-for="(mode, index) in MODES"
                  :key="mode"
                  class="flex items-start gap-3 opacity-80 hover:opacity-100 transition-opacity"
                >
                  <div class="font-mono text-[var(--color-brand)]">[{{ index + 1 }}]</div>
                  <div class="flex-1">
                    <h5 class="tracking-widest mb-1 text-[var(--color-text)]">
                      {{ MODE_LABELS[mode].toUpperCase() }}
                    </h5>
                    <p class="text-[9px] text-[var(--color-text-dim)] opacity-70">
                      <template v-if="mode === 'simple'">GRID:ON | LBL:ON | T:20s | OPT:3</template>
                      <template v-else-if="mode === 'challenge'">GRID:OFF | LBL:ON | T:10s | OPT:5</template>
                      <template v-else-if="mode === 'hell'">GRID:OFF | LBL:OFF | TEST: ID+SYM+TRANS</template>
                      <template v-else>TEST: AREA+ID+SYM+TRANS</template>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Playing Phase -->
          <div v-else-if="phase === 'playing'" class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              <!-- Screen Grid / Canvas -->
              <div class="lg:col-span-2 border border-[var(--color-border)] p-1 bg-[#0a0a0a]">
                <canvas ref="canvasRef" class="w-full aspect-square max-h-[420px] filter contrast-125 saturate-50"></canvas>
              </div>

              <!-- HUD Panels -->
              <div class="space-y-4 font-mono text-[10px]">
                <!-- Mission Details -->
                <div class="border border-[var(--color-border)] p-4 bg-[var(--color-bg)]">
                  <div class="flex items-center justify-between border-b border-[var(--color-border)] pb-2 mb-3">
                    <span class="tracking-widest text-[var(--color-brand)]">> SYS.STATUS</span>
                    <span class="opacity-70">
                      Q: [{{ modeQIdx }}/{{ currentConfig.questions }}]
                    </span>
                  </div>

                  <div class="flex flex-col gap-2 mb-4">
                    <div class="flex justify-between">
                      <span class="opacity-50">MODE:</span>
                      <span :style="{ color: currentColor }" class="uppercase tracking-widest">{{ currentLabel }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="opacity-50">SCORE:</span>
                      <span class="text-[var(--color-brand)] font-bold">{{ score }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="opacity-50">CORRECT:</span>
                      <span class="text-green-500">{{ correctCount }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="opacity-50">ERROR:</span>
                      <span class="text-red-500">{{ wrongCount }}</span>
                    </div>
                  </div>

                  <!-- Timer countdown bar -->
                  <div v-if="currentConfig.time > 0" class="mb-2">
                    <div class="flex justify-between text-[10px] mb-1">
                      <span class="opacity-50">剩余时间:</span>
                      <strong :class="timerClass" class="font-mono text-xs">{{ timeLeft }}秒</strong>
                    </div>
                    <div class="h-3 bg-[var(--color-bg)] border border-[var(--color-text)] p-0.5 rounded overflow-hidden">
                      <div
                        class="h-full transition-all duration-300 timer-bar"
                        :class="timerClass"
                        :style="{ width: timerPercent + '%' }"
                      ></div>
                    </div>
                  </div>

                  <div v-if="currentMode === 'final'" class="flex justify-between border-t border-[var(--color-border)] pt-2 mt-2">
                    <span class="opacity-50">T_ELAPSED:</span>
                    <p>{{ finalElapsedDisplay }}s</p>
                  </div>
                </div>

                <!-- Tips board -->
                <div class="border border-[var(--color-border)] p-4 bg-[var(--color-bg)]">
                  <div class="border-b border-[var(--color-border)] pb-2 mb-3 text-[var(--color-brand)] uppercase tracking-widest">
                    > SYS.INFO
                  </div>
                  <div class="text-[9px] text-[var(--color-text-dim)] space-y-2 opacity-80 leading-relaxed">
                    <p v-for="(tip, i) in currentTips" :key="i">[{{ i+1 }}] {{ tip }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quiz prompt box -->
            <div class="border border-[var(--color-border)] p-5 bg-[#0a0a0a]">
              <p class="text-lg font-mono text-[var(--color-brand)] mb-4 tracking-widest">
                > AWAITING_INPUT: <span class="text-[var(--color-text)]">{{ question?.prompt }}</span>
              </p>

              <div
                v-if="currentMode === 'hell' || (currentMode === 'final' && question?.type !== 'area')"
                class="text-[9px] font-mono text-[var(--color-text-dim)] mb-4 uppercase opacity-60"
              >
                // Use reference points A & B to deduce P's absolute coordinate
              </div>

              <!-- Answer Choices -->
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <button
                  v-for="(choice, idx) in question?.choices"
                  :key="idx"
                  class="border border-[var(--color-border)] py-2 px-3 text-[11px] font-mono hover:bg-[var(--color-text)] hover:text-[#000] transition-colors"
                  :class="{
                    'bg-[var(--color-brand)] text-[#000] border-transparent': answerState !== 'idle' && idx === question?.correctIdx,
                    'bg-red-500 text-white border-transparent': answerState === 'wrong' && idx === selectedIdx,
                    'opacity-50 cursor-not-allowed': answerState !== 'idle'
                  }"
                  :disabled="answerState !== 'idle'"
                  @click="pickAnswer(idx)"
                >
                  <span class="opacity-50 mr-2">[{{ idx + 1 }}]</span>
                  <span>{{ choice }}</span>
                </button>
              </div>

              <div v-if="answerState !== 'idle'" class="mt-4 border-t border-[var(--color-border)] pt-4 text-[11px] font-mono">
                <p
                  class="uppercase tracking-widest"
                  :class="{
                    'text-[var(--color-brand)]': answerState === 'correct',
                    'text-red-500': answerState === 'wrong' || answerState === 'timeout'
                  }"
                >
                  <template v-if="answerState === 'correct'">> STATUS: SUCCESS // +{{ POINTS_PER_MODE[currentMode] }} PTS</template>
                  <template v-else-if="answerState === 'wrong'">> STATUS: FAILED // EXPECTED: {{ question?.choices[question?.correctIdx] }}</template>
                  <template v-else>> STATUS: TIMEOUT // EXPECTED: {{ question?.choices[question?.correctIdx] }}</template>
                </p>
              </div>
            </div>
          </div>

          <!-- Transition Phase -->
          <div v-else-if="phase === 'transition'" class="flex flex-col items-center justify-center py-12 border border-[var(--color-border)] bg-[#0a0a0a]">
            <div class="text-[var(--color-text)] font-mono text-center">
              <h2 class="text-2xl font-art tracking-widest text-[var(--color-brand)] mb-4">> {{ TRANSITION_MSG[currentMode]?.title }}</h2>
              <p class="text-[10px] text-[var(--color-text-dim)] mb-8 max-w-sm mx-auto leading-relaxed uppercase opacity-80">
                // {{ TRANSITION_MSG[currentMode]?.sub }}
              </p>
              <button class="btn-terminal !px-8 !py-2 !text-[12px]" @click="continueFromTransition">
                [ SYS.CONTINUE ]
              </button>
              <p class="text-[9px] opacity-40 mt-4 tracking-widest">[AWAITING ENTER / SPACE]</p>
            </div>
          </div>

          <!-- Results Phase -->
          <div v-else-if="phase === 'results'" class="border border-[var(--color-border)] p-8 bg-[#0a0a0a] font-mono text-center">
            <h2 class="text-3xl font-art tracking-widest text-[var(--color-brand)] mb-6">> EXECUTION_COMPLETE</h2>
            
            <div class="inline-block border border-[var(--color-border)] px-6 py-2 mb-8 bg-[var(--color-bg)]">
              <span class="text-3xl font-art tracking-wider" :style="{ color: getGrade.color }">{{ getGrade.grade }}</span>
              <span class="text-[10px] uppercase ml-3 opacity-80">// {{ getGrade.message }}</span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-0 mb-8 max-w-2xl mx-auto border border-[var(--color-border)]">
              <div class="p-4 border-b md:border-b-0 border-r border-[var(--color-border)]">
                <div class="opacity-50 text-[9px] tracking-widest mb-1">SCORE</div>
                <p class="text-xl text-[var(--color-brand)]">{{ score }}</p>
              </div>
              <div class="p-4 border-b md:border-b-0 md:border-r border-[var(--color-border)]">
                <div class="opacity-50 text-[9px] tracking-widest mb-1">CORRECT</div>
                <p class="text-xl text-green-500">{{ correctCount }}</p>
              </div>
              <div class="p-4 border-r border-[var(--color-border)]">
                <div class="opacity-50 text-[9px] tracking-widest mb-1">ERRORS</div>
                <p class="text-xl text-red-500">{{ wrongCount }}</p>
              </div>
              <div class="p-4">
                <div class="opacity-50 text-[9px] tracking-widest mb-1">ACCURACY</div>
                <p class="text-xl text-[var(--color-text)]">{{ accuracy }}%</p>
              </div>
            </div>

            <div class="flex flex-wrap gap-4 justify-center">
              <button class="btn-terminal !px-6 !py-2 !text-[12px]" @click="startGame">[ REBOOT ]</button>
              <button class="btn-terminal !px-6 !py-2 !text-[12px]" @click="restartGame">[ TERMINATE ]</button>
            </div>
          </div>
        </transition>
      </div>


    </div>
  </div>
</template>

<style scoped>
.choice-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--color-bg);
  border: 2px solid var(--color-text);
  box-shadow: 2px 2px 0px var(--color-text);
  font-family: 'Pixelify Sans', monospace;
  font-weight: bold;
  cursor: pointer !important;
  transition: all 0.1s steps(2);
  text-align: left;
}

.choice-btn:hover:not(.disabled) {
  background: var(--color-brand);
  color: var(--color-bg);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0px var(--color-text);
}

.choice-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.choice-btn.correct {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.choice-btn.wrong {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.choice-key {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: var(--color-text);
  color: var(--color-bg);
  font-size: 10px;
  font-weight: bold;
}

.choice-label {
  flex: 1;
  font-weight: 600;
}

.timer-bar {
  background: var(--color-brand);
}

.timer-bar.danger {
  background: #ef4444;
}

.timer-bar.warn {
  background: #f59e0b;
}

strong.danger {
  color: #ef4444 !important;
}

strong.warn {
  color: #f59e0b !important;
}

.radial-crt {
  background: radial-gradient(circle, transparent 70%, rgba(0, 0, 0, 0.4) 100%);
}
</style>

