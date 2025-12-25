<!--
 * @Description: 朋友圈文章项
 * @Author: 安知鱼
 * @Date: 2025-10-08
-->
<script lang="ts" setup>
import { ref, computed, nextTick } from "vue";
import { gsap } from "gsap";
import { ElMessage } from "element-plus";
import type { Moment } from "@/views/post/fcircle/types";
import { getLinkMoments } from "@/api/moments";
import { formatDate } from "@/utils/format";

const props = defineProps<{
  moments: Moment[];
  sortType: string;
}>();

const cardShow = ref(false);
const selectedLinkMoments = ref<Moment[]>([]);
const selectedLinkInfo = ref({
  name: "",
  logo: "",
  url: ""
});
const loadingPopup = ref(false);

// 只显示最新的5条数据
const displayedMoments = computed(() => {
  return selectedLinkMoments.value.slice(0, 5);
});

const overlayRef = ref<HTMLElement>();
const popupRef = ref<HTMLElement>();

// 打开弹窗动画
const openPopup = () => {
  if (!popupRef.value || !overlayRef.value) return;

  const popup = popupRef.value;
  const overlay = overlayRef.value;

  // 初始状态
  gsap.set(overlay, { opacity: 0 });
  gsap.set(popup, {
    scale: 0.95,
    y: 10,
    opacity: 0,
    force3D: true
  });

  // 动画时间线
  const tl = gsap.timeline();

  tl.to(overlay, {
    opacity: 1,
    duration: 0.2,
    ease: "power2.out"
  }).to(
    popup,
    {
      scale: 1,
      y: 0,
      opacity: 1,
      duration: 0.25,
      ease: "power2.out",
      force3D: true
    },
    "-=0.1"
  );
};

// 关闭弹窗动画
const closePopup = () => {
  if (!popupRef.value || !overlayRef.value) return;

  const popup = popupRef.value;
  const overlay = overlayRef.value;

  const tl = gsap.timeline({
    onComplete: () => {
      cardShow.value = false;
    }
  });

  tl.to(popup, {
    scale: 0.95,
    y: 10,
    opacity: 0,
    duration: 0.2,
    ease: "power2.in",
    force3D: true
  }).to(
    overlay,
    {
      opacity: 0,
      duration: 0.15,
      ease: "power2.in"
    },
    "-=0.1"
  );
};

// 显示该友链的更多文章
const showLinkMoments = async (moment: Moment) => {
  loadingPopup.value = true;

  try {
    // 调用API获取该友链的文章列表
    const response = await getLinkMoments(moment.link_id, 1, 10);

    if (response.code === 200 && response.data) {
      selectedLinkMoments.value = response.data.list || [];
      selectedLinkInfo.value = {
        name: moment.link_name,
        logo: moment.link_logo,
        url: moment.link_url
      };

      cardShow.value = true;

      // 等待 DOM 更新后播放动画
      nextTick(() => {
        openPopup();
      });
    } else {
      ElMessage.error(response.message || "获取友链文章失败");
    }
  } catch (error) {
    console.error("获取友链文章失败:", error);
    ElMessage.error("获取友链文章失败");
  } finally {
    loadingPopup.value = false;
  }
};

// 处理遮罩层点击
const handleOverlayClick = () => {
  closePopup();
};

// 处理图片加载失败
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=default";
};
</script>

