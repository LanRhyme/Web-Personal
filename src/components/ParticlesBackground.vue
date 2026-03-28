<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const isDark = ref(false);
let observer: MutationObserver | null = null;

const checkDarkMode = () => {
  isDark.value = document.documentElement.classList.contains('dark');
};

onMounted(() => {
  checkDarkMode();
  observer = new MutationObserver(() => {
    checkDarkMode();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

const particlesOptions = computed(() => ({
  background: {
    color: {
      value: "transparent",
    },
  },
  fpsLimit: 120,
  interactivity: {
    detectsOn: "window",
    events: {
      onClick: {
        enable: true,
        mode: "push",
      },
      onHover: {
        enable: true,
        mode: ["repulse", "connect"],
      },
    },
    modes: {
      bubble: {
        distance: 400,
        duration: 2,
        opacity: 0.8,
        size: 40,
      },
      push: {
        quantity: 4,
      },
      repulse: {
        distance: 100,
        duration: 0.4,
        factor: 1,
        speed: 1,
      },
      connect: {
        distance: 80,
        links: {
          opacity: 0.5,
        },
        radius: 60,
      },
    },
  },
  particles: {
    color: {
      value: isDark.value ? "#5a7a6e" : "#2d4a2b",
    },
    links: {
      color: isDark.value ? "#5a7a6e" : "#2d4a2b",
      distance: 150,
      enable: false,
      opacity: 0.4,
      width: 1,
    },
    move: {
      direction: "none",
      enable: true,
      outModes: "bounce",
      random: false,
      speed: 1,
      straight: false,
    },
    number: {
      density: {
        enable: true,
        area: 800,
      },
      value: 80,
    },
    opacity: {
      // Lower opacity in dark mode for subtler effect
      value: isDark.value ? 0.25 : 0.5,
    },
    shape: {
      type: "circle",
    },
    size: {
      value: { min: 1, max: 3 },
    },
  },
  detectRetina: true,
}));
</script>

<template>
  <div class="particles-container">
    <vue-particles
      id="tsparticles"
      :options="particlesOptions"
      :key="isDark"
    />
  </div>
</template>

<style scoped>
.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* Just above background, below content */
  pointer-events: auto; /* Allow interaction */
}
</style>
