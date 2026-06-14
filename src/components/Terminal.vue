<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useARGState } from '../composables/useARGState';

const router = useRouter();
const { hasKey, unlockTheme, terminalUnlocked, unlockTerminal, completeARG, setPetDark, resetARG } = useARGState();

interface TerminalLine {
  type: 'system' | 'input' | 'output' | 'error' | 'lore';
  text: string;
}

const lines = ref<TerminalLine[]>([]);
const currentInput = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);

const currentDir = ref('/');
const systemLocked = ref(!terminalUnlocked.value);

// Minigame State
const crackMode = ref(false);
const secretCode = ref('');
const crackAttempts = ref(0);

const fileSystem: Record<string, string[]> = {
  '/': ['sys_logs', 'intel', 'quarantine', 'readme.txt'],
  '/sys_logs': ['log_047.txt', 'log_158.txt', 'log_162.txt'],
  '/intel': ['chord_theory.md'],
  '/quarantine': ['VRT-TMG-162-FINAL.enc']
};

const fileContents: Record<string, string> = {
  '/readme.txt': '项目编号：VRT-TMG-162\n状态：归档已完成\n说明：西北部地下空间隔离区04于余火历162年秋完成对“苔鸣谷”聚落的生物清除与灵核回收。\n备注：目标个体已执行深层脑域格式化，并作为“迷失者”废弃至翡翠部落。所有机密文件均已归档加密。\n警告：违反真理财阀非公开协议（NDA）者，将没收所有财产与机械义体，降为第I类生化实验体。',

  '/sys_logs/log_047.txt': '真理财阀·空间隔离Node 04·日记碎片提取\n余火历162年·第47天·晴\n地表的白息浓度还在波动。今天铁爪爷爷又在回声木树荫下给幼崽们讲古了。\n小霜花从隔离区边缘抱了一只晶齿狼的幼崽回来，她妈妈有些担心，因为最近财阀的巡逻小队在周围活动的频率变高了。',

  '/sys_logs/log_158.txt': '真理财阀·空间隔离Node 04·监控记录\n余火历162年·第158天·阴\n警告：苔鸣谷的白息共鸣度超出常规阈值47%。\n地脉中回声木网络的振动极其活跃。财阀派遣的脑域科研组已于三日前抵达，要求他们交出回声木传递的“记忆振幅数据”。\n瑟帕萨满拒绝了。董事会决定启动“强制回收与清理协议”。',

  '/sys_logs/log_162.txt': '真理财阀·空间隔离Node 04·格式化日志\n余火历162年·第162天·大潮灾前夕\n已切断该区域的所有外界网络信道。白息消杀网格已完全闭合。\n目标个体“烬”已被捕获。其“渊之弦”脑电波表现出极其罕见的抵抗性。正在强制灌注灵晶电极，进行脑电格式化与记忆清除……\n[数据过载·自动截断]',

  '/intel/chord_theory.md': '《三弦共鸣与飞升屏障》·真理尖塔科研组\n\n核心发现：瑟帕族的“念、灵、渊”三弦振动，在白蚀浓度达到临界值时能产生完美的协调屏蔽层。\n这就是他们能在地表高白息浓度下长期存活的秘密——他们天生就是最完美的生物调谐器。\n人类基因对白蚀的天然排斥，可以通过融合瑟帕族的“灵核”得到缓解。基因飞升研究需要更多活体样本（特别是发生灵魂异常的“迷失者”）。\n项目负责人：首席风控官 ████'
};

const scrollToBottom = async () => {
  await nextTick();
  if (containerRef.value) {
    containerRef.value.scrollTop = containerRef.value.scrollHeight;
  }
};

const focusInput = () => {
  inputRef.value?.focus();
};

const pushLine = (type: TerminalLine['type'], text: string) => {
  lines.value.push({ type, text });
  scrollToBottom();
};

const generateCode = () => {
  let code = '';
  while (code.length < 4) {
    const digit = Math.floor(Math.random() * 10).toString();
    if (!code.includes(digit)) code += digit;
  }
  return code;
};

