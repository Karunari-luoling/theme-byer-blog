<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useSnackbar } from "@/composables/useSnackbar";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useLazyLoading } from "@/composables/useLazyLoading";
import "katex/dist/katex.min.css";
import { ElMessageBox, ElMessage } from "element-plus";
import { getArticle } from "@/api/post";
import { updateArticle, uploadArticleImage } from "@/api/post";
import { getPaymentStatus } from "@/api/payment";

import PaymentDialog from "@/components/PaymentDialog/index.vue";
import OrderQueryDialog from "@/components/OrderQueryDialog/index.vue";
import FullTextHiddenDialog from "@/components/FullTextHiddenDialog/index.vue";
import FrontendEditor from "@/components/FrontendEditor/index.vue";
import LoginDialog from "@/components/LoginDialog/index.vue";
import {
  initAllMusicPlayers,
  registerGlobalMusicFunctions,
  unregisterGlobalMusicFunctions
} from "./music-player-global";

// Fancybox 懒加载，避免影响首屏性能
let Fancybox: any = null;

// Mermaid 缩放功能的清理函数
let mermaidCleanup: (() => void) | null = null;

// Mermaid 虚拟渲染（进入视口再注入 SVG）
let mermaidVirtualObserver: IntersectionObserver | null = null;

/**
 * 初始化 Mermaid 图表的缩放功能
 * 模拟 md-editor-v3 的行为，动态添加 action 按钮
 */
