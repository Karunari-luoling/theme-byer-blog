<!--
 * @Description: AI 助手消息列表
-->
<template>
  <div ref="containerRef" class="message-list">
    <!-- 欢迎区域 - 无消息时显示 -->
    <div v-if="messages.length === 0" class="welcome-section">
      <div class="welcome-card">
        <div class="welcome-avatar">
          <IconifyIconOnline icon="ri:robot-2-line" />
        </div>
        <h2 class="welcome-title">{{ assistantName }}</h2>
        <p class="welcome-subtitle">{{ welcomeText }}</p>
      </div>

      <!-- 建议问题 -->
      <div class="suggestions">
        <TransitionGroup name="suggestion">
          <div
            v-for="(item, index) in suggestions"
            :key="item"
            class="suggestion-item"
            :style="{ '--delay': `${index * 80}ms` }"
            @click="$emit('selectSuggestion', item)"
          >
            <span class="suggestion-text">{{ item }}</span>
            <span class="suggestion-arrow">
              <IconifyIconOnline icon="ri:arrow-right-s-line" />
            </span>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- 消息列表 - 有消息时显示 -->
    <template v-else>
      <template v-for="(msg, index) in messages" :key="index">
        <!-- 用户查询 -->
        <div v-if="msg.role === 'user'" class="user-query">
          {{ msg.content }}
        </div>

        <!-- AI 回复 -->
        <div v-else class="ai-response">
          <!-- 搜索结果摘要 -->
          <div
            v-if="msg.query && msg.searchResults?.length"
            class="search-header"
          >
            我为你找到了关于"{{ msg.query }}"的
            {{ msg.searchResults.length }} 条结果
          </div>

          <!-- 搜索结果列表 -->
          <template v-if="msg.searchResults?.length">
            <div
              v-for="(result, idx) in msg.searchResults"
              :key="idx"
              class="result-card"
              @click="$emit('openResult', result)"
            >
              <h3 class="result-title">{{ result.title }}</h3>
              <p class="result-desc">{{ result.summary }}</p>
            </div>
          </template>

          <!-- 聊天回复（有内容时显示） -->
          <div
            v-else-if="msg.content"
            class="chat-reply"
            v-html="renderMarkdown(msg.content)"
          />

          <!-- 加载状态卡片（无内容时显示） -->
          <div v-else-if="msg.loading" class="loading-card">
            <div class="loading-content">
              <span class="loading-text">{{
                getLoadingText(msg.loadingStage)
              }}</span>
              <div class="loading-dots"><span /><span /><span /></div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { IconifyIconOnline } from "@/components/ReIcon";
import type { Message, SearchResult, ChatMode, LoadingStage } from "../types";

const props = defineProps<{
  messages: Message[];
  assistantName?: string;
  welcomeText?: string;
  suggestions?: string[]; // 当前模式的预设问题
  mode?: ChatMode; // 当前模式
}>();

defineEmits<{
  openResult: [result: SearchResult];
  selectSuggestion: [text: string];
}>();

// 加载阶段文案（不带省略号，由动画点表示）
const loadingStageText: Record<LoadingStage, string> = {
  understanding: "理解问题中",
  searching: "搜索知识库中",
  generating: "生成回答中",
  done: ""
};

// 获取加载文案
const getLoadingText = (stage?: LoadingStage) => {
  return stage ? loadingStageText[stage] : "思考中";
};

const containerRef = ref<HTMLElement | null>(null);

// 渲染 Markdown
const renderMarkdown = (content: string) => {
  try {
    const html = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(html);
  } catch {
    return content;
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
  });
};

// 监听消息变化自动滚动
watch(
  () => props.messages,
  () => scrollToBottom(),
  { deep: true }
);

// 暴露滚动方法
defineExpose({ scrollToBottom });
</script>

<style lang="scss" scoped>
.message-list {
  flex: 1;
  min-height: 200px;
  max-height: 450px;
  padding: 20px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--anzhiyu-scrollbar);
    border-radius: 3px;
  }
}

// ==================
// 欢迎区域
// ==================
.welcome-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 20px 24px;
  text-align: center;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border);
  border-radius: 16px;
  box-shadow: var(--anzhiyu-shadow-border);

  .welcome-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: 14px;
    font-size: 28px;
    color: #fff;
    background: linear-gradient(135deg, var(--anzhiyu-main) 0%, #5ac8fa 100%);
    border-radius: 14px;
    box-shadow: var(--anzhiyu-shadow-main);
  }

  .welcome-title {
    margin: 0 0 6px;
    font-size: 20px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
    letter-spacing: -0.02em;
  }

  .welcome-subtitle {
    margin: 0;
    font-size: 14px;
    color: var(--anzhiyu-secondtext);
  }
}

// 建议问题
.suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 450;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border);
  border-radius: 14px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: suggestionEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  animation-delay: var(--delay, 0ms);

  .suggestion-text {
    flex: 1;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .suggestion-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 18px;
    color: var(--anzhiyu-secondtext);
    background: var(--anzhiyu-card-btn-bg);
    border-radius: 8px;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform: translateX(-8px);
  }

  &:hover {
    background: var(--anzhiyu-card-bg);
    border-color: var(--anzhiyu-main);
    transform: translateY(-2px);

    .suggestion-text {
      transform: translateX(4px);
    }

    .suggestion-arrow {
      color: var(--anzhiyu-main);
      background: var(--anzhiyu-main-op);
      opacity: 1;
      transform: translateX(0);
    }
  }

  &:active {
    transform: translateY(-1px) scale(0.98);
    transition-duration: 0.1s;
  }
}

