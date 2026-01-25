<template>
  <div id="console" :class="{ show: isConsoleShow }">
    <div class="console-content">
      <div class="console-card-group">
        <div class="console-card-group-left">
          <div class="card-newest-comments console-card">
            <div class="card-content">
              <div class="author-content-item-tips">互动</div>
              <div class="card-hor-content">
                <span class="author-content-item-title">最近评论</span>
                <router-link
                  class="go_to_recent_comments !text-[var(--anzhiyu-fontcolor)]"
                  to="/recentcomments"
                  title="最近评论"
                  @click="appStore.toggleConsole(false)"
                >
                  <i
                    class="anzhiyufont anzhiyu-icon-circle-arrow-right !text-[22px]"
                /></router-link>
              </div>
            </div>
            <div class="console_recentcomments">
              <template v-if="latestComments && latestComments.length > 0">
                <div
                  v-for="comment in latestComments"
                  :key="comment.id"
                  class="comment-card"
                  @click="goToArticle(comment)"
                >
                  <div class="comment-info">
                    <img
                      :src="getAvatarUrl(comment.email_md5)"
                      alt="最近评论头像"
                    />
                    <div>
                      <span class="comment-user">{{ comment.nickname }}</span>
                    </div>
                    <span class="comment-time">{{
                      formatCommentDate(comment.created_at)
                    }}</span>
                  </div>
                  <div class="comment-content" v-html="comment.content_html" />
                  <div class="comment-title" :title="comment.target_title">
                    <i class="anzhiyufont anzhiyu-icon-comments" />
                    {{ comment.target_title }}
                  </div>
                </div>
              </template>
              <div v-else class="no-comments">暂无评论</div>
            </div>
          </div>
        </div>
        <div class="console-card-group-right">
          <div class="console-card tags">
            <div class="card-content">
              <div class="author-content-item-tips">标签</div>
              <div class="author-content-item-title">寻找感兴趣的领域</div>
            </div>
            <div class="card-tag-cloud">
              <router-link
                v-for="tag in tags"
                :key="tag.id"
                class="tag-item"
                :to="`/tags/${tag.name}/`"
                @click="appStore.toggleConsole(false)"
              >
                {{ tag.name }}
                <sup>{{ tag.count }}</sup>
              </router-link>
            </div>
          </div>
          <div class="console-card history">
            <ul class="card-archive-list">
              <li
                v-for="archive in displayArchives"
                :key="archive.year"
                class="card-archive-list-item"
                @click="goToArchive(archive.year)"
              >
                <div class="card-archive-list-link">
                  <div class="card-archive-list-date">{{ archive.year }}</div>
                  <div class="card-archive-list-count-group">
                    <div class="card-archive-list-count">
                      {{ archive.count }}
                    </div>
                    <div class="card-archive-list-count-unit">篇</div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="button-group">
        <el-tooltip
          content="显示模式切换"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
        >
          <div class="console-btn-item" :class="{ on: dataTheme }">
            <button
              class="darkmode_switch_button"
              aria-label="显示模式切换"
              @click="handleThemeToggle"
            >
              <i class="anzhiyufont anzhiyu-icon-moon" />
            </button>
          </div>
        </el-tooltip>

        <el-tooltip
          content="热评开关"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
        >
          <div
            class="console-btn-item"
            :class="{ on: isCommentBarrageVisible }"
          >
            <button
              class="commentBarrage"
              aria-label="热评开关"
              @click="toggleCommentBarrage()"
            >
              <IconifyIconOffline :icon="Chat1Fill" />
            </button>
          </div>
        </el-tooltip>

        <el-tooltip
          content="快捷键开关"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
        >
          <div
            id="consoleKeyboard"
            class="console-btn-item"
            :class="{ on: isShortcutsEnabled }"
          >
            <button
              class="keyboard-switch"
              aria-label="快捷键开关"
              @click="toggleShortcuts()"
            >
              <i class="anzhiyufont anzhiyu-icon-keyboard" />
            </button>
          </div>
        </el-tooltip>

        <el-tooltip
          v-if="siteConfig?.music?.player?.enable"
          content="音乐胶囊开关"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
        >
          <div class="console-btn-item" :class="{ on: isMusicPlayerVisible }">
            <button
              class="music-player-switch"
              aria-label="音乐胶囊开关"
              @click="toggleMusicPlayer()"
            >
              <i class="anzhiyufont anzhiyu-icon-music" />
            </button>
          </div>
        </el-tooltip>

        <el-tooltip
          content="侧边栏开关"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
        >
          <div class="console-btn-item" :class="{ on: isSidebarVisible }">
            <button
              class="sidebar-switch"
              aria-label="侧边栏开关"
              @click="toggleSidebar()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="28"
                viewBox="0 0 24 24"
              >
                <g fill="currentColor">
                  <path d="M17 22h2a4 4 0 0 0 4-4V6a4 4 0 0 0-4-4h-2z" />
                  <path
                    fill-rule="evenodd"
                    d="M15 2H5a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4h10zm-6.707 8.707a1 1 0 0 1 1.414-1.414l2 2a1 1 0 0 1 0 1.414l-2 2a1 1 0 0 1-1.414-1.414L9.586 12z"
                    clip-rule="evenodd"
                  />
                </g>
              </svg>
            </button>
          </div>
        </el-tooltip>
      </div>
    </div>
    <div class="console-mask" @click="appStore.toggleConsole(false)" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAppStore } from "@/store/modules/app";
