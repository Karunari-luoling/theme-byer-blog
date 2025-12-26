<script setup lang="ts">
import {
  type PropType,
  computed,
  ref,
  onMounted,
  onUnmounted,
  watch
} from "vue";
import type { Article } from "@/api/post/type";
import { useRouter } from "vue-router";
import { useArticleStore } from "@/store/modules/articleStore";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDark } from "@pureadmin/utils";
import { initLazyLoad, destroyLazyLoad } from "@/utils/lazyload";

gsap.registerPlugin(ScrollTrigger);

const props = defineProps({
  article: {
    type: Object as PropType<Article & { comment_count?: number }>,
    required: true
  }
});

const router = useRouter();
const articleStore = useArticleStore();
const siteConfigStore = useSiteConfigStore();
let ctx: gsap.Context;
let observer: IntersectionObserver | null = null;

const articleType = computed(() => {
  const siteOwnerName = siteConfigStore.siteConfig?.frontDesk?.siteOwner?.name;
  if (
    props.article.copyright_author &&
    props.article.copyright_author !== siteOwnerName
  ) {
    return "转载";
  }
  return "原创";
});

// 检查评论功能是否启用
const isCommentEnabled = computed(() => {
  return siteConfigStore.getSiteConfig?.comment?.enable === true;
});

onMounted(() => {
  // 初始化封面图片懒加载
  observer = initLazyLoad(document, {
    selector: "img[data-src]",
    threshold: 0.1,
    rootMargin: "100px",
    loadedClass: "lazy-loaded",
    loadingClass: "lazy-loading"
  });

  ctx = gsap.context(() => {
    // 使用 ScrollTrigger.matchMedia 来创建响应式动画
    ScrollTrigger.matchMedia({
      // 桌面端视图
      "(min-width: 769px)": function () {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".post-header-container",
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });
      },

      // 移动端视图
      "(max-width: 768px)": function () {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".post-header-container",
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });
      }
    });
  });
});

onUnmounted(() => {
  ctx.revert();
  destroyLazyLoad(observer);
});

const { isDark } = useDark();

const topCoverUrl = computed(() => {
  return props.article.top_img_url || articleStore.defaultCover;
});

const coverImageRef = ref<HTMLImageElement | null>(null);
const isImageLoaded = ref(false);

const handleImageLoad = () => {
  isImageLoaded.value = true;
};

// 监听文章变化，重置图片加载状态
watch(
  () => props.article.id,
  () => {
    isImageLoaded.value = false;
  }
);

const dynamicStyles = computed(() => {
  if (isDark.value) {
    return {
      "--primary-color":
        props.article.primary_color + "dd" || "var(--anzhiyu-main-op-deep)"
    };
  } else {
    return {
      "--primary-color": props.article.primary_color || "var(--anzhiyu-main)"
    };
  }
});

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const goToCategory = (categoryName: string) => {
  router.push(`/categories/${categoryName}/`);
};

const goToTag = (tagName: string) => {
  router.push(`/tags/${tagName}/`);
};

// 滚动到评论区（带布局变动稳定器）
const scrollToComment = (event: Event) => {
  event.preventDefault();

  const commentSection = document.getElementById("post-comment");
  if (!commentSection) return;

  const headerHeight = 80;

  const computeTargetTop = () => {
    const elementPosition = commentSection.getBoundingClientRect().top;
    return elementPosition + window.pageYOffset - headerHeight;
  };

  const scrollToTop = (top: number, smooth = true) => {
    window.scrollTo({
      top,
      behavior: smooth ? "smooth" : "auto"
    });
  };

  // 第一次滚动
  scrollToTop(computeTargetTop(), true);

  // 稳定器：在图片懒加载和内容高度变化时，重复校正滚动位置
  const contentRoot =
    (document.querySelector(".post-content") as HTMLElement) || document.body;

  let lastResizeTime = Date.now();
  let settledTimer: number | null = null;
  const settleQuietMs = 300; // 多久没有尺寸变动认为稳定
  const maxDurationMs = 3000; // 最长纠正时长
  const startTime = Date.now();

  const reAlign = () => {
    // 使用 auto 避免叠加过多平滑动画
    scrollToTop(computeTargetTop(), false);
  };

  // 图片加载监听（包括懒加载的逐张加载）
  const images = Array.from(
    (contentRoot.querySelectorAll("img") as NodeListOf<HTMLImageElement>) || []
  );
  images.forEach(img => {
    if (!img.complete) {
      const handler = () => {
        lastResizeTime = Date.now();
        reAlign();
      };
      img.addEventListener("load", handler, { once: true });
    }
  });

  // 尺寸变化监听（应对段落折行、图片高度变化、懒加载切换等）
  let resizeObserver: ResizeObserver | null = null;
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      lastResizeTime = Date.now();
      reAlign();
      // 重新计时，直到稳定
      if (settledTimer) {
        window.clearTimeout(settledTimer);
      }
      settledTimer = window.setTimeout(() => {
        // 如果已超过最大时长或已稳定一段时间，结束观察
        if (Date.now() - startTime >= maxDurationMs) {
          cleanup();
          return;
        }
        // 若仍有变化，计时器会被上面回调重置；若无变化，则这里触发清理
        cleanup();
      }, settleQuietMs);
    });
    resizeObserver.observe(contentRoot);
  }

  // 兜底：到达最大时长后强制停止
  const hardStopTimer = window.setTimeout(() => {
    cleanup();
  }, maxDurationMs + 200);

  const cleanup = () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (settledTimer) {
      window.clearTimeout(settledTimer);
    }
    window.clearTimeout(hardStopTimer);
    // 最终再对齐一次，确保停在正确位置
    reAlign();
  };
};
</script>

