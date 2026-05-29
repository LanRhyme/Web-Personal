# ARG 重构实现计划：「苔鸣谷」— 回声残响

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 ARG 从无关的黑客叙事重构为《裂月编年：破碎之光》世界观内的支线故事「苔鸣谷」

**Architecture:** 修改现有 ARG 状态管理系统（useARGState），重写各页面的碎片触发逻辑，增加宠物引导系统，重写终端文件系统和叙事内容。保留 Mastermind 游戏机制，重新包装叙事。

**Tech Stack:** Vue 3 Composition API, TypeScript, localStorage, Tailwind CSS

---

## File Structure

| 文件 | 职责 |
|------|------|
| `src/composables/useARGState.ts` | ARG 全局状态管理（碎片、主题、终端、宠物、进度） |
| `src/data/arg-dialogues.ts` | 宠物 ARG 对话数据（新增文件） |
| `src/App.vue` | 宠物 ARG 引导逻辑、宠物暗化外观 |
| `src/views/Home.vue` | 碎片一触发（MOSS） |
| `src/views/Projects.vue` | 碎片二触发（1→2→3） |
| `src/views/Games.vue` | 碎片三触发（SOS） |
| `src/views/ArticleDetail.vue` | 隐藏文字 + Base64（在文章详情页） |
| `src/components/Terminal.vue` | 终端文件系统、叙事、解密、抉择、重置 |
| `public/arg-walkthrough.md` | 攻略文档重写 |

---

### Task 1: 扩展 useARGState 状态管理

**Files:**
- Modify: `src/composables/useARGState.ts`

- [ ] **Step 1: 重写 useARGState.ts**

```typescript
import { ref } from 'vue';

const themeUnlocked = ref(localStorage.getItem('arg_theme_unlocked') === 'true');
const themeActive = ref(localStorage.getItem('arg_theme_active') === 'true');
const keysFound = ref<string[]>(JSON.parse(localStorage.getItem('arg_keys') || '[]'));
const terminalUnlocked = ref(localStorage.getItem('arg_terminal_unlocked') === 'true');
const petDark = ref(localStorage.getItem('arg_pet_dark') === 'true');
const argStarted = ref(localStorage.getItem('arg_arg_started') === 'true');
const argCompleted = ref(localStorage.getItem('arg_completed') === 'true');

export function useARGState() {
  const applyTheme = (active: boolean) => {
    if (active) {
      document.body.classList.add('theme-eclipse');
    } else {
      document.body.classList.remove('theme-eclipse');
    }
  };

  const unlockTheme = () => {
    themeUnlocked.value = true;
    localStorage.setItem('arg_theme_unlocked', 'true');
    themeActive.value = true;
    localStorage.setItem('arg_theme_active', 'true');
    applyTheme(true);
  };

  const toggleTheme = () => {
    if (!themeUnlocked.value) return;
    themeActive.value = !themeActive.value;
    localStorage.setItem('arg_theme_active', themeActive.value.toString());
    applyTheme(themeActive.value);
  };

  const initTheme = () => {
    if (themeActive.value) {
      applyTheme(true);
    }
  };

  const addKey = (key: string) => {
    if (!keysFound.value.includes(key)) {
      keysFound.value.push(key);
      localStorage.setItem('arg_keys', JSON.stringify(keysFound.value));
    }
  };

  const hasKey = (key: string) => keysFound.value.includes(key);

  const unlockTerminal = () => {
    terminalUnlocked.value = true;
    localStorage.setItem('arg_terminal_unlocked', 'true');
  };

  const startARG = () => {
    argStarted.value = true;
    localStorage.setItem('arg_arg_started', 'true');
  };

  const completeARG = () => {
    argCompleted.value = true;
    localStorage.setItem('arg_completed', 'true');
  };

  const setPetDark = () => {
    petDark.value = true;
    localStorage.setItem('arg_pet_dark', 'true');
  };

  const resetARG = () => {
    keysFound.value = [];
    terminalUnlocked.value = false;
    themeUnlocked.value = false;
    themeActive.value = false;
    petDark.value = false;
    argStarted.value = false;
    argCompleted.value = false;
    localStorage.removeItem('arg_keys');
    localStorage.removeItem('arg_terminal_unlocked');
    localStorage.removeItem('arg_theme_unlocked');
    localStorage.removeItem('arg_theme_active');
    localStorage.removeItem('arg_pet_dark');
    localStorage.removeItem('arg_arg_started');
    localStorage.removeItem('arg_completed');
    document.body.classList.remove('theme-eclipse');
  };

  return {
    themeUnlocked,
    themeActive,
    keysFound,
    terminalUnlocked,
    petDark,
    argStarted,
    argCompleted,
    unlockTheme,
    toggleTheme,
    initTheme,
    addKey,
    hasKey,
    unlockTerminal,
    startARG,
    completeARG,
    setPetDark,
    resetARG
  };
}
```

- [ ] **Step 2: 验证无 TypeScript 错误**

