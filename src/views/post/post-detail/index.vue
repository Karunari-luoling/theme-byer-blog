<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  provide,
  computed,
  type Ref
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { getPublicArticle, getPublicArticles } from "@/api/post";
import type { Article, ArticleLink } from "@/api/post/type";
import { useLoadingStore } from "@/store/modules/loadingStore";
import { useCommentStore } from "@/store/modules/commentStore";
import { useArticleStore } from "@/store/modules/articleStore";
import { useAppStore } from "@/store/modules/app";
import {
  saveOriginalThemeColors,
  restoreOriginalThemeColors,
  setArticleTheme,
  resetThemeToDefault
} from "@/utils/themeManager";
import { setArticleMetaTags, clearArticleMetaTags } from "@/utils/metaManager";

import PostHeader from "./components/PostHeader/index.vue";
import PostOutdateNotice from "./components/PostOutdateNotice/index.vue";
import PostPreviewNotice from "./components/PostPreviewNotice/index.vue";
import AiSummary from "./components/AiSummary/index.vue";
import PostContent from "./components/PostContent/index.vue";
import PostCopyright from "./components/PostCopyright/index.vue";
import PostTools from "./components/PostTools/index.vue";
import PostPagination from "./components/PostPagination/index.vue";
import RelatedPosts from "./components/RelatedPosts/index.vue";
import CommentBarrage from "./components/CommentBarrage/index.vue";
import PostComment from "../components/PostComment/index.vue";
import Sidebar from "../components/Sidebar/index.vue";
import AIPodcastButton from "@/components/AIPodcastButton/index.vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useUiStore } from "@/store/modules/uiStore";
import { useUserStore } from "@/store/modules/user";
import { storeToRefs } from "pinia";
import { usePostCustomHTML } from "@/composables/usePostCustomHTML";
import { virtualizeMermaidBlocks } from "@/utils/virtualizeMermaid";

defineOptions({
  name: "PostDetail"
});

// --- 核心响应式状态 ---
const route = useRoute();
const router = useRouter();
const article = ref<Article | null>(null);
const recentArticles = ref<ArticleLink[]>([]);
const seriesArticles = ref<Article[]>([]);
const loading = ref(true);
const commentRef = ref<InstanceType<typeof PostComment> | null>(null);

// 全文隐藏相关状态
const FULL_TEXT_TOKEN_KEY = "anheyu_full_text_tokens";

// --- Pinia Stores ---
const loadingStore = useLoadingStore();
const commentStore = useCommentStore();
const articleStore = useArticleStore();
const uiStore = useUiStore();
const { isSidebarVisible } = storeToRefs(uiStore);
const appStore = useAppStore();
const userStore = useUserStore();

// --- 用户权限 ---
const isAdmin = computed(() => userStore.roles.includes("1")); // 1 是管理员组ID
// 使用别名以保持向后兼容
const isAdminReactive = isAdmin;

// --- 计算属性 ---
const seriesCategory = computed(() => {
  if (!article.value) return null;
  return article.value.post_categories.find(cat => cat.is_series) || null;
});

const articleWithCommentCount = computed(() => {
  if (!article.value) return null;
  return {
    ...article.value,
    comment_count: commentStore.totalComments
  };
});

const siteConfigStore = useSiteConfigStore();
const commentBarrageConfig = computed(() => {
  const siteConfig = siteConfigStore.getSiteConfig;
  if (!siteConfig || !siteConfig.GRAVATAR_URL) {
    return null;
  }
  return {
    gravatarUrl: siteConfig.GRAVATAR_URL,
    defaultGravatarType: siteConfig.DEFAULT_GRAVATAR_TYPE
  };
});

const siteConfig = siteConfigStore.getSiteConfig;

const siteName = computed(() => {
  return siteConfig?.APP_NAME || "安和鱼";
});

// 获取系列文章显示篇数配置
const seriesPostCount = computed(() => {
  return siteConfig?.sidebar?.seriesPostCount || 6;
});