const initMermaidZoom = (container: HTMLElement) => {
  const mermaidContainers = container.matches(".md-editor-mermaid")
    ? [container]
    : Array.from(container.querySelectorAll(".md-editor-mermaid"));
  if (mermaidContainers.length === 0) return;

  const removeEventsMap = new Map<
    Element,
    { removeEvent?: () => void; removeClick?: () => void }
  >();

  // Pin 图标 SVG
  const pinOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-off"><path d="M12 17v5"></path><path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89"></path><path d="m2 2 20 20"></path><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"></path></svg>`;
  const pinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>`;

  // 添加缩放/平移事件
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

    // 触摸事件支持
    let lastTouchDistance = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = (distance - lastTouchDistance) * 0.01;
        scale = Math.max(0.5, Math.min(3, scale + delta));
        lastTouchDistance = distance;
        updateTransform();
      } else if (isDragging && e.touches.length === 1) {
        translateX = e.touches[0].clientX - startX;
        translateY = e.touches[0].clientY - startY;
        updateTransform();
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
      lastTouchDistance = 0;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    el.style.cursor = "grab";
    el.style.overflow = "hidden";

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);

      // 重置变换
      const svg = el.querySelector("svg");
      if (svg) {
        (svg as unknown as HTMLElement).style.transform = "";
      }
      el.style.cursor = "";
      el.removeAttribute("data-grab");
    };
  };

  mermaidContainers.forEach(mm => {
    // 检查是否已有 action div（可能是子元素或兄弟元素）
    let actionDiv = mm.querySelector(".md-editor-mermaid-action");
    // 如果子元素中没有，检查下一个兄弟元素是否是 action div（后端保存的 HTML 结构）
    if (
      !actionDiv &&
      mm.nextElementSibling?.classList.contains("md-editor-mermaid-action")
    ) {
      // 将兄弟元素移动到 mermaid 块内部，以便 CSS 正确定位
      actionDiv = mm.nextElementSibling;
      mm.appendChild(actionDiv);
    }
    if (!actionDiv) {
      // 创建 action div
      const div = document.createElement("div");
      div.className = "md-editor-mermaid-action";
      div.innerHTML = pinOffIcon;
      mm.appendChild(div);
      actionDiv = div;
    }

    const onClick = () => {
      const current = removeEventsMap.get(mm);
      if (current?.removeEvent) {
        // 已启用缩放，点击后禁用
        current.removeEvent();
        mm.removeAttribute("data-grab");
        removeEventsMap.set(mm, { removeClick: current.removeClick });
        actionDiv!.innerHTML = pinOffIcon;
      } else {
        // 未启用缩放，点击后启用
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

  // 返回清理函数
  return () => {
    removeEventsMap.forEach(({ removeEvent, removeClick }) => {
      removeEvent?.();
      removeClick?.();
    });
    removeEventsMap.clear();
  };
};

interface ArticleInfo {
  isReprint: boolean; // 是否为转载文章
  copyrightAuthor?: string; // 原作者
  copyrightUrl?: string; // 原文链接
}

const props = defineProps({
  content: {
    type: String,
    default: "PostContent"
  },
  // Mermaid 虚拟渲染：原始 HTML（包含 SVG），用于按需 slice 注入
  rawContent: {
    type: String,
    default: ""
  },
  // Mermaid 虚拟渲染：id -> slice 索引
  mermaidBlocks: {
    type: Object as () => Record<string, { start: number; end: number }>,
    default: () => ({})
  },
  articleId: {
    type: String,
    required: true
  },
  articleTitle: {
    type: String,
    required: true
  },
  fullTextHiddenConfig: {
    type: Object as () => {
      enabled: boolean;
      button_text?: string;
      modal_top_description?: string;
      qr_code_url?: string;
      input_placeholder?: string;
      initial_visible_height?: number;
      is_content_truncated?: boolean;
    } | null,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

const setupVirtualMermaid = (container: HTMLElement) => {
  // 清理旧 observer
  if (mermaidVirtualObserver) {
    mermaidVirtualObserver.disconnect();
    mermaidVirtualObserver = null;
  }

  if (!props.rawContent || !props.mermaidBlocks) return;
  const blockIds = Object.keys(props.mermaidBlocks);
  if (blockIds.length === 0) return;

  // 找到所有占位符
  const placeholders = container.querySelectorAll<HTMLElement>(
    '.md-editor-mermaid[data-mermaid-virtual="1"][data-mermaid-vid]'
  );
  if (placeholders.length === 0) return;

  mermaidVirtualObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const id = el.getAttribute("data-mermaid-vid") || "";
        const meta = props.mermaidBlocks?.[id];
        if (!meta) {
          mermaidVirtualObserver?.unobserve(el);
          return;
        }

        // 注入原始 mermaid 块 HTML（包含 SVG）
        const blockHtml = props.rawContent.slice(meta.start, meta.end);
        try {
          const range = document.createRange();
          range.selectNode(el);
          const frag = range.createContextualFragment(blockHtml);
          const newNode = frag.firstElementChild as HTMLElement | null;
          if (newNode) {
            el.replaceWith(newNode);
            // 为新注入的 mermaid 块补齐缩放 action
            const cleanupFn = initMermaidZoom(newNode);
            if (cleanupFn) {
              const prevCleanup = mermaidCleanup;
              mermaidCleanup = () => {
                prevCleanup?.();
                cleanupFn();
              };
            }
          } else {
            el.innerHTML = "";
          }
        } catch (e) {
          console.error("[MermaidVirtual] 注入失败:", e);
        } finally {
          mermaidVirtualObserver?.unobserve(el);
        }
      });
    },
    { rootMargin: "800px 0px", threshold: 0.01 }
  );

  placeholders.forEach(el => mermaidVirtualObserver?.observe(el));
};

const emit = defineEmits<{
  "content-updated": [data: { content_html: string; content_markdown: string }];
}>();

// 前台编辑相关状态
const isEditing = ref(false);
const editingContent = ref("");
const editingMarkdown = ref("");
const isSaving = ref(false);
const articleData = ref<any>(null); // 存储完整的文章数据
const accessReason = ref<string>(""); // 访问原因（如管理员权限）

const { showSnackbar } = useSnackbar();
const siteConfigStore = useSiteConfigStore();

// 当前文章信息（从全局事件获取）
const currentArticleInfo = ref<ArticleInfo | null>(null);

// 是否允许复制
const copyEnabled = computed(() => {
  return siteConfigStore.getSiteConfig?.post?.copy?.enable !== false;
});

// 是否携带版权信息
const copyrightEnabled = computed(() => {
  // 兼容两种格式：驼峰和下划线
  const copyConfig = siteConfigStore.getSiteConfig?.post?.copy;
  const enabled =
    copyConfig?.copyrightEnable === true ||
    copyConfig?.copyright_enable === true ||
    copyConfig?.["copyright_enable"] === true;
  console.log("[PostContent] 版权信息配置:", {
    copyrightEnable: copyConfig?.copyrightEnable,
    copyright_enable: copyConfig?.copyright_enable,
    enabled,
    fullConfig: copyConfig
  });
  return enabled;
});

// 获取站点名称
const siteName = computed(() => {
  return siteConfigStore.getSiteConfig?.APP_NAME || "本站";
});

// 获取站长名称
const siteOwnerName = computed(() => {
  return siteConfigStore.getSiteConfig?.frontDesk?.siteOwner?.name || "博主";
});

// 原创文章版权模板
const copyrightOriginalTemplate = computed(() => {
  const copyConfig = siteConfigStore.getSiteConfig?.post?.copy;
  return (
    copyConfig?.copyrightOriginal ||
    copyConfig?.copyright_original ||
    copyConfig?.["copyright_original"] ||
    "本文来自 {siteName}，作者 {author}，转载请注明出处。\n原文地址：{url}"
  );
});

// 转载文章版权模板
const copyrightReprintTemplate = computed(() => {
  const copyConfig = siteConfigStore.getSiteConfig?.post?.copy;
  return (
    copyConfig?.copyrightReprint ||
    copyConfig?.copyright_reprint ||
    copyConfig?.["copyright_reprint"] ||
    "本文转载自 {originalAuthor}，原文地址：{originalUrl}\n当前页面：{currentUrl}"
  );
});

// 初始化懒加载
const { initLazyLoading, reinitialize, cleanup } = useLazyLoading({
  rootMargin: "100px",
  threshold: 0.1,
  showLoading: true
});

const codeMaxLines = computed(
  () => siteConfigStore.getSiteConfig?.post?.code_block?.code_max_lines || 10
);

const postContentRef = ref<HTMLElement | null>(null);

// 支付对话框相关状态
const showPaymentDialog = ref(false);
const currentPaymentData = ref<{
  articleId: string;
  articleTitle: string;
  price: number;
  originalPrice?: number;
  currencyUnit?: string;
} | null>(null);
const availableProviders = ref<string[]>([]);

// 查询订单对话框相关状态
const showOrderQueryDialog = ref(false);

// 全文隐藏相关状态
const showFullTextHiddenDialog = ref(false);
const isFullTextUnlocked = ref(false);
const fullTextOverlayRef = ref<HTMLElement | null>(null);

// 登录对话框相关状态
const showLoginDialog = ref(false);
const loginDialogInitialStep = ref<"check-email" | "register-form">(
  "check-email"
);

// ====== 密码保护内容缓存管理 ======
const PASSWORD_CACHE_KEY = "anheyu_password_unlocked";
const CACHE_EXPIRY_HOURS = 24; // 缓存24小时

// 缓存管理工具函数
const passwordCache = {
  // 存储已解锁的内容ID、内容和标题
  store(contentId: string, content: string = "", title: string = "") {
    try {
      const cache = this.getAll();
      cache[contentId] = {
        unlockedAt: Date.now(),
        articleId: props.articleId,
        content: content,
        title: title
      };
      localStorage.setItem(PASSWORD_CACHE_KEY, JSON.stringify(cache));
      console.log(`🔓 密码缓存已保存: ${contentId}`);
    } catch (error) {
      console.warn("保存密码缓存失败:", error);
    }
  },

  // 检查内容是否已解锁且未过期
  isUnlocked(contentId: string): boolean {
    try {
      const cache = this.getAll();
      const entry = cache[contentId];

      if (!entry) return false;

      // 检查是否过期
      const expiryTime = entry.unlockedAt + CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
      if (Date.now() > expiryTime) {
        // 过期则删除
        this.remove(contentId);
        console.log(`⏰ 密码缓存已过期: ${contentId}`);
        return false;
      }

      // 检查是否为当前文章
      const isValid = entry.articleId === props.articleId;
      if (isValid) {
        console.log(`✅ 密码缓存有效: ${contentId}`);
      }
      return isValid;
    } catch (error) {
      console.warn("检查密码缓存失败:", error);
      return false;
    }
  },

  // 获取所有缓存
  getAll(): Record<
    string,
    { unlockedAt: number; articleId: string; content?: string; title?: string }
  > {
    try {
      const cache = localStorage.getItem(PASSWORD_CACHE_KEY);
      return cache ? JSON.parse(cache) : {};
    } catch (error) {
      console.warn("读取密码缓存失败:", error);
      return {};
    }
  },

  // 移除特定内容的缓存
  remove(contentId: string) {
    try {
      const cache = this.getAll();
      delete cache[contentId];
      localStorage.setItem(PASSWORD_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn("删除密码缓存失败:", error);
    }
  },

  // 清理过期的缓存
  cleanup() {
    try {
      const cache = this.getAll();
      const now = Date.now();
      const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
      let hasChanges = false;

      for (const contentId in cache) {
        if (now - cache[contentId].unlockedAt > expiryTime) {
          delete cache[contentId];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        localStorage.setItem(PASSWORD_CACHE_KEY, JSON.stringify(cache));
        console.log("🧹 过期的密码缓存已清理");
      }
    } catch (error) {
      console.warn("清理密码缓存失败:", error);
    }
  }
};

// 自动解锁已缓存的密码保护内容
const autoUnlockCachedContent = async () => {
  console.log("🔍 检查已缓存的密码保护内容...");

  // 查找所有密码保护内容元素
  const passwordElements = document.querySelectorAll(
    ".password-content-editor-preview"
  );

  for (const element of Array.from(passwordElements)) {
    const contentId = element.getAttribute("data-content-id");
    if (!contentId) continue;

    // 检查是否已缓存且有内容
    const cache = passwordCache.getAll();
    const cachedEntry = cache[contentId];

    if (cachedEntry && passwordCache.isUnlocked(contentId)) {
      console.log(`🔓 使用缓存内容自动解锁: ${contentId}`);

      try {
        // 直接使用缓存的内容，无需调用API
        const protectedContent = cachedEntry.content || "";
        const originalTitle =
          cachedEntry.title ||
          element.getAttribute("data-title") ||
          "密码保护内容";

        // 创建已解锁的内容元素
        const unlockedElement = document.createElement("div");
        unlockedElement.className = "password-content-unlocked";
        unlockedElement.innerHTML = `
          <div class="password-content-header">
            <span class="password-icon">
              <svg t="1757587236982" class="md-editor-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                <path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240z m460 600H232V536h560v304z" fill="#52c41a" p-id="15848"></path>
              </svg>
            </span>
            <span class="password-title">${originalTitle}</span>
            <span class="unlock-badge">已解锁</span>
          </div>
          <div class="password-content-body">
            ${protectedContent}
          </div>
        `;

        // 替换密码保护元素
        element.parentNode?.replaceChild(unlockedElement, element);
        console.log(`✅ 缓存自动解锁成功: ${contentId}`);
      } catch (error) {
        console.warn(`缓存自动解锁出错: ${contentId}`, error);
        // 出错时从缓存中移除
        passwordCache.remove(contentId);
      }
    }
  }
};

const collapsedHeight = computed(() => {
  const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
  // 每行高度约 26px (font-size 1rem * line-height 1.6)，加上 padding 20px
  const height = lines * 26 + 20;
  return `${height}px`;
});

/**
 * 生成版权信息文本
 */
const generateCopyrightText = (): string => {
  const currentUrl = window.location.href;
  const articleInfo = currentArticleInfo.value;

  if (articleInfo?.isReprint) {
    // 转载文章的版权信息
    const author = articleInfo.copyrightAuthor || "原作者";
    const originalUrl = articleInfo.copyrightUrl || "";

    return (
      "\n\n---\n" +
      copyrightReprintTemplate.value
        .replace("{originalAuthor}", author)
        .replace("{originalUrl}", originalUrl)
        .replace("{currentUrl}", currentUrl)
    );
  } else {
    // 原创文章的版权信息
    return (
      "\n\n---\n" +
      copyrightOriginalTemplate.value
        .replace("{siteName}", siteName.value)
        .replace("{author}", siteOwnerName.value)
        .replace("{url}", currentUrl)
    );
  }
};

/**
 * 检查目标元素是否在文章内容区域
 */
const isInArticleContent = (target: HTMLElement): boolean => {
  return !!(
    target.closest(".post-content") || target.closest(".post-detail-content")
  );
};

// 全局复制处理函数 - 用于已发布文章中的代码复制
const handleCodeCopy = (codeElement: HTMLElement) => {
  if (codeElement) {
    navigator.clipboard
      .writeText(codeElement.textContent || "")
      .then(() => {
        showSnackbar("复制成功，复制和转载请标注本文地址");
      })
      .catch(() => {
        showSnackbar("复制失败，请手动复制");
      });
  }
};

/**
 * 处理文本复制事件（Ctrl+C 或右键复制）
 */
const handleTextCopy = (event: ClipboardEvent) => {
  console.log("[PostContent] 复制事件触发");

  // 如果禁止复制
  if (!copyEnabled.value) {
    console.log("[PostContent] 复制已禁用");
    event.preventDefault();
    return;
  }

  console.log(
    "[PostContent] 复制已启用，版权信息启用:",
    copyrightEnabled.value
  );

  // 如果需要携带版权信息
  if (copyrightEnabled.value && event.clipboardData) {
    const selection = window.getSelection();
    console.log("[PostContent] 选择的文本:", selection?.toString());

    if (selection && selection.toString().length > 0) {
      // 检查选择的文本是否在文章内容区域内
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      console.log("[PostContent] 选择范围:", range);

      if (range) {
        const container = range.commonAncestorContainer;
        const target =
          container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : (container as HTMLElement);

        console.log("[PostContent] 目标元素:", target);
        const isInContent = target && isInArticleContent(target);
        console.log("[PostContent] 是否在文章内容区域:", isInContent);

        if (isInContent) {
          const originalText = selection.toString();
          const copyrightText = generateCopyrightText();
          const textWithCopyright = originalText + copyrightText;

          console.log("[PostContent] 原始文本长度:", originalText.length);
          console.log("[PostContent] 版权信息:", copyrightText);
          console.log("[PostContent] 完整文本长度:", textWithCopyright.length);

          event.clipboardData.setData("text/plain", textWithCopyright);
          event.preventDefault();

          // 显示复制成功提示
          showSnackbar("复制成功，复制和转载请标注本文地址");
          console.log("[PostContent] 已添加版权信息并显示提示");
        } else {
          console.log(
            "[PostContent] 选择的文本不在文章内容区域内，不添加版权信息"
          );
        }
      } else {
        console.log("[PostContent] 无法获取选择范围");
      }
    } else {
      console.log("[PostContent] 没有选择的文本");
    }
  } else {
    console.log("[PostContent] 版权信息未启用或没有剪贴板数据");
  }
};

/**
 * 处理文章信息更新事件
 */
const handleArticleInfoUpdate = (event: CustomEvent<ArticleInfo>) => {
  currentArticleInfo.value = event.detail;
  console.log("[PostContent] 文章信息已更新:", event.detail);
};

// 解析付费内容的价格信息
const parsePaidContentData = (paidContentElement: HTMLElement) => {
  let title = "付费内容";
  let price = 0;
  let originalPrice: number | undefined = undefined;
  let currency = "¥";

  // 解析标题
  const titleElement = paidContentElement.querySelector(".paid-title");
  if (titleElement?.textContent?.trim()) {
    title = titleElement.textContent.trim();
  }

  // 解析当前价格
  const currentPriceElement = paidContentElement.querySelector(
    ".paid-current-price"
  );
  if (currentPriceElement?.textContent) {
    const match = currentPriceElement.textContent.match(
      /([^0-9]*)([0-9]+\.?[0-9]*)/
    );
    if (match) {
      if (match[1]) {
        currency = match[1].trim();
      }
      if (match[2]) {
        price = parseFloat(match[2]);
      }
    }
  }

  // 解析原价
  const originalPriceElement = paidContentElement.querySelector(
    ".paid-original-price"
  );
  if (originalPriceElement?.textContent) {
    const match = originalPriceElement.textContent.match(
      /([^0-9]*)([0-9]+\.?[0-9]*)/
    );
    if (match && match[2]) {
      originalPrice = parseFloat(match[2]);
    }
  }

  return {
    title,
    price,
    originalPrice,
    currencyUnit: currency
  };
};

// 处理支付成功
const handlePaymentSuccess = async (data: {
  orderNo: string;
  accessToken: string;
}) => {
  try {
    showSnackbar("支付成功！正在加载完整内容...");

    // 保存访问令牌到本地存储
    const TokenManager = (await import("@/utils/tokenManager")).default;
    TokenManager.saveToken({
      token: data.accessToken,
      articleId: props.articleId,
      orderNo: data.orderNo
    });

    // 使用access_token重新请求文章内容
    const { getArticleContent } = await import("@/api/payment");
    const response = await getArticleContent(props.articleId, {
      access_token: data.accessToken
    });

    if (response.code === 200) {
      // 通知父组件更新文章内容
      emit("content-updated", {
        content_html: response.data.content_html,
        content_markdown: response.data.content_markdown
      });

      showSnackbar("内容已解锁，享受阅读吧！");
      console.log("Payment successful, token saved, content updated:", data);
    } else {
      throw new Error(response.message || "获取文章内容失败");
    }
  } catch (error: any) {
    console.error("重新获取文章内容失败:", error);
    showSnackbar(`内容加载失败: ${error.message}，正在刷新页面...`);
    // 如果重新获取内容失败，则刷新页面作为后备方案
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
};

// 处理密码验证
const handlePasswordVerify = async (passwordElement: HTMLElement) => {
  console.log("🔑 开始密码验证流程...");

  const container = passwordElement.closest(".password-content-locked");
  if (!container) {
    console.error("❌ 无法找到密码容器");
    return;
  }

  const inputElement = container.querySelector(
    ".password-input"
  ) as HTMLInputElement;
  const buttonElement = container.querySelector(
    ".password-verify-btn"
  ) as HTMLButtonElement;
  const errorElement = container.querySelector(
    ".password-error"
  ) as HTMLElement;

  if (!inputElement || !buttonElement) {
    console.error("❌ 密码输入元素缺失");
    return;
  }

  const password = inputElement.value.trim();
  if (!password) {
    inputElement.classList.add("error");
    showSnackbar("请输入密码");
    return;
  }

  // 获取密码保护内容ID
  const passwordContentElement = container.closest(
    ".password-content-editor-preview"
  );
  if (!passwordContentElement) return;

  const passwordContentId =
    passwordContentElement.getAttribute("data-content-id") || "";

  console.log("🔍 获取到的密码保护内容信息:");
  console.log("  - Content ID:", passwordContentId);
  console.log("  - Article ID:", props.articleId);
  console.log("  - Password:", password);

  if (!passwordContentId) {
    console.error("❌ 密码保护内容ID为空");
    showSnackbar("无法获取密码保护内容信息");
    return;
  }

  try {
    // 显示加载状态
    buttonElement.disabled = true;
    const originalText = buttonElement.textContent || "解锁";
    buttonElement.innerHTML = '<div class="btn-loading"></div>';

    // 清除错误状态
    inputElement.classList.remove("error");
    if (errorElement) {
      errorElement.classList.remove("show");
    }

    console.log("🚀 开始调用密码验证API...");

    // 直接使用明文密码验证
    const { verifyPasswordContent } = await import("@/api/payment");

    const response = await verifyPasswordContent(props.articleId, {
      content_id: passwordContentId,
      password: password
    });

    console.log("📡 API响应:", response);

    if (response.code === 200 && response.data.success) {
      // 密码验证成功，替换内容
      const protectedContent = response.data.content || "";

      // 获取原始标题
      const originalTitle =
        passwordContentElement.getAttribute("data-title") || "密码保护内容";

      // 🔓 保存到缓存，下次访问不需要再输入密码
      passwordCache.store(passwordContentId, protectedContent, originalTitle);

      // 创建已解锁的内容元素
      const unlockedElement = document.createElement("div");
      unlockedElement.className = "password-content-unlocked";
      unlockedElement.innerHTML = `
        <div class="password-content-header">
          <span class="password-icon">
            <svg t="1757587236982" class="md-editor-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
              <path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240z m460 600H232V536h560v304z" fill="#52c41a" p-id="15848"></path>
            </svg>
          </span>
          <span class="password-title">${originalTitle}</span>
          <span class="unlock-badge">已解锁</span>
        </div>
        <div class="password-content-body">
          ${protectedContent}
        </div>
      `;

      // 替换密码保护元素
      passwordContentElement.parentNode?.replaceChild(
        unlockedElement,
        passwordContentElement
      );

      showSnackbar("密码验证成功！内容已解锁");
    } else {
      // 密码验证失败
      inputElement.classList.add("error");
      if (errorElement) {
        errorElement.textContent =
          response.data?.message || response.message || "密码错误，请重试";
        errorElement.classList.add("show");
      } else {
        showSnackbar(
          response.data?.message || response.message || "密码错误，请重试"
        );
      }
    }
  } catch (error: any) {
    console.error("密码验证失败:", error);
    inputElement.classList.add("error");
    if (errorElement) {
      errorElement.textContent = "验证失败，请重试";
      errorElement.classList.add("show");
    } else {
      showSnackbar("验证失败，请重试");
    }
  } finally {
    // 恢复按钮状态
    buttonElement.disabled = false;
    buttonElement.textContent = "解锁";
  }
};

// 处理键盘事件
const handleKeydown = (event: Event) => {
  const keyEvent = event as KeyboardEvent;
  const target = keyEvent.target as HTMLElement;

  // 处理密码输入框回车键
  if (keyEvent.key === "Enter" && target.classList.contains("password-input")) {
    event.preventDefault();
    const container = target.closest(".password-content-locked");
    const verifyButton = container?.querySelector(
      ".password-verify-btn"
    ) as HTMLElement;
    if (verifyButton && !verifyButton.hasAttribute("disabled")) {
      handlePasswordVerify(verifyButton);
    }
    return;
  }
};

const handleContentClick = (event: Event) => {
  const target = event.target as HTMLElement;

  // ========== Pro 版特有功能：保留这些事件处理 ==========

  // 处理全文隐藏按钮点击
  const fullTextButton = target.closest(".full-text-hidden-unlock-btn");
  if (fullTextButton) {
    event.preventDefault();
    event.stopPropagation();
    showFullTextHiddenDialog.value = true;
    return;
  }

  // 处理密码验证按钮点击
  const passwordVerifyButton = target.closest(".password-verify-btn");
  if (passwordVerifyButton) {
    event.preventDefault();
    event.stopPropagation();
    handlePasswordVerify(passwordVerifyButton as HTMLElement);
    return;
  }

  // 处理查询订单链接点击
  const queryOrderLink = target.closest(".query-order-link");
  if (queryOrderLink) {
    event.preventDefault();
    event.stopPropagation();
    showOrderQueryDialog.value = true;
    return;
  }

  // 处理付费内容购买按钮点击
  const purchaseButton = target.closest(".purchase-btn");
  if (purchaseButton) {
    event.preventDefault();
    event.stopPropagation();

    // 找到对应的付费内容区域
    const paidContentElement = purchaseButton.closest(
      ".paid-content-editor-preview"
    );
    if (paidContentElement instanceof HTMLElement) {
      // 解析付费内容数据
      const paidData = parsePaidContentData(paidContentElement);

      // 先获取可用的支付方式
      getPaymentStatus()
        .then(response => {
          if (response.code === 200 && response.data?.available_providers) {
            availableProviders.value = response.data.available_providers;
          } else {
            availableProviders.value = [];
          }

          // 检查是否有可用的支付方式
          if (availableProviders.value.length === 0) {
            ElMessage.error("暂无可用的支付方式，请联系管理员配置");
            return;
          }

          // 设置支付对话框数据
          currentPaymentData.value = {
            articleId: props.articleId,
            articleTitle: paidData.title,
            price: paidData.price,
            originalPrice: paidData.originalPrice,
            currencyUnit: paidData.currencyUnit
          };

          // 显示支付对话框
          showPaymentDialog.value = true;
        })
        .catch(error => {
          console.error("获取支付配置失败:", error);
          ElMessage.error("获取支付配置失败，请稍后再试");
        });
    }
    return;
  }

  // 处理登录/注册按钮点击（登录后可见内容区域）
  const loginActionButton = target.closest("[data-login-action]");
  if (loginActionButton instanceof HTMLElement) {
    event.preventDefault();
    event.stopPropagation();

    const action = loginActionButton.getAttribute("data-login-action");
    if (action === "check-email" || action === "register-form") {
      loginDialogInitialStep.value = action;
      showLoginDialog.value = true;
    }
    return;
  }

  // ========== 通用交互：已内置到 HTML 中，无需处理 ==========
  // Tab 切换、代码复制、代码展开等逻辑已由插件内置
  // 如果未来需要添加额外的全局处理逻辑，可以在这里扩展

  // ========== Tip插件点击事件处理（v-html不执行内联事件） ==========
  const tipWrapper = target.closest(".anzhiyu-tip-wrapper") as HTMLElement;
  if (tipWrapper) {
    const tipElement = tipWrapper.querySelector(".anzhiyu-tip") as HTMLElement;
    if (
      (tipElement && tipWrapper.classList.contains("tip-click")) ||
      tipElement?.getAttribute("data-trigger") === "click"
    ) {
      event.preventDefault();
      event.stopPropagation();
      // 切换tip的显示/隐藏状态
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

// ========== Tip插件hover事件委托处理 ==========
// 由于v-html不执行内联事件处理器（onmouseenter/onmouseleave），需要通过事件委托实现
let tipCleanupFns: (() => void)[] = [];

const initTipHoverEvents = (container: HTMLElement) => {
  // 清理之前的事件监听
  tipCleanupFns.forEach(fn => fn());
  tipCleanupFns = [];

  // 查找所有tip wrapper元素
  const tipWrappers = container.querySelectorAll(".anzhiyu-tip-wrapper");

  tipWrappers.forEach(wrapper => {
    const wrapperEl = wrapper as HTMLElement;
    const tipElement = wrapperEl.querySelector(".anzhiyu-tip") as HTMLElement;
    if (!tipElement) return;

    // 检查触发方式，只为hover触发的tip添加事件
    const trigger = tipElement.getAttribute("data-trigger");
    if (trigger === "click") return; // click触发的tip由handleContentClick处理

    // 获取延迟时间（毫秒），默认无延迟
    const delay = parseInt(tipElement.getAttribute("data-delay") || "0", 10);

    // 存储定时器
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const showTip = () => {
      // 清除隐藏定时器
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      // 设置延迟显示
      showTimer = setTimeout(() => {
        tipElement.style.visibility = "visible";
        tipElement.style.opacity = "1";
        tipElement.dataset.visible = "true";
      }, delay);
    };

    const hideTip = () => {
      // 清除显示定时器
      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
      }
      // 设置延迟隐藏（100ms）
      hideTimer = setTimeout(() => {
        tipElement.style.visibility = "hidden";
        tipElement.style.opacity = "0";
        tipElement.dataset.visible = "false";
      }, 100);
    };

    wrapperEl.addEventListener("mouseenter", showTip);
    wrapperEl.addEventListener("mouseleave", hideTip);

    // 添加清理函数
    tipCleanupFns.push(() => {
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
      wrapperEl.removeEventListener("mouseenter", showTip);
      wrapperEl.removeEventListener("mouseleave", hideTip);
    });
  });
};

const cleanupTipHoverEvents = () => {
  tipCleanupFns.forEach(fn => fn());
  tipCleanupFns = [];
};

// 音乐播放器功能已移至 music-player-global.ts

// 处理全文隐藏密码验证成功
const handleFullTextVerifySuccess = (token: string) => {
  console.log("✅ [全文隐藏] 密码验证成功，移除遮罩");
  isFullTextUnlocked.value = true;

  // 通知父组件更新内容
  emit("content-updated", {
    content_html: props.content,
    content_markdown: ""
  });

  // 触发一个自定义事件，让父组件重新加载完整内容
  const event = new CustomEvent("fullTextUnlocked", { detail: { token } });
  window.dispatchEvent(event);
};

// 处理登录成功
const handleLoginSuccess = () => {
  console.log("✅ [登录] 登录成功，刷新页面以加载完整内容");
  // 刷新页面以加载登录后可见的内容
  window.location.reload();
};

// 🔧 SSR 兼容的管理员权限检查
// 在客户端挂载后，重新检查管理员权限状态
const isClientMounted = ref(false);
const shouldRecheckAdminStatus = ref(false);

// 计算是否应该显示全文隐藏遮罩
const shouldShowFullTextOverlay = computed(() => {
  // 检查基本条件
  if (!props.fullTextHiddenConfig?.enabled) return false;
  if (!props.fullTextHiddenConfig?.is_content_truncated) return false;
  if (isFullTextUnlocked.value) return false;

  // 🔧 SSR 兼容性修复：在客户端挂载后，如果检测到管理员权限变化，需要重新评估
  if (props.isAdmin) return false;

  return true;
});

// 添加全文隐藏遮罩
const addFullTextOverlay = () => {
  if (!postContentRef.value) return;
  // 防止重复添加
  if (fullTextOverlayRef.value) return;

  console.log("🔒 [全文隐藏] 添加遮罩层");

  const config = props.fullTextHiddenConfig!;
  const initialHeight = config.initial_visible_height || 300;
  const buttonText = config.button_text || "查看全文";

  // 设置容器样式
  const container = postContentRef.value;
  container.style.position = "relative";
  container.style.maxHeight = `${initialHeight}px`;
  container.style.overflow = "hidden";

  // 创建遮罩层
  const overlay = document.createElement("div");
  overlay.className = "full-text-hidden-overlay";
  overlay.innerHTML = `
    <div class="full-text-hidden-mask"></div>
    <div class="full-text-hidden-actions">
      <button class="full-text-hidden-unlock-btn">
        <i class="anzhiyufont anzhiyu-icon-lock"></i>
        <span>${buttonText}</span>
      </button>
      <div class="full-text-hidden-tip">内容已加密保护</div>
    </div>
  `;

  container.appendChild(overlay);
  fullTextOverlayRef.value = overlay;
};

// 移除全文隐藏遮罩
const removeFullTextOverlay = () => {
  if (!postContentRef.value || !fullTextOverlayRef.value) return;

  console.log("🔓 [全文隐藏] 移除遮罩层");

  const container = postContentRef.value;
  container.style.position = "";
  container.style.maxHeight = "";
  container.style.overflow = "";

  fullTextOverlayRef.value.remove();
  fullTextOverlayRef.value = null;
};

// 为管理员在付费内容块中添加"管理员可见"徽章
const addAdminBadgeToPaidContent = () => {
  if (!postContentRef.value) return;

  // 查找所有付费内容块（编辑器预览格式）
  const paidContentElements = postContentRef.value.querySelectorAll(
    ".paid-content-editor-preview"
  );

  paidContentElements.forEach(element => {
    const header = element.querySelector(".paid-content-header");
    if (!header) return;

    // 检查是否已经添加了徽章，避免重复添加
    if (header.querySelector(".admin-visible-badge")) return;

    // 创建管理员可见徽章
    const adminBadge = document.createElement("span");
    adminBadge.className = "admin-visible-badge";
    adminBadge.innerHTML = `
      <i class="anzhiyufont anzhiyu-icon-admin"></i>
      <span>管理员可见</span>
    `;

    // 插入到 header 的开头
    header.insertBefore(adminBadge, header.firstChild);
  });

  console.log(`已为 ${paidContentElements.length} 个付费内容块添加管理员徽章`);
};

onMounted(async () => {
  // 🔧 标记客户端已挂载
  isClientMounted.value = true;

  // 注册全局音乐播放器函数
  registerGlobalMusicFunctions();

  // 将复制处理函数暴露到全局作用域，供已发布文章中的内联事件使用
  (window as any).__markdownEditorCopyHandler = handleCodeCopy;

  // 监听复制事件
  document.addEventListener("copy", handleTextCopy as EventListener);

  // 监听文章信息更新事件
  window.addEventListener(
    "article-info-update",
    handleArticleInfoUpdate as EventListener
  );

  if (postContentRef.value) {
    postContentRef.value.addEventListener("click", handleContentClick);
    postContentRef.value.addEventListener("keydown", handleKeydown);

    // 初始化懒加载（图片等），尽快启动以保证首屏资源加载
    initLazyLoading(postContentRef.value);

    // 初始化音乐播放器（仅绑定audio事件，点击事件由HTML的onclick处理）
    initAllMusicPlayers(postContentRef.value);

    // 初始化 Mermaid 缩放功能
    mermaidCleanup = initMermaidZoom(postContentRef.value);

    // 初始化 Mermaid 虚拟渲染（进入视口再注入 SVG）
    setupVirtualMermaid(postContentRef.value);

    // 懒加载 Fancybox
    if (!Fancybox) {
      const fancyboxModule = await import("@fancyapps/ui");
      await import("@fancyapps/ui/dist/fancybox/fancybox.css");
      Fancybox = fancyboxModule.Fancybox;
    }

    Fancybox.bind(postContentRef.value, "img:not(a img)", {
      groupAll: true
    });
  }

  // 🔧 清理过期的密码缓存
  passwordCache.cleanup();

  // 🔓 自动解锁已缓存的密码保护内容
  await nextTick();
  autoUnlockCachedContent();

  // 初始化Tip插件的hover事件委托（v-html不执行内联事件处理器）
  // 必须在nextTick之后，确保v-html内容已渲染到DOM
  if (postContentRef.value) {
    initTipHoverEvents(postContentRef.value);
  }

  // 🔧 SSR 客户端挂载后，如果是管理员且有全文隐藏配置，强制重新评估遮罩显示
  if (props.isAdmin && props.fullTextHiddenConfig?.enabled) {
    console.log("🔧 [SSR修复] 检测到管理员权限，移除可能存在的全文隐藏遮罩");
    // 延迟执行，确保其他初始化完成
    setTimeout(() => {
      if (fullTextOverlayRef.value) {
        removeFullTextOverlay();
        console.log("✅ [SSR修复] 已移除管理员用户的全文隐藏遮罩");
      }
    }, 100);
  }

  // 👑 如果是管理员，在付费内容块中添加"管理员可见"提示
  if (props.isAdmin && postContentRef.value) {
    await nextTick();
    addAdminBadgeToPaidContent();
  }
});

onUnmounted(() => {
  // 清理全局音乐播放器函数
  unregisterGlobalMusicFunctions();

  // 移除离开页面提示事件监听
  window.removeEventListener("beforeunload", handleBeforeUnload);

  // 移除复制事件监听
  document.removeEventListener("copy", handleTextCopy as EventListener);
  window.removeEventListener(
    "article-info-update",
    handleArticleInfoUpdate as EventListener
  );

  if (postContentRef.value) {
    postContentRef.value.removeEventListener("click", handleContentClick);
    postContentRef.value.removeEventListener("keydown", handleKeydown);
    Fancybox.unbind(postContentRef.value);
    Fancybox.close(true);
  }
  // 清理 Mermaid 缩放功能
  if (mermaidCleanup) {
    mermaidCleanup();
    mermaidCleanup = null;
  }
  // 清理 Mermaid 虚拟渲染 observer
  if (mermaidVirtualObserver) {
    mermaidVirtualObserver.disconnect();
    mermaidVirtualObserver = null;
  }
  // 清理懒加载资源
  cleanup();
  // 清理Tip插件hover事件
  cleanupTipHoverEvents();
  // 清理全局函数
  delete (window as any).__markdownEditorCopyHandler;
});

// 🔧 监听文章ID变化，重置全文隐藏相关状态
watch(
  () => props.articleId,
  (newId, oldId) => {
    if (newId !== oldId && oldId) {
      console.log(
        `📝 [文章切换] 从 ${oldId} 切换到 ${newId}，重置全文隐藏状态`
      );

      // 重置全文隐藏解锁状态
      isFullTextUnlocked.value = false;

      // 移除旧的遮罩层（如果存在）
      if (fullTextOverlayRef.value && postContentRef.value) {
        postContentRef.value.style.position = "";
        postContentRef.value.style.maxHeight = "";
        postContentRef.value.style.overflow = "";
        fullTextOverlayRef.value.remove();
        fullTextOverlayRef.value = null;
      }
    }
  }
);

// 监听内容变化，重新初始化懒加载
watch(
  () => props.content,
  () => {
    if (postContentRef.value) {
      // 等待 DOM 更新完成后重新初始化懒加载
      setTimeout(() => {
        if (postContentRef.value) {
          reinitialize(postContentRef.value);
          // 重新初始化音乐播放器
          initAllMusicPlayers(postContentRef.value);
          // 重新初始化 Mermaid 缩放功能
          if (mermaidCleanup) {
            mermaidCleanup();
          }
          mermaidCleanup = initMermaidZoom(postContentRef.value);
          // 重新初始化 Mermaid 虚拟渲染
          setupVirtualMermaid(postContentRef.value);
          // 重新绑定 Fancybox
          Fancybox.unbind(postContentRef.value);
          Fancybox.bind(postContentRef.value, "img:not(a img)", {
            groupAll: true
          });
          // 重新初始化Tip插件hover事件
          initTipHoverEvents(postContentRef.value);
          // 👑 如果是管理员，重新添加管理员徽章
          if (props.isAdmin) {
            addAdminBadgeToPaidContent();
          }
        }
      }, 100);
    }
  }
);

// 🔧 监听管理员权限变化（SSR 兼容性修复）
watch(
  () => props.isAdmin,
  (newIsAdmin, oldIsAdmin) => {
    // 只在客户端挂载后且权限状态发生变化时处理
    if (isClientMounted.value && newIsAdmin !== oldIsAdmin) {
      console.log(`🔧 [权限变化] isAdmin: ${oldIsAdmin} -> ${newIsAdmin}`);

      if (
        newIsAdmin &&
        props.fullTextHiddenConfig?.enabled &&
        fullTextOverlayRef.value
      ) {
        // 用户获得管理员权限，移除遮罩
        console.log("🔧 [权限变化] 用户获得管理员权限，移除全文隐藏遮罩");
        removeFullTextOverlay();
      } else if (
        !newIsAdmin &&
        props.fullTextHiddenConfig?.enabled &&
        props.fullTextHiddenConfig?.is_content_truncated &&
        !isFullTextUnlocked.value
      ) {
        // 用户失去管理员权限，添加遮罩
        console.log("🔧 [权限变化] 用户失去管理员权限，添加全文隐藏遮罩");
        if (!fullTextOverlayRef.value) {
          addFullTextOverlay();
        }
      }
    }
  }
);

// 响应式管理全文隐藏遮罩（统一处理所有场景：SSR时序、配置变化、解锁状态）
watch(
  shouldShowFullTextOverlay,
  async shouldShow => {
    await nextTick(); // 确保DOM已更新

    if (shouldShow) {
      // 需要显示遮罩层
      if (!fullTextOverlayRef.value) {
        addFullTextOverlay();
      }
    } else {
      // 需要移除遮罩层
      if (fullTextOverlayRef.value) {
        removeFullTextOverlay();
      }
    }
  },
  { immediate: true } // 立即执行，处理初始状态和SSR场景
);

// ===== 前台编辑功能 =====

// ===== 离开页面保护 =====
// 当处于编辑模式时，离开页面需要提示用户

// 自定义确认弹窗状态
const showLeaveConfirm = ref(false);
let leaveConfirmResolve: ((value: boolean) => void) | null = null;

// 显示离开确认弹窗（返回 Promise）
const showLeaveConfirmDialog = (): Promise<boolean> => {
  return new Promise(resolve => {
    leaveConfirmResolve = resolve;
    showLeaveConfirm.value = true;
  });
};

// 确认离开
const confirmLeave = () => {
  showLeaveConfirm.value = false;
  leaveConfirmResolve?.(true);
  leaveConfirmResolve = null;
};

// 取消离开
const cancelLeave = () => {
  showLeaveConfirm.value = false;
  leaveConfirmResolve?.(false);
  leaveConfirmResolve = null;
};

// beforeunload 事件处理函数
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (isEditing.value) {
    event.preventDefault();
    // 现代浏览器会显示标准的确认对话框
    // 设置 returnValue 是为了兼容旧版浏览器
    event.returnValue = "您正在编辑文章，确定要离开吗？未保存的更改将丢失。";
    return event.returnValue;
  }
};

// 监听编辑模式变化，动态添加/移除 beforeunload 事件
watch(
  isEditing,
  newIsEditing => {
    if (newIsEditing) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  },
  { immediate: true }
);

// Vue Router 路由守卫：阻止路由导航离开
onBeforeRouteLeave(async (to, from, next) => {
  if (isEditing.value) {
    const confirmed = await showLeaveConfirmDialog();
    if (confirmed) {
      // 用户确认离开，移除 beforeunload 事件监听
      window.removeEventListener("beforeunload", handleBeforeUnload);
      next();
    } else {
      // 用户取消，阻止导航
      next(false);
    }
  } else {
    next();
  }
});

// 进入编辑模式
const enterEditMode = async () => {
  if (!props.isAdmin) {
    ElMessage.warning("只有管理员才能编辑文章");
    return;
  }

  try {
    // 使用 API 方法获取完整的文章内容（包括付费、密码保护等完整内容）
    const response = await getArticle(props.articleId);

    if (response.code === 200 && response.data) {
      // 保存完整的文章数据
      articleData.value = response.data;

      editingContent.value = response.data.content_html || props.content;
      editingMarkdown.value = response.data.content_md || "";

      // 如果有访问原因（如管理员权限），保存并显示提示
      if (response.data.access_reason) {
        accessReason.value = response.data.access_reason;
        console.log("📝 访问原因:", accessReason.value);
      }

      isEditing.value = true;

      console.log("✅ 进入编辑模式");
      console.log("  - HTML 长度:", editingContent.value.length);
      console.log("  - Markdown 长度:", editingMarkdown.value.length);
      console.log("  - 文章数据:", {
        title: articleData.value.title,
        tags: articleData.value.post_tag_ids?.length || 0,
        categories: articleData.value.post_category_ids?.length || 0,
        status: articleData.value.status
      });
    } else {
      throw new Error(response.message || "获取文章内容失败");
    }
  } catch (error: any) {
    console.error("进入编辑模式失败:", error);
    ElMessage.error(`进入编辑模式失败: ${error.message || "未知错误"}`);
  }
};

// 退出编辑模式
const exitEditMode = async () => {
  const confirmed = await showLeaveConfirmDialog();
  if (!confirmed) return;

  isEditing.value = false;
  editingContent.value = "";
  editingMarkdown.value = "";
  articleData.value = null;
  accessReason.value = "";

  // 退出编辑模式后，重新初始化懒加载和图片查看器
  await nextTick();
  if (postContentRef.value) {
    // 清理所有图片的懒加载标记，强制重新加载
    const images = postContentRef.value.querySelectorAll(
      "img[data-lazy-processed]"
    );
    images.forEach(img => {
      img.removeAttribute("data-lazy-processed");
      // 如果有 data-src，恢复真实图片
      const dataSrc = img.getAttribute("data-src");
      if (dataSrc) {
        img.setAttribute("src", dataSrc);
        img.removeAttribute("data-src");
      }
    });

    // 重新初始化懒加载
    reinitialize(postContentRef.value);

    // 重新初始化音乐播放器
    initAllMusicPlayers(postContentRef.value);

    // 重新绑定 Fancybox
    if (Fancybox) {
      Fancybox.unbind(postContentRef.value);
      Fancybox.bind(postContentRef.value, "img:not(a img)", {
        groupAll: true
      });
    }
    console.log("✅ 已重新初始化懒加载、音乐播放器和图片查看器");
  }
};

// 验证付费内容（参考后台编辑器）
const validatePaidContent = (markdown: string): boolean => {
  const paidContentRegex = /:::paid-content[\s\S]*?:::/g;
  const matches = markdown.match(paidContentRegex);
  const count = matches ? matches.length : 0;

  if (count > 1) {
    ElMessage.error({
      message:
        "一篇文章只能包含一个付费内容区块，请删除多余的付费内容后再保存。",
      duration: 4000
    });
    return false;
  }

  return true;
};

// 验证密码保护内容（参考后台编辑器）
const validatePasswordContent = (markdown: string): boolean => {
  const passwordContentRegex = /:::password-content[\s\S]*?:::/g;
  const matches = markdown.match(passwordContentRegex);
  const count = matches ? matches.length : 0;

  if (count > 1) {
    ElMessage.error({
      message:
        "一篇文章只能包含一个密码保护内容区块，请删除多余的密码保护内容后再保存。",
      duration: 4000
    });
    return false;
  }

  // 如果有密码保护内容，检查是否包含password字段
  if (count > 0) {
    const passwordContentBlocks = markdown.match(passwordContentRegex);
    for (const block of passwordContentBlocks || []) {
      // 提取开头标签行
      const headerLine = block.split("\n")[0];
      // 检查是否包含password属性
      const passwordMatch = headerLine.match(/password="([^"]*?)"/);

      if (
        !passwordMatch ||
        !passwordMatch[1] ||
        passwordMatch[1].trim() === ""
      ) {
        ElMessage.error({
          message:
            "密码保护内容必须设置密码。请编辑密码保护内容并确保提供有效的密码。",
          duration: 4000
        });
        return false;
      }
    }
  }

  return true;
};

// 保存文章内容
const saveContent = async () => {
  if (isSaving.value) return;

  // 检查是否有完整的文章数据
  if (!articleData.value) {
    ElMessage.error("文章数据不完整，请重新进入编辑模式");
    return;
  }

  try {
    isSaving.value = true;

    // 验证付费内容
    if (!validatePaidContent(editingMarkdown.value)) {
      isSaving.value = false;
      return;
    }

    // 验证密码保护内容
    if (!validatePasswordContent(editingMarkdown.value)) {
      isSaving.value = false;
      return;
    }

    // 构建完整的更新数据（参考后台编辑器）
    const updateData = {
      // 内容字段（必须）
      content_html: editingContent.value,
      content_md: editingMarkdown.value,

      // 保留原有的所有其他字段
      title: articleData.value.title,
      cover_url: articleData.value.cover_url,
      ip_location: articleData.value.ip_location,
      status: articleData.value.status,
      post_tag_ids: articleData.value.post_tag_ids || [],
      post_category_ids: articleData.value.post_category_ids || [],
      home_sort: articleData.value.home_sort || 0,
      pin_sort: articleData.value.pin_sort || 0,
      top_img_url: articleData.value.top_img_url,
      summaries:
        articleData.value.summaries?.filter(s => s && s.trim() !== "") || [],
      primary_color: articleData.value.primary_color,
      is_primary_color_manual: articleData.value.is_primary_color_manual,
      abbrlink: articleData.value.abbrlink,
      copyright: articleData.value.copyright,
      copyright_author: articleData.value.copyright_author,
      copyright_author_href: articleData.value.copyright_author_href,
      copyright_url: articleData.value.copyright_url,
      keywords: articleData.value.keywords,
      custom_published_at: articleData.value.custom_published_at,
      custom_updated_at: articleData.value.custom_updated_at
    };

    console.log("💾 保存文章内容:", {
      html_length: updateData.content_html.length,
      md_length: updateData.content_md.length,
      title: updateData.title,
      tags: updateData.post_tag_ids?.length || 0,
      categories: updateData.post_category_ids?.length || 0,
      status: updateData.status
    });

    // 使用 API 方法更新文章
    const response = await updateArticle(props.articleId, updateData);

    if (response.code === 200) {
      ElMessage.success("保存成功");
      isEditing.value = false;
      articleData.value = null;
      accessReason.value = "";

      // 通知父组件刷新内容
      emit("content-updated", {
        content_html: editingContent.value,
        content_markdown: editingMarkdown.value
      });

      // 🔧 不再自动刷新页面，让用户手动刷新或继续编辑
      // setTimeout(() => {
      //   window.location.reload();
      // }, 500);
    } else {
      throw new Error(response.message || "保存失败");
    }
  } catch (error: any) {
    console.error("保存文章失败:", error);
    ElMessage.error(`保存失败: ${error.message || "未知错误"}`);
  } finally {
    isSaving.value = false;
  }
};

// 编辑器内容更新
const handleEditorUpdate = (html: string) => {
  editingContent.value = html;
};

// 编辑器 Markdown 更新
const handleMarkdownUpdate = (markdown: string) => {
  editingMarkdown.value = markdown;
};

// 图片上传处理
const handleImageUpload = async (file: File): Promise<string> => {
  try {
    const res = await uploadArticleImage(file);
    const url = res?.data?.url;
    if (!url) {
      throw new Error("图片上传失败: 服务器未返回有效URL");
    }
    return url;
  } catch (error: any) {
    console.error("图片上传失败:", error);
    throw new Error(error.message || "图片上传失败，请稍后再试");
  }
};
</script>

<template>
  <div>
    <!-- 管理员全文隐藏提示 -->
    <el-alert
      v-if="isAdmin && fullTextHiddenConfig?.enabled"
      type="success"
      :closable="false"
      show-icon
      class="admin-full-text-hidden-notice"
    >
      <template #title>
        <span class="notice-text">
          <i class="anzhiyufont anzhiyu-icon-admin" style="margin-right: 8px" />
          管理员模式：此文章已启用全文隐藏保护，但您可以查看完整内容（访客将看到受限内容）
        </span>
      </template>
    </el-alert>

    <!-- 管理员编辑按钮 -->
    <div v-if="isAdmin && !isEditing" class="admin-edit-toolbar">
      <el-button type="primary" @click="enterEditMode">
        <i class="anzhiyufont anzhiyu-icon-edit" />
        编辑文章
      </el-button>
    </div>

    <!-- 编辑模式 -->
    <div v-if="isEditing" class="editing-mode post-content">
      <!-- 管理员访问提示 -->
      <el-alert
        v-if="accessReason"
        type="info"
        :closable="true"
        show-icon
        class="admin-access-notice"
      >
        <template #title>
          <span class="notice-text">
            <i
              class="anzhiyufont anzhiyu-icon-info-circle"
              style="margin-right: 8px"
            />
            {{ accessReason }}
          </span>
        </template>
      </el-alert>

      <div class="editing-toolbar">
        <div class="editing-title">
          <i class="anzhiyufont anzhiyu-icon-edit" />
          正在编辑: {{ articleTitle }}
        </div>
        <div class="editing-actions">
          <el-button :loading="isSaving" type="primary" @click="saveContent">
            <i class="anzhiyufont anzhiyu-icon-check" />
            保存
          </el-button>
          <el-button @click="exitEditMode">
            <i class="anzhiyufont anzhiyu-icon-close" />
            取消
          </el-button>
        </div>
      </div>

      <FrontendEditor
        v-model="editingContent"
        placeholder="开始编辑文章内容..."
        :on-upload-image="handleImageUpload"
        @update:model-value="handleEditorUpdate"
        @update:markdown="handleMarkdownUpdate"
      />
    </div>

    <!-- 查看模式 -->
    <article
      v-else
      id="article-container"
      ref="postContentRef"
      class="post-content"
      v-html="content"
    />

    <!-- 支付对话框 -->
    <PaymentDialog
      v-if="currentPaymentData"
      v-model="showPaymentDialog"
      :article-id="currentPaymentData.articleId"
      :article-title="currentPaymentData.articleTitle"
      :price="currentPaymentData.price"
      :original-price="currentPaymentData.originalPrice"
      :currency-unit="currentPaymentData.currencyUnit"
      :available-providers="availableProviders"
      @success="handlePaymentSuccess"
    />

    <!-- 查询订单对话框 -->
    <OrderQueryDialog
      v-model="showOrderQueryDialog"
      :article-id="props.articleId"
      @success="handlePaymentSuccess"
    />

    <!-- 全文隐藏密码验证对话框 -->
    <FullTextHiddenDialog
      v-if="fullTextHiddenConfig"
      v-model="showFullTextHiddenDialog"
      :article-id="props.articleId"
      :config="fullTextHiddenConfig"
      @success="handleFullTextVerifySuccess"
    />

    <!-- 登录对话框 -->
    <LoginDialog
      v-model="showLoginDialog"
      :initial-step="loginDialogInitialStep"
      hideThemeSwitch
      @login-success="handleLoginSuccess"
    />

    <!-- 离开确认弹窗 -->
    <Teleport to="body">
      <Transition name="leave-confirm-fade">
        <div
          v-if="showLeaveConfirm"
          class="leave-confirm-overlay"
          @click.self="cancelLeave"
        >
          <div class="leave-confirm-dialog">
            <div class="leave-confirm-icon">
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div class="leave-confirm-title">离开编辑？</div>
            <div class="leave-confirm-message">未保存的更改将丢失</div>
            <div class="leave-confirm-actions">
              <button class="leave-confirm-btn cancel" @click="cancelLeave">
                继续编辑
              </button>
              <button class="leave-confirm-btn confirm" @click="confirmLeave">
                确定离开
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss">
@use "@/style/post-content.scss";
@use "./editor-code.scss";

// 全文隐藏遮罩样式
.full-text-hidden-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  pointer-events: none;
}

.full-text-hidden-mask {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 250px;
  pointer-events: none;
  content: "";
  background-image: linear-gradient(
    to top,
    var(--anzhiyu-card-bg),
    transparent
  );
}

.full-text-hidden-actions {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  padding: 2rem 0 1.5rem;
  pointer-events: auto;
}

.full-text-hidden-unlock-btn {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.275rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--anzhiyu-white);
  cursor: pointer;
  background: var(--anzhiyu-main);
  border: none;
  border-radius: 50px;
  box-shadow: 0 4px 12px var(--anzhiyu-shadow-main);
  transition: all 0.3s ease;

  i {
    font-size: 1.1rem;
  }

  &:hover {
    box-shadow: 0 6px 16px var(--anzhiyu-shadow-main);
  }

  &:active {
    transform: translateY(0);
  }
}

.full-text-hidden-tip {
  font-size: 0.875rem;
  color: var(--anzhiyu-secondtext);
  opacity: 0.8;
}

// 管理员全文隐藏提示
.admin-full-text-hidden-notice {
  margin-bottom: 1.5rem;

  :deep(.el-alert__content) {
    flex: 1;
  }

  :deep(.el-alert__title) {
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .notice-text {
    font-weight: 500;
  }
}

// 管理员访问提示（编辑模式）
.admin-access-notice {
  margin-bottom: 1rem;

  :deep(.el-alert__content) {
    flex: 1;
  }

  :deep(.el-alert__title) {
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .notice-text {
    display: flex;
    align-items: center;
    font-weight: 500;
  }
}

// 管理员可见徽章（查看模式下的付费内容块）
:deep(.admin-visible-badge) {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  margin-right: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--anzhiyu-white);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

  i {
    font-size: 0.9rem;
  }

  span {
    line-height: 1;
  }
}

// 管理员编辑工具栏
.admin-edit-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;

  .el-button {
    display: flex;
    gap: 6px;
    align-items: center;

    i {
      font-size: 14px;
    }
  }
}

// 编辑模式
.editing-mode {
  margin-bottom: 1.5rem;

  .editing-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    margin-bottom: 12px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;

    .editing-title {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);

      i {
        font-size: 16px;
        color: var(--anzhiyu-main);
      }
    }

    .editing-actions {
      display: flex;
      gap: 8px;

      .el-button {
        display: flex;
        gap: 6px;
        align-items: center;

        i {
          font-size: 14px;
        }
      }
    }
  }
}

@media (width <= 768px) {
  .editing-mode .editing-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;

    .editing-actions {
      width: 100%;

      .el-button {
        flex: 1;
      }
    }
  }
}

// 离开确认弹窗样式
.leave-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.leave-confirm-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
  max-width: 320px;
  padding: 28px 24px 20px;
  text-align: center;
  background: var(--anzhiyu-card-bg);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.leave-confirm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
  color: #faad14;
  background: rgba(250, 173, 20, 0.1);
  border-radius: 50%;
}

.leave-confirm-title {
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.leave-confirm-message {
  margin-bottom: 24px;
  font-size: 14px;
  color: var(--anzhiyu-secondtext);
}

.leave-confirm-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.leave-confirm-btn {
  flex: 1;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  transition: all 0.2s ease;

  &.cancel {
    color: var(--anzhiyu-fontcolor);
    background: var(--anzhiyu-secondbg);

    &:hover {
      background: var(--anzhiyu-background);
    }
  }

  &.confirm {
    color: #fff;
    background: #ff4d4f;

    &:hover {
      background: #ff7875;
    }
  }
}

// 弹窗过渡动画
.leave-confirm-fade-enter-active,
.leave-confirm-fade-leave-active {
  transition: opacity 0.2s ease;

  .leave-confirm-dialog {
    transition: transform 0.2s ease;
  }
}

.leave-confirm-fade-enter-from,
.leave-confirm-fade-leave-to {
  opacity: 0;

  .leave-confirm-dialog {
    transform: scale(0.9);
  }
}
</style>
