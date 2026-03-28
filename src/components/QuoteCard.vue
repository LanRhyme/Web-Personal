<script setup lang="ts">
import { ref, onMounted } from 'vue';

const quote = ref('加载中...');
const from = ref('');

const fetchHitokoto = async () => {
    try {
        const response = await fetch('https://v1.hitokoto.cn');
        if (response.ok) {
            const data = await response.json();
            quote.value = data.hitokoto;
            from.value = data.from;
        } else {
            quote.value = '愿你的代码永无 Bug。';
        }
    } catch (e) {
        quote.value = '网络错误，请稍后再试。';
    }
};

onMounted(() => {
    fetchHitokoto();
});
</script>

<template>
  <div class="card !p-6 flex flex-col justify-center gap-3 group cursor-pointer" @click="fetchHitokoto">
    <div class="flex items-center gap-2 mb-1">
        <i class="fa fa-quote-left text-[#35bfa0] text-xs opacity-50 group-hover:opacity-100 transition-opacity"></i>
        <span class="text-[10px] font-bold text-[#6b8a7a] uppercase tracking-wider">Hitokoto</span>
    </div>
    <p class="text-sm leading-relaxed text-[var(--color-primary)] opacity-90 font-medium">
        {{ quote }}
    </p>
    <div v-if="from" class="text-right">
        <span class="text-[11px] text-[var(--color-secondary)] opacity-60">— {{ from }}</span>
    </div>
  </div>
</template>
