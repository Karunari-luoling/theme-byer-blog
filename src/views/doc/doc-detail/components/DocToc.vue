<!--
 * @Description: 文档右侧目录导航
 * @Author: 安知鱼
 * @Date: 2025-12-30
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";

interface TocItem {
  id: string;
  uniqueId: string;
  text: string;
  level: number;
  index: number;
}

const props = defineProps<{
  contentHtml: string;
}>();

// 目录数据
const tocItems = ref<TocItem[]>([]);
const activeTocId = ref<string | null>(null);
const tocRef = ref<HTMLElement | null>(null);

const isClickScrolling = ref(false);
let scrollTimer: number | null = null;
let hashUpdateTimer: number | null = null;
let tocScrollTimer: number | null = null;
let headingElements: HTMLElement[] = [];
let lastActiveId: string | null = null;
let rafId: number | null = null;

// 从 HTML 中提取标题
const parseHeadings = () => {
  if (!props.contentHtml || typeof document === "undefined") {
    tocItems.value = [];
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(props.contentHtml, "text/html");
  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const newTocItems: TocItem[] = [];
  const idCountMap = new Map<string, number>();

  let index = 0;
  headings.forEach(heading => {
    const originalId =
      heading.id ||
      heading.textContent?.trim().replace(/\s+/g, "-").toLowerCase() ||
      `heading-${index}`;
    const text = heading.textContent?.trim() || "";

    if (text) {
      const count = idCountMap.get(originalId) || 0;
      idCountMap.set(originalId, count + 1);
      const uniqueId = count === 0 ? originalId : `${originalId}-${count}`;

      newTocItems.push({
        id: originalId,
        uniqueId,
        text,
        level: parseInt(heading.tagName.substring(1), 10),
        index
      });
      index++;
    }
  });

  tocItems.value = newTocItems;
};

// 初始化标题元素引用
const initHeadingElements = () => {
  // 获取标题元素 - 选择 .post-content 内的所有 h1-h6
  const headingSelector = "h1, h2, h3, h4, h5, h6";
  const contentEl =
    document.querySelector("#doc-article-container") ||
    document.querySelector(".post-content");
  const allHeadings = Array.from(
    (contentEl || document).querySelectorAll(headingSelector)
  );

  // 过滤掉空标题，只保留有文本内容的
  headingElements = allHeadings.filter(el =>
    el.textContent?.trim()
  ) as HTMLElement[];

  if (headingElements.length === 0) return;

  // 为没有 id 的标题动态添加 id
  headingElements.forEach((el, index) => {
    if (!el.id) {
      const text = el.textContent?.trim().replace(/\s+/g, "-").toLowerCase();
      el.id = text || `heading-${index}`;
    }
  });

  // 初始化时计算一次激活状态
  updateActiveHeading();
};

// 使用 requestAnimationFrame 节流的滚动处理
const onScroll = () => {
  if (rafId !== null) return;

  rafId = requestAnimationFrame(() => {
    rafId = null;

    if (isClickScrolling.value) return;

    updateActiveHeading();
  });
};

// 更新激活的标题
const updateActiveHeading = () => {
  if (headingElements.length === 0) return;

  let activeIndex = -1;
  const headerOffset = 100; // header 高度 + 一些余量

  // 找到当前滚动位置下最近的标题
  for (let i = 0; i < headingElements.length; i++) {
    const rect = headingElements[i].getBoundingClientRect();
    if (rect.top <= headerOffset) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // 如果没有找到（页面顶部），激活第一个
  if (activeIndex === -1 && headingElements.length > 0) {
    activeIndex = 0;
  }

  if (activeIndex >= 0 && tocItems.value[activeIndex]) {
    setActiveHeading(activeIndex);
  }
};

// 设置激活的标题
const setActiveHeading = (index: number) => {
  const item = tocItems.value[index];
  if (!item) return;

  const newActiveUniqueId = item.uniqueId;

  if (activeTocId.value !== newActiveUniqueId) {
    activeTocId.value = newActiveUniqueId;

    // 延迟更新 URL hash（防抖 500ms）
    const newOriginalId = item.id;
    if (newOriginalId !== lastActiveId) {
      lastActiveId = newOriginalId;
      if (hashUpdateTimer) clearTimeout(hashUpdateTimer);
      hashUpdateTimer = window.setTimeout(() => {
        history.replaceState(history.state, "", `#${newOriginalId}`);
      }, 500);
    }
  }
};

// 点击跳转
const scrollToHeading = (event: MouseEvent, item: TocItem) => {
  event.preventDefault();
  activeTocId.value = item.uniqueId;
  lastActiveId = item.id;
  history.replaceState(history.state, "", `#${item.id}`);
  isClickScrolling.value = true;

  const el = headingElements[item.index];
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }
};

// 滚动目录使激活项可见 - 延迟执行
const scrollActiveIntoView = () => {
  if (tocScrollTimer) clearTimeout(tocScrollTimer);
  tocScrollTimer = window.setTimeout(() => {
    const container = tocRef.value;
    if (!container) return;

    const activeLink = container.querySelector(
      "a.active"
    ) as HTMLElement | null;
    if (!activeLink) return;

    const linkTop = activeLink.offsetTop;
    const linkBottom = linkTop + activeLink.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    const padding = 40;

    if (linkTop < visibleTop + padding) {
      container.scrollTo({
        top: Math.max(linkTop - padding, 0),
        behavior: "smooth"
      });
    } else if (linkBottom > visibleBottom - padding) {
      container.scrollTo({
        top: linkBottom - container.clientHeight + padding,
        behavior: "smooth"
      });
    }
  }, 150);
};

// 滚动结束检测 - 用于清除 isClickScrolling
const onScrollEnd = () => {
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => {
    isClickScrolling.value = false;
  }, 150);
};