<template>
  <div class="post-header-container" :style="dynamicStyles">
    <div class="post-info">
      <h1 class="post-title">{{ article.title }}</h1>
      <div id="post-metas" class="post-metas">
        <div class="post-metas-firstline">
          <div v-if="article.ip_location" class="post-meta post-location">
            <i class="anzhiyufont anzhiyu-icon-location-dot" />
            <span class="post-meta-content"> {{ article.ip_location }} | </span>
          </div>
          <div class="post-meta post-publishdate">
            <i class="anzhiyufont anzhiyu-icon-calendar-days" />
            <span class="post-meta-content"
              >发表于 {{ formatDate(article.created_at) }} |</span
            >
          </div>
          <div class="post-meta post-lastupdatedate">
            <i class="anzhiyufont anzhiyu-icon-history" />
            <span class="post-meta-content"
              >更新于 {{ formatDate(article.updated_at) }}
              <span v-if="article.post_categories.length > 0">&nbsp;|</span>
            </span>
          </div>
          <div
            v-if="article.post_categories.length > 0"
            class="post-meta post-category"
          >
            <i class="anzhiyufont anzhiyu-icon-inbox" />
            <span class="post-meta-content">
              <a>{{ articleType }}</a>
              <span class="meta-dot">·</span>
              <a
                :href="`/categories/${article.post_categories[0].name}/`"
                @click.prevent="goToCategory(article.post_categories[0].name)"
                >{{ article.post_categories[0].name }}</a
              >
              <span v-if="article.post_tags.length">&nbsp;| </span>
            </span>
          </div>
          <div v-if="article.post_tags.length" class="post-meta post-tags">
            <i class="anzhiyufont anzhiyu-icon-hashtag" />
            <span class="post-meta-content">
              <div
                v-for="(tag, index) in article.post_tags"
                :key="tag.id"
                class="post-tag-item"
              >
                <span v-if="index > 0" class="meta-dot">·</span>
                <a
                  :href="`/tags/${tag.name}/`"
                  @click.prevent="goToTag(tag.name)"
                  >{{ tag.name }}</a
                >
              </div>
            </span>
          </div>
        </div>
        <div class="post-metas-secondline">
          <div class="post-meta post-wordcount">
            <i class="anzhiyufont anzhiyu-icon-file-word" />
            <span class="post-meta-content"
              >字数总计: {{ article.word_count }} |</span
            >
          </div>
          <div class="post-meta post-viewcount">
            <i class="anzhiyufont anzhiyu-icon-fire" />
            <span class="post-meta-content"
              >阅读量:&nbsp;{{ article.view_count }}&nbsp;|</span
            >
          </div>
          <div class="post-meta post-readtime">
            <i class="anzhiyufont anzhiyu-icon-clock" />
            <span class="post-meta-content"
              >阅读用时: {{ article.reading_time }} 分钟 |</span
            >
          </div>
          <div
            v-if="isCommentEnabled"
            class="post-meta post-commentcount"
            @click="scrollToComment"
          >
            <i class="anzhiyufont anzhiyu-icon-comments" />
            <span class="post-meta-content"
              >{{ article.comment_count || 0 }} 条评论</span
            >
          </div>
        </div>
      </div>
    </div>
    <div class="post-top-cover">
      <img
        ref="coverImageRef"
        :key="article.id || topCoverUrl"
        class="post-top-bg"
        :class="{ 'is-loaded': isImageLoaded }"
        :src="topCoverUrl"
        :alt="article.title"
        @load="handleImageLoad"
      />
    </div>
    <section class="main-hero-waves-area waves-area">
      <svg
        class="waves-svg"
        xmlns="http://www.w3.org/2000/svg"
        xlink="http://www.w3.org/1999/xlink"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shape-rendering="auto"
      >
        <defs>
          <path
            id="gentle-wave"
            d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352Z"
          />
        </defs>
        <g class="parallax">
          <use href="#gentle-wave" x="48" y="0" />
          <use href="#gentle-wave" x="48" y="3" />
          <use href="#gentle-wave" x="48" y="5" />
          <use href="#gentle-wave" x="48" y="7" />
        </g>
      </svg>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.post-header-container {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  height: 26rem;
  min-height: 300px;
  overflow: hidden;
  color: var(--anzhiyu-white);

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    height: 100%;
    content: "";
    opacity: 1;
    transition: 0s;
  }
}

