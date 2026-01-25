<!--
 * @Description: 文档左侧导航栏 - VitePress 风格
 * @Author: 安知鱼
 * @Date: 2025-12-30
-->
<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import type { DocSeriesWithArticles } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { IconifyIconOnline } from "@/components/ReIcon";

const props = defineProps<{
  series: DocSeriesWithArticles | null;
  currentDocId: string;
}>();

const emit = defineEmits<{
  (e: "navigate", docId: string): void;
  (e: "collapse"): void;
}>();

// 收起侧边栏
const handleCollapse = () => {
  emit("collapse");
};

const router = useRouter();
const siteConfigStore = useSiteConfigStore();
const { dataTheme, dataThemeChange } = useDataThemeChange();

// 切换主题
const toggleTheme = () => {
  dataThemeChange(dataTheme.value ? "light" : "dark");
};

// 站点信息
const siteName = computed(
  () => siteConfigStore.siteConfig?.site_name || "Anheyu"
);
const siteUrl = computed(() => siteConfigStore.siteConfig?.site_url || "/");

// 文档侧边栏链接配置
interface DocSidebarLinkItem {
  title: string;
  link: string;
  icon: string;
  external: boolean;
}

const docSidebarLinks = computed<DocSidebarLinkItem[]>(() => {
  const links = siteConfigStore.siteConfig?.sidebar?.doc?.links;
  if (Array.isArray(links) && links.length > 0) {
    return links;
  }
  // 默认链接
  return [
    {
      title: "博客",
      link: "/",
      icon: "ri:external-link-line",
      external: false
    }
  ];
});

// 处理链接点击
const handleLinkClick = (link: DocSidebarLinkItem) => {
  if (link.external || link.link.startsWith("http")) {
    window.open(link.link, "_blank");
  } else {
    router.push(link.link);
  }
};

// 处理文档导航
const handleClick = (docId: string) => {
  if (docId !== props.currentDocId) {
    emit("navigate", docId);
  }
};

// 判断是否为当前文档
const isActive = (docId: string) => {
  return docId === props.currentDocId;
};

// 打开搜索
const openSearch = () => {
  // 触发全局搜索（SearchModal 监听的是 frontend-open-search 事件）
  const searchEvent = new CustomEvent("frontend-open-search");
  window.dispatchEvent(searchEvent);
};

// 主题图标
const isDark = computed(() => dataTheme.value);
</script>

<template>
  <div class="doc-sidebar">
    <!-- 顶部 Logo 区域 -->
    <div class="sidebar-brand">
      <a :href="siteUrl" class="brand-link">
        <img src="/logo.svg" alt="Logo" class="brand-logo" />
        <span class="brand-name">{{ siteName }}</span>
      </a>
      <button
        class="sidebar-collapse-btn"
        title="收起侧边栏"
        @click="handleCollapse"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
        </svg>
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="sidebar-search" @click="openSearch">
      <div class="search-box">
        <svg
          class="search-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span class="search-placeholder">Search</span>
        <span class="search-shortcut">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </span>
      </div>
    </div>

    <!-- 外部链接 -->
    <nav v-if="docSidebarLinks.length > 0" class="sidebar-links">
      <a
        v-for="(link, index) in docSidebarLinks"
        :key="index"
        class="nav-link"
        :class="{ external: link.external }"
        @click.prevent="handleLinkClick(link)"
      >
        <svg
          v-if="link.external"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="external-icon"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        <IconifyIconOnline
          v-else-if="link.icon"
          :icon="link.icon"
          class="link-icon"
        />
        <span>{{ link.title }}</span>
      </a>
    </nav>

    <!-- 文档导航列表 -->
    <nav class="doc-nav">
      <ul class="doc-list">
        <li
          v-for="doc in series?.articles || []"
          :key="doc.id"
          class="doc-item"
          :class="{ active: isActive(doc.id) }"
          @click="handleClick(doc.id)"
        >
          <span class="doc-title">{{ doc.title }}</span>
        </li>
      </ul>

      <!-- 空状态 -->
      <div v-if="!series || series.articles.length === 0" class="empty-state">
        <span>暂无其他文档</span>
      </div>
    </nav>

    <!-- 底部主题切换 -->
    <div class="sidebar-footer">
      <div class="theme-switch" @click="toggleTheme">
        <div class="switch-track" :class="{ dark: isDark }">
          <div class="switch-icon sun">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          </div>
          <div class="switch-icon moon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </div>
          <div class="switch-thumb" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.doc-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  background: var(--anzhiyu-card-bg);
  border-radius: 4px;
  border: var(--style-border);
}

