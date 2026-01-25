<script setup lang="ts">
import {
  ref,
  reactive,
  watch,
  computed,
  onMounted,
  onUnmounted,
  onActivated,
  nextTick
} from "vue";
import { useRoute } from "vue-router";
import HomeTop from "./components/HomeTop/index.vue";
import EssayBar from "./components/EssayBar/index.vue";
import CategoryBar from "./components/CategoryBar/index.vue";
import TagBar from "./components/TagBar/index.vue";
import ArticleCard from "./components/ArticleCard/index.vue";
import ArticleCardSkeleton from "./components/ArticleCardSkeleton/index.vue";
import Archives from "./components/Archives/index.vue";
import Pagination from "./components/Pagination/index.vue";
import Sidebar from "../components/Sidebar/index.vue";
import { getPublicArticles, getFeedList } from "@/api/post";
import type { Article, GetArticleListParams, FeedItem } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { resetThemeToDefault } from "@/utils/themeManager";
import { initLazyLoad, destroyLazyLoad } from "@/utils/lazyload";

defineOptions({
  name: "PostHome"
});

const route = useRoute();
const siteConfigStore = useSiteConfigStore();
const postConfig = computed(() => siteConfigStore.getSiteConfig?.post?.default);

// 记录上次加载的路由路径，避免重复加载
let lastLoadedPath = "";

type PageType = "home" | "tag" | "category" | "archive";

const pageType = computed<PageType>(() => {
  const { path } = route;
  if (path.startsWith("/tags/")) return "tag";
  if (path.startsWith("/categories/")) return "category";
  if (path.startsWith("/archives")) return "archive";
  return "home";
});

const isHomePage = computed(() => pageType.value === "home");
const isFirstPage = computed(() => pagination.page === 1);
const showHomeTop = computed(() => isHomePage.value && isFirstPage.value);
const isDoubleColumn = computed(() => postConfig.value?.double_column ?? true);

// 使用 FeedItem 类型支持文章和商品混合
const feedItems = ref<FeedItem[]>([]);
const isLoading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: postConfig.value?.page_size || 12,
  total: 0
});

// 统一管理懒加载 Observer（避免每个 ArticleCard 重复创建）
let lazyLoadObserver: IntersectionObserver | null = null;

// 初始化懒加载
const initArticleLazyLoad = () => {
  // 先销毁旧的 observer
  if (lazyLoadObserver) {
    lazyLoadObserver.disconnect();
  }
  // 创建新的 observer
  lazyLoadObserver = initLazyLoad(document, {
    selector: "img[data-src]",
    threshold: 0.1,
    rootMargin: "100px",
    loadedClass: "lazy-loaded",
    loadingClass: "lazy-loading"
  });
};

// 兼容旧的 articles 引用 - 用于归档视图（只包含文章）
const articles = computed(() => {
  return feedItems.value
    .filter(item => item.item_type === "article")
    .map(item => {
      // 将 FeedItem 转换为 Article 格式（归档视图需要）
      const articleItem: Partial<Article> = {
        id: item.id,
        title: item.title,
        cover_url: item.cover_url,
        created_at: item.created_at,
        updated_at: item.created_at,
        pin_sort: item.pin_sort || 0,
        comment_count: item.comment_count || 0,
        post_tags: item.post_tags || [],
        post_categories: item.post_categories || [],
        is_doc: item.is_doc || false,
        doc_series_id: item.doc_series_id,
        status: "PUBLISHED" as const,
        view_count: 0,
        word_count: 0,
        reading_time: 0,
        show_on_home: true,
        home_sort: 0,
        top_img_url: item.cover_url,
        summaries: [],
        copyright: false
      };
      return articleItem as Article;
    });
});

// 计算最新文章的ID（只在首页第一页时有效）
const newestArticleId = computed(() => {
  if (!showHomeTop.value || feedItems.value.length === 0) return null;
  // 只考虑文章类型
  const articleItems = feedItems.value.filter(
    item => item.item_type === "article"
  );
  if (articleItems.length === 0) return null;
  return articleItems.reduce((latest, current) =>
    new Date(current.created_at) > new Date(latest.created_at)
      ? current
      : latest
  ).id;
});