Run: `npx vue-tsc --noEmit` (or project's typecheck command)
Expected: No errors

---

### Task 2: 创建宠物 ARG 对话数据

**Files:**
- Create: `src/data/arg-dialogues.ts`

- [ ] **Step 1: 创建对话数据文件**

```typescript
export const argDialogues = {
  // ARG 未开始 - 首次触发
  trigger: [
    '等等……我接收到了微弱的信号……(◎_◎;)',
    '来源：苔鸣谷……余火历162年……已失联……',
    '要继续接收吗？再点我一次就开始～(•ω•`)'
  ],

  // 碎片一（首页）
  fragment1_hint: [
    '信号源：当前页面。信号特征：苔的回响。(•̀ᴗ•́)و',
    '试试在页面上输入什么吧……提示：苔～(°▽°)'
  ],
  fragment1_wrong: ['嗯……不是这个……(´・ω・`)'],
  fragment1_found: ['碎片同步成功！(≧◡≦) 下一站：项目区域！'],

  // 碎片二（项目页）
  fragment2_hint: [
    '信号源：项目区域。信号特征：三弦的律动。(•̀ᴗ•́)و',
    '试试按顺序点击卡片？念、灵、渊……(°▽°)'
  ],
  fragment2_wrong: ['顺序不对哦……三弦有它自己的顺序……(´・ω・`)'],
  fragment2_found: ['碎片同步成功！(≧◡≦) 最后一个：游戏区域！'],

  // 碎片三（游戏页）
  fragment3_hint: [
    '信号源：游戏区域。信号特征：微弱的求救……(´・ω・`)',
    '有人在求救……试试发出呼唤吧……(•̀ᴗ•́)و'
  ],
  fragment3_wrong: ['求救信号是……三个字母……(°▽°)'],
  fragment3_found: ['碎片同步成功！(≧◡≦)'],

  // 全部完成
  all_found: [
    '所有碎片已收集！数据重组中……(⌐■_■)',
    '烬的最后一条回声木广播残留：',
    '「我把备份藏在了知识的殿堂……那篇关于代码优化的文章里……在看不见的地方……」',
    '去找找看吧！(★ω★)'
  ],

  // 阶段二提示
  phase2_hint: ['烬说她把备份藏在了知识的殿堂……去文章页找找看？(°▽°)'],

  // 终端提示
  terminal_hint: ['这里是黑铁联合体的加密档案……(⌐■_■)'],

  // 最终抉择
  final_choice: [
    '烬的遗言……你要怎么选？(´・ω・`)',
    '苔鸣谷的一百四十七条生命……在你手中……'
  ],

  // purge 后的暗化台词（随机触发）
  pet_dark_idle: [
    '苔鸣谷……(´・ω・`)',
    '有些真相……被埋葬了……',
    '一百四十七条生命……',
    '烬……她还在某个角落里活着……',
    '又一个聚落被白蚀吞噬了……'
  ]
};
```

- [ ] **Step 2: 验证文件创建成功**

Run: `npx vue-tsc --noEmit`
Expected: No errors

---

### Task 3: 重写首页碎片一触发逻辑

**Files:**
- Modify: `src/views/Home.vue`

- [ ] **Step 1: 修改 Home.vue 的 ARG 逻辑**

将现有的 `elaraCode`（输入 ELARA）替换为 `mossCode`（输入 MOSS）。

修改 `script setup` 中的 ARG 相关代码：

```typescript
// 替换现有的 elaraCode 相关代码
const { addKey, hasKey, argStarted } = useARGState();
const mossCode = ['m', 'o', 's', 's'];
let mossIndex = 0;
const isFrostActive = ref(false);

const handleKeyDown = (e: KeyboardEvent) => {
  // Konami code 保持不变
  if (e.key === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      triggerRedAlert();
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }

  // ARG Logic: 输入 MOSS
  if (argStarted.value && !hasKey('BREATH_WHITE') && e.key.toLowerCase() === mossCode[mossIndex]) {
    mossIndex++;
    if (mossIndex === mossCode.length) {
      triggerMossAlert();
      mossIndex = 0;
    }
  } else {
    mossIndex = e.key.toLowerCase() === 'm' ? 1 : 0;
  }
};

const triggerMossAlert = () => {
  if (isFrostActive.value) return;
  isFrostActive.value = true;
  addKey('BREATH_WHITE');
  // 通知宠物（通过 window 事件）
  window.dispatchEvent(new CustomEvent('arg-fragment-found', { detail: { key: 'BREATH_WHITE' } }));
  setTimeout(() => {
    isFrostActive.value = false;
  }, 5000);
};
```

- [ ] **Step 2: 修改模板中的反馈文字**

将 `BREATH_FROZEN` 替换为世界观相关的文字：

```html
<!-- Frost Alert UI -->
<transition name="page">
  <div v-if="isFrostActive" class="absolute inset-0 z-50 flex items-center justify-center pointer-events-none mix-blend-screen">
    <div class="text-[var(--color-brand)] font-bold text-2xl md:text-4xl tracking-[0.3em] animate-pulse drop-shadow-[0_0_20px_var(--color-brand)] text-center">
      <div>BREATH_WHITE</div>
      <div class="text-sm md:text-base opacity-70 mt-2">余火历162年·苔鸣谷·白息浓度异常上升……</div>
    </div>
  </div>
</transition>
```

- [ ] **Step 3: 验证无 TypeScript 错误**

Run: `npx vue-tsc --noEmit`
Expected: No errors

---

### Task 4: 重写项目页碎片二触发逻辑

**Files:**
- Modify: `src/views/Projects.vue`

- [ ] **Step 1: 修改触发逻辑**

将现有的倒序触发（2→1→0）改为正序触发（0→1→2）：

```typescript
const { addKey, hasKey, argStarted } = useARGState();
const clickSequence = ref<number[]>([]);
const isShakeActive = ref(false);

