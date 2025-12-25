<!--
 * @Description: 即刻列表组件
 * @Author: 安知鱼
 * @Date: 2025-10-05
-->
<template>
  <div class="essay-list-container">
    <!-- 首次加载时的 loading -->
    <div v-if="loading && essays.length === 0" class="essay-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else-if="essays.length === 0" class="essay-empty">
      <el-empty description="暂无即刻内容" />
    </div>

    <div v-else class="essay-content-wrapper">
      <!-- 布局计算中的 loading 占位（固定高度，遮挡高度变化） -->
      <Transition name="fade-loading">
        <div v-if="!layoutReady" class="layout-loading-placeholder">
          <div class="loading-content">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </div>
      </Transition>

      <!-- 列表容器（一直存在但在计算期间隐藏） -->
      <section
        class="timeline"
        :class="[`page-${currentPage}`, { 'is-hidden': !layoutReady }]"
      >
        <ul
          id="waterfall"
          ref="waterfallRef"
          class="list show"
          :style="{ position: 'relative', height: waterfallHeight + 'px' }"
        >
          <li
            v-for="(essay, index) in essays"
            :key="essay.id"
            :ref="el => setItemRef(el, index)"
            class="bber-item"
            :style="itemPositions[index]"
          >
            <div class="bber-content">
              <p class="datacont" v-html="essay.content" />

              <!-- 图片 -->
              <div
                v-if="essay.image && essay.image.length > 0"
                class="bber-container-img"
              >
                <a
                  v-for="(img, imgIndex) in essay.image"
                  :key="imgIndex"
                  class="bber-content-img"
                  :href="img"
                  :data-fancybox="`essay-${essay.id}`"
                  rel="external nofollow noreferrer"
                  target="_blank"
                >
                  <img
                    :src="img"
                    :alt="`图片 ${imgIndex + 1}`"
                    loading="lazy"
                  />
                </a>
                <div
                  v-for="i in Math.max(0, 3 - essay.image.length)"
                  :key="`noimg-${i}`"
                  class="bber-content-noimg"
                />
              </div>

              <!-- 音乐播放器 -->
              <EssayMusicPlayer
                v-if="essay.aplayer && essay.aplayer.id"
                :music-id="essay.aplayer.id"
                @loaded="handleMusicLoaded"
              />
            </div>

            <hr />

            <div class="bber-bottom">
              <div class="bber-info">
                <div class="bber-info-time">
                  <i class="anzhiyufont anzhiyu-icon-clock" />
                  <time
                    class="datatime"
                    :datetime="essay.created_at"
                    style="display: inline"
                  >
                    {{ formatRelativeTime(essay.created_at) }}
                  </time>
                </div>
                <a
                  v-if="essay.link"
                  class="bber-content-link"
                  title="在新窗口打开链接"
                  :href="essay.link"
                  :rel="isExternalLink(essay.link) ? 'external nofollow' : ''"
                  target="_blank"
                  @click="handleLinkClick($event, essay.link)"
                >
                  <i class="anzhiyufont anzhiyu-icon-link" />链接
                </a>
                <div v-if="essay.from" class="bber-info-from">
                  <i class="anzhiyufont anzhiyu-icon-fw-fire" />
                  <span>{{ essay.from }}</span>
                </div>
                <div v-if="essay.address" class="bber-info-from">
                  <i class="anzhiyufont anzhiyu-icon-location-dot" />
                  <span>{{ essay.address }}</span>
                </div>
              </div>
              <div class="bber-reply" @click="handleComment(essay)">
                <IconifyIconOffline icon="ri:chat-1-fill" class="w-6 h-6" />
              </div>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <!-- 分页 -->
    <nav
      v-if="totalPages > 1 && layoutReady"
      id="essay-pagination"
      class="essay-pagination"
    >
      <div
        v-if="currentPage > 1"
        class="extend prev"
        @click="handlePageChange(currentPage - 1)"
      >
        <i class="anzhiyufont anzhiyu-icon-chevron-left" />
        <div class="pagination_tips_prev">上页</div>
      </div>

      <div class="pagination">
        <div
          class="page-number"
          :class="{ current: 1 === currentPage }"
          @click="handlePageChange(1)"
        >
          1
        </div>

        <span v-if="showStartEllipsis" class="space">…</span>

        <div
          v-for="p in pageNumbers"
          :key="p"
          class="page-number"
          :class="{ current: p === currentPage }"
          @click="handlePageChange(p)"
        >
          {{ p }}
        </div>

        <span v-if="showEndEllipsis" class="space">…</span>

        <div
          v-if="totalPages > 1"
          class="page-number"
          :class="{ current: totalPages === currentPage }"
          @click="handlePageChange(totalPages)"
        >
          {{ totalPages }}
        </div>

        <div class="toPageGroup">
          <div class="extend">
            <i class="anzhiyufont anzhiyu-icon-angles-right" />
          </div>
          <input
            v-model="jumpPage"
            class="toPageText"
            type="text"
            inputmode="numeric"
            maxlength="3"
            aria-label="toPage"
            @keyup.enter="goToPage"
          />
          <div class="toPageButton" @click="goToPage">
            <i class="anzhiyufont anzhiyu-icon-angles-right" />
          </div>
        </div>
      </div>

      <div
        v-if="currentPage < totalPages"
        class="extend next"
        @click="handlePageChange(currentPage + 1)"
      >
        <div class="pagination_tips_next">下页</div>
        <i class="anzhiyufont anzhiyu-icon-chevron-right" />
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import { Loading } from "@element-plus/icons-vue";
import { getPublicEssayList, type EssayData } from "@/api/essay-management";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { formatRelativeTime } from "@/utils/format";
import { useRouter } from "vue-router";
import EssayMusicPlayer from "@/components/EssayMusicPlayer/index.vue";