// 建议入场动画
@keyframes suggestionEnter {
  0% {
    opacity: 0;
    transform: translateY(16px) scale(0.95);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 建议列表过渡
.suggestion-enter-active,
.suggestion-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.suggestion-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.suggestion-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.9);
}

// ==================
// 移动端欢迎区域优化
// ==================
@media screen and (max-width: 640px) {
  .message-list {
    padding: 16px;
  }

  .welcome-section {
    gap: 16px;
  }

  .welcome-card {
    padding: 20px 16px 18px;
    border-radius: 14px;

    .welcome-avatar {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      font-size: 24px;
      border-radius: 12px;
    }

    .welcome-title {
      font-size: 18px;
    }

    .welcome-subtitle {
      font-size: 13px;
    }
  }

  // 移动端建议问题使用网格布局
  .suggestions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;

    // 奇数个标签时，最后一个居中占满
    .suggestion-item:last-child:nth-child(odd) {
      grid-column: 1 / -1;
      max-width: 60%;
      margin: 0 auto;
    }
  }

  .suggestion-item {
    justify-content: center;
    padding: 12px 10px;
    font-size: 13px;
    text-align: center;
    border-radius: 12px;
    // 移动端禁用复杂入场动画，避免布局抖动
    animation: none;
    opacity: 1;
    transform: none;

    .suggestion-text {
      text-align: center;
    }

    .suggestion-arrow {
      display: none;
    }

    &:active {
      background: var(--anzhiyu-main-op);
      border-color: var(--anzhiyu-main);
      transform: scale(0.96);
    }
  }

  // 移动端禁用列表过渡动画，避免切换模式时新旧标签同时显示
  .suggestion-enter-active,
  .suggestion-leave-active {
    transition: none;
  }

  .suggestion-enter-from,
  .suggestion-leave-to {
    opacity: 1;
    transform: none;
  }

  // 离开的元素立即隐藏
  .suggestion-leave-active {
    display: none;
  }
}

// ==================
// 消息样式
// ==================

// 用户查询气泡
.user-query {
  float: right;
  clear: both;
  max-width: 85%;
  padding: 10px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--anzhiyu-white);
  background: var(--anzhiyu-main);
  border-radius: 18px 18px 4px 18px;
  animation: slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

// AI 回复区域
.ai-response {
  clear: both;
  margin-bottom: 16px;
  animation: slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

// 搜索摘要
.search-header {
  padding: 12px 16px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--anzhiyu-fontcolor);
  background: var(--anzhiyu-secondbg);
  border: var(--style-border);
  border-radius: 12px;
}

// 结果卡片
.result-card {
  padding: 16px;
  margin-bottom: 10px;
  cursor: pointer;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: all 0.25s cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: var(--anzhiyu-card-bg);
    border-color: var(--anzhiyu-main);
    transform: translateY(-1px);
  }

  &:last-child {
    margin-bottom: 0;
  }

  .result-title {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--anzhiyu-main);
    transition: color 0.2s;

    &:hover {
      color: var(--anzhiyu-hovertext);
    }
  }

  .result-desc {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.6;
    color: var(--anzhiyu-secondtext);
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
}

// 聊天回复
.chat-reply {
  padding: 14px 16px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--anzhiyu-fontcolor);
  background: var(--anzhiyu-secondbg);
  border: var(--style-border);
  border-radius: 12px;

  :deep(p) {
    margin: 0.6em 0;

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(code) {
    padding: 2px 6px;
    font-family: "SF Mono", ui-monospace, monospace;
    font-size: 13px;
    background: var(--anzhiyu-card-btn-bg);
    border-radius: 4px;
  }

  :deep(pre) {
    padding: 14px;
    margin: 12px 0;
    overflow-x: auto;
    background: var(--anzhiyu-post-tabs-bg);
    border-radius: 10px;

    code {
      padding: 0;
      color: var(--anzhiyu-fontcolor);
      background: none;
    }
  }
}

// 加载状态卡片
.loading-card {
  display: inline-block;
  padding: 12px 18px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 16px;
  box-shadow: var(--anzhiyu-shadow-border);
  animation: slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.loading-content {
  display: flex;
  gap: 10px;
  align-items: center;
}

.loading-text {
  font-size: 14px;
  color: var(--anzhiyu-secondtext);
}

// 内容下方的生成中提示
.generating-hint {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  font-size: 13px;
  color: var(--anzhiyu-secondtext);
  border-top: var(--style-border);
}

// 加载动画
.loading-dots {
  display: flex;
  gap: 4px;
  align-items: center;

  span {
    width: 6px;
    height: 6px;
    background: var(--anzhiyu-secondtext);
    border-radius: 50%;
    animation: dotPulse 1.4s ease-in-out infinite;

    &:nth-child(1) {
      animation-delay: 0s;
    }

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

// ==================
// 动画
// ==================
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dotPulse {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }

  30% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
