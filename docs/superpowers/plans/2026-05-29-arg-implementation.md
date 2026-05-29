# ARG E-09 Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 5-phase ARG (Terminal, Ghost Text, Scavenger Hunt keys, and Theme Toggle) in the Vue 3 application based on the E-09 Protocol design spec.

**Architecture:** 
- Add a composable `useARGState.ts` to manage global puzzle progression and theme state via `localStorage`.
- Add two new hidden routes (`/void-echo-terminal`, `/physical`).
- Build a self-contained `Terminal.vue` component with an internal file system, command parser state, and hacking minigame. 
- Modify existing views (`Home.vue`, `Projects.vue`, `Games.vue`) to inject the scavenger hunt logic via Vue lifecycle hooks and local state. 
- Add "White Eclipse" theme CSS variables to `style.css` and a theme toggle to the header.

**Tech Stack:** Vue 3, Vue Router, TailwindCSS, TypeScript.

---

### Task 1: ARG Global State & Theme Engine

**Files:**
- Create: `src/composables/useARGState.ts`
- Modify: `src/style.css`
- Modify: `src/App.vue`

- [ ] **Step 1: Write state composable**
Create `src/composables/useARGState.ts` to expose `themeUnlocked` and `toggleTheme` using `localStorage`.
- [ ] **Step 2: Add theme CSS variables**
Append `.theme-eclipse` CSS variables to `src/style.css` (white/cyan colors, glassmorphism overrides).
- [ ] **Step 3: Apply theme in App.vue**
Watch the state in `App.vue` and dynamically apply the `theme-eclipse` class to `document.body` or `#app`.

### Task 2: Hidden Terminal Routes

**Files:**
- Create: `src/views/TerminalView.vue`
- Create: `src/views/PhysicalView.vue`
- Modify: `src/router/index.ts`

- [ ] **Step 1: Create minimal views**
Create `TerminalView.vue` holding a placeholder `<Terminal />` and `PhysicalView.vue` holding the text "即使肉体结晶，念依然记得疼痛。密钥：FORM_SHATTERED".
- [ ] **Step 2: Add to router**
Register `/void-echo-terminal` and `/physical` in `src/router/index.ts`.

### Task 3: Terminal Component Core

**Files:**
- Create: `src/components/Terminal.vue`
- Modify: `src/views/TerminalView.vue`

- [ ] **Step 1: Build Terminal UI**
Build `src/components/Terminal.vue` with a black background, cyan/green monospace text, an input field for commands, and an output history array `[{ type: 'input'|'output', text: string }]`.
- [ ] **Step 2: Implement basic CLI parser**
Implement `help`, `ls`, `cd`, `cat`, `clear`. Hardcode a simple file system state (`/sys_logs/log1.txt`, `/quarantine/E-09_memory_core.enc`).
- [ ] **Step 3: Integrate terminal into view**
Import and mount `<Terminal />` in `TerminalView.vue`.

### Task 4: Terminal Minigame & Logic (Mastermind & Unlock)

**Files:**
- Modify: `src/components/Terminal.vue`

- [ ] **Step 1: Implement `crack` minigame**
Add a `systemLocked` state. If locked, commands output "Access Denied. Run crack". The `crack` command prompts for a 4-digit code. Feedback logic: count exact matches and partial matches.
- [ ] **Step 2: Implement `unlock` command**
Command logic that checks if the user knows `FORM_SHATTERED`, `BREATH_FROZEN`, `SOUL_LOST`. If yes, displays the final Obsidian Directives text.
- [ ] **Step 3: Implement choice logic (`purge` vs `broadcast`)**
If decrypted, prompt for choice. If `broadcast`, call `useARGState().unlockTheme()` and show the Shattered Moon toggle.

### Task 5: The Ghost Text (Article Phase)

**Files:**
- Create: `public/blogs/arg-entry.json` (Assuming the site uses JSON for blogs based on `fetch('/blogs/index.json')`)
- Modify: `public/blogs/index.json`

- [ ] **Step 1: Create the bait article**
Add a JSON entry for the article "网页性能优化的几点思考". Add a paragraph: `<span style="user-select: text">我不是 Bug，我是被他们抹除的记忆。</span>`. Add hidden Base64 string `L3ZvaWQtZWNoby10ZXJtaW5hbA==` with inline styling matching the background color.

### Task 6: Scavenger Hunt Triggers (Home, Projects, Games)

**Files:**
- Modify: `src/views/Home.vue`
- Modify: `src/views/Projects.vue`
- Modify: `src/views/Games.vue`

- [ ] **Step 1: Home.vue keydown listener (Breath Key)**
Add `window.addEventListener('keydown')` in `Home.vue` mounted hook. Track consecutive keystrokes matching "ELARA". If matched, set a reactive variable to show `BREATH_FROZEN` overlay and apply a CSS frost filter to the view.
- [ ] **Step 2: Projects.vue click sequence (Form Key)**
Track clicks on project cards. If clicked in a specific reverse ID order (e.g., 3 -> 2 -> 1), trigger an alert or toast showing `FORM_SHATTERED`.
- [ ] **Step 3: Games.vue blind typing (Soul Key)**
Add a "Corrupted Game" tile at the bottom. Clicking it pushes to a new route `/games/void` (or opens a full-screen black overlay). A global keydown listener tracks "HELP" to reveal `SOUL_LOST`.
