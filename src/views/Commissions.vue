<template>
  <div class="page-content flex flex-col items-center w-full max-w-[1200px] mx-auto gap-8">
    
    <!-- Top Platforms & Invitations (Merged Row) -->
    <div class="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Commission Platforms -->
      <section class="commission-section anim-fade-in-up flex-1" style="animation-delay: 0.1s;">
        <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <i class="fas fa-store text-amethyst"></i> 约稿平台
        </h2>
        <div class="platform-grid grid grid-cols-2 gap-4 h-full">
          <a class="platform-card solid-card p-4 flex flex-col items-center justify-center gap-2 text-center decoration-none hover:scale-105 transition-transform h-32" href="https://b23.tv/YLg5WYo" target="_blank">
            <i class="fab fa-bilibili text-3xl mb-1 text-amethyst"></i>
            <h4 class="text-base font-semibold">Bilibili 工坊</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">点击跳转</p>
          </a>
          <div class="platform-card solid-card disabled p-4 flex flex-col items-center justify-center gap-2 text-center opacity-60 cursor-not-allowed h-32">
            <i class="fa-solid fa-palette text-3xl mb-1 text-amethyst"></i>
            <h4 class="text-base font-semibold">画加</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">暂未入驻</p>
          </div>
        </div>
      </section>

      <!-- Invitations -->
      <section class="commission-section anim-fade-in-up flex-1" style="animation-delay: 0.2s;">
        <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <i class="fas fa-envelope-open-text text-amethyst"></i> 向我发起邀请
        </h2>
        <div class="platform-grid grid grid-cols-2 gap-4 h-full">
          <a class="platform-card solid-card p-4 flex flex-col items-center justify-center gap-2 text-center decoration-none hover:scale-105 transition-transform h-32" href="https://b23.tv/YLg5WYo" target="_blank">
            <i class="fab fa-bilibili text-3xl mb-1 text-amethyst"></i>
            <h4 class="text-base font-semibold">B站私信</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">点击跳转</p>
          </a>
          <a class="platform-card solid-card p-4 flex flex-col items-center justify-center gap-2 text-center decoration-none hover:scale-105 transition-transform h-32" href="https://qm.qq.com/q/5jATjlQd4A" target="_blank">
            <i class="fab fa-qq text-3xl mb-1 text-amethyst"></i>
            <h4 class="text-base font-semibold">QQ群</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">687671385</p>
          </a>
        </div>
      </section>

      <!-- Payment -->
      <section class="commission-section anim-fade-in-up flex-1 flex flex-col" style="animation-delay: 0.3s;">
        <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <i class="fas fa-wallet text-amethyst"></i> 支付
        </h2>
        <div class="flex-grow flex items-center justify-center solid-card rounded-2xl p-6 border border-card-border h-32">
          <button @click="showPaymentModal = true" class="amethyst-dark-button py-2 px-6 rounded-full text-base transition-transform hover:scale-105 flex items-center gap-2">
            <i class="fas fa-qrcode"></i> 点击显示收款码
          </button>
        </div>
      </section>
    </div>

    <!-- Main Content: Pricing List -->
    <main class="right-content-area w-full flex flex-col items-center">
      <section class="commission-section w-full anim-fade-in-up" style="animation-delay: 0.4s;">
        <h2 class="text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3">
          <span class="w-12 h-1 bg-amethyst rounded-full"></span>
          报价单
          <span class="w-12 h-1 bg-amethyst rounded-full"></span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div v-for="(item, index) in priceList" :key="index" class="solid-card price-list-item flex flex-col items-center text-center p-6 rounded-2xl border border-card-border shadow-card hover:shadow-lg transition-shadow">
            
            <!-- Image Gallery -->
            <div class="commission-image-gallery w-full max-w-[300px] mb-4">
              <img 
                :src="getImageUrl(item.currentImage || item.images[0] || '')" 
                @click="openImageModal(getImageUrl(item.currentImage || item.images[0] || ''))"
                class="commission-main-image w-full h-[250px] object-cover rounded-lg border border-card-border mb-3 cursor-pointer transition-opacity duration-300"
                alt="Commission Example"
              >
              <div class="commission-thumbnails flex flex-wrap justify-center gap-2">
                <img 
                  v-for="(img, imgIndex) in item.images" 
                  :key="imgIndex"
                  :src="getImageUrl(img)"
                  @click="item.currentImage = img"
                  :class="['commission-thumbnail w-[50px] h-[50px] object-cover rounded-md border-2 cursor-pointer transition-all duration-200 opacity-70 hover:opacity-100 hover:scale-105 hover:border-amethyst', (item.currentImage === img || (!item.currentImage && imgIndex === 0)) ? 'active border-amethyst opacity-100 scale-105' : 'border-transparent']"
                  alt="Thumbnail"
                >
              </div>
            </div>

            <h3 class="text-2xl font-bold mb-2">{{ item.title }}</h3>
            <p class="text-amethyst font-bold text-xl mb-2">{{ item.price }}</p>
            <p class="text-gray-600 dark:text-gray-300 mb-2">{{ item.description }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-auto">{{ item.requirements }}</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Payment Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]" @click.self="showPaymentModal = false">
      <div class="solid-card p-8 relative max-w-sm w-full mx-4 rounded-2xl bg-card-bg shadow-2xl anim-fade-in-up active">
        <button @click="showPaymentModal = false" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">
          <i class="fas fa-times"></i>
        </button>
        <h3 class="text-2xl font-bold mb-6 text-center">我的收款码</h3>
        <div class="flex flex-col items-center gap-6">
          <div>
            <p class="text-lg font-semibold mb-2 text-center">微信支付</p>
            <img alt="WeChat Pay QR Code" class="w-48 h-48 border border-card-border rounded-lg" src="/img/wx.jpg">
          </div>
          <div>
            <p class="text-lg font-semibold mb-2 text-center">支付宝支付</p>
            <img alt="Alipay QR Code" class="w-48 h-48 border border-card-border rounded-lg" src="/img/zfb.jpg">
          </div>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[9999] transition-opacity duration-300" @click.self="closeImageModal">
      <div class="relative max-w-[90%] max-h-[90%] bg-card-bg p-2 rounded-2xl shadow-2xl">
        <button @click="closeImageModal" class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 z-10">
          <i class="fas fa-times"></i>
        </button>
        <img :src="modalImageUrl" class="block max-w-full max-h-[80vh] object-contain rounded-lg" alt="Enlarged Image">
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import commissionsData from '../data/commissions.json';

interface CommissionItem {
  title: string;
  images: string[];
  price: string;
  description: string;
  requirements: string;
  currentImage?: string; // Local state for gallery
}

const priceList = reactive<CommissionItem[]>(commissionsData.priceList.map(item => ({
  ...item,
  currentImage: item.images[0]
})));

const showPaymentModal = ref(false);
const showImageModal = ref(false);
const modalImageUrl = ref('');

const getImageUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : '/' + path;
};

const openImageModal = (url: string) => {
  modalImageUrl.value = url;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  modalImageUrl.value = '';
};

// Intersection Observer for animations
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.anim-fade-in-up').forEach(el => observer.observe(el));
});
</script>

<style scoped>
.text-amethyst {
  color: var(--amethyst-color);
}
.border-amethyst {
  border-color: var(--amethyst-color);
}

/* Reusing global styles, but ensuring scoped styles don't conflict */
.solid-card {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
}

.amethyst-dark-button {
  background-color: var(--amethyst-color);
  color: #fff; /* Assuming white text on button */
}
.amethyst-dark-button:hover {
  background-color: var(--amethyst-color-hover);
}

.anim-fade-in-up {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s ease-out, transform 0.7s ease-out;
}

.anim-fade-in-up.active {
  opacity: 1;
  transform: translateY(0);
}
</style>