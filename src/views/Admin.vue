<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import pinnedItemsData from '../data/pinned-items.json';
import projectsData from '../data/projects.json';
import commissionsData from '../data/commissions.json';
import worksData from '../data/works.json';
import worksSectionData from '../data/works_section.json';
import { getGitHubConfig, saveGitHubConfig, updateFile } from '../services/github';

// Authentication
const isAuthenticated = ref(false);
const password = ref('');
const loginError = ref(false);
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin888';

// GitHub Config
const showSettings = ref(false);
const githubConfig = ref({
  token: import.meta.env.VITE_GITHUB_TOKEN || '',
  owner: import.meta.env.VITE_GITHUB_OWNER || '',
  repo: import.meta.env.VITE_GITHUB_REPO || '',
  branch: 'main'
});
const isGithubConfigured = computed(() => !!githubConfig.value.token && !!githubConfig.value.owner && !!githubConfig.value.repo);

const checkAuth = () => {
  if (password.value === adminPassword) {
    isAuthenticated.value = true;
    localStorage.setItem('isAdminAuthenticated', 'true');
    loginError.value = false;
  } else {
    loginError.value = true;
  }
};

const logout = () => {
  isAuthenticated.value = false;
  localStorage.removeItem('isAdminAuthenticated');
  password.value = '';
};

onMounted(() => {
  if (localStorage.getItem('isAdminAuthenticated') === 'true') {
    isAuthenticated.value = true;
  }
  const savedConfig = getGitHubConfig();
  if (savedConfig) {
    githubConfig.value = savedConfig;
  }
});

const saveSettings = () => {
  saveGitHubConfig(githubConfig.value);
  showSettings.value = false;
  alert('Settings saved!');
};