// 是否显示分页
const showPagination = computed(() => pagination.total > pagination.pageSize);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const { name, year, month } = route.params;
    const type = pageType.value;

    // 构建参数
    const params: GetArticleListParams = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };

    if (type === "category" && name) {
      params.category = name as string;
    } else if (type === "tag" && name) {
      params.tag = name as string;
    } else if (type === "archive") {
      if (year) params.year = Number(year);
      if (month) params.month = Number(month);
    }

    // 首页使用混合内容流接口，其他页面使用原接口
    if (type === "home") {
      const { data } = await getFeedList(params);
      feedItems.value = data.list;
      pagination.total = data.total;
    } else {
      const { data } = await getPublicArticles(params);
      // 将文章转换为 FeedItem 格式
      feedItems.value = data.list.map(article => ({
        id: article.id,
        item_type: "article" as const,
        title: article.title,
        cover_url: article.cover_url,
        created_at: article.created_at,
        pin_sort: article.pin_sort,
        comment_count: article.comment_count,
        post_tags: article.post_tags,
        post_categories: article.post_categories,
        is_doc: article.is_doc,
        doc_series_id: article.doc_series_id
      }));
      pagination.total = data.total;
    }

    // 数据加载完成后，在下一个渲染周期初始化懒加载
    nextTick(() => {
      initArticleLazyLoad();
    });
  } catch (error) {
    console.error("获取内容列表失败:", error);
    feedItems.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handlePageChange = (newPage: number) => {
  pagination.page = newPage;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// 监听路由变化，只在路由真正变化时重新加载
watch(
  () => route.fullPath,
  newPath => {
    // 如果路由没有变化，不重新加载（避免 keep-alive 激活时重复加载）
    if (lastLoadedPath === newPath) {
      return;
    }
    lastLoadedPath = newPath;

    // 只有在路由参数变化时才清空列表（如切换分类/标签/分页）
    feedItems.value = [];
    pagination.page = route.params.id ? Number(route.params.id) : 1;
    fetchData();
  },
  { immediate: true }
);

// keep-alive 激活时，只初始化懒加载（不重新获取数据）
onActivated(() => {
  // 如果已有数据，只需要重新初始化懒加载
  if (feedItems.value.length > 0) {
    nextTick(() => {
      initArticleLazyLoad();
    });
  }
});

onMounted(() => {
  resetThemeToDefault();
});

onUnmounted(() => {
  destroyLazyLoad(lazyLoadObserver);
  // 清理路由记录，确保下次进入时重新加载
  lastLoadedPath = "";
});
</script>

<template>
  <div class="post-home-container">
    <!-- 即刻轮播条 -->
    <EssayBar v-if="showHomeTop" />

    <!-- 首页顶部区域 -->
    <div v-if="showHomeTop" class="post-home-top-container">
      <HomeTop />
    </div>

    <div id="content-inner" class="layout">
      <main class="main-content">
        <!-- 分类/标签导航栏 -->
        <CategoryBar v-if="isHomePage || pageType === 'category'" />
        <TagBar v-else-if="pageType === 'tag'" />

        <!-- 文章列表区域 -->
        <div
          id="recent-posts"
          class="recent-posts"
          :class="{
            'double-column-container': isDoubleColumn,
            '!justify-center': !isLoading && feedItems.length === 0
          }"
        >
          <!-- 骨架屏加载状态 -->
          <template v-if="isLoading && feedItems.length === 0">
            <ArticleCardSkeleton
              v-for="i in 6"
              :key="'skeleton-' + i"
              :is-double-column="isDoubleColumn"
            />
          </template>

          <!-- 内容列表 -->
          <template v-else-if="feedItems.length > 0">
            <!-- 归档视图（只显示文章） -->
            <Archives
              v-if="pageType === 'archive'"
              :articles="articles"
              :total="pagination.total"
            />
            <!-- 卡片视图（显示文章和商品混合） -->
            <template v-else>
              <ArticleCard
                v-for="item in feedItems"
                :key="item.id"
                :article="item"
                :is-double-column="isDoubleColumn"
                :is-newest="
                  item.item_type === 'article' && item.id === newestArticleId
                "
              />
            </template>
          </template>

          <!-- 空状态 -->
          <el-empty
            v-if="!isLoading && feedItems.length === 0"
            description="暂无内容"
          />
        </div>

        <!-- 分页 -->
        <Pagination
          v-if="showPagination"
          :page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="handlePageChange"
        />
      </main>

      <Sidebar />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.post-home-top-container {
  width: 100%;
  max-width: 1400px;
  padding: 0 1.5rem;
  margin: 0 auto;
  overflow: hidden;
  user-select: none;
  animation: slide-in 0.6s 0.1s backwards;
}

.layout {
  display: flex;
  gap: 0.625rem;
  max-width: 1400px;
  padding: 0.5rem 1.5rem 1rem;
  margin: 0 auto;
  min-height: 600px;
  contain: layout style;
}

.main-content {
  flex: 1;
  min-width: 0;
  contain: layout;
}

.recent-posts {
  position: relative;
  width: 100%;
  min-height: 400px;
  will-change: auto;
  animation: slide-in 0.6s 0.1s backwards;

  &.double-column-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
    justify-content: space-between;
  }
}

@media screen and (width > 760px) and (width <= 992px) {
  .recent-post-item {
    flex-direction: row !important;
    width: 100% !important;
    height: 200px !important;
  }

  .recent-posts.double-column-container {
    min-height: auto;
  }
}

@media (width <= 768px) {
  .post-home-top-container {
    padding: 0 1rem;
  }
}
</style>