const handleProjectClick = (index: number) => {
  clickSequence.value.push(index);
  if (clickSequence.value.length > 3) {
    clickSequence.value.shift();
  }
  
  // 正序 0→1→2 触发（念→灵→渊）
  if (argStarted.value && !hasKey('CHORD_PATTERN') &&
      clickSequence.value.length === 3 &&
      clickSequence.value[0] === 0 &&
      clickSequence.value[1] === 1 &&
      clickSequence.value[2] === 2) {
    
    isShakeActive.value = true;
    addKey('CHORD_PATTERN');
    window.dispatchEvent(new CustomEvent('arg-fragment-found', { detail: { key: 'CHORD_PATTERN' } }));
    setTimeout(() => {
      isShakeActive.value = false;
    }, 3000);
  }
};
```

- [ ] **Step 2: 修改模板中的反馈文字**

```html
<!-- ARG Toast UI -->
<transition name="page">
  <div v-if="isShakeActive" class="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] cyber-glass !p-6 border-l-4 border-l-[var(--color-brand)] bg-black/90">
    <div class="text-[var(--color-brand)] font-bold text-xl tracking-[0.3em] font-mono animate-pulse mb-1">CHORD_PATTERN</div>
    <div class="text-xs opacity-60 font-mono tracking-widest">弦律异常·碎月引力波与裂缝脉冲完全同步——烬的研究笔记</div>
  </div>
</transition>
```

- [ ] **Step 3: 验证无 TypeScript 错误**

Run: `npx vue-tsc --noEmit`
Expected: No errors

---

### Task 5: 重写游戏页碎片三触发逻辑

**Files:**
- Modify: `src/views/Games.vue`

- [ ] **Step 1: 修改触发逻辑**

将现有的 HELP 改为 SOS：

```typescript
const { addKey, hasKey, argStarted } = useARGState();
const sosCode = ['s', 'o', 's'];
let sosIndex = 0;
const isHelpActive = ref(false);

function handleKeydown(e: KeyboardEvent) {
  // 现有游戏逻辑保持不变
  if (phase.value === 'playing' && answerState.value === 'idle' && question.value) {
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= question.value.choices.length) pickAnswer(num - 1);
  }
  if (phase.value === 'transition' && (e.key === 'Enter' || e.key === ' ')) continueFromTransition();

  // ARG Logic: 输入 SOS
  if (argStarted.value && !hasKey('SOS_ECHO') && e.key.toLowerCase() === sosCode[sosIndex]) {
    sosIndex++;
    if (sosIndex === sosCode.length) {
      triggerSOSAlert();
      sosIndex = 0;
    }
  } else {
    sosIndex = e.key.toLowerCase() === 's' ? 1 : 0;
  }
}

const triggerSOSAlert = () => {
  if (isHelpActive.value) return;
  isHelpActive.value = true;
  addKey('SOS_ECHO');
  window.dispatchEvent(new CustomEvent('arg-fragment-found', { detail: { key: 'SOS_ECHO' } }));
  setTimeout(() => {
    isHelpActive.value = false;
  }, 4000);
};
```

- [ ] **Step 2: 修改模板中的反馈文字**

找到 ARG Toast UI 部分，修改为：

```html
<transition name="page">
  <div v-if="isHelpActive" class="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] cyber-glass !p-6 border-l-4 border-l-red-500 bg-black/90">
    <div class="text-red-400 font-bold text-xl tracking-[0.3em] font-mono animate-pulse mb-1">SOS_ECHO</div>
    <div class="text-xs opacity-60 font-mono tracking-widest">「黑铁联合体切断了所有补给线……裂缝在扩张……我们还在……」</div>
  </div>
</transition>
```

- [ ] **Step 3: 验证无 TypeScript 错误**

Run: `npx vue-tsc --noEmit`
Expected: No errors

---

### Task 6: 添加隐藏文字到文章详情页

**Files:**
- Modify: `src/views/ArticleDetail.vue`

- [ ] **Step 1: 读取 ArticleDetail.vue 了解结构**

读取文件，找到文章内容渲染区域。

- [ ] **Step 2: 在文章详情页底部添加隐藏文字**

在文章内容区域之后，添加一个隐藏的 ARG 元素。这段文字对特定文章（slug 包含 "performance" 或 "优化" 的文章）显示：

```html
<!-- ARG Hidden Text -->
<div 
  v-if="isArgArticle" 
  class="mt-8 select-all cursor-default"
  style="color: transparent; font-size: 0; line-height: 0; user-select: all;"
  title=""
>
  <span class="text-[1px] leading-[1px] opacity-0 select-all">
    [回声木数据节点·备份] 此处保存了烬的研究数据碎片。解码路径：L2JsYWNraXJvbi1hcmNoaXZl
  </span>
</div>
```

在 script 中添加计算属性：

```typescript
const { argStarted, hasKey } = useARGState();

