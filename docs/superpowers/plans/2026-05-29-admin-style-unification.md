# Admin页面风格统一实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [`) syntax for tracking.

**Goal:** 将Admin管理后台页面统一为网站的ASCII Brutalism设计风格，同时修复发现的潜在bug

**Architecture:** 复用项目中已有的`.cyber-glass`和`.btn-terminal`样式类，添加Admin专用的新样式类，修复代码中的bug

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS, Vite

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/style.css` | 修改 | 添加Admin专用样式 |
| `src/views/Admin.vue` | 修改 | 替换CSS类、修复bug |

---

### Task 1: 添加Admin专用样式到全局CSS

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: 在style.css末尾添加Admin专用样式**

在`src/style.css`文件末尾（`/* Add a global scale trick so clicking works with the box */`之后）添加以下样式：

```css
/* ═══════════════════════════════════════════════════
   Admin专用样式 — ASCII Brutalism风格
   ═══════════════════════════════════════════════════ */

/* Admin专用输入框样式 */
.input-terminal {
  width: 100%;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  padding: 0.75rem 1rem;
  color: var(--color-text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.input-terminal:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 1px var(--color-brand);
}

/* Admin输入组标签 */
.input-terminal-group label {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-dim);
  margin-bottom: 0.5rem;
}

/* Admin侧边栏样式 */
.admin-sidebar {
  background: var(--color-card);
  border-right: 1px solid var(--color-border);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

/* Admin侧边栏导航项 */
.admin-nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  color: var(--color-text-dim);
  transition: all 0.3s ease;
  border: 1px solid transparent;
  cursor: none !important;
}

.admin-nav-item:hover {
  color: var(--color-text);
  border-color: var(--color-border);
  background: rgba(107, 143, 114, 0.05);
}

.admin-nav-item.active {
  color: var(--color-brand);
  border-color: var(--color-brand);
  background: rgba(107, 143, 114, 0.1);
}

/* Admin卡片样式 */
.admin-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  padding: 1.5rem;
  position: relative;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.admin-card:hover {
  border-color: rgba(107, 143, 114, 0.4);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(107, 143, 114, 0.03);
}

/* Admin卡片角标装饰 */
.admin-card::after {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  width: 8px;
  height: 8px;
  border-top: 1px solid var(--color-brand);
  border-left: 1px solid var(--color-brand);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.admin-card:hover::after {
  opacity: 1;
}

/* Admin自定义滚动条 */
.admin-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.admin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.admin-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(107, 143, 114, 0.2);
  border-radius: 10px;
}
```

- [ ] **Step 2: 验证样式已添加**

运行: `npm run dev`
Expected: 开发服务器启动成功，无CSS错误

---

### Task 2: 替换Admin.vue中的CSS类

**Files:**
- Modify: `src/views/Admin.vue`

- [ ] **Step 1: 替换登录界面的card类**

找到第620行：
```html
<div class="card max-w-md w-full mx-4 p-8 md:p-12 text-center animate-fade-in">
```

替换为：
```html
<div class="cyber-glass max-w-md w-full mx-4 p-8 md:p-12 text-center">
```

- [ ] **Step 2: 替换侧边栏样式**

找到第648-651行：
```html
<aside 
  class="fixed lg:sticky top-0 left-0 w-80 lg:w-85 h-screen bg-[var(--color-card)] backdrop-blur-3xl border-r border-[var(--color-border)] p-6 z-50 flex flex-col transition-all duration-500"
  :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
>
```

替换为：
```html
<aside 
  class="fixed lg:sticky top-0 left-0 w-80 lg:w-85 h-screen admin-sidebar p-6 z-50 flex flex-col transition-all duration-500"
  :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
>
```

- [ ] **Step 3: 替换侧边栏导航项样式**

找到第674-680行：
```html
<button 
  v-for="tab in tabs" 
  :key="tab.id"
  @click="() => { activeTab = tab.id; isSidebarOpen = false; }"
  class="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group"
  :class="activeTab === tab.id ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]' : 'text-[var(--color-secondary)] hover:bg-[var(--color-brand)]/5 hover:text-[var(--color-primary)]'"
>
```

替换为：
```html
<button 
  v-for="tab in tabs" 
  :key="tab.id"
  @click="() => { activeTab = tab.id; isSidebarOpen = false; }"
  class="w-full admin-nav-item"
  :class="activeTab === tab.id ? 'active' : ''"