defineOptions({
  name: "EssayList"
});

const emit = defineEmits<{
  (e: "comment-quote", content: string): void;
}>();

const router = useRouter();
const siteConfigStore = useSiteConfigStore();

// 从配置中获取每页显示数量
const pageSize = computed(
  () => parseInt(siteConfigStore.getSiteConfig?.essay?.limit) || 30
);

const essays = ref<EssayData[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const total = ref(0);
const jumpPage = ref("");

// 瀑布流相关
const waterfallRef = ref<HTMLElement | null>(null);
const itemRefs = ref<(HTMLElement | null)[]>([]);
const itemPositions = ref<Record<number, any>>({});
const waterfallHeight = ref(0);
const columnCount = ref(3); // 默认3列
const gap = 16; // 间隙
const layoutReady = ref(false); // 布局是否已稳定

// 设置 item ref
const setItemRef = (el: any, index: number) => {
  if (el) {
    itemRefs.value[index] = el;
  }
};

// 计算瀑布流布局
const calculateWaterfallLayout = () => {
  console.log("[瀑布流] 开始计算布局");

  if (!waterfallRef.value || itemRefs.value.length === 0) {
    console.log("[瀑布流] 容器或items不存在，退出");
    return;
  }

  const containerWidth = waterfallRef.value.offsetWidth;
  console.log("[瀑布流] 容器宽度:", containerWidth);

  // 根据容器宽度计算列数：大屏3列，中屏2列，小屏1列
  if (containerWidth >= 1200) {
    columnCount.value = 3;
  } else if (containerWidth >= 768) {
    columnCount.value = 2;
  } else {
    columnCount.value = 1;
  }

  console.log(
    "[瀑布流] 列数:",
    columnCount.value,
    "内容数量:",
    itemRefs.value.filter(Boolean).length
  );

  const itemWidth =
    (containerWidth - gap * (columnCount.value - 1)) / columnCount.value;
  const columnHeights = new Array(columnCount.value).fill(0);
  const columnsUsed = new Set<number>(); // 记录哪些列被使用了

  itemRefs.value.forEach((item, index) => {
    if (!item) return;

    // 强制重绘以获取准确的高度
    void item.offsetHeight;

    // 找到最短的列
    const minHeight = Math.min(...columnHeights);
    const minColumnIndex = columnHeights.indexOf(minHeight);
    columnsUsed.add(minColumnIndex); // 标记该列被使用

    // 计算位置
    const left = minColumnIndex * (itemWidth + gap);
    const top = columnHeights[minColumnIndex];

    // 设置位置
    itemPositions.value[index] = {
      position: "absolute",
      width: `${itemWidth}px`,
      left: `${left}px`,
      top: `${top}px`
    };

    // 获取实际高度（包括所有内部内容）
    const itemHeight = item.getBoundingClientRect().height;
    console.log(
      `[瀑布流] Item ${index}: height=${itemHeight}, column=${minColumnIndex}, top=${top}`
    );

    columnHeights[minColumnIndex] = top + itemHeight + gap;
  });

  // 设置容器高度：只取被使用的列中的最大高度
  const usedColumnHeights = Array.from(columnsUsed).map(i => columnHeights[i]);
  const maxHeight =
    usedColumnHeights.length > 0 ? Math.max(...usedColumnHeights) : 0;
  waterfallHeight.value = maxHeight > 0 ? maxHeight - gap : 0;

  console.log("[瀑布流] 所有列高度:", columnHeights);
  console.log("[瀑布流] 使用的列:", Array.from(columnsUsed));
  console.log("[瀑布流] 使用列的高度:", usedColumnHeights);
  console.log("[瀑布流] 最终容器高度:", waterfallHeight.value);

  // 验证高度是否真的应用到了 DOM
  nextTick(() => {
    if (waterfallRef.value) {
      const actualHeight = waterfallRef.value.style.height;
      const computedHeight = waterfallRef.value.offsetHeight;
      console.log(
        "[瀑布流] 验证 - style.height:",
        actualHeight,
        "offsetHeight:",
        computedHeight
      );
    }
  });
};

// 初始化 Fancybox
const initFancybox = () => {
  nextTick(() => {
    // @ts-ignore - Fancybox 类型定义可能不完整
    Fancybox.bind("[data-fancybox]", {
      Toolbar: {
        display: {
          left: [],
          middle: [],
          right: ["close"]
        }
      },
      Images: {
        zoom: true
      },
      caption: false
    });
  });
};

// 判断是否为外部链接
const isExternalLink = (url: string): boolean => {
  if (!url) return false;

  // 以 http:// 或 https:// 开头的被认为是外链
  if (url.startsWith("http://") || url.startsWith("https://")) {
    // 检查是否是当前站点的链接
    try {
      const urlObj = new URL(url);
      const currentHost = window.location.host;
      return urlObj.host !== currentHost;
    } catch {
      return true;
    }
  }

  // 以 / 开头的是内链
  if (url.startsWith("/")) return false;

  // 其他情况（相对路径等）认为是内链
  return false;
};

// 处理链接点击
const handleLinkClick = (event: Event, link: string) => {
  if (!link) return;

  // 阻止默认行为，统一使用 window.open 在新标签页打开
  event.preventDefault();

  // 处理同域名的完整 URL，需要先转换为完整路径
  let finalUrl = link;
  if (
    !isExternalLink(link) &&
    (link.startsWith("http://") || link.startsWith("https://"))
  ) {
    try {
      const urlObj = new URL(link);
      // 重新构建完整 URL（保留 pathname、search、hash）
      finalUrl =
        window.location.origin + urlObj.pathname + urlObj.search + urlObj.hash;
    } catch {
      // URL 解析失败，使用原链接
      finalUrl = link;
    }
  } else if (!link.startsWith("http://") && !link.startsWith("https://")) {
    // 相对路径，转换为完整 URL
    finalUrl = new URL(link, window.location.origin).href;
  }

  window.open(finalUrl, "_blank", "noopener,noreferrer");
};

// 处理评论
const handleComment = (essay: EssayData) => {
  // 移除 HTML 标签
  const div = document.createElement("div");
  div.innerHTML = essay.content;
  const textContent = div.textContent || div.innerText || "";
  const quoteText = textContent.substring(0, 50);
  emit("comment-quote", quoteText);
};

// 等待所有图片加载
const waitForImages = async () => {
  const images = waterfallRef.value?.querySelectorAll("img");
  console.log("[图片] 找到", images?.length || 0, "张图片");

  if (!images || images.length === 0) {
    console.log("[图片] 无图片");
    return;
  }

  let loadedCount = 0;
  let cachedCount = 0;

  const imagePromises = Array.from(images).map((img, index) => {
    if (img.complete && img.naturalHeight !== 0) {
      cachedCount++;
      console.log(`[图片] 图片 ${index} 已缓存`);
      return Promise.resolve<void>(undefined);
    }
    return new Promise<void>(resolve => {
      img.onload = () => {
        loadedCount++;
        console.log(`[图片] 图片 ${index} 加载完成`);
        resolve();
      };
      img.onerror = () => {
        console.log(`[图片] 图片 ${index} 加载失败`);
        resolve();
      };

      // 设置超时，避免某些图片一直不加载（缩短为1秒）
      setTimeout(() => {
        console.log(`[图片] 图片 ${index} 超时`);
        resolve();
      }, 1000);
    });
  });

  await Promise.all(imagePromises);
  console.log(`[图片] 已缓存: ${cachedCount}, 新加载: ${loadedCount}`);
};

// 获取即刻列表
const fetchEssays = async (page = 1) => {
  console.log("[加载] 开始获取即刻列表，页码:", page);
  loading.value = true;

  // 每次加载时都隐藏内容，等布局稳定后再显示，避免高度跳动
  layoutReady.value = false;

  // 重置音乐播放器加载计数
  musicLoadedCount = 0;

  try {
    const response = (await getPublicEssayList({
      page,
      page_size: pageSize.value
    })) as { data: { list: EssayData[]; total: number } };

    essays.value = response.data?.list || [];
    total.value = response.data?.total || 0;
    currentPage.value = page;
    console.log("[加载] 获取到", essays.value.length, "条数据");

    // 统计含有音乐的条目数量
    const musicCount = essays.value.filter(e => e.aplayer?.id).length;
    console.log("[加载] 包含", musicCount, "个音乐播放器");

    // 等待 DOM 更新（内容虽然隐藏但已渲染）
    console.log("[加载] 等待 DOM 渲染...");
    await nextTick();
    console.log("[加载] 容器宽度:", waterfallRef.value?.offsetWidth);
    console.log("[加载] itemRefs 数量:", itemRefs.value.filter(Boolean).length);

    // 等待图片加载（最多1秒）
    console.log("[加载] 等待图片加载...");
    await waitForImages();
    console.log("[加载] 图片加载完成");

    // 计算布局和初始化 Fancybox
    console.log("[加载] 开始计算布局");
    calculateWaterfallLayout();
    initFancybox();

    // 短暂延迟后再次计算，确保布局准确
    await nextTick();
    calculateWaterfallLayout();

    // 立即显示内容
    console.log("[加载] 布局计算完成，显示内容");
    layoutReady.value = true;
    loading.value = false;

    // 如果有音乐播放器，延迟再次计算布局（微调可能的小幅高度变化）
    if (musicCount > 0) {
      console.log("[加载] 检测到音乐播放器，将在延迟后微调布局");
      // 500ms 后微调一次（此时音乐播放器应该已完全加载）
      setTimeout(async () => {
        console.log("[加载] 延迟微调布局");
        await nextTick();
        calculateWaterfallLayout();
      }, 500);
    }

    // 滚动到列表顶部（更精确的定位）
    if (page > 1) {
      nextTick(() => {
        waterfallRef.value?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    }
  } catch (error) {
    console.error("获取即刻列表失败:", error);
    loading.value = false; // 出错时也要关闭 loading
    layoutReady.value = true; // 出错时也要显示内容
  }
};

// 计算总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

// 计算显示的页码
const pageNumbers = computed(() => {
  const page = currentPage.value;
  const totalPagesValue = totalPages.value;
  const showCount = 5;
  const arr = [];

  if (totalPagesValue <= showCount + 2) {
    for (let i = 2; i < totalPagesValue; i++) {
      arr.push(i);
    }
    return arr;
  }

  let start = Math.max(2, page - Math.floor((showCount - 3) / 2));
  let end = Math.min(totalPagesValue - 1, start + showCount - 3);

  if (page < showCount - 1) {
    start = 2;
    end = start + showCount - 3;
  }

  if (page > totalPagesValue - (showCount - 2)) {
    end = totalPagesValue - 1;
    start = end - showCount + 3;
  }

  for (let i = start; i <= end; i++) {
    arr.push(i);
  }

  return arr;
});

// 显示省略号
const showStartEllipsis = computed(
  () => pageNumbers.value.length > 0 && pageNumbers.value[0] > 2
);
const showEndEllipsis = computed(
  () =>
    pageNumbers.value.length > 0 &&
    pageNumbers.value[pageNumbers.value.length - 1] < totalPages.value - 1
);

// 处理分页变化
const handlePageChange = (page: number) => {
  if (page > 0 && page <= totalPages.value && page !== currentPage.value) {
    fetchEssays(page);
  }
};

// 跳转到指定页
const goToPage = () => {
  const pageNum = parseInt(jumpPage.value, 10);
  if (!isNaN(pageNum)) {
    handlePageChange(pageNum);
  }
  jumpPage.value = "";
};

// 处理音乐播放器加载完成（用于微调可能的细微高度差异）
let musicLoadedCount = 0;
let recalculateTimer: NodeJS.Timeout;
const handleMusicLoaded = () => {
  musicLoadedCount++;
  console.log(
    `[音乐播放器] 加载完成 (${musicLoadedCount}/${essays.value.filter(e => e.aplayer?.id).length})`
  );

  // 防抖：避免多个播放器同时加载时频繁计算，50ms后微调
  clearTimeout(recalculateTimer);
  recalculateTimer = setTimeout(async () => {
    if (layoutReady.value) {
      console.log("[音乐播放器] 微调瀑布流布局");
      await nextTick();
      calculateWaterfallLayout();
    }
  }, 50);
};

// 防抖函数
let resizeTimer: NodeJS.Timeout;
const handleResize = () => {
  console.log("[Resize] 窗口大小改变");
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(async () => {
    // 只有在布局就绪后才响应 resize
    if (layoutReady.value) {
      console.log("[Resize] 开始重新计算布局");
      await waitForImages();
      calculateWaterfallLayout();
    } else {
      console.log("[Resize] 布局计算中，等待完成后再重新计算");
      await waitForImages();
      calculateWaterfallLayout();
    }
  }, 200);
};

onMounted(() => {
  console.log("[生命周期] 组件已挂载");
  fetchEssays();
  window.addEventListener("resize", handleResize);
});

// 清理
onBeforeUnmount(() => {
  Fancybox.destroy();
  window.removeEventListener("resize", handleResize);
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
  if (recalculateTimer) {
    clearTimeout(recalculateTimer);
  }
});
</script>

<style scoped lang="scss">
.essay-list-container {
  width: 100%;
  margin-top: 1rem;
}

.essay-loading,
.essay-empty {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: var(--anzhiyu-secondtext);

  .el-icon {
    font-size: 2rem;
  }
}

// 内容包装器
.essay-content-wrapper {
  position: relative;
  width: 100%;
}

// 布局加载占位符（固定高度，遮挡高度变化）
.layout-loading-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 600px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;

  .loading-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    padding: 2rem;

    .el-icon {
      font-size: 2.5rem;
      color: var(--anzhiyu-main);
    }

    span {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--anzhiyu-fontcolor);
    }
  }
}