const isArgArticle = computed(() => {
  if (!argStarted.value) return false;
  if (hasKey('BREATH_WHITE') && hasKey('CHORD_PATTERN') && hasKey('SOS_ECHO')) {
    // 检查是否是包含"优化"或"performance"的文章
    const title = article.value?.title?.toLowerCase() || '';
    const content = article.value?.content?.toLowerCase() || '';
    return title.includes('优化') || title.includes('performance') || content.includes('优化');
  }
  return false;
});
```

注意：`L2JsYWNraXJvbi1hcmNoaXZl` 是 `/blackiron-archive` 的 Base64 编码。

- [ ] **Step 3: 验证无 TypeScript 错误**

Run: `npx vue-tsc --noEmit`
Expected: No errors

---

### Task 7: 重写终端组件

**Files:**
- Modify: `src/components/Terminal.vue`

这是最大的改动。需要重写文件系统、叙事内容、解密流程、抉择逻辑，并添加重置命令。

- [ ] **Step 1: 重写文件系统数据**

```typescript
const fileSystem: Record<string, string[]> = {
  '/': ['sys_logs', 'intel', 'quarantine', 'readme.txt'],
  '/sys_logs': ['log_047.txt', 'log_158.txt', 'log_162.txt'],
  '/intel': ['chord_theory.md'],
  '/quarantine': ['TMG-162-FINAL.enc']
};

const fileContents: Record<string, string> = {
  '/readme.txt': '项目编号：BLK-IRON-162-TMG\n状态：已终止\n说明：苔鸣谷聚落于余火历162年秋因白蚀区自然扩张覆灭。属天灾。无幸存者。\n备注：所有相关数据已转移至加密档案。相关人员记忆清除已完成。\n此文件仅供内部查阅。泄露者将按叛国罪处理。',

  '/sys_logs/log_047.txt': '余火历162年·第47天·晴\n今日白息浓度正常。铁爪爷爷又在回声木下给幼崽们讲古了。\n小霜花抓了一只晶齿狼幼崽回来，被她母亲骂了一顿。\n风铃说她新学了一首歌，晚上要在聚落中心唱。',

  '/sys_logs/log_158.txt': '余火历162年·第158天·阴\n白息浓度持续上升。已超出正常脉冲期基准值47%。\n长老决定暂停外出采集。\n黑铁联合体的代表三天前离开了。他们要我们的弦律数据。我们拒绝了。\n补给线已经42天没有更新了。',

  '/sys_logs/log_162.txt': '余火历162年·第……天\n白息浓度……临界……裂缝在……\n补给线……47天没有……\n黑铁……他们……\n[数据损坏·无法恢复]',

  '/intel/chord_theory.md': '弦律理论·烬\n\n核心发现：白蚀裂缝脉冲周期与碎月引力波完全同步。\n同步系数：████████（已删除）\n预测窗口：每次大潮灾前███小时，裂缝会出现可检测的预脉冲。\n第13次大潮灾预测：████████████（已删除）\n\n注：此数据已被列为黑铁联合体最高机密。原作者记忆清除已完成。'
};
```

- [ ] **Step 2: 重写终端初始化文本**

```typescript
onMounted(() => {
  pushLine('system', '黑铁联合体加密档案终端 v2.1.7');
  if (systemLocked.value) {
    pushLine('system', '安全协议 Watcher-7 已激活。');
    pushLine('error', 'WARNING: 检测到未授权访问。请输入授权码或执行暴力破解。');
  } else {
    pushLine('system', '安全协议已解除。欢迎，管理员。');
  }
  focusInput();
});
```

- [ ] **Step 3: 重写 help 命令**

```typescript
case 'help':
  pushLine('output', '可用命令:');
  pushLine('output', '  help      - 显示此消息');
  pushLine('output', '  clear     - 清除终端输出');
  if (systemLocked.value) {
    pushLine('output', '  crack     - 发起暴力破解');
    pushLine('output', '  crack <code> - 管理员后门');
  } else {
    pushLine('output', '  ls        - 列出目录内容');
    pushLine('output', '  cd <dir>  - 切换目录');
    pushLine('output', '  cat <file>- 读取文件内容');
    pushLine('output', '  unlock <f>- 尝试解密加密文件');
    pushLine('output', '  reset-arg - 重置 ARG 进度');
    pushLine('output', '  exit      - 断开连接');
  }
  break;
```

- [ ] **Step 4: 重写 crack 命令的后门和提示文字**

```typescript
case 'crack':
  if (!systemLocked.value) {
    pushLine('output', '系统已解锁。');
  } else if (args[1] === 'echo162') {
    systemLocked.value = false;
    unlockTerminal();
    pushLine('system', '管理员后门已接受。欢迎。');
  } else {
    crackMode.value = true;
    crackAttempts.value = 0;
    secretCode.value = generateCode();
    pushLine('system', '启动暴力破解……');
    pushLine('output', '目标：黑铁联合体军事加密·4位授权码·8次尝试。');
  }
  break;
```

- [ ] **Step 5: 重写 unlock 命令的密钥名称和验证逻辑**

```typescript
case 'unlock':
  if (args[1] !== 'TMG-162-FINAL.enc') {
    pushLine('error', 'unlock: 目标必须是加密文件。');
    break;
  }
  pushLine('system', '正在验证记忆碎片……');
  setTimeout(() => {
    const k1 = hasKey('BREATH_WHITE');
    const k2 = hasKey('CHORD_PATTERN');
    const k3 = hasKey('SOS_ECHO');
    
    pushLine('output', `[白息碎片]: ${k1 ? '已验证' : '缺失'}`);
    pushLine('output', `[弦律碎片]: ${k2 ? '已验证' : '缺失'}`);
    pushLine('output', `[求救碎片]: ${k3 ? '已验证' : '缺失'}`);
    
    if (k1 && k2 && k3) {
      pushLine('system', '解密成功。');
      setTimeout(displayTruth, 1000);
    } else {
      pushLine('error', '解密失败。请收集所有三枚记忆碎片。');
    }
  }, 1000);
  break;