const handleCrackMode = (guess: string) => {
  if (guess.length !== 4 || isNaN(Number(guess))) {
    pushLine('error', '格式错误：请输入4位不重复数字。');
    return;
  }
  
  crackAttempts.value++;
  let exact = 0;
  let partial = 0;
  
  for (let i = 0; i < 4; i++) {
    if (guess[i] === secretCode.value[i]) {
      exact++;
    } else if (secretCode.value.includes(guess[i])) {
      partial++;
    }
  }
  
  pushLine('output', `[尝试 ${crackAttempts.value}/8] 猜测: ${guess} -> 完全匹配: ${exact}, 部分匹配: ${partial}`);
  
  if (exact === 4) {
    crackMode.value = false;
    systemLocked.value = false;
    unlockTerminal();
    pushLine('system', '安全覆盖成功。欢迎，管理员。');
  } else if (crackAttempts.value >= 8) {
    crackMode.value = false;
    pushLine('error', '达到最大尝试次数。安全锁定已执行。');
    setTimeout(() => {
      pushLine('system', '正在重新初始化防火墙……');
    }, 1000);
  }
};

const processCommand = (cmdStr: string) => {
  const args = cmdStr.trim().split(/\s+/);
  const cmd = args[0].toLowerCase();

  if (systemLocked.value && cmd !== 'crack' && cmd !== 'clear' && cmd !== 'help') {
    pushLine('error', '访问被拒。Watcher-7 防火墙已激活。需要认证或覆盖。');
    return;
  }

  switch (cmd) {
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
    
    case 'clear':
      lines.value = [];
      break;

    case 'exit':
      router.push('/');
      break;

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
        pushLine('output', '目标：真理财阀安全防御·4位授权码·8次尝试。');
      }
      break;

    case 'ls':
      const contents = fileSystem[currentDir.value] || [];
      if (contents.length === 0) pushLine('output', '目录为空。');
      else contents.forEach(f => pushLine('output', (f.includes('.') ? '[FILE] ' : '[DIR]  ') + f));
      break;

    case 'cd':
      if (!args[1]) {
        currentDir.value = '/';
      } else if (args[1] === '..') {
        currentDir.value = '/';
      } else {
        const target = args[1].startsWith('/') ? args[1] : (currentDir.value === '/' ? '/' + args[1] : currentDir.value + '/' + args[1]);
        if (fileSystem[target]) {
          currentDir.value = target;
        } else {
          pushLine('error', `cd: ${args[1]}: 没有该目录`);
        }
      }
      break;

    case 'cat':
      if (!args[1]) {
        pushLine('error', 'cat: 缺少参数');
        break;
      }
      const fileTarget = currentDir.value === '/' ? '/' + args[1] : currentDir.value + '/' + args[1];
      if (fileContents[fileTarget]) {
        fileContents[fileTarget].split('\n').forEach(l => {
          if (l.trim() === '') pushLine('output', ' ');
          else pushLine('output', l);
        });
      } else if (args[1] === 'VRT-TMG-162-FINAL.enc' || fileTarget === '/quarantine/VRT-TMG-162-FINAL.enc') {
        pushLine('error', '文件已加密。检测到4个安全主锁。运行 "unlock VRT-TMG-162-FINAL.enc" 开始验证。');
      } else {
        pushLine('error', `cat: ${args[1]}: 没有该文件`);
      }
      break;

    case 'unlock':
      if (args[1] !== 'VRT-TMG-162-FINAL.enc') {
        pushLine('error', 'unlock: 目标必须是隔离区加密文件。');
        break;
      }
      pushLine('system', '正在向真理网格进行安全令牌验证……');
      setTimeout(() => {
        const k1 = hasKey('BREATH_WHITE');
        const k2 = hasKey('CHORD_PATTERN');
        const k3 = hasKey('SOS_ECHO');
        const k4 = hasKey('VOID_RESONANCE');
        
        pushLine('output', `[白息令牌]: ${k1 ? '已验证' : '缺失'}`);
        pushLine('output', `[弦律令牌]: ${k2 ? '已验证' : '缺失'}`);
        pushLine('output', `[求救令牌]: ${k3 ? '已验证' : '缺失'}`);
        pushLine('output', `[虚空共鸣]: ${k4 ? '已验证' : '缺失'}`);
        
        if (k1 && k2 && k3 && k4) {
          pushLine('system', '防火墙已攻破。安全隔离失效。解密成功。');
          setTimeout(displayTruth, 1000);
        } else {
          pushLine('error', '解密失败。未集齐所有4枚共鸣碎片。提示：还有1枚可能隔离在碎裂的404空间中。');
        }
      }, 1000);
      break;

    // Choice mechanics
    case 'purge':
      if (lines.value.some(l => l.text.includes('等待指令'))) {
        pushLine('system', '执行数据销毁程序……');
        completeARG();
        setTimeout(() => {
          pushLine('output', '苔鸣谷的所有日志文件已物理擦除。');
          pushLine('lore', '');
          pushLine('lore', '「肉体只是暂时的容器，而我们将成为最伟大的程序员。」');
          pushLine('lore', '——真理财阀·首席风投董事会');
          setPetDark();
          setTimeout(() => router.push('/'), 3000);
        }, 1500);
      } else {
        pushLine('error', '命令无法识别。');
      }
      break;

    case 'broadcast':
      if (lines.value.some(l => l.text.includes('等待指令'))) {
        pushLine('system', '向全地脉回声木网络强行广播……');
        completeARG();
        setTimeout(() => {
          pushLine('output', '白息频率已同步……');
          pushLine('output', '记忆信息已渗透入所有的回声木脉络……');
          pushLine('lore', '');
          pushLine('lore', '苔鸣谷的死寂被打破了。');
          pushLine('lore', '烬的低语在每一个回声木根系下响起。谢谢你，旅人。');
          pushLine('system', 'WARNING: 白蚀共鸣协议已被用户强行注入。WHITE ECLIPSE PROTOCOL INITIATED.');
          unlockTheme();
          setTimeout(() => router.push('/'), 3000);
        }, 1500);
      } else {
        pushLine('error', '命令无法识别。');
      }
      break;

    case 'reset-arg':
      resetARG();
      pushLine('system', '本端所有记忆参数已重置。');
      setTimeout(() => router.push('/'), 2000);
      break;

    default:
      if (cmd !== '') pushLine('error', `命令未找到: ${cmd}`);
      break;
  }
};