import { useArticleStore } from "@/store/modules/articleStore";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useCommentStore } from "@/store/modules/commentStore";
import type { Comment } from "@/api/comment/type";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useUiStore } from "@/store/modules/uiStore";
import IconifyIconOffline from "@/components/ReIcon/src/iconifyIconOffline";
import Chat1Fill from "@iconify-icons/ri/chat-1-fill";

const { dataTheme, dataThemeChange } = useDataThemeChange();

const appStore = useAppStore();
const articleStore = useArticleStore();
const commentStore = useCommentStore();
const router = useRouter();
const uiStore = useUiStore();

const {
  isCommentBarrageVisible,
  isShortcutsEnabled,
  isMusicPlayerVisible,
  isSidebarVisible
} = storeToRefs(uiStore);
const {
  toggleCommentBarrage,
  toggleShortcuts,
  toggleMusicPlayer,
  toggleSidebar
} = uiStore;

const siteConfigStore = useSiteConfigStore();
const siteConfig = computed(() => siteConfigStore.getSiteConfig);

const { tags, archives } = storeToRefs(articleStore);
const { latestComments } = storeToRefs(commentStore);
const totalPostCount = computed(
  () => siteConfig.value?.sidebar?.siteinfo?.totalPostCount
);

const isConsoleShow = computed(() => appStore.isConsoleOpen);

const handleThemeToggle = () => {
  const newTheme = dataTheme.value ? "light" : "dark";
  dataThemeChange(newTheme);
};

const commentInfoConfig = computed(() => {
  return {
    gravatar_url: siteConfigStore.getSiteConfig.GRAVATAR_URL,
    default_gravatar_type: siteConfigStore.getSiteConfig.DEFAULT_GRAVATAR_TYPE
  };
});

const getAvatarUrl = (emailMd5: string) => {
  const url = new URL(commentInfoConfig.value.gravatar_url);
  url.pathname += `avatar/${emailMd5}`;
  url.searchParams.set("d", commentInfoConfig.value.default_gravatar_type);
  url.searchParams.set("s", "140");
  return url.toString();
};

const formatCommentDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const goToArticle = (comment: Comment) => {
  if (!comment || !comment.target_path) return;
  router.push({
    path: comment.target_path,
    hash: `#comment-${comment.id}`
  });
  appStore.toggleConsole(false);
};

const goToTag = (tagName: string) => {
  router.push({ path: `/tags/${tagName}/` });
  appStore.toggleConsole(false);
};

const goToArchive = (year: string) => {
  const path = year === "全部文章" ? "/archives" : `/archives/${year}/`;
  router.push({ path });
  appStore.toggleConsole(false);
};

const archivesByYear = computed(() => {
  if (!archives.value || archives.value.length === 0) return [];

  const yearMap = new Map<number, number>();
  archives.value.forEach(item => {
    const year = item.year;
    const currentCount = yearMap.get(year) || 0;
    yearMap.set(year, currentCount + item.count);
  });

  return Array.from(yearMap, ([year, count]) => ({
    year: String(year),
    count
  }));
});

const displayArchives = computed(() => {
  const yearArchives = archivesByYear.value.slice(0, 7);
  if (totalPostCount.value > 0) {
    yearArchives.push({
      year: "全部文章",
      count: totalPostCount.value
    });
  }
  return yearArchives;
});

// 监听控制台显示状态，只在打开时请求评论数据
watch(isConsoleShow, newValue => {
  if (newValue) {
    // 控制台打开时才请求最近评论
    commentStore.fetchLatestComments(6);
  }
});

onMounted(() => {
  articleStore.fetchTags();
  articleStore.fetchArchives();
});
</script>