```

- [ ] **Step 6: 重写 displayTruth 函数**

```typescript
const displayTruth = () => {
  lines.value = [];
  pushLine('system', '正在解密 TMG-162-FINAL.enc……');
  pushLine('system', '密钥验证通过。三枚碎片匹配。');
  pushLine('output', '解密进度：23%……58%……87%……');
  pushLine('system', '解密完成。发现两条附加记录。');

  setTimeout(() => {
    pushLine('lore', '=== 记录 A：弦律核心数据 ===');
    pushLine('lore', '弦律公式：裂缝脉冲周期 = 碎月引力波周期 × 3.17');
    pushLine('lore', '预测窗口：每次大潮灾前72小时，白蚀裂缝会出现可检测的预脉冲。');
    pushLine('lore', '第13次大潮灾预测：余火历401年，春分前后。');
    pushLine('lore', '警告：第13次大潮灾的强度将是前所未有的。这不是普通的脉冲——这是"完全观测"。');
    pushLine('lore', '=================================');

    setTimeout(() => {
      pushLine('lore', '=== 记录 B：烬的最后日志 ===');
      pushLine('lore', '个人日志。最后一条。');
      pushLine('lore', '');
      pushLine('lore', '我知道我活不过今晚。');
      pushLine('lore', '');
      pushLine('lore', '但我害怕的不是死亡。我害怕的是，苔鸣谷会就这样消失。');
      pushLine('lore', '没有人记得我们。没有人知道真相。');
      pushLine('lore', '');
      pushLine('lore', '黑铁联合体会把我们的死归咎于天灾。');
      pushLine('lore', '他们会说："又一个聚落被白蚀吞噬了。"然后继续他们的战争。');
      pushLine('lore', '');
      pushLine('lore', '一百四十七条生命。每一只瑟帕都有名字。');
      pushLine('lore', '');
      pushLine('lore', '铁爪爷爷每天清晨都会在回声木下讲古。');
      pushLine('lore', '小霜花最喜欢追着晶齿狼的幼崽跑。');
      pushLine('lore', '风铃的歌声能让枯萎的花重新开放。');
      pushLine('lore', '');
      pushLine('lore', '这些都会消失吗？');
      pushLine('lore', '');
      pushLine('lore', '……');
      pushLine('lore', '');
      pushLine('lore', '我把这段记录发送到了回声木网络的碎片中。');
      pushLine('lore', '不是为了复仇。');
      pushLine('lore', '是为了有人能记得。');
      pushLine('lore', '');
      pushLine('lore', '如果你正在读这段话，请替我们记住：');
      pushLine('lore', '苔鸣谷存在过。');
      pushLine('lore', '我们存在过。');
      pushLine('lore', '=================================');

      setTimeout(() => {
        pushLine('system', '检测到隐藏数据层……');
        pushLine('system', '正在解析……');
        pushLine('lore', '');
        pushLine('lore', '黑铁联合体·内部通讯·加密等级：最高');
        pushLine('lore', '收件人：██████');
        pushLine('lore', '主题：162-TMG 后续处理');
        pushLine('lore', '');
        pushLine('lore', '目标个体"烬"已被捕获。记忆清除程序已完成。');
        pushLine('lore', '该个体已按标准流程处理为"迷失者"，释放至翡翠部落边缘地带。');
        pushLine('lore', '弦律数据已完整回收。建议将该个体列入长期监控名单。');
        pushLine('lore', '');
        pushLine('lore', '注：该个体在记忆清除前的最后一句话：');
        pushLine('lore', '"如果有一天，你遇到了一个没有过去的旅人……告诉他，有人曾经记得他。"');

        setTimeout(() => {
          pushLine('error', '⚠ 入侵检测 ⚠');
          pushLine('error', '黑铁联合体安全协议已启动');
          pushLine('output', '连接即将断开');
          pushLine('output', '');
          pushLine('output', '请立即选择操作：');
          pushLine('output', '  [purge]     - 清除所有数据，安全断开');
          pushLine('output', '  [broadcast] - 向全网广播烬的遗言');
          pushLine('system', '等待指令: purge / broadcast');
          // 通知宠物
          window.dispatchEvent(new CustomEvent('arg-final-choice'));
        }, 3000);
      }, 4000);
    }, 2000);
  }, 2000);
};
```

- [ ] **Step 7: 重写 purge 命令**

```typescript
case 'purge':
  if (lines.value.some(l => l.text.includes('等待指令'))) {
    pushLine('system', '执行清除协议……');
    completeARG();
    setTimeout(() => {
      pushLine('output', '数据已清除。连接已断开。');
      pushLine('lore', '');
      pushLine('lore', '「又一个聚落被白蚀吞噬了。」');
      pushLine('lore', '——黑铁联合体·官方记录');
      setPetDark();
      setTimeout(() => router.push('/'), 3000);
    }, 1500);
  } else {
    pushLine('error', '命令无法识别。');
  }
  break;