.post-info {
  position: absolute;
  z-index: 10;
  width: 92%;
  padding: 0 4%;
  max-width: 1400px;
  color: var(--anzhiyu-white);
  bottom: 100px;
}

.post-top-cover {
  position: relative;
  width: 100%;
  height: 100%;
  margin-bottom: 0;
  overflow: hidden;

  &::before {
    position: absolute;
    inset: 0;
    z-index: 1;
    content: "";
    background-color: #0003;
    backdrop-filter: blur(15px) saturate(180%);
    pointer-events: none;
  }
}

.post-top-cover .post-top-bg {
  width: 100%;
  min-width: 50vw;
  height: 100%;
  min-height: 25rem;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.5s ease-out;

  &:not([src]),
  &[src=""] {
    opacity: 0;
  }

  &.is-loaded {
    opacity: 1;
  }
}

#post-metas {
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  background-color: #fff2;
  border-radius: 15px;
  padding: 10px 15px;
  box-shadow: 0 0 20px #0002;
}

.post-metas-firstline,
.post-metas-secondline {
  display: flex;
  flex-wrap: wrap;
}

#post-metas .post-meta {
  display: flex;
  align-items: center;
}

#post-metas .post-meta > * {
  margin: auto 0 auto 5px;
}

#post-metas .post-meta-content {
  display: flex;
}

#post-metas .post-tags {
  white-space: nowrap;
}

.meta-dot {
  margin: 0 2px;
  font-size: 1.4rem;
  line-height: 1.2;
}

#post-metas .post-meta-content a {
  color: inherit;
  font-size: inherit;
  transition: all 0.2s;

  &:hover {
    color: var(--anzhiyu-main);
  }
}

#post-metas .post-tag-item {
  display: inline-flex;
  align-items: center;
}

#post-metas .post-commentcount {
  cursor: pointer;
}

.post-title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.2;
  text-align: left;
  padding-bottom: 1rem;
}

.main-hero-waves-area {
  position: absolute;
  bottom: -11px;
  left: 0;
  z-index: 5;
  width: 100%;
  pointer-events: none;
}

.waves-area .waves-svg {
  width: 100%;
  height: 3.75rem;
}

.parallax > use {
  animation: move-forever 25s cubic-bezier(0.55, 0.5, 0.45, 0.5) infinite;
  will-change: transform;
}

.parallax > use:nth-child(1) {
  fill: #f7f9febd;
  animation-duration: 7s;
  animation-delay: -2s;
}

.parallax > use:nth-child(2) {
  fill: #f7f9fe82;
  animation-duration: 10s;
  animation-delay: -3s;
}

.parallax > use:nth-child(3) {
  fill: #f7f9fe36;
  animation-duration: 13s;
  animation-delay: -4s;
}

.parallax > use:nth-child(4) {
  fill: #f7f9fe;
  animation-duration: 20s;
  animation-delay: -5s;
}

@keyframes move-forever {
  0% {
    transform: translate3d(-90px, 0, 0);
  }

  100% {
    transform: translate3d(85px, 0, 0);
  }
}

[data-theme="dark"] .parallax {
  & > use:nth-child(1) {
    fill: #18171dc8;
  }

  & > use:nth-child(2) {
    fill: #18171d80;
  }

  & > use:nth-child(3) {
    fill: #18171d3e;
  }

  & > use:nth-child(4) {
    fill: rgb(0 0 0 / 39%);
  }
}
</style>