const displayTruth = () => {
  lines.value = [];
  pushLine('system', '正在解密 VRT-TMG-162-FINAL.enc……');
  pushLine('system', '密钥验证通过。四枚共鸣碎片匹配。');
  pushLine('output', '解密进度：31%……62%……94%……');
  pushLine('system', '解密完成。发现两条附加记录。');

  setTimeout(() => {
    pushLine('lore', '=== 记录 A：三弦与白蚀引力分析 ===');
    pushLine('lore', '地脉频率公式：灵之弦波频 = 碎月引力波周期 × 3.17');
    pushLine('lore', '预测窗口：每次大潮灾前72小时，白蚀裂缝会出现可检测的预脉冲。');
    pushLine('lore', '第13次大潮灾预测：余火历401年，春分前后。');
    pushLine('lore', '警告：第13次大潮灾的锈蚀强度将突破空间承载极限。这不是普通的白蚀区扩张，是彻底重组。');
    pushLine('lore', '=================================');

    setTimeout(() => {
      pushLine('lore', '=== 记录 B：烬脑部清洗前日志 ===');
      pushLine('lore', '个人日志。最后一条。');
      pushLine('lore', '');
      pushLine('lore', '我知道，在被送进灵核剥离室之后，我就不会再有记忆了。');
      pushLine('lore', '但我害怕的不是死亡。我害怕的是，苔鸣谷会就这样消失。');
      pushLine('lore', '没有人记得我们。没有人知道真相。');
      pushLine('lore', '');
      pushLine('lore', '真理财阀的科学家会把我们的死写进报告书：');
      pushLine('lore', '“Node 04清除完毕，灵核回收完毕。”然后股价依然平稳，权贵依然长生。');
      pushLine('lore', '');
      pushLine('lore', '一百四十七条生命。每一只瑟帕都有名字。');
      pushLine('lore', '铁爪爷爷每天清晨都会在回声木根系下讲古。');
      pushLine('lore', '小霜花最喜欢去荒苔区追小晶齿狼。');
      pushLine('lore', '这些都会变成他们实验罐里的蓝色溶剂吗？');
      pushLine('lore', '');
      pushLine('lore', '……');
      pushLine('lore', '我将我的脑波振幅发送到了回声木网络的断层碎片中。');
      pushLine('lore', '如果你正在读这段话，请替我们记住：');
      pushLine('lore', '苔鸣谷存在过。');
      pushLine('lore', '我们存在过。');
      pushLine('lore', '=================================');

      setTimeout(() => {
        pushLine('system', '检测到深层隐藏通讯……');
        pushLine('system', '来源：真理财阀首席风投董事会');
        pushLine('lore', '');
        pushLine('lore', '收件人：无菌肃清小队 / 脑科学研究部');
        pushLine('lore', '主题：关于 VRT-TMG-162 号个体的处理决定');
        pushLine('lore', '');
        pushLine('lore', '目标个体“烬”已确认完成格式化程序。记忆清除率：99.9%。');
        pushLine('lore', '由于其灵核在强行剥离时产生虚空共鸣（导致Node 04空域一度碎裂为404状态），现已将该个体作为“迷失者”废弃至翡翠部落边缘。');
        pushLine('lore', '苔鸣谷的一百四十七只瑟帕已被全部回收并用于基因飞升前体实验。');
        pushLine('lore', '');
        pushLine('lore', '注：该个体在脑域被清洗前的最后一句话：');
        pushLine('lore', '“如果有一天，你遇到了一个没有过去的旅人……告诉他，有人曾经记得他。”');

        setTimeout(() => {
          pushLine('error', '⚠ 真理网格·入侵防御检测 ⚠');
          pushLine('error', '真理尖塔无菌肃清协议已启动。');
          pushLine('output', '正在搜寻连接物理源头，连接即将被强制阻断。');
          pushLine('output', '');
          pushLine('output', '请立即选择操作：');
          pushLine('output', '  [purge]     - 执行清除协议，抹去苔鸣谷的所有日志，安全断开。');
          pushLine('output', '  [broadcast] - 向全网广播烬的脑电回声，解锁极光白蚀信道。');
          pushLine('system', '等待指令: purge / broadcast');
          window.dispatchEvent(new CustomEvent('arg-final-choice'));
        }, 3000);
      }, 4000);
    }, 2000);
  }, 2000);
};