const authorInfoConfig = computed(() => {
  return {
    ownerName: siteConfig.frontDesk.siteOwner.name
  };
});

const { isConsoleOpen } = storeToRefs(appStore);

const { isCommentBarrageVisible } = storeToRefs(uiStore);

// 检查评论功能是否启用
const isCommentEnabled = computed(() => {
  return siteConfigStore.getSiteConfig?.comment?.enable === true;
});

// 检查是否处于预览模式（未发布的文章）
const isPreviewMode = computed(() => {
  return article.value?.is_preview === true;
});

// 获取文章页面自定义HTML（支持script执行）
usePostCustomHTML();

// Mermaid 虚拟渲染：避免首屏/TOC 解析时一次性解析大量 SVG DOM
const mermaidVirtualized = computed(() =>
  virtualizeMermaidBlocks(article.value?.content_html || "")
);

const headingTocItems = ref<{ id: string }[]>([]);
const commentIds = ref<string[]>([]);
const allSpyIds = computed(() => [
  ...headingTocItems.value.map(item => item.id),
  ...commentIds.value
]);

provide("seriesCategory", seriesCategory);
provide("seriesArticles", seriesArticles);
provide("recentArticles", recentArticles);
provide(
  "articleContentHtml",
  computed(() => mermaidVirtualized.value.virtualHtml)
);
provide("allSpyIds", allSpyIds);
provide("updateHeadingTocItems", (items: { id: string }[]) => {
  headingTocItems.value = items;
});

// --- 方法与逻辑 ---

/**
 * @description 管理文章主色调主题的逻辑（优化版本）
 * @param articleRef - 文章数据的 ref
 */
const useArticleTheme = (articleRef: Ref<Article | null>) => {
  // 记录上一次的颜色，避免重复设置
  let previousColor: string | undefined = undefined;

  watch(
    () => articleRef.value?.primary_color,
    (newColor, oldColor) => {
      // 如果颜色没有变化，跳过处理
      if (newColor === previousColor) {
        return;
      }

      // 更新记录
      previousColor = newColor;

      // 如果新颜色为空，重置到默认主题色
      if (!newColor) {
        resetThemeToDefault();
      } else {
        setArticleTheme(newColor);
      }
    },
    { immediate: true }
  );

  onMounted(() => {
    // 在mounted时保存当前的主题色作为原始颜色
    saveOriginalThemeColors();
  });

  onUnmounted(() => {
    commentStore.resetStore();
    // 离开文章页时，重置到默认主题色
    resetThemeToDefault();
    clearArticleMetaTags();

    // 移除全文解锁事件监听
    window.removeEventListener(
      "fullTextUnlocked",
      handleFullTextUnlocked as EventListener
    );

    // 清空记录
    previousColor = undefined;
  });
};

useArticleTheme(article);

const handleCommentIdsLoaded = (ids: string[]) => {
  commentIds.value = ids;
};

/**
 * @description 更新文章相关的meta标签
 */
const updateArticleMetaTags = () => {
  if (!article.value) {
    clearArticleMetaTags();
    return;
  }

  const metaData = {
    publishedTime: article.value.created_at,
    modifiedTime: article.value.updated_at,
    author: article.value.copyright_author || undefined,
    tags: article.value.post_tags?.map(tag => tag.name) || [],
    keywords: article.value.keywords || undefined
  };

  setArticleMetaTags(metaData);
};

/**
 * @description 处理支付成功后的内容更新
 * @param data - 更新的文章内容数据
 */
const handleContentUpdated = (data: {
  content_html: string;
  content_markdown: string;
}) => {
  if (article.value) {
    // 更新文章内容
    article.value.content_html = data.content_html;
    if (data.content_markdown) {
      article.value.content_md = data.content_markdown;
    }
    console.log("文章内容已更新:", data);
  }
};

