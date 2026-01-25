<!--
 * @Description: 文档内容区域
 * @Author: 安知鱼
 * @Date: 2025-12-30
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import type { Article, DocArticleItem } from "@/api/post/type";
import { useSnackbar } from "@/composables/useSnackbar";
import { useLazyLoading } from "@/composables/useLazyLoading";
import {
  initAllMusicPlayers,
  registerGlobalMusicFunctions,
  unregisterGlobalMusicFunctions
} from "@/views/post/post-detail/components/PostContent/music-player-global";
import "katex/dist/katex.min.css";

// Fancybox 懒加载
let Fancybox: any = null;

// Mermaid 缩放功能的清理函数
let mermaidCleanup: (() => void) | null = null;

const props = defineProps<{
  article: Article;
  siteConfig: any;
  prevDoc?: DocArticleItem | null;
  nextDoc?: DocArticleItem | null;
}>();

const emit = defineEmits<{
  (e: "navigate", docId: string): void;
}>();

const { showSnackbar } = useSnackbar();
const docContentRef = ref<HTMLElement | null>(null);

// 初始化懒加载
const { initLazyLoading, reinitialize, cleanup } = useLazyLoading({
  rootMargin: "100px",
  threshold: 0.1,
  showLoading: true
});

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

// 阅读时间
const readingTime = computed(() => {
  const time = props.article.reading_time || 1;
  return time < 1 ? "< 1 分钟" : `${time} 分钟`;
});

// 导航到其他文档
const navigateToDoc = (docId: string) => {
  emit("navigate", docId);
};

// ========== Mermaid 图表缩放功能 ==========
const initMermaidZoom = (container: HTMLElement) => {
  const mermaidContainers = container.matches(".md-editor-mermaid")
    ? [container]
    : Array.from(container.querySelectorAll(".md-editor-mermaid"));
  if (mermaidContainers.length === 0) return;

  const removeEventsMap = new Map<
    Element,
    { removeEvent?: () => void; removeClick?: () => void }
  >();

  const pinOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-off"><path d="M12 17v5"></path><path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89"></path><path d="m2 2 20 20"></path><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"></path></svg>`;
  const pinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>`;

  const addZoomEvent = (mm: Element) => {
    const el = mm as HTMLElement;
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const updateTransform = () => {
      const svg = el.querySelector("svg");
      if (svg) {
        (svg as unknown as HTMLElement).style.transform =
          `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        (svg as unknown as HTMLElement).style.transformOrigin = "center center";
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.max(0.5, Math.min(3, scale + delta));
      updateTransform();
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      el.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    };

    const onMouseUp = () => {
      isDragging = false;
      el.style.cursor = "grab";
    };

    const onMouseLeave = () => {
      isDragging = false;
      el.style.cursor = "grab";
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mouseleave", onMouseLeave);

    el.style.cursor = "grab";
    el.style.overflow = "hidden";

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mouseleave", onMouseLeave);

      const svg = el.querySelector("svg");
      if (svg) {
        (svg as unknown as HTMLElement).style.transform = "";
      }
      el.style.cursor = "";
      el.removeAttribute("data-grab");
    };
  };

  mermaidContainers.forEach(mm => {
    let actionDiv = mm.querySelector(".md-editor-mermaid-action");
    if (!actionDiv) {
      const div = document.createElement("div");
      div.className = "md-editor-mermaid-action";
      div.innerHTML = pinOffIcon;
      mm.appendChild(div);
      actionDiv = div;
    }

    const onClick = () => {
      const current = removeEventsMap.get(mm);
      if (current?.removeEvent) {
        current.removeEvent();
        mm.removeAttribute("data-grab");
        removeEventsMap.set(mm, { removeClick: current.removeClick });
        actionDiv!.innerHTML = pinOffIcon;
      } else {
        const removeEvent = addZoomEvent(mm);
        mm.setAttribute("data-grab", "");
        removeEventsMap.set(mm, {
          removeEvent,
          removeClick: current?.removeClick
        });
        actionDiv!.innerHTML = pinIcon;
      }
    };

    (actionDiv as HTMLElement).addEventListener("click", onClick);
    removeEventsMap.set(mm, {
      removeClick: () =>
        (actionDiv as HTMLElement).removeEventListener("click", onClick)
    });
  });

  return () => {
    removeEventsMap.forEach(({ removeEvent, removeClick }) => {
      removeEvent?.();
      removeClick?.();
    });
    removeEventsMap.clear();
  };
};

// ========== 代码复制处理 ==========
const handleCodeCopy = (codeElement: HTMLElement) => {
  if (codeElement) {
    navigator.clipboard
      .writeText(codeElement.textContent || "")
      .then(() => {
        showSnackbar("复制成功");
      })
      .catch(() => {
        showSnackbar("复制失败，请手动复制");
      });
  }
};

