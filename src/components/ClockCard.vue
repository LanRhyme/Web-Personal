<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const time = ref(new Date());
let timer: number;

const updateTime = () => {
    time.value = new Date();
};

onMounted(() => {
    timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
    clearInterval(timer);
});

const hours = computed(() => time.value.getHours().toString().padStart(2, '0'));
const minutes = computed(() => time.value.getMinutes().toString().padStart(2, '0'));
const seconds = computed(() => time.value.getSeconds().toString().padStart(2, '0'));

const segmentMap: Record<number, boolean[]> = {
    0: [true, true, true, true, true, true, false],
    1: [false, true, true, false, false, false, false],
    2: [true, true, false, true, true, false, true],
    3: [true, true, true, true, false, false, true],
    4: [false, true, true, false, false, true, true],
    5: [true, false, true, true, false, true, true],
    6: [true, false, true, true, true, true, true],
    7: [true, true, true, false, false, false, false],
    8: [true, true, true, true, true, true, true],
    9: [true, true, true, true, false, true, true]
};

const activeColor = 'var(--color-brand)';
const inactiveColor = 'rgba(var(--brand-rgb), 0.05)';
</script>

<template>
  <div class="card !p-2 flex items-center justify-center overflow-hidden w-full">
    <div class="w-full bg-[var(--color-brand)]/10 rounded-[20px] md:rounded-[24px] flex items-center justify-center gap-0.5 sm:gap-1 md:gap-1.5 py-3 md:py-4 px-2 sm:px-3 md:px-4">
      <!-- Hours -->
      <div class="digit-box flex gap-0.5 sm:gap-1">
        <svg v-for="(v, i) in hours.split('')" :key="'h'+i" viewBox="0 0 29 52" fill="none" class="digit-svg digit-hours">
          <path v-for="(active, idx) in segmentMap[parseInt(v)]" :key="idx"
                :d="paths[idx]"
                :fill="active ? activeColor : inactiveColor"
          />
        </svg>
      </div>

      <!-- Colon -->
      <div class="flex flex-col gap-1 sm:gap-1.5 opacity-60 px-0.5">
        <div class="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-[var(--color-brand)] rounded-full"></div>
        <div class="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-[var(--color-brand)] rounded-full"></div>
      </div>

      <!-- Minutes -->
      <div class="digit-box flex gap-0.5 sm:gap-1">
        <svg v-for="(v, i) in minutes.split('')" :key="'m'+i" viewBox="0 0 29 52" fill="none" class="digit-svg digit-minutes">
          <path v-for="(active, idx) in segmentMap[parseInt(v)]" :key="idx"
                :d="paths[idx]"
                :fill="active ? activeColor : inactiveColor"
          />
        </svg>
      </div>

      <!-- Optional Seconds for larger screens -->
      <template v-if="true">
        <div class="flex flex-col gap-1 opacity-30 hidden sm:flex px-0.5">
          <div class="w-0.5 h-0.5 bg-[var(--color-brand)] rounded-full"></div>
          <div class="w-0.5 h-0.5 bg-[var(--color-brand)] rounded-full"></div>
        </div>
        <div class="digit-box hidden sm:flex gap-0.5 transform scale-75 origin-left">
          <svg v-for="(v, i) in seconds.split('')" :key="'s'+i" width="18" height="32" viewBox="0 0 29 52" fill="none" class="digit-svg digit-seconds">
            <path v-for="(active, idx) in segmentMap[parseInt(v)]" :key="idx"
                  :d="paths[idx]"
                  :fill="active ? activeColor : inactiveColor"
            />
          </svg>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