// 全文隐藏token管理
const fullTextTokenManager = {
  // 保存token
  saveToken(articleId: string, token: string) {
    try {
      const tokens = this.getAllTokens();
      tokens[articleId] = {
        token,
        savedAt: Date.now()
      };
      localStorage.setItem(FULL_TEXT_TOKEN_KEY, JSON.stringify(tokens));
      console.log(`✅ [全文隐藏] Token已保存: ${articleId}`);
    } catch (error) {
      console.warn("[全文隐藏] 保存token失败:", error);
    }
  },

  // 获取token
  getToken(articleId: string): string | null {
    try {
      const tokens = this.getAllTokens();
      const entry = tokens[articleId];
      if (!entry) return null;

      // 检查是否过期（24小时）
      const expiryTime = entry.savedAt + 24 * 60 * 60 * 1000;
      if (Date.now() > expiryTime) {
        this.removeToken(articleId);
        console.log(`⏰ [全文隐藏] Token已过期: ${articleId}`);
        return null;
      }

      return entry.token;
    } catch (error) {
      console.warn("[全文隐藏] 获取token失败:", error);
      return null;
    }
  },

  // 获取所有tokens
  getAllTokens(): Record<string, { token: string; savedAt: number }> {
    try {
      const tokens = localStorage.getItem(FULL_TEXT_TOKEN_KEY);
      return tokens ? JSON.parse(tokens) : {};
    } catch (error) {
      console.warn("[全文隐藏] 读取tokens失败:", error);
      return {};
    }
  },

  // 删除token
  removeToken(articleId: string) {
    try {
      const tokens = this.getAllTokens();
      delete tokens[articleId];
      localStorage.setItem(FULL_TEXT_TOKEN_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.warn("[全文隐藏] 删除token失败:", error);
    }
  }
};

/**
 * @description 使用token加载完整内容
 */
const loadFullContentWithToken = async (articleId: string, token: string) => {
  try {
    console.log("📡 [全文隐藏] 使用token请求完整内容...");

    // 使用full_text_token查询参数重新请求文章内容
    const response = await getPublicArticle(articleId, {
      full_text_token: token
    });

    if (response.code === 200 && response.data.content_html) {
      console.log("✅ [全文隐藏] 完整内容加载成功");
      updateArticleContent(response.data);
    } else {
      throw new Error("获取内容失败");
    }
  } catch (error: any) {
    console.error("[全文隐藏] 加载完整内容失败:", error);
    // token可能无效，删除
    fullTextTokenManager.removeToken(articleId);
  }
};

/**
 * @description 更新文章内容的通用方法
 */
const updateArticleContent = (data: any) => {
  if (!article.value) return;

  article.value.content_html = data.content_html;
  if (data.content_md) {
    article.value.content_md = data.content_md;
  }

  // 标记内容不再被截断
  if (article.value.full_text_hidden_config) {
    article.value.full_text_hidden_config.is_content_truncated = false;
  }
};

/**
 * @description 管理员获取完整内容
 */
const loadAdminFullContent = async (articleId: string) => {
  try {
    console.log("🔑 [管理员模式] 获取完整内容...");

    const response = await getPublicArticle(articleId, {
      full_text_token: "admin_bypass"
    });

    if (response.code === 200) {
      updateArticleContent(response.data);
      console.log("✅ [管理员模式] 成功获取完整内容");
    }
  } catch (error) {
    console.error("❌ [管理员模式] 获取完整内容失败:", error);
  }
};

/**
 * @description 从HTML标记中检测全文隐藏配置
 */
const detectFullTextHiddenFromHTML = (html: string) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const marker = tempDiv.querySelector(".full-text-hidden-marker");

  if (marker && marker.getAttribute("data-enabled") === "true") {
    console.log("🔍 [SSR检测] 从HTML标记中检测到全文隐藏配置");
    return {
      enabled: true,
      button_text: marker.getAttribute("data-button-text") || "查看全文",
      initial_visible_height: parseInt(
        marker.getAttribute("data-initial-height") || "300"
      ),
      is_content_truncated: true
    };
  }
  return null;
};

