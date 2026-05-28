# Admin页面风格统一设计文档

## 概述

将Admin管理后台页面统一为网站的ASCII Brutalism设计风格，同时修复发现的潜在bug。

## 目标

1. 将Admin页面视觉风格统一为ASCII Brutalism
2. 复用项目中已有的`.cyber-glass`和`.btn-terminal`样式
3. 修复代码中的潜在bug
4. 保持Admin页面的功能完整性

## 设计原则

- **复用优先**：使用已有的`.cyber-glass`和`.btn-terminal`样式类
- **一致性**：与网站其他页面保持相同的视觉语言
- **功能不变**：只改变外观，不改变功能逻辑

## 样式映射

### CSS类替换

| Admin当前使用 | 替换为 | 说明 |
|--------------|--------|------|
| `.card` | `.cyber-glass` | 玻璃面板效果，带边框和悬停高亮 |
| `.card-flat` | `.cyber-glass` | 同上 |
| `.btn-brand` | `.btn-terminal` | 终端风格按钮，悬停有绿色填充动画 |
| `.btn-ghost` | `.btn-terminal` | 同上 |

### 新增样式

需要在`style.css`中添加以下样式：

```css
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
```

## 组件修改

### Admin.vue模板修改

#### 1. 登录界面

**当前代码：**
```html
<div class="card max-w-md w-full mx-4 p-8 md:p-12 text-center animate-fade-in">
```

**替换为：**
```html
<div class="cyber-glass max-w-md w-full mx-4 p-8 md:p-12 text-center">
```

#### 2. 侧边栏

**当前代码：**
```html
<aside class="fixed lg:sticky top-0 left-0 w-80 lg:w-85 h-screen bg-[var(--color-card)] backdrop-blur-3xl border-r border-[var(--color-border)] p-6 z-50 flex flex-col transition-all duration-500">
```

**替换为：**
```html
<aside class="fixed lg:sticky top-0 left-0 w-80 lg:w-85 h-screen admin-sidebar p-6 z-50 flex flex-col transition-all duration-500">
```

#### 3. 侧边栏导航项

**当前代码：**
```html
<button class="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group"
        :class="activeTab === tab.id ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]' : 'text-[var(--color-secondary)] hover:bg-[var(--color-brand)]/5 hover:text-[var(--color-primary)]'">
```

**替换为：**
```html
<button class="w-full admin-nav-item"
        :class="activeTab === tab.id ? 'active' : ''">
```

#### 4. 内容卡片

**当前代码：**
```html
<div class="card-flat group relative animate-fade-in-up">
```

**替换为：**
```html
<div class="admin-card group relative">
```

#### 5. 按钮样式

**当前代码：**
```html
<button class="btn-brand w-full py-4 text-xs font-bold tracking-widest uppercase">
```

**替换为：**
```html
<button class="btn-terminal w-full py-4 text-xs font-bold tracking-widest uppercase">
```

#### 6. 输入框样式

**当前代码：**
```html
<input class="input-modern" />
```

**替换为：**
```html
<input class="input-terminal" />
```

#### 7. 输入组标签

**当前代码：**
```html
<div class="input-group"><label>标题</label><input ... /></div>
```

**替换为：**
```html
<div class="input-terminal-group"><label>标题</label><input ... /></div>
```

## Bug修复

### 1. CSS类缺失

**问题：** `.card`, `.card-flat`, `.btn-brand`, `.btn-ghost`等类未在全局CSS中定义。

**解决方案：** 
- 删除Admin.vue中scoped样式中的`.input-modern`, `.input-group`, `.custom-scrollbar`定义
- 使用新的`.input-terminal`, `.input-terminal-group`样式
- 使用已有的`.cyber-glass`和`.btn-terminal`样式

### 2. Promise反模式

**问题：** `uploadImage`函数中使用了`new Promise(async (resolve, reject) => {`反模式。

**位置：** `Admin.vue:73`

**解决方案：** 重构为直接返回async函数的结果：

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

### 3. createBlob函数未导入

**问题：** `publishArticle`函数中调用`createBlob`但未导入。

**位置：** `Admin.vue:369, 377, 449, 546`

**解决方案：** 
- 方案A：将`createBlob`移到`services/github.ts`中并导入
- 方案B：在Admin.vue中定义`createBlob`函数（当前已在Admin.vue:507定义，但需要检查是否正确导出）

**检查：** `createBlob`已在Admin.vue:507定义，但需要确保它在`publishArticle`和`deleteArticle`函数之前定义。

### 4. 错误处理不足

**问题：** `indexData.content`解析可能失败。

**位置：** `Admin.vue:433, 541`

**解决方案：** 添加错误处理：

```typescript
let existingIndex = [];
try {
  const indexData = await indexRes.json();
  if (indexData.content) {
    existingIndex = JSON.parse(atob(indexData.content));
  }
} catch (e) {
  console.error('Failed to parse index.json:', e);
}
```

### 5. 自定义滚动条样式

**问题：** `.custom-scrollbar`样式在scoped中定义，但可能与其他样式冲突。

**解决方案：** 将`.custom-scrollbar`移到全局CSS中，或使用Admin专用的类名。

## 实现步骤

### 第1步：更新全局CSS

在`style.css`中添加Admin专用样式（`.input-terminal`, `.input-terminal-group`, `.admin-sidebar`, `.admin-nav-item`, `.admin-card`）。

### 第2步：修改Admin.vue模板

1. 替换所有`.card`和`.card-flat`为`.cyber-glass`或`.admin-card`
2. 替换所有`.btn-brand`和`.btn-ghost`为`.btn-terminal`
3. 替换所有`.input-modern`为`.input-terminal`
4. 替换所有`.input-group`为`.input-terminal-group`
5. 更新侧边栏样式

### 第3步：修复Bug

1. 重构`uploadImage`函数
2. 添加错误处理
3. 确保`createBlob`函数正确定义和使用

### 第4步：清理scoped样式

删除Admin.vue中不再需要的scoped样式定义。

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/style.css` | 添加Admin专用样式 |
| `src/views/Admin.vue` | 替换CSS类、修复bug、清理scoped样式 |

## 验证标准

1. Admin页面视觉风格与网站其他页面一致
2. 所有功能正常工作（登录、编辑、发布、删除等）
3. 响应式布局正常
4. 无控制台错误
