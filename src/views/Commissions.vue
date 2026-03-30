<template>
  <div class="flex flex-col items-center w-full gap-8">

    <!-- Top Row: Platforms, Invitations, Payment -->
    <div class="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Commission Platforms -->
      <section class="anim-fade-in-up" style="animation-delay: 0.05s;">
        <h2 class="section-heading mb-4 text-lg">
          <i class="fas fa-store text-[var(--color-brand)]"></i>
          约稿平台
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <a
            class="card !p-4 flex flex-col items-center justify-center gap-2 text-center h-28"
            href="https://b23.tv/YLg5WYo"
            target="_blank"
          >
            <i class="fab fa-bilibili text-2xl text-[var(--color-brand)]"></i>
            <h4 class="text-sm font-semibold text-[var(--color-primary)]">Bilibili 工坊</h4>
            <p class="text-xs text-[var(--color-secondary)]">点击跳转</p>
          </a>
          <div class="card-flat !p-4 flex flex-col items-center justify-center gap-2 text-center opacity-50 cursor-not-allowed h-28">
            <i class="fa-solid fa-palette text-2xl text-[var(--color-brand)]"></i>
            <h4 class="text-sm font-semibold text-[var(--color-primary)]">画加</h4>
            <p class="text-xs text-[var(--color-secondary)]">暂未入驻</p>
          </div>
        </div>
      </section>

      <!-- Invitations -->
      <section class="anim-fade-in-up" style="animation-delay: 0.1s;">
        <h2 class="section-heading mb-4 text-lg">
          <i class="fas fa-envelope-open-text text-[var(--color-brand)]"></i>
          向我发起邀请
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <a
            class="card !p-4 flex flex-col items-center justify-center gap-2 text-center h-28"
            href="https://b23.tv/YLg5WYo"
            target="_blank"
          >
            <i class="fab fa-bilibili text-2xl text-[var(--color-brand)]"></i>
            <h4 class="text-sm font-semibold text-[var(--color-primary)]">B站私信</h4>
            <p class="text-xs text-[var(--color-secondary)]">点击跳转</p>
          </a>
          <a
            class="card !p-4 flex flex-col items-center justify-center gap-2 text-center h-28"
            href="https://qm.qq.com/q/5jATjlQd4A"
            target="_blank"
          >
            <i class="fab fa-qq text-2xl text-[var(--color-brand)]"></i>
            <h4 class="text-sm font-semibold text-[var(--color-primary)]">QQ群</h4>
            <p class="text-xs text-[var(--color-secondary)]">687671385</p>
          </a>
        </div>
      </section>

      <!-- Payment -->
      <section class="anim-fade-in-up flex flex-col" style="animation-delay: 0.15s;">
        <h2 class="section-heading mb-4 text-lg">
          <i class="fas fa-wallet text-[var(--color-brand)]"></i>
          支付
        </h2>
        <div class="card-flat flex-grow flex items-center justify-center">
          <button
            @click="showPaymentModal = true"
            class="btn-brand"
          >
            <i class="fas fa-qrcode"></i>
            <span>显示收款码</span>
          </button>
        </div>
      </section>
    </div>

    <!-- Pricing List -->
    <section class="w-full anim-fade-in-up" style="animation-delay: 0.2s;">
      <h3 class="section-heading justify-center mb-8 text-2xl">橱窗</h3>

      <div v-if="!isBusinessOpen" class="card-flat p-12 text-center max-w-2xl mx-auto">
        <div class="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-3xl mx-auto mb-6">
          <i class="fas fa-store-slash"></i>
        </div>
        <h4 class="text-xl font-bold text-[var(--color-primary)] mb-3">当前暂停营业</h4>
        <p class="text-[var(--color-secondary)] text-sm leading-relaxed">
          抱歉，目前暂时没有开启任何橱窗<br>
          请稍后再来查看，或通过上方联系方式了解最新动态
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto stagger-children">
        <div
          v-for="(item, index) in priceList"
          :key="index"
          class="card flex flex-col items-center text-center group overflow-hidden anim-fade-in-up"
        >
          <!-- Image Gallery -->
          <div class="w-full max-w-[280px] mb-4">
            <img
              :src="getImageUrl(item.currentImage || item.images[0] || '')"
              @click="openImageModal(getImageUrl(item.currentImage || item.images[0] || ''))"
              class="w-full h-[240px] object-cover rounded-2xl cursor-pointer transition-transform duration-500 group-hover:scale-[1.02]"
              alt="Commission Example"
            >
            <div class="flex flex-wrap justify-center gap-2 mt-3">
              <img
                v-for="(img, imgIndex) in item.images"
                :key="imgIndex"
                :src="getImageUrl(img)"
                @click="item.currentImage = img"
                class="w-11 h-11 object-cover rounded-lg cursor-pointer transition-all duration-200 border-2"
                :class="[
                  (item.currentImage === img || (!item.currentImage && imgIndex === 0))
                    ? 'border-[var(--color-brand)] opacity-100 scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                ]"
                alt="Thumbnail"
              >
            </div>
          </div>

          <h4 class="text-xl font-bold text-[var(--color-primary)] mb-2">{{ item.title }}</h4>
          <p class="text-brand-gradient font-bold text-lg mb-2">{{ item.price }}</p>
          <p class="text-sm text-[var(--color-secondary)] mb-2 leading-relaxed">{{ item.description }}</p>
          <p class="text-xs text-[var(--color-secondary)] mt-auto opacity-60">{{ item.requirements }}</p>
        </div>
      </div>
    </section>

    <!-- Payment Modal -->
    <Teleport to="body">
      <div
        v-if="showPaymentModal"
        class="fixed inset-0 bg-black/40 backdrop-blur-lg flex justify-center items-center z-[1000] transition-opacity"
        @click.self="showPaymentModal = false"
      >
        <div class="card !bg-[var(--color-card-solid)] relative max-w-sm w-full mx-4 anim-fade-in-up active">
          <button @click="showPaymentModal = false" class="absolute top-5 right-5 text-[var(--color-secondary)] hover:text-[var(--color-primary)] text-xl transition-colors">
            <i class="fas fa-times"></i>
          </button>
          <h3 class="text-xl font-bold mb-6 text-center text-[var(--color-primary)]">我的收款码</h3>
          <div class="flex flex-col items-center gap-6">
            <div class="text-center">
              <p class="text-sm font-semibold mb-2 text-[var(--color-primary)]">微信支付</p>
              <img alt="WeChat Pay" class="w-44 h-44 rounded-2xl border border-white" src="/img/wx.jpg">
            </div>
            <div class="text-center">
              <p class="text-sm font-semibold mb-2 text-[var(--color-primary)]">支付宝支付</p>
              <img alt="Alipay" class="w-44 h-44 rounded-2xl border border-white" src="/img/zfb.jpg">
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Image Modal -->
    <Teleport to="body">
      <div
        v-if="showImageModal"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[9999] transition-opacity"
        @click.self="closeImageModal"
      >
        <div class="relative max-w-[90%] max-h-[90%]">
          <button @click="closeImageModal" class="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-lg text-[var(--color-primary)] hover:bg-[var(--color-brand)] hover:text-white transition-colors z-10">
            <i class="fas fa-times text-sm"></i>
          </button>
          <img :src="modalImageUrl" class="block max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" alt="Enlarged">
        </div>
      </div>
    </Teleport>
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
  currentImage?: string;
}

const isBusinessOpen = ref(commissionsData.isBusinessOpen !== undefined ? commissionsData.isBusinessOpen : true);
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