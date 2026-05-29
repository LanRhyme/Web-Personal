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
      document.documentElement.classList.add('theme-eclipse');
    } else {
      document.documentElement.classList.remove('theme-eclipse');
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
    document.documentElement.classList.remove('theme-eclipse');
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
