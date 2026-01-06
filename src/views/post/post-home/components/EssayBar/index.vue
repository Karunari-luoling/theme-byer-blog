<template>
  <div v-if="showEssayBar" class="essay-bar-container">
    <i
      class="anzhiyufont anzhiyu-icon-jike essay-logo fontbold"
      title="即刻短文"
      @click="goToEssayPage"
    />
    <div
      v-if="essays.length > 0"
      class="essay-carousel-wrapper"
      @click="goToEssayPage"
      @mouseenter="stopCarousel"
      @mouseleave="resumeCarousel"
    >
      <div
        ref="carouselRef"
        class="essay-carousel"
        :style="{ transform: `translateY(-${currentIndex * 30}px)` }"
      >
        <div
          v-for="(essay, index) in displayEssays"
          :key="`${essay.id}-${index}`"
          class="essay-item"
        >
          {{ stripHtmlTags(essay.content) }}
        </div>
      </div>
    </div>
    <div v-else class="essay-carousel-wrapper essay-loading-placeholder">
      <div class="essay-item">加载中...</div>
    </div>
    <a
      v-if="essays.length > 0"
      class="essay-more-btn anzhiyufont anzhiyu-icon-circle-arrow-right"
      title="查看全文"
      @click.prevent="goToEssayPage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import {
  getPublicEssayList,
  type EssayData,
  type EssayListResponse
} from "@/api/essay-management";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

defineOptions({
  name: "EssayBar"
});

const router = useRouter();
const siteConfigStore = useSiteConfigStore();

const essays = ref<EssayData[]>([]);
const carouselRef = ref<HTMLElement | null>(null);
const currentIndex = ref(0);
let intervalId: NodeJS.Timeout | null = null;

// 从配置中获取是否显示即刻条
const showEssayBar = computed(() => {
  const config = siteConfigStore.getSiteConfig?.essay;
  return config?.home_enable === true;
});

// 用于无限循环的展示数组（复制第一条到末尾）
const displayEssays = computed(() => {
  if (essays.value.length === 0) return [];
  if (essays.value.length === 1) return essays.value;
  return [...essays.value, essays.value[0]];
});

// 去除 HTML 标签，只保留纯文本
const stripHtmlTags = (html: string): string => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

// 跳转到即刻页面
const goToEssayPage = () => {
  router.push("/essay");
};

// 获取即刻数据
const fetchEssays = async () => {
  try {
    const response = (await getPublicEssayList({
      page: 1,
      page_size: 10
    })) as { data: EssayListResponse };
    essays.value = response.data?.list || [];

    // 数据加载完成后开始轮播
    if (essays.value.length > 1) {
      startCarousel();
    }
  } catch (error) {
    console.error("获取即刻数据失败:", error);
  }
};

// 开始轮播
const startCarousel = () => {
  stopCarousel();
  intervalId = setInterval(() => {
    currentIndex.value++;

    // 当滚动到复制的第一条时，等动画结束后瞬间跳回真正的第一条
    if (currentIndex.value >= essays.value.length) {
      setTimeout(() => {
        // 移除过渡效果
        if (carouselRef.value) {
          carouselRef.value.style.transition = "none";
        }
        currentIndex.value = 0;

        // 强制重绘后恢复过渡效果
        setTimeout(() => {
          if (carouselRef.value) {
            carouselRef.value.style.transition = "transform 1s ease";
          }
        }, 50);
      }, 1000);
    }
  }, 5000);
};

// 停止轮播
const stopCarousel = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

// 恢复轮播
const resumeCarousel = () => {
  if (essays.value.length > 1) {
    startCarousel();
  }
};

onMounted(() => {
  fetchEssays();
});

onBeforeUnmount(() => {
  stopCarousel();
});
</script>

<style lang="scss" scoped>
.essay-bar-container {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: calc(1400px - 3rem);
  height: 50px;
  padding: 0.5rem 1rem;
  margin: 0 auto;
  font-weight: 700;
  color: var(--anzhiyu-fontcolor);
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-lightblack);
  transition: all 0.3s ease 0s;
  animation: slide-in 0.5s 0s backwards;
}

@media screen and (width<= 1400px) {
  .essay-bar-container {
    max-width: calc(100% - 3rem);
    animation: slide-in 0.6s 0s backwards;
  }
}

@media screen and (width<= 1200px) {
  .essay-bar-container {
    width: auto;
    max-width: 100%;
    margin: 0 1.5rem;
  }
}

.essay-logo {
  margin-right: 1rem;
  font-size: 2rem;
  line-height: 22px;
  transition: all 0.3s ease 0s;
}

.essay-carousel-wrapper {
  flex: 1;
  height: 30px;
  overflow: hidden;
  cursor: pointer;
}

.essay-carousel {
  width: 100%;
  transition: transform 1s ease;
}

.essay-item {
  width: 100%;
  height: 30px;
  padding: 0 0.5rem;
  overflow: hidden;
  font-size: 1rem;
  line-height: 30px;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s ease;

  &:hover {
    color: var(--anzhiyu-main);
  }
}

.essay-more-btn {
  flex-shrink: 0;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: var(--anzhiyu-main);
    transform: translateX(4px);
  }
}

.essay-loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--anzhiyu-secondtext);
  font-size: 0.875rem;
}

@media (width <= 768px) {
  .essay-bar-container {
    padding: 0 1rem;
  }
  .essay-more-btn {
    font-size: 1.125rem;
  }
}
</style>