/**
 * @description 处理全文隐藏内容 - 在渲染前确定最终内容
 */
const processFullTextHiddenContent = async (articleId: string) => {
  if (!article.value?.content_html) return;

  // 1. 检测全文隐藏配置
  if (!article.value.full_text_hidden_config) {
    const config = detectFullTextHiddenFromHTML(article.value.content_html);
    if (config) {
      article.value.full_text_hidden_config = config;
      console.log("✅ [SSR检测] 全文隐藏配置已提取:", config);
    }
  }

  const config = article.value.full_text_hidden_config;
  if (!config?.enabled || !config.is_content_truncated) return;

  console.log("🔍 [内容处理] 检测到全文隐藏且内容被截断");

  // 2. 根据用户权限决定内容
  if (isAdmin.value) {
    // 管理员：获取完整内容
    console.log("🔑 [管理员模式] 获取完整内容用于渲染");
    try {
      const fullResponse = await getPublicArticle(articleId, {
        full_text_token: "admin_bypass"
      });
      if (fullResponse.code === 200) {
        updateArticleContent(fullResponse.data);
        console.log("✅ [管理员模式] 成功获取完整内容");
      }
    } catch (error) {
      console.error("❌ [管理员模式] 获取完整内容失败:", error);
    }
  } else {
    // 普通用户：检查是否有保存的token
    const savedToken = fullTextTokenManager.getToken(articleId);
    if (savedToken) {
      console.log("🔑 [全文隐藏] 使用保存的token获取完整内容");
      await loadFullContentWithToken(articleId, savedToken);
    }
    // 如果没有token，保持截断内容，等待用户解锁
  }
};

/**
 * @description 获取页面所需的所有数据
 * @param id - 文章ID
 */