```

- [ ] **Step 8: 重写 broadcast 命令**

```typescript
case 'broadcast':
  if (lines.value.some(l => l.text.includes('等待指令'))) {
    pushLine('system', '广播协议启动……');
    completeARG();
    setTimeout(() => {
      pushLine('output', '白蚀频率已同步……');
      pushLine('output', '记录已发送至所有回声木节点……');
      pushLine('lore', '');
      pushLine('lore', '苔鸣谷的记忆不会消失。');
      pushLine('lore', '感谢你，旅人。');
      pushLine('system', 'WARNING: 白蚀协议已触发。WHITE ECLIPSE PROTOCOL INITIATED.');
      unlockTheme();
      setTimeout(() => router.push('/'), 3000);
    }, 1500);
  } else {
    pushLine('error', '命令无法识别。');
  }
  break;
```

- [ ] **Step 9: 添加 reset-arg 命令**

在 `processCommand` 的 switch 中添加：

```typescript
case 'reset-arg':
  resetARG();
  pushLine('system', 'ARG 数据已重置。回声木网络信号已清除。');
  setTimeout(() => router.push('/'), 2000);
  break;
```

需要在顶部解构中添加 `resetARG`：

```typescript
const { hasKey, unlockTheme, terminalUnlocked, unlockTerminal, completeARG, setPetDark, resetARG } = useARGState();
```

- [ ] **Step 10: 验证无 TypeScript 错误**

Run: `npx vue-tsc --noEmit`
Expected: No errors

---

### Task 8: 实现宠物 ARG 引导系统

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 导入对话数据和 ARG 状态**

在 `script setup` 中添加：

```typescript
import { argDialogues } from './data/arg-dialogues';
const { argStarted, petDark, startARG, hasKey } = useARGState();
const argTriggerCount = ref(0);
const argPhase = ref<'none' | 'trigger' | 'fragment1' | 'fragment2' | 'fragment3' | 'phase2' | 'terminal' | 'final'>('none');
```

- [ ] **Step 2: 添加 ARG 宠物对话逻辑**

```typescript
// ARG 宠物引导
const getArgHint = (): string | null => {
  if (!argStarted.value) return null;
  
  // 碎片一提示（首页，未收集）
  if (route.path === '/' && !hasKey('BREATH_WHITE')) {
    return argDialogues.fragment1_hint[Math.floor(Math.random() * argDialogues.fragment1_hint.length)];
  }
  // 碎片二提示（项目页，未收集）
  if (route.path === '/projects' && !hasKey('CHORD_PATTERN')) {
    return argDialogues.fragment2_hint[Math.floor(Math.random() * argDialogues.fragment2_hint.length)];
  }
  // 碎片三提示（游戏页，未收集）
  if (route.path === '/games' && !hasKey('SOS_ECHO')) {
    return argDialogues.fragment3_hint[Math.floor(Math.random() * argDialogues.fragment3_hint.length)];
  }
  // 全部完成，阶段二提示
  if (hasKey('BREATH_WHITE') && hasKey('CHORD_PATTERN') && hasKey('SOS_ECHO') && !terminalUnlocked.value) {
    return argDialogues.phase2_hint[0];
  }
  return null;
};

// 监听碎片发现事件
const onFragmentFound = (e: Event) => {
  const detail = (e as CustomEvent).detail;
  if (detail?.key === 'BREATH_WHITE') {
    petTalking(argDialogues.fragment1_found[0]);
  } else if (detail?.key === 'CHORD_PATTERN') {
    petTalking(argDialogues.fragment2_found[0]);
  } else if (detail?.key === 'SOS_ECHO') {
    petTalking(argDialogues.fragment3_found[0]);
    // 全部完成
    setTimeout(() => {
      petTalking(argDialogues.all_found[0]);
    }, 4500);
    setTimeout(() => {
      petTalking(argDialogues.all_found[1]);
    }, 9000);
    setTimeout(() => {
      petTalking(argDialogues.all_found[2]);
    }, 14000);
    setTimeout(() => {
      petTalking(argDialogues.all_found[3]);
    }, 20000);
  }
};

// 监听最终抉择事件
const onFinalChoice = () => {
  petTalking(argDialogues.final_choice[0]);
  setTimeout(() => {
    petTalking(argDialogues.final_choice[1]);
  }, 4000);
};

onMounted(() => {
  // ... 现有的 onMounted 代码 ...
  
  window.addEventListener('arg-fragment-found', onFragmentFound);
  window.addEventListener('arg-final-choice', onFinalChoice);
});

