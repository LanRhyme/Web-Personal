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
  '/quarantine': ['TMG-162-FINAL.enc']
};

const fileContents: Record<string, string> = {
  '/readme.txt': '项目编号：BLK-IRON-162-TMG\n状态：已终止\n说明：苔鸣谷聚落于余火历162年秋因白蚀区自然扩张覆灭。属天灾。无幸存者。\n备注：所有相关数据已转移至加密档案。相关人员记忆清除已完成。\n此文件仅供内部查阅。泄露者将按叛国罪处理。',

  '/sys_logs/log_047.txt': '余火历162年·第47天·晴\n今日白息浓度正常。铁爪爷爷又在回声木下给幼崽们讲古了。\n小霜花抓了一只晶齿狼幼崽回来，被她母亲骂了一顿。\n风铃说她新学了一首歌，晚上要在聚落中心唱。',

  '/sys_logs/log_158.txt': '余火历162年·第158天·阴\n白息浓度持续上升。已超出正常脉冲期基准值47%。\n长老决定暂停外出采集。\n黑铁联合体的代表三天前离开了。他们要我们的弦律数据。我们拒绝了。\n补给线已经42天没有更新了。',

  '/sys_logs/log_162.txt': '余火历162年·第……天\n白息浓度……临界……裂缝在……\n补给线……47天没有……\n黑铁……他们……\n[数据损坏·无法恢复]',

  '/intel/chord_theory.md': '弦律理论·烬\n\n核心发现：白蚀裂缝脉冲周期与碎月引力波完全同步。\n同步系数：████████（已删除）\n预测窗口：每次大潮灾前███小时，裂缝会出现可检测的预脉冲。\n第13次大潮灾预测：████████████（已删除）\n\n注：此数据已被列为黑铁联合体最高机密。原作者记忆清除已完成。'
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
        pushLine('output', '目标：黑铁联合体军事加密·4位授权码·8次尝试。');
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
      } else if (args[1] === 'TMG-162-FINAL.enc' || fileTarget === '/quarantine/TMG-162-FINAL.enc') {
        pushLine('error', '文件已加密。检测到3个主锁。运行 "unlock TMG-162-FINAL.enc" 开始解密。');
      } else {
        pushLine('error', `cat: ${args[1]}: 没有该文件`);
      }
      break;

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

    // Choice mechanics
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

    case 'reset-arg':
      resetARG();
      pushLine('system', 'ARG 数据已重置。回声木网络信号已清除。');
      setTimeout(() => router.push('/'), 2000);
      break;

    default:
      if (cmd !== '') pushLine('error', `命令未找到: ${cmd}`);
      break;
  }
};

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
          window.dispatchEvent(new CustomEvent('arg-final-choice'));
        }, 3000);
      }, 4000);
    }, 2000);
  }, 2000);
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
  pushLine('system', '黑铁联合体加密档案终端 v2.1.7');
  if (systemLocked.value) {
    pushLine('system', '安全协议 Watcher-7 已激活。');
    pushLine('error', 'WARNING: 检测到未授权访问。请输入授权码或执行暴力破解。');
  } else {
    pushLine('system', '安全协议已解除。欢迎，管理员。');
  }
  focusInput();
});
</script>

<template>
  <div class="w-full h-full p-4 pt-28 md:p-8 md:pt-32 font-mono text-sm md:text-base leading-relaxed flex flex-col" @click="focusInput">
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