const fetchRequiredData = async (id: string) => {
  // 检查是否有SSR数据且数据是新鲜的
  if (window && window.__INITIAL_DATA__) {
    const initialData = window.__INITIAL_DATA__;

    // 检查数据新鲜度（如果数据超过5分钟，重新获取）
    const dataTimestamp = initialData.__timestamp__;
    const isDataFresh =
      dataTimestamp && Date.now() - dataTimestamp < 5 * 60 * 1000;

    if (isDataFresh) {
      article.value = initialData.data || initialData; // 兼容新旧数据格式
      loading.value = false;
      delete window.__INITIAL_DATA__;

      // SSR场景：设置文章标题到store（与非SSR路径保持一致）
      articleStore.setCurrentArticleTitle(article.value.title);

      // 主题色将由 watch 自动处理，无需显式设置

      nextTick(() => {
        loadingStore.stopLoading();
        // 更新meta标签
        updateArticleMetaTags();
      });

      getPublicArticles({ page: 1, pageSize: 5 }).then(res => {
        recentArticles.value = res.data.list.map(p => ({
          id: p.id,
          title: p.title,
          cover_url: p.cover_url,
          abbrlink: p.abbrlink || "",
          created_at: p.created_at
        }));
      });

      // SSR路径也需要获取系列文章
      if (seriesCategory.value) {
        getPublicArticles({
          category: seriesCategory.value.name,
          pageSize: seriesPostCount.value
        }).then(res => {
          seriesArticles.value = res.data.list;
        });
      }

      // 即使是服务端渲染的数据，也要检查是否有已保存的token并尝试获取完整内容
      await checkAndLoadPaidContent(id);

      // 🔒 检测并处理全文隐藏 - 在渲染前确定最终内容
      await processFullTextHiddenContent(id);

      return;
    } else {
      // 数据过期，清除并重新获取
      delete window.__INITIAL_DATA__;
      console.log("SSR数据已过期，重新获取最新数据");
    }
  }

  if (!article.value) {
    loading.value = true;
  }

  try {
    // 检查是否有已保存的访问令牌
    const TokenManager = (await import("@/utils/tokenManager")).default;
    const validToken = TokenManager.getValidTokenString(id);

    // 构建请求参数，包含已保存的token
    const articleParams: any = {};
    if (validToken) {
      articleParams.access_token = validToken;
      console.log(`[文章加载] 找到已保存的访问令牌:`, validToken);
    }

    const [articleResponse, recentArticlesResponse] = await Promise.all([
      // 使用带token的请求获取文章内容
      validToken
        ? (await import("@/api/payment")).getArticleContent(id, articleParams)
        : getPublicArticle(id),
      getPublicArticles({ page: 1, pageSize: 5 })
    ]);

    article.value = articleResponse.data as Article;
    articleStore.setCurrentArticleTitle(articleResponse.data.title);

    // 更新meta标签
    updateArticleMetaTags();

    // 主题色将由 watch 自动处理，无需显式设置

    if (validToken) {
      console.log(
        `[文章加载] 使用已保存令牌成功获取完整内容，内容长度: ${articleResponse.data.content_html?.length || 0}`
      );
    }

    recentArticles.value = recentArticlesResponse.data.list.map(p => ({
      id: p.id,
      title: p.title,
      cover_url: p.cover_url,
      abbrlink: p.abbrlink || "",
      created_at: p.created_at
    }));

    // 获取系列文章（根据配置的篇数获取）
    if (seriesCategory.value) {
      const seriesResponse = await getPublicArticles({
        category: seriesCategory.value.name,
        pageSize: seriesPostCount.value
      });
      seriesArticles.value = seriesResponse.data.list;
    } else {
      seriesArticles.value = [];
    }

    // 如果有保存的全文隐藏token，尝试自动加载完整内容
    if (article.value) {
      const savedToken = fullTextTokenManager.getToken(id);
      if (
        savedToken &&
        article.value.full_text_hidden_config?.is_content_truncated
      ) {
        console.log("🔑 [全文隐藏] 发现已保存的token，尝试获取完整内容...");
        await loadFullContentWithToken(id, savedToken);
      }
    }
  } catch (err: any) {
    console.error("获取页面数据失败:", err);

    // 检查是否为404错误（文章不存在或已删除）
    if (err?.response?.status === 404) {
      // 跳转到404页面
      router.replace({ path: "/404", query: { from: route.fullPath } });
      return;
    }
  } finally {
    loading.value = false;
    nextTick(() => {
      loadingStore.stopLoading();
    });
  }
};

/**
 * @description 检查并加载付费内容（用于服务端渲染的情况）
 */
const checkAndLoadPaidContent = async (articleId: string) => {
  try {
    const TokenManager = (await import("@/utils/tokenManager")).default;
    const validToken = TokenManager.getValidTokenString(articleId);

    if (validToken && article.value) {
      console.log(`[SSR内容检查] 发现已保存的令牌，尝试获取完整内容`);

      const { getArticleContent } = await import("@/api/payment");
      const response = await getArticleContent(articleId, {
        access_token: validToken
      });

      if (response.code === 200 && response.data.content_html) {
        // 更新文章内容
        article.value.content_html = response.data.content_html;
        if (response.data.content_markdown) {
          article.value.content_md = response.data.content_markdown;
        }
        console.log(
          `[SSR内容检查] 成功获取完整内容，长度: ${response.data.content_html.length}`
        );
      }
    }
  } catch (err: any) {
    console.error("[SSR内容检查] 获取付费内容失败:", err);

    // 如果是404错误，说明文章不存在或已删除
    if (err?.response?.status === 404) {
      // 跳转到404页面
      router.replace({ path: "/404", query: { from: route.fullPath } });
      return;
    }
  }
};

/**
 * @description 滚动到目标元素
 * @param id - 目标元素ID
 */