onUnmounted(() => {
  // ... 现有的 onUnmounted 代码 ...
  
  window.removeEventListener('arg-fragment-found', onFragmentFound);
  window.removeEventListener('arg-final-choice', onFinalChoice);
});
```

- [ ] **Step 3: 修改宠物点击逻辑**

在 `triggerHappyPet` 函数中添加 ARG 触发逻辑：

```typescript
const triggerHappyPet = () => {
  if (showAsciiOverlay.value) return;
  
  // ARG 触发逻辑
  if (!argStarted.value) {
    argTriggerCount.value++;
    if (argTriggerCount.value === 1) {
      petTalking(argDialogues.trigger[0]);
      setTimeout(() => petTalking(argDialogues.trigger[1]), 3000);
      setTimeout(() => petTalking(argDialogues.trigger[2]), 6000);
      return;
    } else if (argTriggerCount.value >= 2) {
      startARG();
      petTalking('信号接收已启动！(★ω★)');
      argTriggerCount.value = 0;
      return;
    }
  }
  
  // ARG 进行中，显示提示
  if (argStarted.value) {
    const hint = getArgHint();
    if (hint) {
      petTalking(hint);
      return;
    }
  }
  
  // purge 后的暗化台词
  if (petDark.value && Math.random() > 0.5) {
    petTalking(argDialogues.pet_dark_idle[Math.floor(Math.random() * argDialogues.pet_dark_idle.length)]);
    return;
  }
  
  // 正常的 happy 逻辑
  petState.value = 'happy';
  petHappiness.value = Math.min(100, petHappiness.value + 12);
  petTalking(getRandomText(happyDialogues));
  
  setTimeout(() => {
    if (route.path === '/projects' || route.path === '/games' || route.path === '/github') {
      petState.value = 'working';
    } else {
      petState.value = 'idle';
    }
  }, 2200);
};
```

- [ ] **Step 4: 添加宠物暗化外观**

修改宠物的模板，添加暗化样式：

```html
<!-- AI Core Widget -->
<div 
  class="cyber-glass p-2 flex flex-col items-center justify-center bg-black/60 border border-[var(--color-border)] hover:border-[var(--color-brand)] transition-all duration-500 cursor-pointer group w-16 h-16 rounded-full animate-float-slow hover:shadow-[0_0_30px_rgba(107,143,114,0.3)]"
  :class="{ 
    'scale-90': petState === 'happy',
    'pet-dark': petDark
  }"
  @click="triggerHappyPet"
  @mousedown="startLongPress"
  @touchstart="startLongPress"
  @mouseup="endLongPress"
  @mouseleave="endLongPress"
  @touchend="endLongPress"
  @mouseenter="onPetHover"
>
```

在 `<style>` 中添加暗化样式：

```css
.pet-dark {
  border-color: #991b1b !important;
}
.pet-dark:hover {
  border-color: #dc2626 !important;
  box-shadow: 0 0 30px rgba(153, 27, 27, 0.3) !important;
}
```

修改宠物眼睛颜色：

```html
<div 
  class="w-4 h-4 transition-all duration-300 shadow-[0_0_10px_currentColor]"
  :class="petDark ? 'bg-red-800 group-hover:bg-red-600' : 'bg-[var(--color-text-dim)] group-hover:bg-[var(--color-brand)]'"
  :style="{ 
    transform: `rotate(${eyeRotation}deg) translateX(4px)`,
    clipPath: petState === 'happy' ? 'polygon(0 40%, 100% 40%, 100% 60%, 0 60%)' : 'polygon(0 50%, 50% 0, 100% 50%, 50% 100%)'
  }"
></div>
```

- [ ] **Step 5: 修改路由切换时的宠物对话**

如果 ARG 已开始，路由切换时显示对应的提示：

```typescript
watch(() => route.path, (newPath) => {
  // ARG 提示优先
  if (argStarted.value) {
    const hint = getArgHint();
    if (hint) {
      petTalking(hint);
      return;
    }
  }
  
  // 正常路由对话
  if (newPath === '/projects' || newPath === '/games' || newPath === '/github') {
    petState.value = 'working';
    petTalking(getRandomText(routeDialogues));
  } else if (newPath === '/works' || newPath === '/commissions') {
    petState.value = 'active';
    petTalking(getRandomText(routeDialogues));
  } else {
    petState.value = 'idle';
    petTalking('我回来啦！(＾▽＾)');
  }
});
```

- [ ] **Step 6: 验证无 TypeScript 错误**

Run: `npx vue-tsc --noEmit`
Expected: No errors

---

### Task 9: 重写攻略文档

**Files:**
- Modify: `public/arg-walkthrough.md`

- [ ] **Step 1: 完全重写攻略文档**

```markdown
# 回声残响：苔鸣谷 — ARG 通关全攻略

欢迎来到隐藏在 LanRhyme.OS 中的 ARG 解密游戏。本指南将带你一步步揭开被黑铁联合体掩盖的真相——苔鸣谷的覆灭。

## 背景故事

余火历162年，位于白蚀区边缘的瑟帕族聚落「苔鸣谷」在一夜之间被白蚀吞噬。官方记录称这是天灾，但真相远比这残酷。研究员「烬」发现了白蚀的核心秘密——弦律，却被黑铁联合体灭口。她的记忆碎片散落在回声木网络中，等待有人将它们拼凑。

## 第一阶段：收集三枚记忆碎片

在网站右下角有一个小宠物。点击它两次，它会告诉你它接收到了来自苔鸣谷的微弱信号。接受信号后，ARG 正式开始。宠物会在每个阶段给你提示。

### 1. 白息碎片 (BREATH_WHITE)

*   **触发地点**：网站首页 (`/`)
*   **获取方法**：在键盘上依次输入字母：`M` `O` `S` `S`（不区分大小写）
*   **成功反馈**：屏幕会蒙上白蚀滤镜，中央出现文字：「余火历162年·苔鸣谷·白息浓度异常上升……」

### 2. 弦律碎片 (CHORD_PATTERN)

*   **触发地点**：项目页 (`/projects`)
*   **获取方法**：依次点击前三个项目卡片，顺序为 **第1个 → 第2个 → 第3个**（代表三弦：念→灵→渊）
*   **成功反馈**：页面顶端弹出警告框，显示烬的研究笔记

### 3. 求救碎片 (SOS_ECHO)

