<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useArticleStore } from "@/store/modules/articleStore";
import { initLazyLoad, destroyLazyLoad } from "@/utils/lazyload";

defineOptions({
  name: "RecommendedSection"
});

const siteConfigStore = useSiteConfigStore();
const articleStore = useArticleStore();
const router = useRouter();

const siteConfig = computed(() => siteConfigStore.getSiteConfig);
const homeTopConfig = computed(() => siteConfig.value?.HOME_TOP);

const recommendedArticles = computed(() => articleStore.homeArticles);
const hasRecommendedArticles = computed(
  () => recommendedArticles.value && recommendedArticles.value.length > 0
);

// 轮播控制
const currentIndex = ref(0);
const isTransitioning = ref(false);
let carouselTimer: number | null = null;

// 每次显示的数量
const VISIBLE_COUNT = 3;
// 卡片之间的间距（需与宽度计算保持一致）
const ITEM_SPACING_REM = 0.5;

// 扩展的文章列表（前后各添加 VISIBLE_COUNT 个用于无缝循环）
const extendedArticles = computed(() => {
  if (!hasRecommendedArticles.value) return [];
  const articles = recommendedArticles.value;
  if (articles.length <= VISIBLE_COUNT) {
    // 如果文章数量不足，重复填充
    const repeated = [];
    while (repeated.length < VISIBLE_COUNT * 3) {
      repeated.push(...articles);
    }
    return repeated;
  }
  // 前面添加最后 VISIBLE_COUNT 个，后面添加前 VISIBLE_COUNT 个
  const prefix = articles.slice(-VISIBLE_COUNT);
  const suffix = articles.slice(0, VISIBLE_COUNT);
  return [...prefix, ...articles, ...suffix];
});
// 将间距按元素数量均摊，避免尾部留白
const itemSpacingShareRem = computed(() => {
  const total = extendedArticles.value.length;
  if (total <= 1) return 0;
  return (ITEM_SPACING_REM * (total - 1)) / total;
});

// 计算轨道和位移样式
const trackStyle = computed(() => {
  const totalCount = extendedArticles.value.length;
  if (totalCount === 0) return {};

  // track 宽度 = 扩展后元素数 / 显示数量 * 100%
  const widthPercent = (totalCount / VISIBLE_COUNT) * 100;
  // 位移：相对于 track 自身宽度
  const offset = currentIndex.value + VISIBLE_COUNT;
  const translatePercent = -(offset / totalCount) * 100;

  return {
    width: `${widthPercent}%`,
    transform: `translateX(${translatePercent}%)`,
    transition: isTransitioning.value ? "transform 0.5s ease-in-out" : "none"
  };
});

// 计算单个卡片宽度（相对于 track）
const itemWidthPercent = computed(() => {
  const totalCount = extendedArticles.value.length;
  if (totalCount === 0) return 0;
  return 100 / totalCount;
});

// 开始自动轮播
const startCarousel = () => {
  if (carouselTimer) {
    window.clearInterval(carouselTimer);
  }
  carouselTimer = window.setInterval(() => {
    if (hasRecommendedArticles.value && !isTransitioning.value) {
      moveNext();
    }
  }, 3000); // 3秒自动切换
};

// 停止轮播
const stopCarousel = () => {
  if (carouselTimer) {
    window.clearInterval(carouselTimer);
    carouselTimer = null;
  }
};

// 向前移动一个
const moveNext = () => {
  if (isTransitioning.value) return;
  isTransitioning.value = true;
  currentIndex.value++;
};

// 处理过渡结束
const handleTransitionEnd = (event: TransitionEvent) => {
  // 确保是 transform 过渡结束，且是当前元素（非子元素冒泡）
  if (event.propertyName !== "transform") return;

  isTransitioning.value = false;
  const articlesCount = recommendedArticles.value.length;

  // 当到达末尾克隆区域时，瞬间跳转回真实位置
  if (currentIndex.value >= articlesCount) {
    currentIndex.value = 0;
  }
  // 当到达开头克隆区域时，瞬间跳转回真实位置
  if (currentIndex.value < 0) {
    currentIndex.value = articlesCount - 1;
  }
};

// 监听文章数据变化，重置索引
watch(
  () => recommendedArticles.value,
  () => {
    currentIndex.value = 0;
    setupLazyLoad();
  }
);