const paths = [
  'M4.20248 3.49482C2.82797 2.27303 3.69218 0 5.53121 0H22.6867C24.5522 0 25.4019 2.32821 23.975 3.52982L23.5791 3.86316C23.2186 4.16681 22.7623 4.33333 22.2909 4.33333H5.90621C5.41638 4.33333 4.94359 4.15358 4.57748 3.82815L4.20248 3.49482Z',
  'M24.8497 4.25654C26.1428 3.12502 28.1667 4.04338 28.1667 5.76169L28.1667 21.8498C28.1667 23.4207 26.4388 24.3784 25.1067 23.5458L24.7734 23.3375C24.1886 22.972 23.8334 22.3311 23.8334 21.6415L23.8334 6.05336C23.8334 5.47663 24.0823 4.92798 24.5163 4.54821L24.8497 4.25654Z',
  'M25.1862 28.489C26.5194 27.7391 28.1667 28.7025 28.1667 30.2322L28.1667 46.6299C28.1667 48.4117 26.0124 49.3041 24.7525 48.0441L24.4191 47.7108C24.0441 47.3357 23.8334 46.827 23.8334 46.2966L23.8334 30.4197C23.8334 29.6971 24.2231 29.0308 24.8528 28.6765L25.1862 28.489Z',
  'M23.9259 48.6321C25.1234 49.9094 24.2177 52 22.4669 52L5.69978 52C3.9489 52 3.04321 49.9094 4.24071 48.6321L4.55321 48.2988C4.9313 47.8955 5.45947 47.6667 6.01228 47.6667L22.1544 47.6667C22.7072 47.6667 23.2353 47.8955 23.6134 48.2988L23.9259 48.6321Z',
  'M3.4564 47.7859C2.21509 49.1048 4.23823e-07 48.2263 6.6133e-07 46.4152L2.79423e-06 30.1501C3.00022e-06 28.5793 1.72791 27.6216 3.06 28.4541L3.39333 28.6625C3.9781 29.028 4.33334 29.6689 4.33334 30.3585L4.33333 46.061C4.33333 46.5705 4.13891 47.0607 3.78973 47.4317L3.4564 47.7859Z',
  'M3.06 23.5458C1.7279 24.3784 -8.31295e-08 23.4207 -1.47217e-07 21.8498L-8.06095e-07 5.69981C-8.77526e-07 3.94893 2.09055 3.04323 3.36788 4.24073L3.70121 4.55323C4.10452 4.93133 4.33333 5.45949 4.33333 6.01231L4.33333 21.6415C4.33333 22.3311 3.97809 22.972 3.39333 23.3375L3.06 23.5458Z',
  'M3.85122 24.13C4.16644 23.936 4.5293 23.8333 4.89942 23.8333H23.3022C23.6503 23.8333 23.9923 23.9242 24.2945 24.0969L24.5862 24.2635C25.9298 25.0313 25.9298 26.9687 24.5862 27.7365L24.2945 27.9032C23.9923 28.0758 23.6503 28.1667 23.3022 28.1667H4.89942C4.5293 28.1667 4.16644 28.064 3.85122 27.87L3.58039 27.7033C2.31131 26.9224 2.31132 25.0777 3.58039 24.2967L3.85122 24.13Z'
];
</script>

<style scoped>
.digit-svg {
  filter: drop-shadow(0 0 1px rgba(132, 201, 60, 0.2));
  transition: all 0.3s ease;
}

/* Default sizes for larger screens */
.digit-hours {
  width: 22px;
  height: 40px;
}

.digit-minutes {
  width: 22px;
  height: 40px;
}

.digit-seconds {
  width: 18px;
  height: 32px;
}

/* Tablet sizes */
@media (max-width: 1024px) {
  .digit-hours,
  .digit-minutes {
    width: 20px;
    height: 36px;
  }
}

/* Mobile sizes */
@media (max-width: 640px) {
  .digit-hours,
  .digit-minutes {
    width: 16px;
    height: 28px;
  }
}

/* Small mobile sizes */
@media (max-width: 380px) {
  .digit-hours,
  .digit-minutes {
    width: 14px;
    height: 24px;
  }
}
</style>
