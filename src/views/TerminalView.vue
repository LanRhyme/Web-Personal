<script setup lang="ts">
import Terminal from '../components/Terminal.vue';
import { onMounted, onUnmounted } from 'vue';

let originalTitle = '';
onMounted(() => {
  originalTitle = document.title;
  document.title = "Veritas Node 04";
});

onUnmounted(() => {
  document.title = originalTitle;
});
</script>

<template>
  <div class="fixed inset-0 z-[99999] bg-black overflow-hidden">
    <Terminal />
  </div>
</template>