let observer: IntersectionObserver | null = null;
const setupLazyLoad = async () => {
  await nextTick(); // 确保 DOM 更新后再挂载观察器
  destroyLazyLoad(observer);
  observer = initLazyLoad(document, {
    selector: "img[data-src]",
    threshold: 0.1,
    rootMargin: "100px",
    loadedClass: "lazy-loaded",
    loadingClass: "lazy-loading"
  });
};

const getCoverUrl = (article: any) =>
  article?.cover_url || articleStore.defaultCover;

/**
 * 处理分类点击事件
 * @param item - 分类项配置
 * @param event - 点击事件
 */
const handleCategoryClick = (item: any, event: MouseEvent) => {
  event.preventDefault();

  const path = item.path;
  const isExternal = item.isExternal ?? false;

  // 判断是否为外部链接（以 http:// 或 https:// 开头）
  const isExternalUrl = /^https?:\/\//.test(path);

  if (isExternalUrl) {
    // 外部链接
    if (isExternal) {
      // 新窗口打开
      window.open(path, "_blank");
    } else {
      // 当前页面打开
      window.location.href = path;
    }
  } else {
    // 内部链接
    if (isExternal) {
      // 新窗口打开（使用 router 的方式打开新窗口）
      const routeUrl = router.resolve({ path });
      window.open(routeUrl.href, "_blank");
    } else {
      // 当前页面打开
      router.push({ path });
    }
  }
};

onMounted(() => {
  articleStore.fetchHomeArticles();
  startCarousel();
  setupLazyLoad();
});

onUnmounted(() => {
  stopCarousel();
  destroyLazyLoad(observer);
});
</script>

<template>
  <div v-if="homeTopConfig" class="recommended-section">
    <!-- 左侧：推荐文章列表 -->
    <div
      class="recommended-articles"
      @mouseenter="stopCarousel"
      @mouseleave="startCarousel"
    >
      <div v-if="hasRecommendedArticles" class="articles-viewport">
        <div
          class="articles-track"
          :style="trackStyle"
          @transitionend="handleTransitionEnd"
        >
          <router-link
            v-for="(article, index) in extendedArticles"
            :key="`${article.id}-${index}`"
            class="article-item"
            :style="{
              width: `calc(${itemWidthPercent}% - ${itemSpacingShareRem}rem)`
            }"
            :to="`/posts/${article.id}`"
            :title="article.title"
          >
            <div class="article-cover">
              <span class="article-top-text">荐</span>
              <img
                class="article-bg lazy-loading"
                loading="lazy"
                :src="articleStore.defaultCover"
                :data-src="getCoverUrl(article)"
                :alt="article.title"
              />
            </div>
            <div class="article-info">
              <div class="article-title">{{ article.title }}</div>
            </div>
          </router-link>
        </div>
      </div>

      <div v-else class="articles-skeleton">
        <div v-for="n in 3" :key="n" class="skeleton-card">
          <div class="skeleton-cover shimmer" />
          <div class="skeleton-text shimmer" />
        </div>
      </div>
    </div>

    <!-- 右侧：分类组 -->
    <div class="category-section">
      <div
        v-for="item in homeTopConfig.category"
        :key="item.name"
        class="category-item"
      >
        <a
          class="category-button"
          :style="{ background: item.background }"
          @click="handleCategoryClick(item, $event)"
        >
          <span class="category-button-text">{{ item.name }}</span>
          <!-- 支持HTTP链接图标 -->
          <img
            v-if="
              item.icon &&
              (item.icon.startsWith('http://') ||
                item.icon.startsWith('https://'))
            "
            :src="item.icon"
            :alt="item.name"
            class="category-icon category-icon-img"
          />
          <!-- 字体图标 -->
          <i
            v-else-if="item.icon"
            :class="['anzhiyufont', item.icon]"
            class="category-icon"
          />
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.recommended-section {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  margin: 0.5rem 0;
  animation: slide-in 0.6s 0.1s backwards;
}

.recommended-articles {
  flex: 4;
  position: relative;
  overflow: hidden;
}

.articles-skeleton {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  height: 200px;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  height: 100%;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
}

.skeleton-cover {
  flex: 1 1 60%;
  border-radius: 8px;
}

.skeleton-text {
  flex: 0 0 14px;
  height: 14px;
  border-radius: 6px;
}

