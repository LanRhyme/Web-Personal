<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const countdown = ref(15);
let timer: number;

const goHome = () => {
  router.push('/');
};

onMounted(() => {
  timer = window.setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
      goHome();
    }
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<template>
  <div class="min-h-[70vh] flex flex-col items-center justify-center px-4 font-mono select-none relative overflow-hidden">
    
    <!-- Cyberpunk Terminal Frame -->
    <div class="cyber-glass max-w-2xl w-full border border-[var(--color-border)] p-6 md:p-12 relative bg-[#09090b]/80 backdrop-blur-md hover:border-[var(--color-brand)]/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]">
      
      <!-- Corner Decorations -->
      <div class="absolute top-0 left-0 w-4 h-[2px] bg-[var(--color-brand)]"></div>
      <div class="absolute top-0 left-0 w-[2px] h-4 bg-[var(--color-brand)]"></div>
      <div class="absolute top-0 right-0 w-4 h-[2px] bg-[var(--color-brand)]"></div>
      <div class="absolute top-0 right-0 w-[2px] h-4 bg-[var(--color-brand)]"></div>
      <div class="absolute bottom-0 left-0 w-4 h-[2px] bg-[var(--color-brand)]"></div>
      <div class="absolute bottom-0 left-0 w-[2px] h-4 bg-[var(--color-brand)]"></div>
      <div class="absolute bottom-0 right-0 w-4 h-[2px] bg-[var(--color-brand)]"></div>
      <div class="absolute bottom-0 right-0 w-[2px] h-4 bg-[var(--color-brand)]"></div>

      <!-- Top Title Bar -->
      <div class="border-b border-[var(--color-border)] pb-4 mb-8 flex justify-between items-center text-[10px] tracking-widest text-[var(--color-text-dim)] uppercase">
        <span class="text-red-500 animate-pulse">▲ WARNING: SYSTEM_ERROR</span>
        <span>CODE: 0x00000194</span>
      </div>

      <!-- ASCII Art 404 -->
      <pre class="text-red-500/80 hover:text-red-500 transition-colors leading-[1.15] text-[6px] sm:text-[10px] md:text-[12px] font-bold text-center my-6 select-none glitch-hover animate-pulse" style="text-shadow: 0 0 10px rgba(239, 68, 68, 0.2)">
██╗  ██╗ ██████╗ ██╗  ██╗
██║  ██║██╔═══██╗██║  ██║
███████║██║   ██║███████║
╚════██║██║   ██║╚════██║
     ██║╚██████╔╝     ██║
     ╚═╝ ╚═════╝      ╚═╝
      </pre>

      <!-- Diagnostic Info -->
      <div class="my-8 space-y-2 text-xs md:text-sm text-left border-l-2 border-red-500/40 pl-4 bg-red-500/[0.02] py-3">
        <div class="text-[var(--color-text-dim)] font-bold">// DIAGNOSTICS:</div>
        <div><span class="text-[var(--color-text-dim)]">> STATUS:</span> <span class="text-red-500 font-bold">ROUTE_RESOLVE_FAILED (404)</span></div>
        <div><span class="text-[var(--color-text-dim)]">> MESSAGE:</span> The requested sector does not exist or has been lost to the void.</div>
        <div><span class="text-[var(--color-text-dim)]">> ADVICE:</span> Return to main operational grid to avoid complete memory corruption.</div>
      </div>

      <!-- Footer & Action -->
      <div class="border-t border-[var(--color-border)] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="text-[10px] text-[var(--color-text-dim)] tracking-wider text-center sm:text-left">
          AUTO_RECOVERY IN <span class="text-[var(--color-brand)] font-bold">{{ countdown }}s</span> ...
        </div>
        <button 
          @click="goHome" 
          class="btn-terminal px-6 py-2 border border-[var(--color-brand)] text-[var(--color-brand)] text-xs font-bold tracking-widest uppercase relative overflow-hidden transition-all duration-300 hover:bg-[var(--color-brand)] hover:text-black cursor-pointer active:scale-95"
        >
          &lt; RETURN_TO_HOME_GRID &gt;
        </button>
      </div>

    </div>
  </div>
</template>