// 监听内容变化
watch(
  () => props.contentHtml,
  () => {
    nextTick(() => {
      parseHeadings();
      // 延迟初始化标题元素，确保 DOM 已渲染
      setTimeout(initHeadingElements, 300);
    });
  },
  { immediate: true }
);

// 监听激活项变化
watch(activeTocId, scrollActiveIntoView);

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", onScrollEnd, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("scroll", onScrollEnd);
  if (rafId !== null) cancelAnimationFrame(rafId);
  if (hashUpdateTimer) clearTimeout(hashUpdateTimer);
  if (tocScrollTimer) clearTimeout(tocScrollTimer);
  if (scrollTimer) clearTimeout(scrollTimer);
});
</script>

<template>
  <div class="doc-toc">
    <div class="toc-header">
      <span class="toc-title">On this page</span>
    </div>

    <div class="toc-wrapper">
      <div ref="tocRef" class="toc-content">
        <!-- 目录列表 -->
        <div v-if="tocItems.length > 0" class="toc-list">
          <a
            v-for="item in tocItems"
            :key="item.uniqueId"
            :href="`#${item.id}`"
            class="toc-link"
            :class="[
              `toc-level-${item.level}`,
              { active: activeTocId === item.uniqueId }
            ]"
            @click="scrollToHeading($event, item)"
          >
            {{ item.text }}
          </a>
        </div>

        <!-- 空状态 -->
        <div v-else class="toc-empty">暂无目录</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.doc-toc {
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  padding: 16px 0;
}

.toc-header {
  padding: 0 0 16px;

  .toc-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--anzhiyu-fontcolor);
  }
}

.toc-wrapper {
  position: relative;

  // 顶部渐变遮罩
  &::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    z-index: 1;
    height: 24px;
    pointer-events: none;
    content: "";
    background: linear-gradient(
      to bottom,
      var(--anzhiyu-background) 0%,
      transparent 100%
    );
  }

  // 底部渐变遮罩
  &::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    height: 24px;
    pointer-events: none;
    content: "";
    background: linear-gradient(
      to top,
      var(--anzhiyu-background) 0%,
      transparent 100%
    );
  }
}

.toc-content {
  max-height: calc(100vh - 200px);
  padding: 16px 0;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.toc-list {
  position: relative;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--anzhiyu-card-border);
}

.toc-link {
  position: relative;
  display: block;
  padding: 6px 0 6px 12px;
  margin-left: -1px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--anzhiyu-secondtext);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: var(--anzhiyu-fontcolor);
  }

  &.active {
    font-weight: 500;
    color: #3b82f6;
    border-left-color: #3b82f6;
  }

  // 层级缩进
  &.toc-level-1 {
    padding-left: 12px;
  }

  &.toc-level-2 {
    padding-left: 12px;
  }

  &.toc-level-3 {
    padding-left: 24px;
  }

  &.toc-level-4 {
    padding-left: 36px;
  }

  &.toc-level-5 {
    padding-left: 48px;
  }

  &.toc-level-6 {
    padding-left: 60px;
  }
}

.toc-empty {
  padding: 20px 0;
  text-align: center;
  color: var(--anzhiyu-secondtext);
  font-size: 13px;
}
</style>