.shimmer {
  position: relative;
  overflow: hidden;
  background: var(--anzhiyu-secondbg);

  &::after {
    position: absolute;
    top: 0;
    left: -100%;
    width: 200%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.12),
      transparent
    );
    animation: shimmer 1.2s infinite;
    content: "";
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(50%);
  }
}

.articles-viewport {
  width: 100%;
  overflow: hidden;
  border-radius: 12px;
}

.articles-track {
  display: flex;
  height: 200px;
  --article-gap: 0.5rem;
  column-gap: var(--article-gap);
  padding: 0;
  margin: 0;
  will-change: transform;
}

.article-item {
  flex-shrink: 0;
  margin-right: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: var(--anzhiyu-card-bg);
  border-radius: 12px;
  overflow: hidden;
  border: var(--style-border-always);
  transition:
    box-shadow 0.3s,
    border-color 0.3s;
  box-shadow: var(--anzhiyu-shadow-border);
  cursor: pointer;
  text-decoration: none;
  color: var(--anzhiyu-fontcolor);
}

.article-item:hover .article-info .article-title {
  color: var(--anzhiyu-main);
}

.article-cover {
  width: 100%;
  height: 60%;
  position: relative;
  overflow: hidden;
}

.article-top-text {
  position: absolute;
  top: 0;
  left: -40px;
  display: flex;
  z-index: 2;
  background: var(--anzhiyu-theme);
  color: var(--anzhiyu-white);
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 0 0 12px 0;
  transition: left 0.3s;
  cursor: pointer;
}

.article-item:hover .article-top-text {
  left: 0;
}

.article-bg {
  object-fit: cover;
  width: 100%;
  height: 100%;
  background: var(--anzhiyu-secondbg);
  border-radius: 0;

  // CSS 图片懒加载优化
  &:not([src]),
  &[src=""] {
    opacity: 0;
  }

  &.lazy-loading {
    background: var(--anzhiyu-secondbg);
    opacity: 0.3;
  }

  &.lazy-loaded {
    opacity: 1;
    animation: imageFadeIn 0.4s ease-out forwards;
  }
}

.article-info {
  padding: 0.5rem 0.8rem;
  transition: 0.3s;
  flex-grow: 1;
  display: flex;
  align-items: center;
  width: 100%;
}

.article-title {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-height: 1.4;
  font-weight: bold;
  font-size: 0.9rem;
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  flex-direction: column;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--anzhiyu-secondtext);
  cursor: pointer;
  transition: all 0.3s;
  opacity: 0.5;
}

.indicator:hover {
  opacity: 0.8;
  transform: scale(1.2);
}

.indicator.active {
  background: var(--anzhiyu-theme);
  opacity: 1;
  width: 8px;
  height: 24px;
  border-radius: 4px;
}

.category-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-item {
  flex: 1;
  position: relative;
  transition: all 0.3s;

  &:hover {
    transform: translateX(-5px);

    .category-button .category-icon {
      opacity: 0.8;
      transition: 0.3s;
      transform: scale(1.1);
      filter: blur(0);
    }

    .category-button .category-icon-img {
      opacity: 0.8;
      transition: 0.3s;
      transform: scale(1.1);
      filter: blur(0);
    }
  }
}

.category-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  height: 100%;
  border-radius: 12px;
  color: white;
  text-decoration: none;
  transition: all 0.3s;
  background-size: 200% !important;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.category-button-text {
  font-size: 1rem;
  font-weight: bold;
  z-index: 2;
}

.category-icon {
  font-size: 2.5rem;
  opacity: 0.3;
  position: absolute;
  right: 0.5rem;
  transition: 0.3s;
  filter: blur(1px);
}

.category-icon-img {
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
  opacity: 0.3;
  position: absolute;
  right: 0.5rem;
  transition: 0.3s;
  filter: blur(1px);
}

// 图片淡入动画
@keyframes imageFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

// 992px - 1080px：隐藏 category-section
@media (min-width: 993px) and (max-width: 1080px) {
  .category-section {
    display: none;
  }

  .recommended-articles {
    flex: 1;
  }
}

// 768px - 992px：category-section 显示在右侧
@media (min-width: 769px) and (max-width: 992px) {
  .recommended-section {
    flex-direction: row;
  }

  .category-section {
    display: flex;
    flex-direction: column;
  }
}

// 手机：隐藏整个推荐区域
@media (max-width: 768px) {
  .recommended-section {
    display: none;
  }
}
</style>