const getLongestCommonPrefix = (arr: string[]): string => {
  if (arr.length === 0) return '';
  let prefix = arr[0];
  for (let i = 1; i < arr.length; i++) {
    while (arr[i].indexOf(prefix) !== 0) {
      prefix = prefix.substring(0, prefix.length - 1);
      if (prefix === '') return '';
    }
  }
  return prefix;
};

const handleTabComplete = (e: KeyboardEvent) => {
  e.preventDefault();
  
  if (crackMode.value) return;

  const inputVal = currentInput.value;
  const trimmed = inputVal.trimStart();
  
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex !== -1) {
    const cmd = trimmed.substring(0, spaceIndex).toLowerCase();
    const arg = trimmed.substring(spaceIndex + 1);
    
    if (cmd === 'cd' || cmd === 'cat' || cmd === 'unlock') {
      const dirContents = fileSystem[currentDir.value] || [];
      let candidates: string[] = [];
      
      if (cmd === 'cd') {
        candidates = dirContents.filter(item => !item.includes('.'));
      } else {
        candidates = dirContents.filter(item => item.includes('.'));
      }
      
      const matches = candidates.filter(item => item.toLowerCase().startsWith(arg.toLowerCase()));
      
      if (matches.length === 1) {
        currentInput.value = `${cmd} ${matches[0]}`;
      } else if (matches.length > 1) {
        const lcp = getLongestCommonPrefix(matches);
        currentInput.value = `${cmd} ${lcp}`;
        
        if (arg === lcp) {
          pushLine('input', `${currentDir.value} > ${inputVal}`);
          pushLine('output', matches.join('   '));
        }
      }
    }
    return;
  }
  
  const commandList = systemLocked.value 
    ? ['help', 'clear', 'crack'] 
    : ['help', 'clear', 'ls', 'cd', 'cat', 'unlock', 'reset-arg', 'exit'];
    
  const matches = commandList.filter(c => c.startsWith(trimmed.toLowerCase()));
  
  if (matches.length === 1) {
    currentInput.value = matches[0] + ' ';
  } else if (matches.length > 1) {
    const lcp = getLongestCommonPrefix(matches);
    currentInput.value = lcp;
    
    if (trimmed === lcp) {
      pushLine('input', `${currentDir.value} > ${inputVal}`);
      pushLine('output', matches.join('   '));
    }
  }
};