// ========== Tip插件hover事件委托处理 ==========
let tipCleanupFns: (() => void)[] = [];

const initTipHoverEvents = (container: HTMLElement) => {
  tipCleanupFns.forEach(fn => fn());
  tipCleanupFns = [];

  const tipWrappers = container.querySelectorAll(".anzhiyu-tip-wrapper");

  tipWrappers.forEach(wrapper => {
    const wrapperEl = wrapper as HTMLElement;
    const tipElement = wrapperEl.querySelector(".anzhiyu-tip") as HTMLElement;
    if (!tipElement) return;

    const trigger = tipElement.getAttribute("data-trigger");
    if (trigger === "click") return;

    const showTip = () => {
      tipElement.style.visibility = "visible";
      tipElement.style.opacity = "1";
    };

    const hideTip = () => {
      tipElement.style.visibility = "hidden";
      tipElement.style.opacity = "0";
    };

    wrapperEl.addEventListener("mouseenter", showTip);
    wrapperEl.addEventListener("mouseleave", hideTip);

    tipCleanupFns.push(() => {
      wrapperEl.removeEventListener("mouseenter", showTip);
      wrapperEl.removeEventListener("mouseleave", hideTip);
    });
  });
};

const cleanupTipHoverEvents = () => {
  tipCleanupFns.forEach(fn => fn());
  tipCleanupFns = [];
};

// ========== 内容点击事件处理 ==========
const handleContentClick = (event: Event) => {
  const target = event.target as HTMLElement;

  // Tip插件点击事件处理（v-html不执行内联事件）
  const tipWrapper = target.closest(".anzhiyu-tip-wrapper") as HTMLElement;
  if (tipWrapper) {
    const tipElement = tipWrapper.querySelector(".anzhiyu-tip") as HTMLElement;
    if (
      (tipElement && tipWrapper.classList.contains("tip-click")) ||
      tipElement?.getAttribute("data-trigger") === "click"
    ) {
      event.preventDefault();
      event.stopPropagation();
      if (tipElement.style.visibility === "visible") {
        tipElement.style.visibility = "hidden";
        tipElement.style.opacity = "0";
      } else {
        tipElement.style.visibility = "visible";
        tipElement.style.opacity = "1";
      }
    }
    return;
  }
};

onMounted(async () => {
  // 注册全局音乐播放器函数
  registerGlobalMusicFunctions();

  // 将复制处理函数暴露到全局作用域
  (window as any).__markdownEditorCopyHandler = handleCodeCopy;

  if (docContentRef.value) {
    docContentRef.value.addEventListener("click", handleContentClick);

    // 初始化懒加载
    initLazyLoading(docContentRef.value);

    // 初始化音乐播放器
    initAllMusicPlayers(docContentRef.value);

    // 初始化 Mermaid 缩放功能
    mermaidCleanup = initMermaidZoom(docContentRef.value);

    // 懒加载 Fancybox
    if (!Fancybox) {
      const fancyboxModule = await import("@fancyapps/ui");
      await import("@fancyapps/ui/dist/fancybox/fancybox.css");
      Fancybox = fancyboxModule.Fancybox;
    }

    Fancybox.bind(docContentRef.value, "img:not(a img)", {
      groupAll: true
    });
  }

  // 初始化Tip插件的hover事件委托
  await nextTick();
  if (docContentRef.value) {
    initTipHoverEvents(docContentRef.value);
  }
});

onUnmounted(() => {
  // 清理全局音乐播放器函数
  unregisterGlobalMusicFunctions();

  if (docContentRef.value) {
    docContentRef.value.removeEventListener("click", handleContentClick);
    if (Fancybox) {
      Fancybox.unbind(docContentRef.value);
      Fancybox.close(true);
    }
  }

  // 清理 Mermaid 缩放功能
  if (mermaidCleanup) {
    mermaidCleanup();
    mermaidCleanup = null;
  }

  // 清理懒加载资源
  cleanup();

  // 清理Tip插件hover事件
  cleanupTipHoverEvents();

  // 清理全局函数
  delete (window as any).__markdownEditorCopyHandler;
});

// 监听文章内容变化，重新初始化
watch(
  () => props.article.content_html,
  async () => {
    await nextTick();
    if (docContentRef.value) {
      reinitialize(docContentRef.value);
      initAllMusicPlayers(docContentRef.value);
      if (mermaidCleanup) {
        mermaidCleanup();
      }
      mermaidCleanup = initMermaidZoom(docContentRef.value);
      if (Fancybox) {
        Fancybox.unbind(docContentRef.value);
        Fancybox.bind(docContentRef.value, "img:not(a img)", {
          groupAll: true
        });
      }
      initTipHoverEvents(docContentRef.value);
    }
  }
);
</script>