const scrollToTargetElement = (id: string) => {
  const targetElement = document.getElementById(id);
  if (targetElement) {
    if (id.startsWith("comment-")) {
      commentRef.value?.scrollToComment(id);
    } else {
      targetElement.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }
};

/**
 * @description 处理URL哈希值变化，滚动到对应元素
 * @param hash - URL中的hash值 (例如 #comment-123)
 */
const handleHashChange = (hash: string) => {
  if (!hash) return;

  try {
    const id = decodeURIComponent(hash.slice(1));

    // 立即定位一次
    scrollToTargetElement(id);

    // 图片加载会导致高度变化，多次校正位置
    const delays = [100, 300, 600, 1000, 2000];
    delays.forEach(delay => {
      setTimeout(() => scrollToTargetElement(id), delay);
    });
  } catch (e) {
    console.error("处理URL哈希值失败:", e);
  }
};

onMounted(() => {
  // 监听全文解锁事件
  window.addEventListener(
    "fullTextUnlocked",
    handleFullTextUnlocked as EventListener
  );
});

// 处理全文解锁事件
const handleFullTextUnlocked = async (event: CustomEvent) => {
  const { token } = event.detail;
  const articleId = route.params.id as string;
  if (!articleId || !token) return;

  console.log("🎉 [全文隐藏] 收到解锁事件，保存token并加载完整内容");

  // 保存token
  fullTextTokenManager.saveToken(articleId, token);

  // 加载完整内容
  await loadFullContentWithToken(articleId, token);
};

watch(
  () => route.hash,
  newHash => {
    handleHashChange(newHash);
  }
);

watch(
  () => route.params.id,
  newId => {
    if (newId) {
      fetchRequiredData(newId as string);
    }
  },
  { immediate: true }
);

// 监听文章变化，发送文章信息更新事件（用于复制版权功能）并处理hash定位
watch(
  () => article.value,
  newArticle => {
    if (newArticle) {
      const siteOwnerName = siteConfig.frontDesk?.siteOwner?.name;
      const isReprint =
        newArticle.copyright_author &&
        newArticle.copyright_author !== siteOwnerName;

      window.dispatchEvent(
        new CustomEvent("article-info-update", {
          detail: {
            isReprint,
            copyrightAuthor: newArticle.copyright_author,
            copyrightUrl: newArticle.copyright_url
          }
        })
      );

      // 文章加载完成后处理hash定位
      if (route.hash) {
        handleHashChange(route.hash);
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="post-detail-container">
    <div v-if="loading" class="post-header-placeholder" />

    <PostHeader
      v-else-if="articleWithCommentCount"
      :article="articleWithCommentCount"
    />

    <div class="layout">
      <main
        class="post-content-inner"
        :class="{ 'full-width': !isSidebarVisible }"
      >
        <div v-if="article" class="post-detail-content">
          <!-- 自定义文章顶部HTML（支持script执行） -->
          <div id="post-custom-top" class="custom-post-top" />

          <!-- 预览模式提示（未发布文章） -->
          <PostPreviewNotice
            v-if="isPreviewMode"
            :status="article.status"
            :review-status="article.review_status"
          />

          <AiSummary
            v-if="article.summaries && article.summaries.length > 0"
            :summary="article.summaries"
          />
          <PostOutdateNotice :update-date="article.updated_at" />
          <PostContent
            :content="mermaidVirtualized.virtualHtml"
            :raw-content="mermaidVirtualized.rawHtml"
            :mermaid-blocks="mermaidVirtualized.blocks"
            :article-id="article.id"
            :article-title="article.title"
            :full-text-hidden-config="article.full_text_hidden_config"
            :is-admin="isAdminReactive"
            @content-updated="handleContentUpdated"
          />
          <PostCopyright :article="article" />
          <PostTools :article="article" />
          <PostPagination
            :prev-article="article.prev_article"
            :next-article="article.next_article"
          />
          <!-- 相关文章可以直接在文章详情中获取，最近文章才需要从文章列表获取，这里是相关文章，最近文章数据才通过provide传递 -->
          <RelatedPosts :posts="article.related_articles" />

          <!-- 自定义文章底部HTML（支持script执行） -->
          <div id="post-custom-bottom" class="custom-post-bottom" />

          <!-- 预览模式下禁用评论 -->
          <PostComment
            v-if="!isPreviewMode"
            ref="commentRef"
            :target-path="route.path"
            @comment-ids-loaded="handleCommentIdsLoaded"
          />
        </div>
      </main>
      <Sidebar v-if="!loading && !loadingStore.isLoading" />
    </div>

    <div id="anzhiyu-footer-bar">
      <div class="footer-logo">{{ siteName }}</div>
      <div class="footer-bar-description">
        来自 {{ authorInfoConfig?.ownerName }} 最新设计与科技的文章
      </div>
      <router-link to="/archives" class="footer-bar-link">
        查看全部
      </router-link>
    </div>

    <!-- 预览模式下禁用评论弹幕 -->
    <CommentBarrage
      v-if="
        article && commentBarrageConfig && isCommentEnabled && !isPreviewMode
      "
      v-show="isCommentBarrageVisible && !isConsoleOpen"
      :gravatar-url="commentBarrageConfig.gravatarUrl"
      :default-gravatar-type="commentBarrageConfig.defaultGravatarType"
    />

    <!-- AI播客按钮 - 显示在左下角，音乐胶囊上方 -->
    <AIPodcastButton
      v-if="article && !isPreviewMode"
      :article-id="article.id"
      :article-title="article.title"
      :content-html="article.content_html"
      :primary-color="article.primary_color"
    />
  </div>
</template>

<style lang="scss" scoped>
.post-header-placeholder {
  width: 100%;
  height: 30rem;
  min-height: 300px;

  [data-theme="dark"] & {
    background-color: #18171d;
  }
}

div#anzhiyu-footer-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 140px;
  margin-top: 16px;

  @media screen and (width <= 768px) {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0;
    background: var(--anzhiyu-card-bg);
  }

  .footer-logo {
    padding: 0 5px;
    font-size: 1.6rem;
    font-weight: 900;
    line-height: 3rem;
    letter-spacing: normal;
    transition:
      all 0.3s,
      color 0s,
      opacity 0.3s;
  }

  .footer-bar-description {
    font-weight: 700;
    color: var(--anzhiyu-secondtext);
  }

  .footer-bar-link {
    display: inline-block;
    padding: 4px 16px;
    margin-top: 8px;
    font-size: 14px;
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    background: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    border-radius: 20px;
    transition: all 0.3s ease-out 0s;

    &:hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);
      border-color: var(--anzhiyu-main);
      transform: scale(1.1);
    }
  }
}

.post-content-inner {
  width: calc(100% - 300px);
  transition: width 0.3s ease;

  &::selection {
    color: var(--anzhiyu-white);
    background-color: var(--anzhiyu-main);
  }

  &.full-width {
    width: 100%;
  }
}

.post-detail-content {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  align-self: flex-start;
  width: 100%;
  padding: 1.25rem 2.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: all 0.3s ease 0s;
  animation: slide-in 0.6s 0.1s backwards;

  @media screen and (width <= 768px) {
    box-shadow: none;
  }
}

.layout {
  display: flex;
  gap: 0.625rem;
  max-width: 1400px;
  padding: 1rem 1.5rem;
  margin: 0 auto;

  #content-inner {
    flex: 1;
    width: 75%;
    min-width: 0;
  }
}

@media (width <= 992px) {
  .post-content-inner {
    width: 100%;
  }
}

@media (width <= 768px) {
  .layout {
    position: relative;
    z-index: 3;
    padding: 0;
    background-color: var(--anzhiyu-main);
  }

  .post-detail-content {
    z-index: 1;
    padding: 1rem;
    border: none;
    border-radius: 0 0 0 0;
  }

  .post-content-inner {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    touch-action: pan-y;
  }

  div#anzhiyu-footer-bar {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    touch-action: pan-y;
  }
}
</style>
