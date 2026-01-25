<!--
 * @Description: 文档详情页 - 三栏布局
 * @Author: 安知鱼
 * @Date: 2025-12-30
-->
<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  Transition
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { getPublicArticle, getPublicDocSeriesWithArticles } from "@/api/post";
import type {
  Article,
  DocSeriesWithArticles,
  DocArticleItem
} from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { updateMetaThemeColorDynamic } from "@/utils/themeManager";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import DocSidebar from "./components/DocSidebar.vue";
import DocToc from "./components/DocToc.vue";
import DocContent from "./components/DocContent.vue";
import "./styles/doc.scss";

defineOptions({ name: "DocDetail" });

const route = useRoute();
const router = useRouter();
const siteConfigStore = useSiteConfigStore();
const { dataTheme } = useDataThemeChange();

// 状态
const loading = ref(true);
const isSidebarOpen = ref(false);
const isSidebarCollapsed = ref(false);

// 切换移动端侧边栏
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

// PC端收起/展开侧边栏
const collapseSidebar = () => {
  isSidebarCollapsed.value = true;
};

const expandSidebar = () => {
  isSidebarCollapsed.value = false;
};

// 打开搜索
const openSearch = () => {
  const searchEvent = new CustomEvent("frontend-open-search");
  window.dispatchEvent(searchEvent);
};
const article = ref<Article | null>(null);
const docSeries = ref<DocSeriesWithArticles | null>(null);
const currentDocId = computed(() => route.params.id as string);

// 上下篇文档
const prevDoc = computed<DocArticleItem | null>(() => {
  if (!docSeries.value?.articles?.length) return null;
  const currentIndex = docSeries.value.articles.findIndex(
    doc => doc.id === currentDocId.value
  );
  if (currentIndex > 0) {
    return docSeries.value.articles[currentIndex - 1];
  }
  return null;
});

const nextDoc = computed<DocArticleItem | null>(() => {
  if (!docSeries.value?.articles?.length) return null;
  const currentIndex = docSeries.value.articles.findIndex(
    doc => doc.id === currentDocId.value
  );
  if (currentIndex >= 0 && currentIndex < docSeries.value.articles.length - 1) {
    return docSeries.value.articles[currentIndex + 1];
  }
  return null;
});

// 获取文档详情
const fetchArticle = async (id: string) => {
  loading.value = true;
  try {
    const res = await getPublicArticle(id);
    article.value = res.data;

    // 如果文章有关联的文档系列，获取系列信息
    if (res.data.doc_series_id) {
      await fetchDocSeries(res.data.doc_series_id);
    } else {
      docSeries.value = null;
    }
  } catch (error) {
    console.error("获取文档失败:", error);
    router.push("/404");
  } finally {
    loading.value = false;
  }
};

// 获取文档系列及其文章列表
const fetchDocSeries = async (seriesId: string) => {
  try {
    const res = await getPublicDocSeriesWithArticles(seriesId);
    docSeries.value = res.data;
  } catch (error) {
    console.error("获取文档系列失败:", error);
  }
};

// 导航到其他文档
const handleNavigateDoc = (docId: string) => {
  router.push(`/doc/${docId}`);
};

// 更新沉浸式状态栏主题色
const updateImmersiveThemeColor = (delay = 100) => {
  setTimeout(() => {
    const scrollTop = Math.max(0, window.scrollY);
    if (scrollTop === 0) {
      // 页面顶部：使用背景色
      updateMetaThemeColorDynamic("var(--anzhiyu-background)");
    } else {
      // 滚动后：使用卡片背景色
      updateMetaThemeColorDynamic("var(--anzhiyu-card-bg)");
    }
  }, delay);
};

// 监听路由变化
watch(
  () => route.params.id,
  async newId => {
    if (newId) {
      await fetchArticle(newId as string);
      await nextTick();
      window.scrollTo({ top: 0, behavior: "smooth" });
      // 路由切换后更新沉浸式状态栏
      updateImmersiveThemeColor(200);
    }
  }
);

// 监听主题变化，更新沉浸式状态栏颜色
watch(dataTheme, () => {
  // 主题切换后需要延迟一下，等待 CSS 变量更新完成
  updateImmersiveThemeColor(100);
});

onMounted(async () => {
  if (currentDocId.value) {
    await fetchArticle(currentDocId.value);
  }
  // 初始化沉浸式状态栏
  updateImmersiveThemeColor();
});

onUnmounted(() => {
  // 组件卸载时恢复默认主题色
  updateMetaThemeColorDynamic("var(--anzhiyu-card-bg)");
});
</script>

<template>
  <div class="doc-page">
    <!-- 顶部渐变遮罩 - 模拟内容消失效果 -->
    <div class="doc-top-fade" />

    <!-- 移动端侧边栏遮罩 -->
    <div
      class="mobile-sidebar-overlay"
      :class="{ 'is-open': isSidebarOpen }"
      @click="closeSidebar"
    />

    <!-- PC端收起后的悬浮块 -->
    <div
      v-if="isSidebarCollapsed && docSeries"
      class="sidebar-collapsed-float"
      @click.stop
    >
      <button class="float-btn" title="展开侧边栏" @click="expandSidebar">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
        </svg>
      </button>
      <button class="float-btn" title="搜索" @click="openSearch">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    </div>

    <div
      class="doc-container"
      :class="{ 'sidebar-collapsed': isSidebarCollapsed }"
    >
      <!-- 左侧导航栏 -->
      <aside
        class="doc-sidebar-left"
        :class="{
          'is-open': isSidebarOpen,
          'is-collapsed': isSidebarCollapsed
        }"
      >
        <DocSidebar
          :series="docSeries"
          :current-doc-id="currentDocId"
          @navigate="
            id => {
              handleNavigateDoc(id);
              closeSidebar();
            }
          "
          @collapse="collapseSidebar"
        />
      </aside>

      <!-- 中间内容区 -->
      <main class="doc-main">
        <!-- 加载中的遮罩层 -->
        <Transition name="doc-loading-fade">
          <div v-if="loading" class="doc-loading-overlay">
            <div class="loading-spinner" />
          </div>
        </Transition>

        <!-- 文档内容 - 始终保持在 DOM 中，避免切换时高度塌陷 -->
        <DocContent
          v-if="article"
          :key="article.id"
          :article="article"
          :site-config="siteConfigStore"
          :prev-doc="prevDoc"
          :next-doc="nextDoc"
          :class="{ 'is-loading': loading }"
          @navigate="handleNavigateDoc"
        />

        <!-- 首次加载骨架屏 -->
        <div v-else-if="loading" class="doc-loading">
          <div class="loading-skeleton">
            <div class="skeleton-title" />
            <div class="skeleton-line" />
            <div class="skeleton-line short" />
            <div class="skeleton-line" />
            <div class="skeleton-line" />
            <div class="skeleton-line short" />
          </div>
        </div>
      </main>

      <!-- 右侧目录 -->
      <aside class="doc-sidebar-right">
        <DocToc v-if="article" :content-html="article.content_html || ''" />
      </aside>
    </div>

    <!-- 移动端侧边栏切换按钮 -->
    <button
      v-if="docSeries"
      class="mobile-sidebar-toggle"
      @click="toggleSidebar"
    >
      <i
        :class="
          isSidebarOpen
            ? 'anzhiyufont anzhiyu-icon-xmark'
            : 'anzhiyufont anzhiyu-icon-list-ul'
        "
      />
    </button>
  </div>
</template>
