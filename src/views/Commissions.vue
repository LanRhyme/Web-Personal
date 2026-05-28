<template>
  <div class="flex flex-col items-center w-full gap-16 font-sans max-w-[1400px] mx-auto px-4 md:px-12 py-8">

    <div class="w-full border-b border-[var(--color-border)] pb-4 mb-4 relative">
      <div class="absolute -top-6 -left-4 font-art text-[80px] leading-none opacity-5 text-[var(--color-text)] pointer-events-none z-[-1] tracking-tighter whitespace-nowrap overflow-hidden">REQUEST</div>
      <h2 class="text-3xl font-art tracking-widest text-[var(--color-text)] uppercase">> COMMISSION_BOARD</h2>
    </div>

    <!-- Top Row: Platforms, Invitations, Payment -->
    <div class="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Commission Platforms -->
      <section class="reveal is-visible relative" style="animation-delay: 0.05s;">
        <div class="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[var(--color-brand)] opacity-50"></div>
        <h2 class="section-heading mb-6 text-xl font-sans font-bold tracking-wider flex items-center gap-3">
          <span class="w-2 h-2 bg-[var(--color-brand)] animate-pulse block"></span>
          GUILD_PLATFORMS
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <a
            class="cyber-glass !p-5 flex flex-col items-center justify-center gap-3 text-center py-6 hover:-translate-y-1 transition-all duration-300 group"
            href="https://b23.tv/YLg5WYo"
            target="_blank"
          >
            <i class="fab fa-bilibili text-4xl text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors"></i>
            <h4 class="text-sm font-bold text-[var(--color-primary)] tracking-wide">Bili工坊</h4>
            <p class="text-[10px] font-mono text-[var(--color-brand)] opacity-80">> ESTABLISH.EXE</p>
          </a>
          <div class="cyber-glass !p-5 flex flex-col items-center justify-center gap-3 text-center opacity-30 cursor-not-allowed py-6 relative overflow-hidden">
            <div class="absolute inset-0 bg-black/50 z-10"></div>
            <i class="fa-solid fa-palette text-4xl text-[var(--color-text)] relative z-0"></i>
            <h4 class="text-sm font-bold text-[var(--color-primary)] tracking-wide relative z-0">画加</h4>
            <p class="text-[10px] font-mono text-red-400 relative z-0">[ LOCKED ]</p>
          </div>
        </div>
      </section>

      <!-- Invitations -->
      <section class="reveal is-visible relative" style="animation-delay: 0.1s;">
        <div class="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[var(--color-brand)] opacity-50"></div>
        <h2 class="section-heading mb-6 text-xl font-sans font-bold tracking-wider flex items-center gap-3">
          <span class="w-2 h-2 bg-[var(--color-brand)] animate-pulse block" style="animation-delay: 0.2s"></span>
          SUBMIT_QUEST
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <a
            class="cyber-glass !p-5 flex flex-col items-center justify-center gap-3 text-center py-6 hover:-translate-y-1 transition-all duration-300 group"
            href="https://message.bilibili.com/"
            target="_blank"
          >
            <i class="fas fa-envelope text-4xl text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors"></i>
            <h4 class="text-sm font-bold text-[var(--color-primary)] tracking-wide">B站私信</h4>
            <p class="text-[10px] font-mono text-[var(--color-brand)] opacity-80">> CONNECT</p>
          </a>
          <a
            class="cyber-glass !p-5 flex flex-col items-center justify-center gap-3 text-center py-6 hover:-translate-y-1 transition-all duration-300 group"
            href="https://qm.qq.com/q/5jATjlQd4A"
            target="_blank"
          >
            <i class="fab fa-qq text-4xl text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors"></i>
            <h4 class="text-sm font-bold text-[var(--color-primary)] tracking-wide">QQ群</h4>
            <p class="text-[10px] font-mono text-[var(--color-brand)] opacity-80">> 687671385</p>
          </a>
        </div>
      </section>

      <!-- Payment -->
      <section class="reveal is-visible flex flex-col relative" style="animation-delay: 0.15s;">
        <div class="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[var(--color-brand)] opacity-50"></div>
        <h2 class="section-heading mb-6 text-xl font-sans font-bold tracking-wider flex items-center gap-3">
          <span class="w-2 h-2 bg-[var(--color-brand)] animate-pulse block" style="animation-delay: 0.4s"></span>
          TRANSACTION_DECK
        </h2>
        <div class="cyber-glass flex-grow flex items-center justify-center p-6 relative overflow-hidden group">
          <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMCIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+')] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-500"></div>
          <button
            @click="showPaymentModal = true"
            class="btn-terminal !px-6 !py-3 !text-sm relative z-10 w-full md:w-auto text-center justify-center bg-[var(--color-bg)]"
          >
            <i class="fas fa-qrcode mr-2"></i>
            <span>[ SCAN_QRCODE.SYS ]</span>
          </button>
        </div>
      </section>
    </div>

    <!-- Pricing List -->
    <section class="w-full reveal is-visible mt-8" style="animation-delay: 0.2s;">
      <div class="flex items-center gap-4 mb-10">
        <h3 class="text-3xl font-art text-[var(--color-text)] tracking-widest uppercase m-0">> QUEST_WINDOW</h3>
        <div class="flex-grow h-[1px] bg-[var(--color-border)] opacity-50"></div>
        <span class="font-mono text-[var(--color-brand)] text-xs border border-[var(--color-brand)] px-2 py-1 bg-[var(--color-brand)]/10">ARCHIVE_ACCESS</span>
      </div>

      <div v-if="!isBusinessOpen" class="cyber-glass p-16 text-center max-w-3xl mx-auto border-t-4 border-t-[var(--color-brand)] relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand)] opacity-5 blur-[100px] pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 bg-[var(--color-brand)] opacity-5 blur-[100px] pointer-events-none"></div>
        <div class="w-24 h-24 text-[var(--color-brand)] flex items-center justify-center text-4xl mx-auto mb-8 border border-[var(--color-brand)]/30 rounded relative bg-[var(--color-brand)]/5 shadow-[0_0_20px_rgba(107,143,114,0.1)]">
          <div class="absolute inset-0 border border-[var(--color-brand)]/50 scale-110 opacity-30 animate-ping"></div>
          <i class="fas fa-store-slash"></i>
        </div>
        <h4 class="text-2xl font-art text-[var(--color-text)] mb-4 tracking-widest">SHOP CURRENTLY CLOSED</h4>
        <div class="w-12 h-1 bg-[var(--color-brand)] mx-auto mb-6 opacity-50"></div>
        <p class="text-[var(--color-text-dim)] text-sm leading-relaxed font-mono">
          > 抱歉，目前暂时没有开启任何约稿橱窗哦 // OUT OF STOCK<br>
          > 请稍后再来查看，或通过上方联系方式向我发起委托
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div
          v-for="(item, index) in priceList"
          :key="index"
          class="cyber-glass group overflow-hidden flex flex-col h-full !p-0 reveal is-visible transition-all duration-500 hover:border-[var(--color-brand)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.8),_inset_0_0_15px_rgba(107,143,114,0.1)] hover:-translate-y-2 relative"
        >
          <!-- Top Image Area -->
          <div class="aspect-video w-full overflow-hidden relative bg-[var(--color-bg)] flex items-center justify-center border-b border-[var(--color-border)]">
            <!-- Shutter CSS graphic -->
            <div class="absolute top-3 left-3 w-16 h-10 bg-[var(--color-bg)] border border-[var(--color-border)] flex justify-between p-1.5 opacity-80 z-20 shadow-lg">
              <div class="w-2 h-full bg-[var(--color-text)] opacity-30"></div>
              <div class="w-[3px] h-full bg-[var(--color-text)] opacity-30"></div>
            </div>
            <!-- Status Tab -->
            <div class="absolute top-0 right-6 px-3 h-7 bg-[var(--color-brand)] flex items-center justify-center text-[10px] text-black font-bold font-mono tracking-widest z-20">
              [ACTIVE]
            </div>

            <img
              :src="getImageUrl(item.currentImage || item.images[0] || '')"
              @click="openImageModal(getImageUrl(item.currentImage || item.images[0] || ''))"
              class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 filter brightness-75 group-hover:brightness-100 cursor-pointer z-10"
              alt="Commission Reference"
            >
            
            <div class="absolute bottom-3 right-3 z-20 flex gap-2" v-if="item.images && item.images.length > 1">
              <img
                v-for="(img, imgIndex) in item.images"
                :key="imgIndex"
                :src="getImageUrl(img)"
                @click="item.currentImage = img"
                class="w-10 h-10 object-cover cursor-pointer border-2 filter grayscale hover:grayscale-0 transition-all duration-300"
                :class="[
                  (item.currentImage === img || (!item.currentImage && imgIndex === 0))
                    ? 'border-[var(--color-brand)] grayscale-0 opacity-100 shadow-[0_0_10px_rgba(107,143,114,0.5)]'
                    : 'border-[var(--color-border)] opacity-60 hover:opacity-100'
                ]"
                alt="Thumbnail"
              >
            </div>
          </div>

          <!-- Bottom Text Area -->
          <div class="p-8 flex flex-col flex-grow relative bg-[var(--color-card)]">
            <!-- Sticker Grid background effect -->
            <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMCIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+')] opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-500"></div>

            <div class="flex justify-between items-start mb-4 relative z-10">
              <h3 class="text-2xl font-art tracking-wide text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors flex items-center gap-3">
                > {{ item.title.toUpperCase() }}
                <span class="opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 font-mono text-[12px] text-[var(--color-brand)] animate-pulse">_</span>
              </h3>
              <span class="font-mono text-lg tracking-widest text-[var(--color-brand)] border-b border-[var(--color-brand)]/30 pb-1">
                [{{ item.price }}]
              </span>
            </div>

            <p class="text-[14px] text-[var(--color-text-dim)] mb-8 flex-grow leading-relaxed font-sans relative z-10">{{ item.description }}</p>

            <div class="mt-auto relative z-10 pt-5 border-t border-[var(--color-border)]">
              <div class="absolute -top-[1px] left-0 w-8 h-[1px] bg-[var(--color-brand)]"></div>
              <span class="text-[11px] font-mono tracking-widest text-[var(--color-brand)] block mb-2">> SYS.REQ:</span>
              <p class="text-[12px] text-[var(--color-text-dim)] font-mono opacity-80">{{ item.requirements }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Payment Modal -->
    <Teleport to="body">
      <div
        v-if="showPaymentModal"
        class="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[1000] transition-opacity"
        @click.self="showPaymentModal = false"
      >
        <div class="cyber-glass !p-8 bg-[var(--color-bg)] relative max-w-md w-full mx-4 reveal is-visible active border-t-4 border-t-[var(--color-brand)]">
          <button @click="showPaymentModal = false" class="absolute top-4 right-4 text-[var(--color-text-dim)] hover:text-[var(--color-brand)] text-2xl transition-colors">
            <i class="fas fa-times"></i>
          </button>
          <h3 class="text-xl font-art tracking-widest mb-8 text-center text-[var(--color-text)] uppercase flex items-center justify-center gap-3">
             <span class="w-8 h-[1px] bg-[var(--color-brand)]"></span>
             CHOOSE_TRANSACTION
             <span class="w-8 h-[1px] bg-[var(--color-brand)]"></span>
          </h3>
          <div class="grid grid-cols-2 gap-6 font-sans">
            <div class="text-center group">
              <p class="text-xs font-mono font-bold mb-3 text-[var(--color-text-dim)] group-hover:text-[var(--color-brand)] transition-colors">> WECHAT</p>
              <div class="p-2 border border-[var(--color-border)] group-hover:border-[var(--color-brand)] transition-colors bg-white">
                 <img alt="WeChat Pay" class="w-full h-auto" src="/img/wx.jpg">
              </div>
            </div>
            <div class="text-center group">
              <p class="text-xs font-mono font-bold mb-3 text-[var(--color-text-dim)] group-hover:text-[var(--color-brand)] transition-colors">> ALIPAY</p>
              <div class="p-2 border border-[var(--color-border)] group-hover:border-[var(--color-brand)] transition-colors bg-white">
                 <img alt="Alipay" class="w-full h-auto" src="/img/zfb.jpg">
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Image Modal -->
    <Teleport to="body">
      <div
        v-if="showImageModal"
        class="fixed inset-0 bg-black/90 backdrop-blur-lg flex justify-center items-center z-[9999] transition-opacity"
        @click.self="closeImageModal"
      >
        <div class="relative max-w-[95%] max-h-[95%]">
          <button @click="closeImageModal" class="absolute -top-5 -right-5 w-10 h-10 flex items-center justify-center bg-[var(--color-bg)] rounded-sm border border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-black transition-colors z-10 cursor-pointer shadow-[0_0_15px_rgba(107,143,114,0.3)]">
            <i class="fas fa-times text-lg"></i>
          </button>
          <img :src="modalImageUrl" class="block max-w-full max-h-[90vh] object-contain border border-[var(--color-border)] shadow-[0_0_50px_rgba(0,0,0,1)]" alt="Enlarged">
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