<style scoped lang="scss">
#console {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100dvh;
  pointer-events: none;
  user-select: none;
  user-select: none;
  opacity: 0;
  // 只允许 opacity 过渡，禁用颜色过渡避免主题切换时的闪烁
  transition: opacity 0.3s ease-out;

  &.show {
    pointer-events: all;
    opacity: 1;

    .button-group {
      opacity: 1;
      transition-delay: 0.2s;
      transform: translateY(0);
    }

    .console-mask {
      backdrop-filter: blur(20px);
      backdrop-filter: saturate(180%) blur(20px);
      transform: translateZ(0);
      animation: 0.6s ease 0s 1 normal none running to_show;
    }

    .console-content > * {
      pointer-events: auto;
    }

    .console-card-group {
      opacity: 1;
      transition-delay: 0.1s;
      transform: translateY(0);
    }
  }

  .console-card-group-left {
    width: 40%;
    min-width: 300px;
    max-width: 550px;
    height: 100%;

    .card-newest-comments {
      height: 100%;
    }
  }

  .console-card {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 32px 36px 36px;
    overflow: hidden;
    background: var(--anzhiyu-maskbg);
    border: var(--style-border);
    border-radius: 12px;
    box-shadow: var(--anzhiyu-shadow-border);
  }

  .author-content-item-tips {
    margin-bottom: 0.625rem;
    font-size: 0.75rem;
    opacity: 0.8;
    transition: 0.3s !important;
    color: inherit;
  }

  .card-hor-content {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .console_recentcomments {
    display: flex;
    flex: 1;
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 8px;
    align-content: flex-start;
    overflow-y: scroll;

    &::-webkit-scrollbar {
      display: none;
    }

    .comment-card {
      position: relative;
      display: flex;
      flex-shrink: 0;
      flex-direction: column;
      gap: 8px;
      justify-content: space-between;
      width: calc(100% / 2 - 4px);
      padding: 14px;
      overflow: hidden;
      cursor: pointer;
      background: var(--anzhiyu-card-bg);
      border: var(--style-border-always);
      border-radius: 12px;

      .comment-content :deep(.anzhiyu-owo-emotion) {
        width: 3rem;
        max-width: 100%;
        height: auto;
        max-height: 300px;
        vertical-align: middle;
        border-radius: 4px;
      }

      &:hover {
        border-color: var(--anzhiyu-lighttext);
      }
    }

    .comment-info {
      display: flex;
      flex-shrink: 0;
      gap: 8px;
      align-items: end;
      align-items: center;
      width: 100%;
      min-height: 40px;
      padding-bottom: 8px;
      border-bottom: var(--style-border-always);

      img {
        width: 24px;
        height: 24px;
        margin: 0;
        object-fit: cover;
        border-radius: 30px;
      }

      div {
        display: flex;
        flex-direction: column;
        line-height: 1.5;
      }

      .comment-user {
        overflow: hidden;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      span.comment-time {
        margin-left: auto;
        font-size: 12px;
        color: var(--anzhiyu-secondtext);
      }
    }

    .comment-content {
      display: -webkit-box;
      flex-shrink: 0;
      min-height: 48px;
      overflow: hidden;
      font-size: 14px;
      line-height: 1.7;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      transition: 0.3s;
      -webkit-box-orient: vertical;

      :deep(p) {
        margin: 0;
      }
      :deep(a) {
        transition: 0.3s !important;
      }
    }

    .comment-title {
      display: -webkit-box;
      flex-shrink: 0;
      min-height: 20px;
      padding-top: 8px;
      margin-top: auto;
      overflow: hidden;
      font-size: 12px;
      line-height: 1;
      color: var(--anzhiyu-secondtext);
      text-overflow: ellipsis;
      -webkit-line-clamp: 1;
      line-clamp: 1;
      opacity: 0.6;
      transition: 0.3s;
      -webkit-box-orient: vertical;
    }
  }

  .go_to_recent_comments {
    margin-left: auto;
  }

  .author-content-item-title {
    display: flex;
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    // 禁用颜色过渡，避免主题切换时的闪烁
    transition: none !important;
    color: inherit;
  }

  .console-card-group-right {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 60%;
    min-width: 500px;
    max-width: 900px;
    height: 100%;
    overflow: hidden;
  }

  .console-content {
    position: fixed;
    left: 50%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    justify-content: center;
    width: 100dvw;
    max-width: 1400px;
    max-height: 800px;
    padding-top: 30px;
    color: var(--anzhiyu-fontcolor);
    pointer-events: none;
    transform: translateX(-50%);
    transition: 0.3s !important;
  }

  .console-mask {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    width: 100vw;
    height: 100dvh;
    background: var(--anzhiyu-maskbgdeep);
    backdrop-filter: blur(20px);
    backdrop-filter: saturate(180%) blur(20px);
    transform: translateZ(0);
    backface-visibility: hidden;
    backface-visibility: hidden;
    transform-style: preserve-3d;
    transform-style: preserve-3d;
  }

  .console-card-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: calc(100% - 64px);
    height: 800px;
    max-height: calc(100dvh - 180px);
    opacity: 0;
    transition: 0.3s;
    transform: translateY(20px);
  }

  .console-card.tags {
    flex: 1;
    min-height: 0;

    .card-tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      min-height: 0;
      overflow-y: scroll;
      transition: 0s;

      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background-color: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background-color: var(--anzhiyu-main-op);
      }

      a {
        padding: 2px 8px;
        font-size: 14px;
        font-weight: 700;
        color: var(--anzhiyu-fontcolor);
        background: var(--anzhiyu-card-bg);
        border: var(--style-border);
        border-radius: 8px;
        transition:
          color 0.3s,
          background 0s;

        &:hover {
          color: var(--anzhiyu-card-bg) !important;
          background: var(--anzhiyu-lighttext);
          box-shadow: var(--anzhiyu-shadow-main);
        }

        sup {
          position: relative;
          top: -0.4rem;
          font-size: 75%;
          line-height: 0;
          vertical-align: baseline;
          opacity: 0.6;
        }
      }
    }
  }

  .console-card.history {
    flex-shrink: 0;
    padding: 0;
    margin-top: 8px;
    overflow: hidden;
    background: 0 0;
    border: none;
    border-radius: 0;
    box-shadow: none;

    .card-archive-list {
      display: flex;
      flex-flow: row wrap;
      gap: 8px;
      justify-content: flex-start;

      li.card-archive-list-item {
        flex: 0 0 calc(25% - 6px);
        height: 82px;
        cursor: pointer;
        border-radius: 12px;
        transition: 0.3s;

        &:hover .card-archive-list-link {
          color: var(--anzhiyu-card-bg);
          background: var(--anzhiyu-main);
        }
      }

      .card-archive-list-link {
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
        padding: 12px 16px;
        background: var(--anzhiyu-maskbgdeep);
        border: var(--style-border);
        border-radius: 8px;
        box-shadow: var(--anzhiyu-shadow-border);
      }
    }

    .card-archive-list-date {
      font-size: 14px;
      opacity: 0.6;
    }

    .card-archive-list-count-group {
      display: flex;
      flex-direction: row;
      gap: 4px;
      align-items: baseline;
    }

    .card-archive-list-count {
      width: auto;
      font-size: 1.1rem;
      font-weight: 700;
      line-height: 0.9;
      text-align: left;
    }

    .card-archive-list-count-unit {
      width: auto;
      font-size: 14px;
      font-weight: 700;
      text-align: left;
    }

    .card-archive-list-item {
      width: 100%;
    }
  }

  .button-group {
    display: flex;
    justify-content: center;
    width: fit-content;
    opacity: 0;
    transition: 0.3s;
    transform: translateY(20px);

    .console-btn-item:not(:last-child) {
      margin-right: 0.5rem;
    }

    .console-btn-item button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: var(--anzhiyu-fontcolor);
      cursor: pointer;
      background: var(--anzhiyu-card-bg);
      border: var(--style-border);
      border-radius: 60px;
      outline: none;
      box-shadow: var(--anzhiyu-shadow-border);
      transition:
        color 0.3s,
        background 0.3s,
        filter 0.3s;

      // 确保 IconifyIconOffline 渲染的 SVG 图标正确显示
      :deep(svg),
      :deep(.iconify) {
        display: inline-block;
        width: 24px;
        height: 24px;
        fill: currentColor;
        color: inherit;
      }

      &:hover {
        color: var(--anzhiyu-white);
        background: var(--anzhiyu-main);
      }

      &:focus-visible {
        outline: 2px solid var(--anzhiyu-main);
        outline-offset: 2px;
      }
    }

    .console-btn-item {
      width: 60px;
      height: 60px;
      cursor: pointer;

      &.on button {
        color: var(--anzhiyu-white);
        background: var(--anzhiyu-orange);

        &:hover {
          filter: brightness(1.2);
        }
      }
    }
  }
}

@media (width <= 1024px) {
  #console {
    .console-card-group-right {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      max-width: 900px;
      height: 100%;
      overflow: hidden;
    }

    .console-card-group {
      width: 100%;
    }

    .console-card-group-left {
      display: none;
    }

    .console-card.history .card-archive-list li.card-archive-list-item {
      flex: 0 0 calc(50% - 4px);
      height: 82px;
    }
  }
}

@media (width <= 768px) {
  #console {
    .console-card {
      padding: 24px;
    }

    .author-content-item-title {
      font-size: 24px;
    }

    .console-card.history .card-archive-list li.card-archive-list-item {
      flex: 0 0 100%;
      height: 82px;
    }
  }
}
</style>
