<template>
  <div class="flex flex-col items-center w-full gap-12 font-sans">

    <!-- Top Row: Platforms, Invitations, Payment -->
    <div class="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Commission Platforms -->
      <section class="reveal is-visible" style="animation-delay: 0.05s;">
        <h2 class="section-heading mb-4 text-lg font-sans font-bold">
          <i class="fas fa-store text-[var(--color-brand)]"></i>
          > GUILD_PLATFORMS
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <a
            class="premium-card !p-4 flex flex-col items-center justify-center gap-2 text-center h-28 hover:shadow-md"
            href="https://b23.tv/YLg5WYo"
            target="_blank"
          >
            <i class="fab fa-bilibili text-3xl text-[var(--color-brand)]"></i>
            <h4 class="text-xs font-bold text-[var(--color-primary)]">Bili工坊</h4>
            <p class="text-[9px] opacity-60">ESTABLISH.EXE</p>
          </a>
          <div class="premium-card !p-4 flex flex-col items-center justify-center gap-2 text-center opacity-40 cursor-not-allowed h-28">
            <i class="fa-solid fa-palette text-3xl text-[var(--color-text)]"></i>
            <h4 class="text-xs font-bold text-[var(--color-primary)]">画加</h4>
            <p class="text-[9px] opacity-60">LOCKED</p>
          </div>
        </div>
      </section>

      <!-- Invitations -->
      <section class="reveal is-visible" style="animation-delay: 0.1s;">
        <h2 class="section-heading mb-4 text-lg font-sans font-bold">
          <i class="fas fa-envelope-open-text text-[var(--color-brand)]"></i>
          > SUBMIT_QUEST
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <a
            class="premium-card !p-4 flex flex-col items-center justify-center gap-2 text-center h-28 hover:shadow-md"
            href="https://b23.tv/YLg5WYo"
            target="_blank"
          >
            <i class="fab fa-bilibili text-3xl text-[var(--color-brand)]"></i>
            <h4 class="text-xs font-bold text-[var(--color-primary)]">B站私信</h4>
            <p class="text-[9px] opacity-60">ESTABLISH.EXE</p>
          </a>
          <a
            class="premium-card !p-4 flex flex-col items-center justify-center gap-2 text-center h-28 hover:shadow-md"
            href="https://qm.qq.com/q/5jATjlQd4A"
            target="_blank"
          >
            <i class="fab fa-qq text-3xl text-[var(--color-brand)]"></i>
            <h4 class="text-xs font-bold text-[var(--color-primary)]">QQ群</h4>
            <p class="text-[9px] opacity-60">687671385</p>
          </a>
        </div>
      </section>

      <!-- Payment -->
      <section class="reveal is-visible flex flex-col" style="animation-delay: 0.15s;">
        <h2 class="section-heading mb-4 text-lg font-sans font-bold">
          <i class="fas fa-wallet text-[var(--color-brand)]"></i>
          > TRANSACTION_DECK
        </h2>
        <div class="premium-card flex-grow flex items-center justify-center p-4">
          <button
            @click="showPaymentModal = true"
            class="premium-btn !px-4 !py-2"
          >
            <i class="fas fa-qrcode"></i>
            <span>[ SCAN_QRCODE.SYS ]</span>
          </button>
        </div>
      </section>
    </div>

    <!-- Pricing List -->
    <section class="w-full reveal is-visible" style="animation-delay: 0.2s;">
      <h3 class="section-heading justify-center mb-8 text-2xl font-sans">> QUEST_WINDOW</h3>

      <div v-if="!isBusinessOpen" class="premium-card p-12 text-center max-w-2xl mx-auto">
        <div class="w-20 h-20 bg-red-500/10 text-red-500 flex items-center justify-center text-3xl mx-auto mb-6 border-4 border-red-500 rounded relative">
          <i class="fas fa-store-slash"></i>
        </div>
        <h4 class="text-xl font-bold text-[var(--color-primary)] mb-3 font-sans">SHOP CURRENTLY CLOSED</h4>
        <p class="text-[var(--color-secondary)] text-xs leading-relaxed font-sans font-medium">
          抱歉，目前暂时没有开启任何约稿橱窗哦 // OUT OF STOCK<br>
          请稍后再来查看，或通过上方联系方式向我发起委托
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto stagger-children">
        <div
          v-for="(item, index) in priceList"
          :key="index"
          class="premium-card flex flex-col items-center text-center group overflow-hidden reveal is-visible relative"
        >
          <!-- Shutter top visual decoration -->
          <div class="w-full flex justify-between items-center text-[8px] font-mono opacity-50 border-b border-[var(--color-text)] pb-2 mb-4">
            <span>QUEST // ITEM-0{{ index + 1 }}</span>
            <span class="text-[var(--color-brand)]">ACTIVE</span>
          </div>

          <!-- Image Gallery -->
          <div class="w-full max-w-[280px] mb-4 relative">
            <img
              :src="getImageUrl(item.currentImage || item.images[0] || '')"
              @click="openImageModal(getImageUrl(item.currentImage || item.images[0] || ''))"
              class="w-full h-[240px] object-cover rounded border-4 border-[var(--color-text)] cursor-pointer transition-all duration-300 group-hover:scale-[1.02]"
              alt="Commission Example"
            >
            <div class="flex flex-wrap justify-center gap-2 mt-3">
              <img
                v-for="(img, imgIndex) in item.images"
                :key="imgIndex"
                :src="getImageUrl(img)"
                @click="item.currentImage = img"
                class="w-10 h-10 object-cover rounded cursor-pointer transition-all duration-200 border-2"
                :class="[
                  (item.currentImage === img || (!item.currentImage && imgIndex === 0))
                    ? 'border-[var(--color-brand)] opacity-100 scale-105'
                    : 'border-[var(--color-text)] opacity-50 hover:opacity-100 hover:scale-105'
                ]"
                alt="Thumbnail"
              >
            </div>
          </div>

          <h4 class="text-xl font-bold text-[var(--color-primary)] mb-2 font-sans">> {{ item.title }}</h4>
          <p class=" font-bold text-lg mb-2 text-[var(--color-brand)]">{{ item.price }}</p>
          <p class="text-xs text-[var(--color-secondary)] mb-4 leading-relaxed font-sans font-medium">{{ item.description }}</p>
          <p class="text-[10px] text-[var(--color-text-dim)] mt-auto opacity-70 border-t border-dashed border-[var(--color-text)] w-full pt-3 font-sans">REQ: {{ item.requirements }}</p>
        </div>
      </div>
    </section>

    <!-- Payment Modal -->
    <Teleport to="body">
      <div
        v-if="showPaymentModal"
        class="fixed inset-0 bg-black/70 backdrop-blur-lg flex justify-center items-center z-[1000] transition-opacity"
        @click.self="showPaymentModal = false"
      >
        <div class="premium-card !p-6 bg-[var(--color-card-solid)] relative max-w-sm w-full mx-4 reveal is-visible active">
          <button @click="showPaymentModal = false" class="absolute top-4 right-4 text-[var(--color-secondary)] hover:text-[var(--color-primary)] text-xl transition-colors">
            <i class="fas fa-times"></i>
          </button>
          <h3 class="text-lg font-bold mb-6 text-center text-[var(--color-primary)] font-sans">> CHOOSE_TRANSACTION</h3>
          <div class="flex flex-col items-center gap-6 font-sans">
            <div class="text-center">
              <p class="text-xs font-bold mb-2 text-[var(--color-primary)]">微信支付 // WECHAT</p>
              <img alt="WeChat Pay" class="w-40 h-40 border-4 border-[var(--color-text)] rounded" src="/img/wx.jpg">
            </div>
            <div class="text-center">
              <p class="text-xs font-bold mb-2 text-[var(--color-primary)]">支付宝支付 // ALIPAY</p>
              <img alt="Alipay" class="w-40 h-40 border-4 border-[var(--color-text)] rounded" src="/img/zfb.jpg">
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Image Modal -->
    <Teleport to="body">
      <div
        v-if="showImageModal"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[9999] transition-opacity"
        @click.self="closeImageModal"
      >
        <div class="relative max-w-[90%] max-h-[90%]">
          <button @click="closeImageModal" class="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-white rounded border-2 border-black shadow-lg text-[var(--color-primary)] hover:bg-[var(--color-brand)] hover:text-white transition-colors z-10">
            <i class="fas fa-times text-sm"></i>
          </button>
          <img :src="modalImageUrl" class="block max-w-full max-h-[85vh] object-contain rounded border-4 border-black shadow-2xl" alt="Enlarged">
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

  document.querySelectorAll('.reveal is-visible').forEach(el => observer.observe(el));
});
</script>