// 顶部品牌区域
.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--anzhiyu-card-border);

  .brand-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--anzhiyu-fontcolor);
    font-weight: 600;
    font-size: 17px;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }

  .brand-logo {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .brand-name {
    letter-spacing: -0.3px;
  }

  .sidebar-collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--anzhiyu-secondtext);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--anzhiyu-fontcolor);
    }

    &:active {
      background: rgba(0, 0, 0, 0.1);
    }
  }
}

// 搜索框
.sidebar-search {
  padding: 12px 16px;

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--anzhiyu-secondbg);
    border: 1px solid var(--anzhiyu-card-border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--anzhiyu-theme);
      background: var(--anzhiyu-card-bg);
    }
  }

  .search-icon {
    color: var(--anzhiyu-secondtext);
    flex-shrink: 0;
  }

  .search-placeholder {
    flex: 1;
    font-size: 13px;
    color: var(--anzhiyu-secondtext);
  }

  .search-shortcut {
    display: flex;

    kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      font-size: 11px;
      font-family: inherit;
      color: var(--anzhiyu-secondtext);
      background: var(--anzhiyu-card-bg);
      border: 1px solid var(--anzhiyu-card-border);
      border-radius: 4px;
      box-shadow: 0 1px 0 var(--anzhiyu-card-border);
    }
  }
}

// 外部链接
.sidebar-links {
  padding: 0 12px 8px;
  border-bottom: 1px solid var(--anzhiyu-card-border);
  margin-bottom: 8px;

  .nav-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 14px;
    color: var(--anzhiyu-fontcolor);
    text-decoration: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(66, 90, 239, 0.08);
    }

    .external-icon,
    .link-icon {
      color: var(--anzhiyu-secondtext);
      font-size: 14px;
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
  }
}

// 文档导航
.doc-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--anzhiyu-card-border);
    border-radius: 2px;
  }
}

.doc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.doc-item {
  position: relative;
  padding: 8px 12px;
  margin-bottom: 2px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--anzhiyu-fontcolor);
  font-size: 12px;
  line-height: 1.5;

  &:hover:not(.active) {
    background: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
  }

  &.active {
    background: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
    font-weight: 600;
  }

  .doc-title {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    line-height: 1.5;
    margin-bottom: 0;
  }
}

.empty-state {
  padding: 24px 12px;
  text-align: center;
  color: var(--anzhiyu-secondtext);
  font-size: 13px;
}

// 底部主题切换
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--anzhiyu-card-border);
  margin-top: auto;
}

.theme-switch {
  display: inline-flex;
  cursor: pointer;

  .switch-track {
    position: relative;
    display: flex;
    align-items: center;
    width: 64px;
    height: 32px;
    padding: 4px;
    background: var(--anzhiyu-secondbg);
    border-radius: 16px;
    transition: background 0.25s;

    &.dark {
      .switch-thumb {
        transform: translateX(32px);
      }

      .sun {
        opacity: 0.4;
      }

      .moon {
        opacity: 1;
        color: #425aef;
      }
    }
  }

  .switch-icon {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    transition: all 0.25s;

    &.sun {
      color: #f59e0b;
    }

    &.moon {
      opacity: 0.4;
      color: var(--anzhiyu-secondtext);
    }
  }

  .switch-thumb {
    position: absolute;
    left: 4px;
    width: 24px;
    height: 24px;
    background: var(--anzhiyu-card-bg);
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

// 暗色模式
[data-theme="dark"] {
  .sidebar-brand {
    border-bottom-color: #2d2d2d;

    .sidebar-collapse-btn {
      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      &:active {
        background: rgba(255, 255, 255, 0.12);
      }
    }
  }

  .sidebar-search .search-box {
    background: #1a1a1a;
    border-color: #2d2d2d;

    &:hover {
      background: #222;
    }

    kbd {
      background: #1a1a1a;
      border-color: #2d2d2d;
      box-shadow: 0 1px 0 #2d2d2d;
    }
  }

  .sidebar-links {
    border-bottom-color: #2d2d2d;
  }

  .sidebar-footer {
    border-top-color: #2d2d2d;
  }

  .theme-switch .switch-track {
    background: #1a1a1a;
  }
}

// 响应式
@media (max-width: 900px) {
  .sidebar-brand {
    .sidebar-collapse-btn {
      display: none;
    }
  }
}
</style>