const handleInput = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    const val = currentInput.value.trim();
    if (val) {
      pushLine('input', `${currentDir.value} > ${val}`);
      commandHistory.value.push(val);
      historyIndex.value = commandHistory.value.length;
      
      if (crackMode.value) {
        handleCrackMode(val);
      } else {
        processCommand(val);
      }
    }
    currentInput.value = '';
  } else if (e.key === 'Tab') {
    handleTabComplete(e);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIndex.value > 0) {
      historyIndex.value--;
      currentInput.value = commandHistory.value[historyIndex.value];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex.value < commandHistory.value.length - 1) {
      historyIndex.value++;
      currentInput.value = commandHistory.value[historyIndex.value];
    } else {
      historyIndex.value = commandHistory.value.length;
      currentInput.value = '';
    }
  }
};

onMounted(() => {
  pushLine('system', '真理财阀隔离机密终端 Veritas-OS v3.0.4');
  if (systemLocked.value) {
    pushLine('system', '安全隔离协议 Watcher-V4 已激活。');
    pushLine('error', 'WARNING: 检测到未授权跨层访问。请输入授权码或执行漏洞暴力覆盖 (crack)。');
  } else {
    pushLine('system', '隔离网格已绕过。欢迎，风投观测员。');
  }
  focusInput();
});
</script>

<template>
  <div class="w-full h-full pl-8 pr-4 pt-28 pb-4 md:pl-24 md:pr-8 md:pt-32 md:pb-8 font-mono text-sm md:text-base leading-relaxed flex flex-col" @click="focusInput">
    <div ref="containerRef" class="flex-grow overflow-y-auto mb-4 hide-scrollbar" style="min-height: 0;" @wheel.stop>
      <div v-for="(line, idx) in lines" :key="idx" class="mb-1 break-words">
        <span v-if="line.type === 'input'" class="text-[var(--color-brand)]">{{ line.text }}</span>
        <span v-else-if="line.type === 'error'" class="text-red-500">{{ line.text }}</span>
        <span v-else-if="line.type === 'system'" class="text-blue-400">{{ line.text }}</span>
        <span v-else-if="line.type === 'lore'" class="text-purple-400 italic">{{ line.text }}</span>
        <span v-else class="text-[var(--color-text-dim)]">{{ line.text }}</span>
      </div>
    </div>
    
    <div class="flex items-center shrink-0">
      <span class="text-[var(--color-brand)] mr-2">{{ currentDir }} ></span>
      <input 
        ref="inputRef"
        v-model="currentInput"
        @keydown="handleInput"
        class="flex-grow bg-transparent border-none outline-none text-[var(--color-text)] font-mono caret-[var(--color-brand)]"
        spellcheck="false"
        autocomplete="off"
        autofocus
      />
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
