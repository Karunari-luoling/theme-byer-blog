<script setup lang="ts">
import {
  type PropType,
  computed,
  ref,
  onMounted,
  onUnmounted,
  watch
} from "vue";
import type { Product } from "@/api/product";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useUserStoreHook } from "@/store/modules/user";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDark } from "@pureadmin/utils";
import { initLazyLoad, destroyLazyLoad } from "@/utils/lazyload";
import CalendarIcon from "@iconify-icons/ri/calendar-line";
import IconifyIconOffline from "@/components/ReIcon/src/iconifyIconOffline";
import StockManageDialog from "../StockManageDialog/index.vue";

gsap.registerPlugin(ScrollTrigger);

const props = defineProps({
  product: {
    type: Object as PropType<Product>,
    required: true
  }
});

const siteConfigStore = useSiteConfigStore();
const userStore = useUserStoreHook();
let ctx: gsap.Context;
let observer: IntersectionObserver | null = null;

// 检查是否为管理员
const isAdmin = computed(() => {
  return userStore.roles.includes("1");
});

// 库存管理对话框
const showStockDialog = ref(false);

// 检查波浪区域是否启用（默认为 true）
const isWavesEnabled = computed(() => {
  return siteConfigStore.siteConfig?.post?.waves?.enable !== false;
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
            trigger: ".product-header-container",
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });

        tl.to(".product-info", {
          scale: 0.8,
          y: 0,
          ease: "none"
        }).to(
          ".product-top-cover",
          {
            scale: 0.5,
            ease: "none"
          },
          "<"
        );
      },

      // 移动端视图
      "(max-width: 768px)": function () {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".product-header-container",
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });

        tl.to(".product-info", {
          scale: 1,
          y: 0,
          ease: "none",
          transformOrigin: "center top"
        }).to(
          ".product-top-cover",
          {
            scale: 1,
            ease: "none"
          },
          "<"
        );
      }
    });
  });
});

onUnmounted(() => {
  ctx.revert();
  destroyLazyLoad(observer);
});

const { isDark } = useDark();

const coverUrl = computed(() => {
  return props.product.cover_url || "";
});

const coverImageRef = ref<HTMLImageElement | null>(null);
const isImageLoaded = ref(false);

const handleImageLoad = () => {
  isImageLoaded.value = true;
};

// 监听商品变化，重置图片加载状态
watch(
  () => props.product.id,
  () => {
    isImageLoaded.value = false;
  }
);

const dynamicStyles = computed(() => {
  if (isDark.value) {
    return {
      "--primary-color": "var(--anzhiyu-main-op-deep)"
    };
  } else {
    return {
      "--primary-color": "var(--anzhiyu-main)"
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

// 库存管理刷新回调
const handleStockRefresh = () => {
  // 可以在这里触发产品数据刷新
  // 如果需要的话，可以通过 emit 通知父组件刷新
};
</script>

<template>
  <div class="product-header-container" :style="dynamicStyles">
    <div class="product-info">
      <div class="product-firstinfo">
        <div class="meta-firstline-top">
          <a class="product-meta-type">商品</a>
        </div>
      </div>
      <h1 class="product-title">{{ product.title }}</h1>
      <p v-if="product.description" class="product-desc">
        {{ product.description }}
      </p>
      <div class="product-meta">
        <div class="meta-firstline" />
        <div class="meta-secondline">
          <el-tooltip
            content="商品创建日期"
            placement="top"
            :show-arrow="false"
          >
            <div>
              <span class="product-meta-date">
                <IconifyIconOffline
                  :icon="CalendarIcon"
                  class="product-meta-icon"
                />
                <time :datetime="product.created_at">{{
                  formatDate(product.created_at)
                }}</time>
              </span>
            </div>
          </el-tooltip>
          <el-tooltip
            v-if="isAdmin"
            content="库存管理"
            placement="top"
            :show-arrow="false"
          >
            <el-button
              class="stock-manage-btn"
              size="small"
              type="primary"
              @click="showStockDialog = true"
            >
              <IconifyIconOffline
                icon="ri:box-3-line"
                class="product-meta-icon"
              />
              库存管理
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>
    <div class="product-top-cover">
      <img
        v-if="coverUrl"
        ref="coverImageRef"
        :key="product.id || coverUrl"
        class="product-top-bg"
        :class="{ 'is-loaded': isImageLoaded }"
        :src="coverUrl"
        :alt="product.title"
        @load="handleImageLoad"
      />
    </div>
    <section v-if="isWavesEnabled" class="main-hero-waves-area waves-area">
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
    <!-- 当波浪区域关闭时，显示圆角过渡元素 -->
    <div v-if="!isWavesEnabled" class="product-radius-bottom" />
  </div>

  <!-- 库存管理对话框 -->
  <StockManageDialog
    v-if="isAdmin"
    v-model="showStockDialog"
    :product-id="product.id"
    @refresh="handleStockRefresh"
  />
</template>

<style lang="scss" scoped>
.product-header-container {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  height: 30rem;
  min-height: 300px;
  margin-top: 0;
  padding-top: 0;
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
    background-color: var(--primary-color);
    opacity: 1;
    transition: 0s;
  }
}

.product-info {
  position: absolute;
  top: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  max-width: 1400px;
  height: 100%;
  padding: 0 3.75rem;
  margin: 0 auto;
  color: var(--anzhiyu-white);
  text-align: center;
  transform-origin: top left;
  animation: slide-in 0.6s 0s backwards;
}

.product-top-cover {
  position: relative;
  width: 70%;
  height: 100%;
  margin: 0 -20% 0 auto;
  margin-bottom: 0;
  overflow: hidden;
  filter: blur(30px);
  opacity: 0.5;
  transform: rotate(10deg) translateY(30%) scale(2) translateZ(0);
}

.product-top-cover .product-top-bg {
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
    opacity: 0.8;
  }

  &::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    box-shadow: 110px -130px 300px 60px var(--anzhiyu-bar-background) inset;
  }
}

.product-firstinfo .meta-firstline-top {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 1rem;
}

.product-meta-type {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  background: var(--anzhiyu-white-op);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    color: var(--anzhiyu-main);
    background: var(--anzhiyu-white);
  }
}