.timeline {
  width: 100%;
  visibility: visible;
  opacity: 1;
  transition: opacity 0.25s ease;

  &.is-hidden {
    pointer-events: none;
    visibility: hidden;
    opacity: 0;
  }

  .list {
    padding: 0;
    margin: 0;
    list-style: none;
  }
}

// Loading 占位符过渡动画
.fade-loading-enter-active {
  transition: all 0.2s ease-out;
}

.fade-loading-leave-active {
  transition: all 0.25s ease-in;
}

.fade-loading-enter-from {
  opacity: 0;
  transform: scale(0.96);
}

.fade-loading-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.bber-item {
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem 1rem 0.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: all 0.3s ease 0s;

  hr {
    width: 100%;
    margin: 1rem 0;
    border: none;
    border-top: 1px dashed var(--anzhiyu-card-border);
  }
}

.bber-content {
  width: 100%;

  .datacont {
    display: flex;
    flex-direction: column;
    order: 0;
    width: 100%;
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.38;
    color: var(--anzhiyu-fontcolor);
    text-align: justify;
    border-radius: 12px;

    :deep(p) {
      margin: 0.5rem 0;
    }

    :deep(a) {
      color: var(--anzhiyu-main);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.bber-container-img {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;

  .bber-content-img {
    position: relative;
    display: block;
    width: 100%;
    padding-bottom: 100%;
    overflow: hidden;
    text-decoration: none;
    cursor: pointer;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;

    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
  }

  .bber-content-noimg {
    display: none;
  }
}

// 底部信息栏
.bber-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.bber-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.8125rem;

  .bber-info-time,
  .bber-info-from,
  .bber-content-link {
    display: flex;
    gap: 0.2rem;
    align-items: center;
    padding: 0 8px;
    font-size: 0.7rem;
    color: var(--anzhiyu-fontcolor);
    cursor: default;
    background-color: var(--anzhiyu-gray-op);
    border-radius: 20px;

    i {
      font-size: 0.875rem;
    }
  }

  .bber-content-link {
    color: #f56c6c;
    text-decoration: none;
    cursor: pointer;
    background-color: rgb(245 108 108 / 13%);
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 0.7;
    }
  }
}

.bber-reply {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--anzhiyu-secondtext);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }

  &:hover {
    color: var(--anzhiyu-main);
    background: var(--anzhiyu-main-op);
  }
}