>
```

- [ ] **Step 4: 替换登录按钮样式**

找到第632行：
```html
<button @click="checkAuth" class="btn-brand w-full py-4 text-xs font-bold tracking-widest uppercase">解锁控制台</button>
```

替换为：
```html
<button @click="checkAuth" class="btn-terminal w-full py-4 text-xs font-bold tracking-widest uppercase">解锁控制台</button>
```

- [ ] **Step 5: 替换发布按钮样式**

找到第658行：
```html
<button @click="() => { publishAllChanges(); isSidebarOpen = false; }" :disabled="isPublishing" class="w-full flex items-center justify-center gap-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-secondary)] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[var(--color-brand)]/20 transition-all disabled:opacity-50">
```

替换为：
```html
<button @click="() => { publishAllChanges(); isSidebarOpen = false; }" :disabled="isPublishing" class="btn-terminal w-full flex items-center justify-center gap-3 py-4 font-black text-xs uppercase tracking-widest disabled:opacity-50">
```

- [ ] **Step 6: 替换新增记录按钮样式**

找到第663-668行：
```html
<button @click="() => {
    activeTab === 'pinned' ? addPinnedItem() : activeTab === 'projects' ? addProject() : activeTab === 'commissions' ? addCommission() : activeTab === 'works' ? addWork() : addWorksSection();
    isSidebarOpen = false;
}" class="w-full flex items-center justify-center gap-3 bg-[var(--color-card-solid)] border border-[var(--color-border)] text-[var(--color-brand)] py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[var(--color-brand)]/5 transition-all">
```

替换为：
```html
<button @click="() => {
    activeTab === 'pinned' ? addPinnedItem() : activeTab === 'projects' ? addProject() : activeTab === 'commissions' ? addCommission() : activeTab === 'works' ? addWork() : addWorksSection();
    isSidebarOpen = false;
}" class="btn-terminal w-full flex items-center justify-center gap-3 py-4 font-black text-xs uppercase tracking-widest">
```

- [ ] **Step 7: 替换设置按钮样式**

找到第692行：
```html
<button @click="showSettings = true" class="w-full flex items-center gap-3 text-xs font-bold text-[var(--color-secondary)] hover:text-[var(--color-brand)] transition-colors">
```

替换为：
```html
<button @click="showSettings = true" class="btn-terminal w-full flex items-center gap-3 text-xs font-bold !border-0 !p-0 text-[var(--color-secondary)] hover:text-[var(--color-brand)] transition-colors">
```

- [ ] **Step 8: 替换退出登录按钮样式**

找到第695行：
```html
<button @click="logout" class="w-full flex items-center gap-3 text-xs font-bold text-red-400 hover:text-red-500 transition-colors">
```

替换为：
```html
<button @click="logout" class="btn-terminal w-full flex items-center gap-3 text-xs font-bold !border-0 !p-0 text-red-400 hover:text-red-500 transition-colors">
```

- [ ] **Step 9: 替换所有card-flat类为admin-card**

使用替换功能，将所有`card-flat`替换为`admin-card`：

找到：`class="card-flat`
替换为：`class="admin-card`

同时处理带其他class的情况：
找到：`class="card-flat group`
替换为：`class="admin-card group`

- [ ] **Step 10: 替换所有input-modern类为input-terminal**

使用替换功能，将所有`input-modern`替换为`input-terminal`：

找到：`class="input-modern`
替换为：`class="input-terminal`

- [ ] **Step 11: 替换所有input-group类为input-terminal-group**

使用替换功能，将所有`input-group`替换为`input-terminal-group`：

找到：`class="input-group`
替换为：`class="input-terminal-group`

- [ ] **Step 12: 替换设置弹窗的card类**

找到第1002行：
```html
<div class="card max-w-lg w-full p-10 relative">
```

替换为：
```html
<div class="cyber-glass max-w-lg w-full p-10 relative">
```

- [ ] **Step 13: 替换设置保存按钮样式**

找到第1014行：
```html
<button @click="saveSettings" class="btn-brand w-full py-4 mt-4">确认保存</button>
```

替换为：
```html
<button @click="saveSettings" class="btn-terminal w-full py-4 mt-4">确认保存</button>
```

- [ ] **Step 14: 替换custom-scrollbar为admin-scrollbar**

使用替换功能，将所有`custom-scrollbar`替换为`admin-scrollbar`：

找到：`custom-scrollbar`
替换为：`admin-scrollbar`

- [ ] **Step 15: 替换文章发布按钮样式**

找到第956行：
```html
<button @click="publishArticle" :disabled="isArticlePublishing" class="btn-brand">
```

替换为：
```html
<button @click="publishArticle" :disabled="isArticlePublishing" class="btn-terminal">
```

---

### Task 3: 修复Bug

**Files:**
- Modify: `src/views/Admin.vue`

- [ ] **Step 1: 修复uploadImage函数的Promise反模式**

找到第72-117行的`uploadImage`函数：
```typescript
const uploadImage = async (file: File, folder: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      // ... 函数体
    };
    reader.readAsDataURL(file);
  });
};
```