<template>
  <article class="doc-content">
    <!-- 文档标题区域 -->
    <header class="doc-header">
      <h1 class="doc-title">{{ article.title }}</h1>
      <p
        v-if="article.summaries && article.summaries.length > 0"
        class="doc-subtitle"
      >
        {{ article.summaries[0] }}
      </p>

      <!-- 元信息 -->
      <div class="doc-meta">
        <span class="meta-item">
          <i class="anzhiyufont anzhiyu-icon-calendar" />
          {{ formatDate(article.created_at) }}
        </span>
        <span class="meta-item">
          <i class="anzhiyufont anzhiyu-icon-time" />
          {{ readingTime }} 阅读
        </span>
        <span class="meta-item">
          <i class="anzhiyufont anzhiyu-icon-eye" />
          {{ article.view_count }} 次阅读
        </span>
      </div>
    </header>

    <!-- 文档正文 -->
    <div class="doc-body">
      <article
        id="doc-article-container"
        ref="docContentRef"
        class="post-content"
        v-html="article.content_html || ''"
      />
    </div>

    <!-- 上下篇导航 -->
    <nav v-if="prevDoc || nextDoc" class="doc-nav-footer">
      <div
        v-if="prevDoc"
        class="nav-item nav-prev"
        @click="navigateToDoc(prevDoc.id)"
      >
        <span class="nav-label">
          <i class="anzhiyufont anzhiyu-icon-arrow-left" />
          上一篇
        </span>
        <span class="nav-title">{{ prevDoc.title }}</span>
      </div>
      <div v-else class="nav-item nav-placeholder" />

      <div
        v-if="nextDoc"
        class="nav-item nav-next"
        @click="navigateToDoc(nextDoc.id)"
      >
        <span class="nav-label">
          下一篇
          <i class="anzhiyufont anzhiyu-icon-arrow-right" />
        </span>
        <span class="nav-title">{{ nextDoc.title }}</span>
      </div>
      <div v-else class="nav-item nav-placeholder" />
    </nav>

    <!-- 文档页脚 -->
    <footer class="doc-footer">
      <div class="update-info">
        最后更新于 {{ formatDate(article.updated_at) }}
      </div>
    </footer>
  </article>
</template>

<style lang="scss">
// 引入文章内容通用样式（非 scoped，让 v-html 内容也能应用样式）
@use "@/style/post-content.scss";

.doc-content {
  max-width: 768px;
  margin: 0 auto;
  padding: 40px 24px;
}

.doc-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--anzhiyu-card-border);
}

.doc-title {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.3;
}

.doc-subtitle {
  margin: 0 0 16px;
  font-size: 16px;
  color: var(--anzhiyu-secondtext);
  line-height: 1.6;
}

.doc-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
  color: var(--anzhiyu-secondtext);

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;

    i {
      font-size: 14px;
    }
  }
}

.doc-body {
  min-height: 300px;

  // 文档特殊样式 - 提示框
  :deep(.doc-tip) {
    margin: 16px 0;
    padding: 16px;
    border-left: 4px solid #425aef;
    background-color: rgba(66, 90, 239, 0.08);
    border-radius: 0 8px 8px 0;

    .tip-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 600;
      color: #425aef;
    }
  }

  // 表格样式
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;

    th {
      background-color: var(--anzhiyu-card-bg);
      font-weight: 600;
    }

    th,
    td {
      padding: 12px 16px;
      border: 1px solid var(--anzhiyu-card-border);
      text-align: left;
    }
  }
}

// 上下篇导航
.doc-nav-footer {
  display: flex;
  gap: 16px;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--anzhiyu-card-border);
}

.nav-item {
  flex: 1;
  padding: 16px 20px;
  border-radius: 12px;
  background-color: var(--anzhiyu-card-bg);
  border: 1px solid var(--anzhiyu-card-border);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #425aef;
    box-shadow: 0 4px 12px rgba(66, 90, 239, 0.1);
  }

  &.nav-prev {
    text-align: left;
  }

  &.nav-next {
    text-align: right;
  }

  &.nav-placeholder {
    visibility: hidden;
    cursor: default;
  }
}

.nav-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
  margin-bottom: 6px;

  .nav-next & {
    justify-content: flex-end;
  }

  i {
    font-size: 12px;
  }
}

.nav-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--anzhiyu-fontcolor);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--anzhiyu-card-border);

  .update-info {
    font-size: 13px;
    color: var(--anzhiyu-secondtext);
  }
}

// 响应式
@media (max-width: 768px) {
  .doc-content {
    padding: 24px 16px;
  }

  .doc-title {
    font-size: 24px;
  }

  .doc-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