// 分页
#essay-pagination {
  position: relative;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  margin: 1rem 0 0;

  .extend {
    width: 5rem;

    &:hover {
      transform: scale(1.03);
    }
  }

  .prev {
    position: absolute;
    left: 0;

    .pagination_tips_prev {
      margin-right: -32px;
      opacity: 0;
      transition: 0.3s;
    }

    &:hover {
      .pagination_tips_prev {
        margin-right: 2px;
        white-space: nowrap;
        filter: none;
        opacity: 1;
      }
    }
  }

  .next {
    position: absolute;
    right: 0;

    .pagination_tips_next {
      margin-left: -32px;
      opacity: 0;
      transition: 0.3s;
    }

    &:hover {
      .pagination_tips_next {
        margin-left: 2px;
        white-space: nowrap;
        filter: none;
        opacity: 1;
      }
    }
  }
}

.essay-pagination .pagination {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.essay-pagination .page-number,
.essay-pagination .extend {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--anzhiyu-fontcolor, #333);
  cursor: pointer;
  background-color: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 8px;
  transition: all 0.3s;
}

.essay-pagination .page-number:hover,
.essay-pagination .extend:hover {
  color: var(--anzhiyu-theme);
  border: var(--style-border-hover);
  box-shadow: var(--anzhiyu-shadow-main);
}

.essay-pagination .current {
  color: var(--anzhiyu-white);
  pointer-events: none;
  background: var(--anzhiyu-main);
  border-color: var(--anzhiyu-main);
}

.essay-pagination .space {
  padding: 0 0.2rem;
}

.essay-pagination .toPageGroup {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  overflow: hidden;
  border: var(--style-border-always);
  border-radius: 8px;
  transition: width 0.3s ease;
}

.essay-pagination .toPageGroup > .extend {
  width: 100%;
  height: 100%;
  border: none;
}

.essay-pagination .toPageGroup .toPageText {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0 2.5rem 0 1rem;
  font-size: 1rem;
  color: var(--anzhiyu-fontcolor);
  background: var(--anzhiyu-card-bg, #fff);
  border: none;
  outline: none;
}

.essay-pagination .toPageGroup .toPageButton {
  position: absolute;
  top: 50%;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.865rem;
  height: 100%;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  transform: translateY(-50%);
}

.essay-pagination .toPageGroup:hover {
  width: 6rem;
  border-color: var(--anzhiyu-main);
  box-shadow: var(--anzhiyu-shadow-main, 0 4px 10px rgb(73 177 245 / 30%));

  .toPageButton {
    height: 30px;
    background: var(--anzhiyu-secondbg);
    border: 1px solid var(--anzhiyu-none);
    border-radius: 4px;
  }
}

.essay-pagination .toPageGroup:hover > .extend {
  opacity: 0;
}

// 响应式设计
@media (width <= 768px) {
  .bber-item {
    padding: 1rem;
  }

  .bber-content .datacont {
    font-size: 0.875rem;
  }

  .bber-info {
    font-size: 0.75rem;
  }

  .bber-container-img {
    gap: 0.375rem;
  }

  #essay-pagination {
    .pagination {
      display: none;
    }

    .extend {
      position: static;
      width: 100%;
      height: 3.125rem;
      line-height: 3.125rem;
      background: var(--anzhiyu-card-bg);
      border: var(--style-border-always);
      border-radius: 12px;
      box-shadow: var(--anzhiyu-shadow-border);

      .pagination_tips_next,
      .pagination_tips_prev {
        margin-right: 0;
        margin-left: 0;
        opacity: 1;
      }

      i {
        display: none;
      }
    }
  }
}
</style>