替换为：
```typescript
const uploadImage = async (file: File, folder: string): Promise<string> => {
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      const base64 = reader.result as string;
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${folder}/${Date.now()}-${safeName}`;
      
      if (isGithubConfigured.value) {
        try {
          isUploading.value = true;
          const content = base64.replace(/^data:image\/\w+;base64,/, "");
          const path = `public/${filename}`;
          await updateFile(path, content, `Upload ${filename}`, githubConfig.value, true);
          resolve(`/${filename}`);
        } catch (e) {
          console.error(e);
          reject('GitHub 上传失败: ' + e);
        } finally {
          isUploading.value = false;
        }
      } else {
        try {
          isUploading.value = true;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filepath: filename, content: base64 })
          });
          
          if (res.ok) {
            const json = await res.json();
            resolve(json.path);
          } else {
            reject('上传失败');
          }
        } catch (e) {
          reject(e);
        } finally {
          isUploading.value = false;
        }
      }
    };
    reader.readAsDataURL(file);
  });
};
```

- [ ] **Step 2: 修复publishArticle函数中的错误处理**

找到第429-433行：
```typescript
const indexRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/contents/public/blogs/index.json?ref=${githubConfig.value.branch}`, {
  headers: { Authorization: `token ${githubConfig.value.token}` }
});
const indexData = await indexRes.json();
const existingIndex = indexData.content ? JSON.parse(atob(indexData.content)) : [];
```

替换为：
```typescript
const indexRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/contents/public/blogs/index.json?ref=${githubConfig.value.branch}`, {
  headers: { Authorization: `token ${githubConfig.value.token}` }
});
let existingIndex: any[] = [];
try {
  const indexData = await indexRes.json();
  if (indexData.content) {
    existingIndex = JSON.parse(atob(indexData.content));
  }
} catch (e) {
  console.error('Failed to parse index.json:', e);
}
```

- [ ] **Step 3: 修复deleteArticle函数中的错误处理**

找到第537-541行：
```typescript
const indexRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/contents/public/blogs/index.json?ref=${githubConfig.value.branch}`, {
  headers: { Authorization: `token ${githubConfig.value.token}` }
});
const indexData = await indexRes.json();
const existingIndex = indexData.content ? JSON.parse(atob(indexData.content)) : [];
```

替换为：
```typescript
const indexRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/contents/public/blogs/index.json?ref=${githubConfig.value.branch}`, {
  headers: { Authorization: `token ${githubConfig.value.token}` }
});
let existingIndex: any[] = [];
try {
  const indexData = await indexRes.json();
  if (indexData.content) {
    existingIndex = JSON.parse(atob(indexData.content));
  }
} catch (e) {
  console.error('Failed to parse index.json:', e);
}
```

---

### Task 4: 清理scoped样式

**Files:**
- Modify: `src/views/Admin.vue`

- [ ] **Step 1: 删除不再需要的scoped样式**

找到第1024-1063行的`<style scoped>`部分：
```css
<style scoped>
.input-modern {
    width: 100%;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    padding: 0.75rem 1.25rem;
    color: var(--color-primary);
    font-size: 0.875rem;
    transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.input-modern:focus {
    outline: none;
    border-color: var(--color-brand);
    background: var(--color-card-solid);
}

.input-group label {
    display: block;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-secondary);
    margin-bottom: 0.6rem;
    padding-left: 0.5rem;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(132, 201, 60, 0.2);
  border-radius: 10px;
}
</style>
```

替换为：
```css
<style scoped>
/* Admin页面scoped样式已移至全局style.css */
</style>
```

---

### Task 5: 验证和测试

**Files:**
- None (验证步骤)

- [ ] **Step 1: 启动开发服务器**

运行: `npm run dev`
Expected: 开发服务器启动成功，无错误

- [ ] **Step 2: 访问Admin页面**

打开浏览器访问: `http://localhost:5173/#/admin`
Expected: 页面正常加载，显示ASCII Brutalism风格的登录界面

- [ ] **Step 3: 测试登录功能**

输入密码（默认: admin888）并点击登录
Expected: 成功登录，显示管理后台主界面

- [ ] **Step 4: 测试各个Tab切换**

依次点击侧边栏的各个Tab
Expected: 每个Tab正常切换，内容正确显示

- [ ] **Step 5: 测试新增记录功能**

点击"新增记录"按钮
Expected: 新记录成功添加到列表中

- [ ] **Step 6: 测试删除记录功能**

点击某个记录的删除按钮
Expected: 记录成功删除

- [ ] **Step 7: 检查控制台无错误**

打开浏览器开发者工具，检查Console标签
Expected: 无JavaScript错误

- [ ] **Step 8: 测试响应式布局**

调整浏览器窗口大小，测试移动端布局
Expected: 侧边栏在移动端正确隐藏/显示

---

## 验证标准

1. ✅ Admin页面视觉风格与网站其他页面一致
2. ✅ 所有功能正常工作（登录、编辑、发布、删除等）
3. ✅ 响应式布局正常
4. ✅ 无控制台错误
5. ✅ 使用`.cyber-glass`和`.btn-terminal`样式类
6. ✅ 输入框使用终端风格（方形边框）
7. ✅ 侧边栏使用ASCII Brutalism风格