.product-title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.2;
  text-align: left;
}

.product-desc {
  margin: 0 0 16px;
  font-size: 1.1rem;
  line-height: 1.6;
  opacity: 0.9;
  text-align: left;
}

.product-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 1rem;
  opacity: 0.9;
}

.product-meta .meta-firstline,
.product-meta .meta-secondline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0;
  align-items: center;
}

.product-meta-icon {
  margin-right: 0.4rem;
}

.product-meta-separator {
  margin: 0 0.15rem;
}

.product-meta-date {
  display: inline-flex;
  align-items: center;
  opacity: 0.6;
  transition: 0.3s;
  border-radius: 12px;
  padding: 2px 8px;
  cursor: default;
}

.stock-manage-btn {
  margin-left: 12px;
  background: var(--anzhiyu-white-op);
  backdrop-filter: blur(10px);
  border: 1px solid var(--anzhiyu-white-op);
  color: var(--anzhiyu-white);
  transition: all 0.3s;

  &:hover {
    background: var(--anzhiyu-white);
    color: var(--anzhiyu-main);
    border-color: var(--anzhiyu-white);
  }

  :deep(.product-meta-icon) {
    margin-right: 4px;
  }
}

.main-hero-waves-area {
  position: absolute;
  bottom: -11px;
  left: 0;
  z-index: 5;
  width: 100%;
  pointer-events: none;
}

.product-radius-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 5;
  width: 100%;
  height: 16px;
  background-color: var(--anzhiyu-background);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
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

@media (width <= 768px) {
  .main-hero-waves-area.waves-area {
    display: none;
    visibility: hidden;
  }

  .product-info {
    position: absolute;
    top: auto;
    bottom: 0;
    left: 0;
    gap: 0;
    align-items: center;
    justify-content: normal;
    height: fit-content;
    padding: 11rem 6% 1rem;
    background-image: linear-gradient(
      to bottom,
      var(--anzhiyu-none),
      var(--anzhiyu-main)
    );

    .product-meta {
      align-items: center;
      margin-top: 1rem;
    }

    .product-meta .meta-firstline,
    .product-meta .meta-secondline {
      justify-content: center;
      font-size: 0.75rem;
    }

    .product-title {
      text-align: center;
    }

    .product-desc {
      text-align: center;
    }
  }

  .product-top-cover {
    position: fixed;
    z-index: 1;
    width: 100%;
    height: 30rem;
    margin: 0 0 0 auto;
    filter: blur(0);
    opacity: 1;
    transform: rotate(0) translateY(0) scale(1);

    &::after {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 70%;
      content: "";
      box-shadow: 0 0 105px 99px var(--anzhiyu-main) inset;
    }

    .product-top-bg {
      height: 70%;
      min-height: 18.75rem;
      filter: none;
      border-radius: 0;
      opacity: 1;
    }
  }

  .product-header-container {
    z-index: 1;
    height: 30rem;
    background-color: var(--anzhiyu-main);

    &::before {
      display: none;
    }
  }
}
</style>