*   **触发地点**：游戏页 (`/games`)
*   **获取方法**：在任意非游戏输入状态下，盲打输入字母：`S` `O` `S`（不区分大小写）
*   **成功反馈**：屏幕上方出现系统异常弹窗，显示烬的求救信息

---

## 第二阶段：寻找档案入口

集齐三枚碎片后，宠物会告诉你烬把备份藏在了「知识的殿堂」中。

*   **线索位置**：文章页 (`/articles`)
*   **解密步骤**：
    1.  找到一篇与「代码优化」或「性能优化」相关的文章
    2.  在文章详情页，使用鼠标拖拽选中文章底部的空白区域
    3.  你会发现一段隐藏文字以及一串 Base64 编码：`L2JsYWNraXJvbi1hcmNoaXZl`
    4.  使用浏览器控制台 `atob('L2JsYWNraXJvbi1hcmNoaXZl')` 解码，得到：`/blackiron-archive`
*   **进入方法**：在浏览器地址栏中，将网址后缀修改为 `/#/blackiron-archive` 并回车

---

## 第三阶段：破解黑铁加密档案

进入终端后，你将面对黑铁联合体的军事加密系统。

### 1. 暴力破解 (Mastermind 游戏)

*   **启动破解**：在终端输入 `crack` 并按回车
*   **游戏规则**：
    *   系统会生成一个 4 位不重复的数字密码
    *   你需要输入你的 4 位数字猜测并回车
    *   系统会返回两个线索：`Exact` (数字正确且位置正确) 和 `Partial` (数字正确但位置错误)
    *   你有 8 次机会。通过逻辑推理找出正确的 4 位密码
*   **管理员后门**：输入 `crack echo162` 可直接解锁
*   **破解成功**：控制台提示系统解锁，获得管理员权限

### 2. 探索档案

*   **浏览文件**：使用 `ls`（列出文件）、`cd`（进入目录）、`cat`（查看文件内容）
    *   例如：`cat readme.txt`，或者 `cd sys_logs` 后 `cat log_047.txt`
*   **推荐探索顺序**：
    1.  `cat readme.txt` — 黑铁联合体的官方口径
    2.  `cd sys_logs` → `cat log_047.txt` — 苔鸣谷的日常生活
    3.  `cat log_158.txt` — 白息浓度预警
    4.  `cat log_162.txt` — 最终日志（已损坏）
    5.  `cd ..` → `cd intel` → `cat chord_theory.md` — 烬的研究数据（被涂黑）

### 3. 解密核心文件

*   **进入目录**：`cd quarantine`
*   **解锁核心**：`unlock TMG-162-FINAL.enc`
*   **密钥验证**：系统会自动检测你是否集齐了三枚碎片。全部验证通过后，将会解密出烬的完整遗言

---

## 第四阶段：烬的遗言与终极抉择

解密完成后，你将看到：

1.  **弦律核心数据** — 白蚀裂缝脉冲与碎月引力波的同步公式
2.  **烬的最后日志** — 苔鸣谷最后时刻的记录，以及147只瑟帕的名字
3.  **反转真相** — 烬没有死，她被黑铁联合体抓获后记忆清除，变成了迷失者

此时终端警报响起，你必须做出选择：

1.  **输入 `purge`**：
    *   清除所有数据，自保断开
    *   **奖励**：宠物外观永久变化——眼睛颜色变暗，偶尔会说出与苔鸣谷相关的台词
2.  **输入 `broadcast`**：
    *   向全网广播烬的遗言，完成她未竟的心愿
    *   **触发奖励**：解锁网站的「白蚀 (White Eclipse)」主题。导航栏右上角永久解锁一个月亮图标按钮，点击可切换白色高定风格主题

---

## 重置游戏

通关后，在终端中输入 `reset-arg` 可以重置所有 ARG 进度，重新体验整个游戏。

---

恭喜，你已完成「回声残响：苔鸣谷」ARG！

苔鸣谷存在过。我们存在过。
```

- [ ] **Step 2: 验证文件写入成功**

Read: `public/arg-walkthrough.md`
Expected: 新的攻略内容

---

### Task 10: 最终验证

- [ ] **Step 1: 运行类型检查**

Run: `npx vue-tsc --noEmit`
Expected: No errors

- [ ] **Step 2: 运行构建**

Run: `npm run build`
Expected: Build successful

- [ ] **Step 3: 手动测试完整流程**

1. 访问首页，点击宠物两次，确认 ARG 启动
2. 在首页输入 MOSS，确认碎片一获得
3. 前往项目页，点击卡片 1→2→3，确认碎片二获得
4. 前往游戏页，输入 SOS，确认碎片三获得
5. 确认宠物显示阶段二提示
6. 前往文章页，找到隐藏文字，解码得到路径
7. 进入终端，输入 `crack echo162` 解锁
8. 探索文件系统，确认所有文件内容正确
9. 输入 `unlock TMG-162-FINAL.enc`，确认解密流程
10. 输入 `broadcast`，确认主题解锁
11. 刷新页面，确认主题切换按钮存在
12. 重置：进入终端输入 `reset-arg`，确认所有状态清除
13. 重新走一遍流程，这次输入 `purge`，确认宠物外观变化

- [ ] **Step 4: 提交代码**

```bash
git add -A
git commit -m "feat: redesign ARG with worldview-integrated story '苔鸣谷'"
```
