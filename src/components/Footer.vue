<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const footerRef = ref<HTMLElement | null>(null);
const route = useRoute();

// 监听路由变化，一旦开始切换页面，立刻强制页脚播放消失动画
// 这样可以避免从短页面切换到长页面时，页脚被瞬间挤到屏幕外面导致“突然消失”的撕裂感
watch(() => route.path, () => {
  if (footerRef.value) {
    footerRef.value.classList.remove('is-visible');
  }
});

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // 只要露出超过 10%，就显示；一旦低于 10%（比如向上滚动离开时），就立刻移除 class 触发消失动画
      if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
        entry.target.classList.add('is-visible');
      } else {
        entry.target.classList.remove('is-visible');
      }
    });
  }, { 
    threshold: [0, 0.1, 0.2, 0.5, 1.0] 
  });

  if (footerRef.value) {
    observer.observe(footerRef.value);
  }
});
</script>

<template>
  <footer ref="footerRef" class="footer-reveal w-full text-center py-3 md:py-4 mt-auto border-t-4 border-[var(--color-text)] bg-[var(--color-bg)] font-sans text-[9px] md:text-[10px] uppercase">
    <div class="max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-2 md:gap-4">
      <span class="footer-left">(C) 2024-2026 LANRHYME // ALL RIGHTS RESERVED</span>
      
      <div class="footer-center flex items-center gap-2">
        <a 
          href="https://ebrao.com/csr/" 
          target="_blank" 
          rel="noopener noreferrer"
          class="csr-badge inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--color-border)] hover:border-[var(--color-brand)] bg-[var(--color-hud)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-all duration-300 group shadow-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
          title="Cool Site Revival (CSR)"
        >
          <img 
            src="/img/csr-logo.svg" 
            alt="CSR Logo" 
            class="w-3.5 h-3.5 object-contain invert opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
          />
          <span class="font-mono tracking-widest text-[8px] md:text-[9px]">CSR MEMBER</span>
        </a>
      </div>

      <span class="footer-right">SYS.STATUS: RUNNING // EOF_REACHED</span>
    </div>
  </footer>
</template>

<style scoped>
.footer-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.footer-reveal.is-visible {
  opacity: 0.7; /* Original opacity limit */
  transform: translateY(0);
}

.footer-left {
  opacity: 0;
  transform: translateX(-30px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
}
.footer-reveal.is-visible .footer-left {
  opacity: 1;
  transform: translateX(0);
}

.footer-center {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
}
.footer-reveal.is-visible .footer-center {
  opacity: 1;
  transform: translateY(0);
}

.footer-right {
  opacity: 0;
  transform: translateX(30px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
}
.footer-reveal.is-visible .footer-right {
  opacity: 1;
  transform: translateX(0);
}
</style>
