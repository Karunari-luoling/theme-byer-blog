<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import type { Notification } from "@/api/notification";
import { formatFullTime, getNotificationTypeText } from "../utils";
import { highlightCodeBlocks } from "@/utils/markdown";

const props = defineProps<{
  notification: Notification;
  renderedContent: string;
}>();

const emit = defineEmits<{
  back: [];
  goToLink: [];
}>();

const contentRef = ref<HTMLElement | null>(null);

// 高亮代码块
const highlightContent = async () => {
  await nextTick();
  await highlightCodeBlocks(contentRef.value);
};

watch(
  () => props.renderedContent,
  () => {
    highlightContent();
  }
);

onMounted(() => {
  highlightContent();
});
</script>

<template>
  <div class="detail-view">
    <button class="back-btn" @click="emit('back')">← 返回列表</button>
    <div class="detail-header">
      <h2 class="detail-title">{{ notification.title }}</h2>
      <div class="detail-meta">
        <span>{{ formatFullTime(notification.created_at) }}</span>
        <span class="detail-type">{{
          getNotificationTypeText(notification.type)
        }}</span>
      </div>
    </div>
    <div
      ref="contentRef"
      class="detail-content comment-content"
      v-html="renderedContent"
    />
    <button
      v-if="notification.link"
      class="detail-link-btn"
      @click="emit('goToLink')"
    >
      查看详情 →
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use "@/style/article-content-base.scss" as *;

.detail-view {
  display: flex;
  flex-direction: column;
}

.back-btn {
  padding: 6px 0;
  font-size: 13px;
  color: var(--anzhiyu-theme, #49b1f5);
  background: none;
  border: none;
  cursor: pointer;
  margin-bottom: 12px;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
}

.detail-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: var(--style-border);
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor, #333);
  margin: 0 0 6px;
  line-height: 1.4;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--anzhiyu-secondtext, #999);
}

.detail-type {
  padding: 1px 6px;
  background: var(--anzhiyu-theme, #49b1f5);
  color: var(--anzhiyu-white, #fff);
  border-radius: 4px;
}

// 详情内容使用与评论区一致的样式
.detail-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--anzhiyu-fontcolor, #444);

  @include article-content-base;

  // 覆盖一些样式以适应详情页
  :deep(p) {
    margin: 0.6rem 0;
    font-size: 14px;
  }

  :deep(p:first-child) {
    margin-top: 0;
  }

  // 表情图片
  :deep(.chat-emoji),
  :deep(.anzhiyu-owo-emotion) {
    width: 1.4em;
    height: 1.4em;
    vertical-align: middle;
    margin: 0 2px;
    display: inline;
    border-radius: 0;
    box-shadow: none;
  }

  // 代码块
  :deep(pre) {
    margin: 12px 0;
    border-radius: 8px;
  }

  // 图片
  :deep(img:not(.chat-emoji):not(.anzhiyu-owo-emotion)) {
    max-width: 100%;
    max-height: 400px;
    margin: 10px 0;
  }
}

.detail-link-btn {
  display: inline-flex;
  align-items: center;
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: var(--anzhiyu-theme, #49b1f5);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  width: fit-content;

  &:hover {
    filter: brightness(1.1);
  }
}

// ==================== 移动端适配 ====================
@media screen and (width <= 600px) {
  .back-btn {
    font-size: 12px;
    margin-bottom: 10px;
  }

  .detail-header {
    margin-bottom: 12px;
    padding-bottom: 10px;
  }

  .detail-title {
    font-size: 16px;
    margin-bottom: 4px;
  }

  .detail-meta {
    font-size: 11px;
    gap: 8px;
  }

  .detail-content {
    font-size: 13px;
    line-height: 1.6;

    :deep(p) {
      font-size: 13px;
      margin: 0.5rem 0;
    }

    :deep(pre) {
      margin: 10px 0;
      font-size: 12px;
    }

    :deep(img:not(.chat-emoji):not(.anzhiyu-owo-emotion)) {
      max-height: 300px;
    }
  }

  .detail-link-btn {
    width: 100%;
    justify-content: center;
    margin-top: 16px;
    padding: 12px;
  }
}

@media screen and (width <= 480px) {
  .detail-title {
    font-size: 15px;
  }

  .detail-content {
    font-size: 13px;

    :deep(img:not(.chat-emoji):not(.anzhiyu-owo-emotion)) {
      max-height: 250px;
    }
  }
}
</style>