// Upload Logic
const isUploading = ref(false);
const uploadImage = async (file: File, folder: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${folder}/${Date.now()}-${safeName}`;
      
      // If GitHub is configured, upload to GitHub directly
      if (isGithubConfigured.value) {
        try {
            isUploading.value = true;
            const content = base64.replace(/^data:image\/\w+;base64,/, "");
            const path = `public/${filename}`;
            await updateFile(path, content, `Upload ${filename}`, githubConfig.value, true);
            // Return root relative path for usage in app
            resolve(`/${filename}`);
        } catch (e) {
            console.error(e);
            reject('GitHub Upload Failed: ' + e);
        } finally {
            isUploading.value = false;
        }
      } else {
        // Fallback to local dev server
        try {
            isUploading.value = true;
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filepath: filename, content: base64 })
            });
            
            if (res.ok) {
                const json = await res.json();
                resolve(json.path);
            } else {
                reject('Upload failed on server');
            }
        } catch (e) {
            reject(e);
        } finally {
            isUploading.value = false;
        }
      }
    };
    reader.readAsDataURL(file);
  });
};

const handleFileUpload = async (event: Event, item: any, key: string, folder: string) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  
  try {
    const path = await uploadImage(file, folder);
    item[key] = path;
  } catch (e) {
    alert('Upload failed: ' + e);
    console.error(e);
  } finally {
    input.value = ''; 
  }
};

// Tabs
const activeTab = ref('pinned');
const tabs = [
  { id: 'pinned', name: 'Home Pinned', icon: 'fa-thumbtack', desc: 'Featured items on homepage', file: 'pinned-items.json' },
  { id: 'projects', name: 'Projects', icon: 'fa-code', desc: 'Showcase of your code', file: 'projects.json' },
  { id: 'commissions', name: 'Commissions', icon: 'fa-pencil-alt', desc: 'Pricing and services', file: 'commissions.json' },
  { id: 'works', name: 'Gallery', icon: 'fa-image', desc: 'Artworks and images', file: 'works.json' },
  { id: 'works_section', name: 'Collections', icon: 'fa-folder-open', desc: 'Grouped works', file: 'works_section.json' }
];

const currentTabInfo = computed(() => tabs.find(t => t.id === activeTab.value));

// Data State
const pinnedItems = ref([...pinnedItemsData]);
const projects = ref([...projectsData]);
const commissions = ref([...commissionsData.priceList]);
const works = ref([...worksData]);
const worksSections = ref([...worksSectionData]);

const getCurrentData = () => {
    switch (activeTab.value) {
        case 'pinned': return pinnedItems.value;
        case 'projects': return projects.value;
        case 'commissions': return { priceList: commissions.value }; // Match structure
        case 'works': return works.value;
        case 'works_section': return worksSections.value;
        default: return [];
    }
};

// Actions
const isPublishing = ref(false);

const publishChanges = async () => {
    if (!isGithubConfigured.value) {
        alert('Please configure GitHub settings first!');
        showSettings.value = true;
        return;
    }
    
    if (!confirm('Are you sure you want to publish changes to the live site? This will trigger a deployment.')) return;

    try {
        isPublishing.value = true;
        const filename = currentTabInfo.value?.file;
        if (!filename) throw new Error('Unknown file for current tab');
        
        const content = JSON.stringify(getCurrentData(), null, 2);
        const path = `src/data/${filename}`;
        
        await updateFile(path, content, `Update ${filename} via Admin Panel`, githubConfig.value);
        
        alert('Successfully published! Netlify should be rebuilding your site now.');
    } catch (e) {
        console.error(e);
        alert('Failed to publish: ' + e);
    } finally {
        isPublishing.value = false;
    }
};

// Helper to copy JSON (Legacy)
const copyJson = () => {
  const data = getCurrentData();
  const filename = currentTabInfo.value?.file || 'data.json';
  const jsonStr = JSON.stringify(data, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    alert(`JSON copied! Please paste it into src/data/${filename}`);
  }).catch(err => {
    console.error('Failed to copy: ', err);
    alert('Failed to copy JSON.');
  });
};

// --- CRUD Actions ---
const addPinnedItem = () => pinnedItems.value.push({ title: 'New Item', description: 'Description', link: '' });
const removePinnedItem = (index: number) => pinnedItems.value.splice(index, 1);

const addProject = () => projects.value.push({ image: '', title: 'New Project', description: 'Description', tags: [], live_url: '', source_url: '' });
const removeProject = (index: number) => projects.value.splice(index, 1);
const updateProjectTags = (index: number, tagsStr: string) => {
    const project = projects.value[index];
    if (project) {
        project.tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
    }
};

const addCommission = () => commissions.value.push({ title: 'New Commission', images: [], price: '¥ 0', description: 'Description', requirements: 'Requirements' });
const removeCommission = (index: number) => commissions.value.splice(index, 1);
const updateCommissionImages = (index: number, imagesStr: string) => {
    const commission = commissions.value[index];
    if (commission) {
        commission.images = imagesStr.split('\n').map(t => t.trim()).filter(t => t);
    }
};

const addWork = () => works.value.unshift({ id: `work-${Date.now()}`, image: '', title: '', description: 'New Work' });
const removeWork = (index: number) => works.value.splice(index, 1);

const addWorksSection = () => worksSections.value.push({ id: `section-${Date.now()}`, title: 'New Collection', description: 'Description', thumbnail: '', work_ids: [] });
const removeWorksSection = (index: number) => worksSections.value.splice(index, 1);
const toggleWorkInSection = (sectionIndex: number, workId: string) => {
  const section = worksSections.value[sectionIndex];
  if (!section) return; // Guard clause
  const idx = section.work_ids.indexOf(workId);
  if (idx === -1) section.work_ids.push(workId);
  else section.work_ids.splice(idx, 1);
};

const editingSectionId = ref<string | null>(null);
const toggleSectionEdit = (id: string) => {
    editingSectionId.value = editingSectionId.value === id ? null : id;
};

const quickAddWorkToSection = async (event: Event, sectionIndex: number) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const section = worksSections.value[sectionIndex];
    if (!section) {
        alert('Section not found');
        return;
    }

    try {
        const path = await uploadImage(file, 'img-works');
        const newWork = {
            id: `work-${Date.now()}`,
            image: path,
            title: '',
            description: 'Uploaded via Collection'
        };
        works.value.unshift(newWork);
        section.work_ids.push(newWork.id);
        
        // Alert minimal feedback
        // alert('Work uploaded and added to collection!');
    } catch (e) {
        alert('Upload failed: ' + e);
    } finally {
        input.value = '';
    }
};

// Image Path Resolver
const resolveImg = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return path.startsWith('/') ? path : '/' + path;
};
</script>

<template>
  <div class="min-h-screen w-full flex overflow-hidden font-sans text-[var(--text-primary)]">
    
    <!-- Settings Modal -->
    <transition name="fade">
        <div v-if="showSettings" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div class="glass-panel p-8 rounded-2xl w-full max-w-md relative">
                <button @click="showSettings = false" class="absolute top-4 right-4 text-gray-400 hover:text-red-500"><i class="fa fa-times"></i></button>
                <h3 class="text-xl font-bold mb-6">Cloud Configuration</h3>
                <div class="space-y-4">
                    <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-200 mb-4">
                        <i class="fas fa-info-circle mr-2"></i>
                        For live websites (Netlify), use this GitHub configuration to manage content. The local upload server is disabled in production.
                    </div>
                    <div class="input-group">
                        <label>GitHub Personal Access Token</label>
                        <input v-model="githubConfig.token" type="password" class="modern-input" placeholder="ghp_..." />
                        <p class="text-[10px] text-gray-400 mt-1">Requires 'repo' or 'public_repo' scope.</p>
                    </div>
                    <div class="input-group">
                        <label>Repository Owner</label>
                        <input v-model="githubConfig.owner" class="modern-input" placeholder="Username or Org" />
                    </div>
                    <div class="input-group">
                        <label>Repository Name</label>
                        <input v-model="githubConfig.repo" class="modern-input" placeholder="Repo Name" />
                    </div>
                    <div class="input-group">
                        <label>Branch</label>
                        <input v-model="githubConfig.branch" class="modern-input" placeholder="main" />
                    </div>
                    <button @click="saveSettings" class="btn-primary w-full py-3 rounded-xl font-bold mt-4">
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    </transition>

    <!-- Auth Check -->
    <transition name="fade" mode="out-in">
      <div v-if="isAuthenticated" class="flex w-full h-screen">
        
        <!-- Sidebar -->
        <aside class="glass-sidebar w-20 lg:w-72 flex-shrink-0 flex flex-col z-20 transition-all duration-300 border-r border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl">
          <!-- Logo Area -->
          <div class="p-6 flex items-center justify-center lg:justify-start">
             <div class="w-10 h-10 rounded-xl bg-[var(--amethyst-color)] text-white flex items-center justify-center text-lg shadow-lg shadow-[var(--amethyst-color)]/30 flex-shrink-0">
                <i class="fa fa-cube"></i>
             </div>
             <div class="ml-3 hidden lg:block">
                <h1 class="text-xl font-bold tracking-tight">Admin<span class="text-[var(--amethyst-color)]">Panel</span></h1>
                <p class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Dashboard</p>
             </div>
          </div>
          
          <!-- Navigation -->
          <nav class="flex-grow space-y-2 overflow-y-auto px-4 py-6 custom-scrollbar">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="group w-full p-3 rounded-xl transition-all duration-300 flex items-center relative overflow-hidden border border-transparent"
              :class="activeTab === tab.id 
                ? 'bg-[var(--highlight-bg)] text-[var(--amethyst-color)] border-[var(--amethyst-color)]/10' 
                : 'hover:bg-[var(--bg-primary)] text-gray-500 hover:text-[var(--text-primary)]'"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-lg lg:mr-3 transition-all duration-300 flex-shrink-0"
                   :class="activeTab === tab.id ? 'bg-[var(--amethyst-color)] text-white shadow-md' : 'bg-transparent group-hover:bg-gray-200 dark:group-hover:bg-white/10'">
                  <i class="fa" :class="tab.icon"></i>
              </div>
              <div class="flex flex-col items-start hidden lg:block overflow-hidden">
                  <span class="font-bold text-sm tracking-wide truncate">{{ tab.name }}</span>
                  <span class="text-[10px] opacity-60 font-medium truncate">{{ tab.desc }}</span>
              </div>
              
              <!-- Tooltip for collapsed mode -->
              <div class="absolute left-14 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 lg:hidden pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {{ tab.name }}
              </div>
            </button>
          </nav>
          
          <!-- User Profile / Settings -->
          <div class="p-4 border-t border-[var(--card-border)] space-y-2">
             <button 
               @click="showSettings = true"
               class="w-full py-3 rounded-xl hover:bg-[var(--bg-primary)] text-gray-500 hover:text-[var(--text-primary)] transition-all font-bold flex items-center justify-center lg:justify-start px-3 group text-sm"
             >
               <i class="fa fa-cog lg:mr-3 group-hover:rotate-90 transition-transform"></i> 
               <span class="hidden lg:inline">Settings</span>
             </button>
             <button 
               @click="logout"
               class="w-full py-3 rounded-xl border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-bold flex items-center justify-center lg:justify-start px-3 group text-sm"
             >
               <i class="fa fa-power-off lg:mr-3 group-hover:scale-110 transition-transform"></i> 
               <span class="hidden lg:inline">Logout</span>
             </button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-grow flex flex-col h-full relative overflow-hidden bg-[var(--bg-primary)]">
          <!-- Top Bar -->
          <header class="px-4 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 border-b border-[var(--card-border)]">
              <div>
                  <h2 class="text-3xl font-thin tracking-tight text-[var(--text-primary)] animate-slide-in">
                    {{ currentTabInfo?.name }}
                  </h2>
              </div>
              
              <div class="flex gap-4 animate-slide-in" style="animation-delay: 0.1s">
                  <template v-if="isGithubConfigured">
                      <button 
                          @click="publishChanges" 
                          :disabled="isPublishing"
                          class="btn-primary px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[var(--amethyst-color)]/20 hover:shadow-[var(--amethyst-color)]/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <i v-if="isPublishing" class="fa fa-spinner fa-spin"></i>
                          <i v-else class="fa fa-cloud-upload-alt"></i> 
                          {{ isPublishing ? 'Publishing...' : 'Publish to Live' }}
                      </button>
                  </template>
                  <template v-else>
                      <button 
                          @click="copyJson" 
                          class="btn-glass px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-blue-500/10 hover:text-blue-500 transition-all border border-[var(--card-border)]"
                      >
                          <i class="fa fa-code"></i> Copy JSON
                      </button>
                      <button 
                          @click="showSettings = true" 
                          class="btn-primary px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[var(--amethyst-color)]/20 hover:shadow-[var(--amethyst-color)]/40 hover:-translate-y-1 transition-all"
                      >
                          <i class="fa fa-cog"></i> Configure Cloud
                      </button>
                  </template>
                  
                  <button 
                      @click="activeTab === 'pinned' ? addPinnedItem() : activeTab === 'projects' ? addProject() : activeTab === 'commissions' ? addCommission() : activeTab === 'works' ? addWork() : addWorksSection()" 
                      class="btn-glass px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-[var(--card-bg)] transition-all border border-[var(--card-border)]"
                  >
                      <i class="fa fa-plus"></i> New Item
                  </button>
              </div>
          </header>

          <!-- Scrollable Content -->
          <div class="flex-grow overflow-y-auto p-3 md:p-4 custom-scrollbar relative z-0">
             <div v-if="isUploading" class="fixed bottom-10 right-10 z-50 bg-[var(--card-bg)]/90 backdrop-blur-xl border border-[var(--amethyst-color)] text-[var(--text-primary)] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-bounce-subtle">
                <div class="w-5 h-5 border-2 border-[var(--amethyst-color)] border-t-transparent rounded-full animate-spin"></div>
                <span class="font-bold text-sm">Uploading asset...</span>
            </div>

            <transition-group name="list" tag="div" class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
              
              <!-- Pinned Items -->
              <template v-if="activeTab === 'pinned'">
                  <div v-for="(item, index) in pinnedItems" :key="index" class="content-card group">
                      <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button @click="removePinnedItem(index)" class="icon-btn-danger"><i class="fa fa-trash"></i></button>
                      </div>
                      <div class="space-y-6">
                          <div class="input-group">
                              <label>Title</label>
                              <input v-model="item.title" type="text" class="modern-input" placeholder="Title" />
                          </div>
                          <div class="input-group">
                              <label>Description</label>
                              <input v-model="item.description" type="text" class="modern-input" placeholder="Short description" />
                          </div>
                          <div class="input-group">
                              <label>Link</label>
                              <input v-model="item.link" type="text" class="modern-input font-mono text-xs" placeholder="https://" />
                          </div>
                      </div>
                  </div>
              </template>

              <!-- Projects -->
              <template v-if="activeTab === 'projects'">
                  <div v-for="(project, index) in projects" :key="index" class="content-card group xl:col-span-2 2xl:col-span-1">
                      <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button @click="removeProject(index)" class="icon-btn-danger"><i class="fa fa-trash"></i></button>
                      </div>
                      <div class="flex flex-col md:flex-row gap-8">
                          <!-- Image -->
                          <div class="w-full md:w-64 flex-shrink-0 space-y-4">
                              <div class="aspect-video rounded-xl bg-[var(--bg-primary)] overflow-hidden relative group/img shadow-inner border border-[var(--card-border)]">
                                  <img v-if="project.image" :src="resolveImg(project.image)" class="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                                  <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                      <i class="fa fa-image text-3xl opacity-50"></i>
                                      <span class="text-xs uppercase tracking-widest opacity-50">No Image</span>
                                  </div>
                                  <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center">
                                      <label class="cursor-pointer bg-white/90 text-black px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:scale-105 transition-transform shadow-xl">
                                          Upload
                                          <input type="file" class="hidden" accept="image/*" @change="(e) => handleFileUpload(e, project, 'image', 'img-projects')" />
                                      </label>
                                  </div>
                              </div>
                              <input v-model="project.image" class="modern-input text-xs font-mono" placeholder="Image URL / Path" />
                          </div>

                          <!-- Fields -->
                          <div class="flex-grow space-y-5">
                               <div class="input-group">
                                  <label>Project Title</label>
                                  <input v-model="project.title" class="modern-input text-lg font-bold" />
                              </div>
                               <div class="input-group">
                                  <label>Description</label>
                                  <textarea v-model="project.description" class="modern-input h-24 resize-none leading-relaxed"></textarea>
                              </div>
                               <div class="input-group">
                                  <label>Tech Stack</label>
                                  <input 
                                      :value="project.tags.join(', ')" 
                                      @input="(e) => updateProjectTags(index, (e.target as HTMLInputElement).value)"
                                      placeholder="Vue, TypeScript..."
                                      class="modern-input"
                                  />
                              </div>
                              <div class="grid grid-cols-2 gap-4">
                                  <div class="input-group">
                                      <label>Live URL</label>
                                      <input v-model="project.live_url" class="modern-input font-mono text-xs" />
                                  </div>
                                  <div class="input-group">
                                      <label>Source URL</label>
                                      <input v-model="project.source_url" class="modern-input font-mono text-xs" />
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </template>

              <!-- Commissions -->
              <template v-if="activeTab === 'commissions'">
                  <div v-for="(comm, index) in commissions" :key="index" class="content-card group xl:col-span-2 2xl:col-span-1">
                       <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button @click="removeCommission(index)" class="icon-btn-danger"><i class="fa fa-trash"></i></button>
                      </div>
                       <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div class="space-y-6">
                              <div class="input-group">
                                  <label>Service Title</label>
                                  <input v-model="comm.title" class="modern-input text-lg font-bold" />
                              </div>
                              <div class="grid grid-cols-2 gap-6">
                                  <div class="input-group">
                                      <label>Price Range</label>
                                      <input v-model="comm.price" class="modern-input text-[var(--amethyst-color)] font-bold" />
                                  </div>
                                  <div class="input-group">
                                      <label>Requirements</label>
                                      <input v-model="comm.requirements" class="modern-input" />
                                  </div>
                              </div>
                              <div class="input-group">
                                  <label>Description</label>
                                  <textarea v-model="comm.description" class="modern-input h-32 resize-none"></textarea>
                              </div>
                          </div>
                          
                          <div class="space-y-4 bg-[var(--bg-primary)]/50 p-6 rounded-xl border border-[var(--card-border)]">
                               <label class="text-xs font-bold uppercase tracking-wider opacity-50 block mb-4">Gallery Preview</label>
                               <div class="grid grid-cols-3 gap-3">
                                  <div v-for="(img, i) in comm.images.slice(0, 5)" :key="i" class="aspect-square rounded-lg bg-[var(--card-bg)] overflow-hidden relative shadow-sm">
                                      <img :src="resolveImg(img)" class="w-full h-full object-cover" />
                                  </div>
                                  <label class="aspect-square rounded-lg bg-[var(--card-bg)] border-2 border-dashed border-[var(--card-border)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--amethyst-color)] hover:text-[var(--amethyst-color)] transition-all group/upload">
                                      <i class="fa fa-plus text-xl mb-1 transition-transform group-hover/upload:scale-125"></i>
                                      <span class="text-[10px] uppercase font-bold">Add</span>
                                      <input type="file" class="hidden" accept="image/*" @change="(e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0];
                                          if(file) uploadImage(file, 'img-commissions').then(path => comm.images.push(path));
                                      }" />
                                  </label>
                               </div>
                               <textarea 
                                  :value="comm.images.join('\n')" 
                                  @input="(e) => updateCommissionImages(index, (e.target as HTMLTextAreaElement).value)"
                                  class="modern-input font-mono text-xs h-32 mt-4"
                                  placeholder="Image paths (one per line)..."
                              ></textarea>
                          </div>
                       </div>
                  </div>
              </template>

              <!-- Works -->
              <template v-if="activeTab === 'works'">
                  <div v-for="(work, index) in works" :key="work.id" class="content-card group hover:-translate-y-2">
                      <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button @click="removeWork(index)" class="icon-btn-danger w-8 h-8 text-xs"><i class="fa fa-trash"></i></button>
                      </div>
                      
                      <div class="flex gap-5">
                          <div class="w-24 flex-shrink-0">
                              <div class="aspect-square rounded-lg bg-[var(--bg-primary)] overflow-hidden relative group/img shadow-md">
                                  <img v-if="work.image" :src="resolveImg(work.image)" class="w-full h-full object-cover" />
                                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400"><i class="fa fa-image"></i></div>
                                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                      <label class="cursor-pointer text-white hover:scale-110 transition-transform">
                                          <i class="fa fa-upload text-xl"></i>
                                          <input type="file" class="hidden" accept="image/*" @change="(e) => handleFileUpload(e, work, 'image', 'img-works')" />
                                      </label>
                                  </div>
                              </div>
                          </div>
                          <div class="flex-grow space-y-3">
                              <div class="input-group">
                                  <input v-model="work.title" class="modern-input font-bold" placeholder="Work Title" />
                              </div>
                              <div class="input-group">
                                  <textarea v-model="work.description" class="modern-input text-sm h-20 resize-none" placeholder="Description..."></textarea>
                              </div>
                          </div>
                      </div>
                  </div>
              </template>

              <!-- Works Section -->
              <template v-if="activeTab === 'works_section'">
                  <div v-for="(section, index) in worksSections" :key="section.id" class="content-card group xl:col-span-2 2xl:col-span-1">
                       <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button @click="removeWorksSection(index)" class="icon-btn-danger"><i class="fa fa-trash"></i></button>
                      </div>
                       
                       <div class="flex flex-col h-full gap-6">
                           <div class="flex gap-5">
                              <div class="w-24 flex-shrink-0">
                                  <div class="aspect-square rounded-lg bg-[var(--bg-primary)] overflow-hidden relative group/img shadow-md border border-[var(--card-border)]">
                                      <img v-if="section.thumbnail" :src="resolveImg(section.thumbnail)" class="w-full h-full object-cover" />
                                      <div v-else class="w-full h-full flex items-center justify-center text-gray-400"><i class="fa fa-folder-open text-2xl"></i></div>
                                      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                          <label class="cursor-pointer text-white hover:scale-110 transition-transform">
                                              <i class="fa fa-upload text-xl"></i>
                                              <input type="file" class="hidden" accept="image/*" @change="(e) => handleFileUpload(e, section, 'thumbnail', 'img-works')" />
                                          </label>
                                      </div>
                                  </div>
                              </div>
                              <div class="flex-grow space-y-3">
                                  <div class="input-group">
                                      <label>ID</label>
                                      <input v-model="section.id" class="modern-input font-mono text-xs" />
                                  </div>
                                  <div class="input-group">
                                      <label>Collection Title</label>
                                      <input v-model="section.title" class="modern-input font-bold" />
                                  </div>
                              </div>
                          </div>
                          <div class="input-group">
                              <label>Description</label>
                              <textarea v-model="section.description" class="modern-input h-20 resize-none"></textarea>
                          </div>
                          
                          <!-- Included Works Selection (Moved Inside) -->
                          <div class="pt-2">
                             <div class="flex items-center justify-between mb-4">
                                 <label class="text-xs font-bold uppercase tracking-wider opacity-50 block">
                                     {{ editingSectionId === section.id ? 'Select from Library' : `Included Works (${section.work_ids.length})` }}
                                 </label>
                                 <button @click="toggleSectionEdit(section.id)" 
                                         class="text-xs font-bold px-3 py-1 rounded-lg transition-colors"
                                         :class="editingSectionId === section.id ? 'bg-[var(--amethyst-color)] text-white' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--highlight-bg)]'">
                                     {{ editingSectionId === section.id ? 'Done' : 'Manage' }}
                                 </button>
                             </div>
                             
                             <!-- Mode: Selection Library (Edit Mode) -->
                             <div v-if="editingSectionId === section.id" class="animate-fade-in">
                                 <div class="h-64 overflow-y-auto custom-scrollbar pr-2 p-2 bg-[var(--bg-primary)] rounded-xl border border-[var(--card-border)]">
                                     <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                         <!-- Quick Add Button -->
                                         <label :for="'quick-add-' + section.id" class="aspect-square rounded-lg bg-[var(--card-bg)] border-2 border-dashed border-[var(--card-border)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--amethyst-color)] hover:text-[var(--amethyst-color)] transition-all group/upload shadow-sm hover:shadow-md sticky top-0 z-10">
                                             <i class="fa fa-cloud-upload-alt text-xl mb-1 transition-transform group-hover/upload:scale-110"></i>
                                             <span class="text-[9px] uppercase font-bold text-center leading-tight">Upload</span>
                                             <input :id="'quick-add-' + section.id" type="file" class="hidden" accept="image/*" @change="(e) => quickAddWorkToSection(e, index)" @click.stop />
                                         </label>
   
                                         <!-- Existing Works Library -->
                                         <div v-for="work in works" :key="work.id" 
                                              class="aspect-square rounded-lg relative cursor-pointer overflow-hidden transition-all group/item"
                                              :class="section.work_ids.includes(work.id) ? 'ring-2 ring-[var(--amethyst-color)] shadow-md opacity-100' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'"
                                              @click="toggleWorkInSection(index, work.id)"
                                         >
                                             <img v-if="work.image" :src="resolveImg(work.image)" class="w-full h-full object-cover" />
                                             <div v-else class="w-full h-full bg-[var(--card-bg)] flex items-center justify-center text-[8px] text-center p-1 break-all">
                                                 {{ work.title || work.id }}
                                             </div>
                                             
                                             <!-- Selected Checkmark -->
                                             <div v-if="section.work_ids.includes(work.id)" class="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--amethyst-color)] flex items-center justify-center shadow-sm z-10">
                                                 <i class="fa fa-check text-[8px] text-white"></i>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                             
                             <!-- Mode: Selected Preview (View Mode) -->
                             <div v-else class="min-h-[6rem] bg-[var(--bg-primary)]/30 rounded-xl p-3 border border-[var(--card-border)] border-dashed transition-all hover:border-[var(--amethyst-color)]/30 cursor-pointer group/view" @click="toggleSectionEdit(section.id)">
                                 <div v-if="section.work_ids.length > 0" class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2">
                                     <div v-for="wid in section.work_ids" :key="wid" class="aspect-square rounded-lg overflow-hidden bg-[var(--card-bg)] shadow-sm relative group/thumb">
                                         <img :src="resolveImg(works.find(w => w.id === wid)?.image || '')" class="w-full h-full object-cover" />
                                         <div class="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity"></div>
                                     </div>
                                     <!-- Add More Placeholder -->
                                     <div class="aspect-square rounded-lg border border-dashed border-[var(--card-border)] flex items-center justify-center text-gray-400 group-hover/view:text-[var(--amethyst-color)] group-hover/view:border-[var(--amethyst-color)] transition-all">
                                         <i class="fa fa-plus text-xs"></i>
                                     </div>
                                 </div>
                                 <div v-else class="h-full flex flex-col items-center justify-center text-gray-400 gap-2 py-4">
                                     <i class="fa fa-folder-open text-2xl opacity-20 group-hover/view:opacity-50 group-hover/view:scale-110 transition-all"></i>
                                     <span class="text-xs font-medium">Empty Collection</span>
                                     <span class="text-[10px] opacity-60">Click to add works</span>
                                 </div>
                             </div>
                          </div>
                       </div>
                       
                       <!-- Deleted old separated block -->
                  </div>
              </template>

            </transition-group>
          </div>
        </main>
      </div>

      <!-- Login Screen -->
      <div v-else class="flex items-center justify-center h-screen w-full relative overflow-hidden bg-[var(--bg-primary)]">
        <!-- Background Decor -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--amethyst-color)] rounded-full filter blur-[120px] opacity-10 animate-pulse"></div>
        
        <div class="glass-panel p-12 rounded-[2.5rem] max-w-md w-full relative z-10 border border-[var(--card-border)] shadow-2xl flex flex-col items-center">
          <div class="w-16 h-16 rounded-2xl bg-[var(--amethyst-color)] text-white flex items-center justify-center text-2xl shadow-lg shadow-[var(--amethyst-color)]/30 mb-6">
              <i class="fa fa-shield-alt"></i>
          </div>
          
          <h2 class="text-4xl font-light tracking-tight mb-2 text-center text-[var(--text-primary)]">Welcome Back</h2>
          <p class="text-center text-gray-400 mb-10 text-sm font-medium tracking-wide uppercase">Admin Authentication</p>
          
          <div class="w-full space-y-6">
            <div class="relative group">
                <input 
                  type="password" 
                  v-model="password" 
                  @keyup.enter="checkAuth"
                  class="w-full px-6 py-4 pl-12 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-primary)]/50 focus:bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--amethyst-color)] focus:border-transparent transition-all text-lg tracking-widest placeholder:tracking-normal"
                  placeholder="Enter Password"
                />
                <i class="fa fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--amethyst-color)] transition-colors text-lg"></i>
            </div>
            
            <button 
              @click="checkAuth"
              class="w-full py-4 bg-[var(--amethyst-color)] hover:bg-[var(--amethyst-color-hover)] text-white rounded-2xl transition-all font-bold text-sm uppercase tracking-widest shadow-xl shadow-[var(--amethyst-color)]/20 hover:shadow-[var(--amethyst-color)]/40 hover:-translate-y-1 active:scale-95"
            >
              Access Dashboard
            </button>
            
             <p v-if="loginError" class="text-red-500 text-xs font-bold text-center animate-shake mt-4 bg-red-50 dark:bg-red-900/10 py-2 rounded-lg border border-red-100 dark:border-red-900/20">
                <i class="fa fa-exclamation-circle mr-1"></i> ACCESS DENIED
             </p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* --- Glass Panel & Layout --- */
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}

.dark .glass-panel {
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* --- Components --- */
.content-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 1rem;
  padding: 1.5rem;
  position: relative;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.content-card:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border-color: var(--amethyst-color);
}

.modern-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--card-border);
  padding: 0.5rem 0;
  color: var(--text-primary);
  transition: all 0.3s ease;
  border-radius: 0;
}

.modern-input:focus {
  outline: none;
  border-bottom-color: var(--amethyst-color);
  background: linear-gradient(to bottom, transparent, var(--highlight-bg));
  padding-left: 0.5rem;
}

.input-group label {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}

/* --- Buttons --- */
.btn-primary {
  background: var(--amethyst-color);
  color: white;
}

.btn-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  color: var(--text-primary);
}

.icon-btn-danger {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.dark .icon-btn-danger {
  background: rgba(127, 29, 29, 0.3);
  color: #f87171;
}

.icon-btn-danger:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* --- Animations --- */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.list-move {
  transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.animate-slide-in {
  opacity: 0;
  animation: slideIn 0.8s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

/* --- Custom Scrollbar --- */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--card-border);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--amethyst-color);
}
</style>