<template>
  <div v-for="moment in props.moments" :key="moment.id" class="moment-item">
    <div class="moment-card">
      <a
        class="moment-title"
        :href="moment.post_url"
        target="_blank"
        rel="noopener nofollow"
        :data-title="moment.post_title"
      >
        {{ moment.post_title }}
      </a>
      <div v-if="moment.post_summary" class="moment-summary">
        {{ moment.post_summary }}
      </div>
      <div class="moment-bottom">
        <img
          class="moment-avatar"
          :src="moment.link_logo"
          :alt="moment.link_name"
          @error="handleImageError"
        />
        <span class="moment-author" @click="showLinkMoments(moment)">
          {{ moment.link_name }}
        </span>
        <span class="moment-time">
          <i class="anzhiyufont anzhiyu-icon-clock" />
          {{ formatDate(moment.published_at) }}
        </span>
      </div>
    </div>
  </div>

  <!-- 遮罩层 -->
  <div
    v-if="cardShow"
    ref="overlayRef"
    class="moment-overlay"
    @click="handleOverlayClick"
  />

  <!-- 弹窗 -->
  <div v-if="cardShow" class="moment-popup">
    <div ref="popupRef" class="popup-content" @click.stop>
      <div class="popup-header">
        <img
          class="popup-avatar"
          :src="selectedLinkInfo.logo"
          :alt="selectedLinkInfo.name"
          @error="handleImageError"
        />
        <a :href="selectedLinkInfo.url" target="_blank" rel="noopener nofollow">
          {{ selectedLinkInfo.name }}
        </a>
      </div>
      <div class="popup-body">
        <div
          v-for="(item, index) in displayedMoments"
          :key="item.id"
          :class="{
            'popup-article-item': true,
            'is-last': index === displayedMoments.length - 1
          }"
        >
          <a
            class="popup-article-title"
            :href="item.post_url"
            target="_blank"
            rel="noopener nofollow"
            :data-title="item.post_title"
          >
            {{ item.post_title }}
          </a>
          <div class="popup-article-meta">
            <i class="anzhiyufont anzhiyu-icon-clock" />
            <span class="popup-article-time">{{
              formatDate(item.published_at)
            }}</span>
          </div>
        </div>
        <div v-if="selectedLinkMoments.length === 0" class="popup-empty">
          <i class="far fa-inbox" />
          <p>暂无更多文章</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.moment-item {
  width: calc(100% / 3);

  @media (width <= 1280px) {
    width: 50%;
  }

  @media (width <= 768px) {
    width: 100%;
  }

  .moment-card {
    position: relative;
    display: flex;
    flex-direction: column;
    place-content: space-between space-between;
    min-height: 160px;
    height: auto;
    padding: 1rem;
    margin: 8px;
    overflow: hidden;
    font-weight: bolder;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border-always);
    border-radius: 8px;
    box-shadow: var(--anzhiyu-shadow-border);
    transition: all 0.3s ease-out;

    &:hover {
      border: var(--style-border-hover);
      box-shadow: var(--anzhiyu-shadow-main);
      transition: 0.3s;
    }

    .moment-title {
      position: relative;
      z-index: 2;
      display: -webkit-box;
      align-self: start;
      width: 100%;
      padding: 0;
      margin-bottom: 8px;
      overflow: hidden;
      font-size: 15px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--anzhiyu-fontcolor);
      text-align: left;
      text-decoration: none;
      text-overflow: ellipsis;
      -webkit-line-clamp: 1;
      line-clamp: 1;
      letter-spacing: 0.5px;
      transition: 0.3s;
      -webkit-box-orient: vertical;

      &:hover {
        color: var(--anzhiyu-lighttext);
      }
    }

    .moment-summary {
      position: relative;
      z-index: 2;
      display: -webkit-box;
      align-self: start;
      width: 100%;
      margin-bottom: 10px;
      overflow: hidden;
      font-size: 13px;
      font-weight: 400;
      line-height: 1.5;
      color: var(--anzhiyu-secondtext);
      text-align: left;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      opacity: 0.8;
      transition: 0.3s;
      -webkit-box-orient: vertical;
    }

    .moment-bottom {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      line-height: 1;

      .moment-avatar {
        display: inline-block;
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        text-align: center;
        background: #fff;
        border-radius: 50%;
        object-fit: cover;
        transition: 0.3s;
      }

      .moment-author {
        z-index: 1;
        display: flex;
        align-items: center;
        align-self: center;
        padding: 8px;
        overflow: hidden;
        font-size: 14px;
        font-size: 0.7rem;
        font-weight: 700;
        line-height: 1;
        color: var(--anzhiyu-fontcolor);
        text-align: center;
        white-space: nowrap;
        cursor: pointer;
        background-color: var(--anzhiyu-gray-op);
        border-radius: 20px;
        transition: 0.3s;

        &:hover {
          color: var(--anzhiyu-white);
          background: var(--anzhiyu-main);
        }
      }

      .moment-time {
        z-index: 1;
        display: flex;
        align-items: center;
        margin-left: auto;
        font-size: 12px;
        font-weight: 400;
        text-align: right;
        transition: 0.3s;

        i {
          display: flex;
          align-items: center;
          padding-right: 6px;
          font-size: 12px;
        }
      }
    }
  }
}

// 遮罩层
.moment-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background-color: rgb(255 255 255 / 42%);
  backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

// 弹窗
.moment-popup {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  .popup-content {
    width: 320px;
    min-height: 170px;
    line-height: 2;
    text-align: center;
    pointer-events: all;
    background: var(--anzhiyu-theme);
    border-radius: 20px;
    box-shadow: 0 12px 40px rgb(0 0 0 / 9%);

    .popup-header {
      display: flex;
      flex-direction: column;
      align-items: center;

      .popup-avatar {
        width: 80px !important;
        max-width: 100%;
        height: 80px !important;
        max-height: 900px;
        margin: 15px auto 0 !important;
        object-fit: cover;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 12px 40px rgb(0 0 0 / 9%);
        transition: 0.8s;
        transform: rotate(-360deg);
      }

      a {
        display: block;
        color: var(--anzhiyu-white);
        text-align: center;
        text-decoration: none;
      }
    }

    .popup-body {
      display: flex;
      flex-direction: column;
      max-height: 70vh;
      padding: 16px 20px;
      overflow: hidden auto;
      background: var(--anzhiyu-card-bg);
      border-bottom-right-radius: 20px;
      border-bottom-left-radius: 20px;

      // 自定义滚动条样式
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 10px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--anzhiyu-gray-op);
        border-radius: 10px;
        transition: background 0.3s;

        &:hover {
          background: var(--anzhiyu-theme-op);
        }
      }

      .popup-article-item {
        position: relative;
        display: flex;
        flex-direction: column;
        padding: 12px 0;
        margin-bottom: 8px;
        transition: all 0.3s ease;

        &:not(.is-last)::after {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          content: "";
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--anzhiyu-gray-op) 20%,
            var(--anzhiyu-gray-op) 80%,
            transparent 100%
          );
        }

        &:hover {
          .popup-article-title {
            color: var(--anzhiyu-theme);
          }

          .popup-article-meta {
            opacity: 1;
          }
        }

        .popup-article-title {
          position: relative;
          z-index: 2;
          display: -webkit-box;
          margin-bottom: 8px;
          overflow: hidden;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.5;
          color: var(--anzhiyu-fontcolor);
          text-align: left;
          text-decoration: none;
          text-overflow: ellipsis;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          letter-spacing: 0.3px;
          transition: all 0.3s ease;
          -webkit-box-orient: vertical;
        }

        .popup-article-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--anzhiyu-fontcolor);
          opacity: 0.6;
          transition: opacity 0.3s ease;

          i {
            font-size: 11px;
          }

          .popup-article-time {
            font-weight: 400;
          }
        }
      }

      .popup-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        color: var(--anzhiyu-fontcolor);
        opacity: 0.5;

        i {
          font-size: 48px;
          margin-bottom: 12px;
        }

        p {
          margin: 0;
          font-size: 14px;
        }
      }
    }
  }
}
</style>
