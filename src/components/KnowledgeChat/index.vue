<!--
 * @Description: 知识库问答组件
 * @Author: 安知鱼
 * @Date: 2025-01-23
-->
<template>
  <div class="knowledge-chat" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 头部 -->
    <div class="chat-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="header-info">
          <h3>AI 知识助手</h3>
          <span class="subtitle">基于博客知识库，为您解答问题</span>
        </div>
      </div>
      <div class="header-actions">
        <el-tooltip content="清空对话">
          <el-button
            :icon="Delete"
            circle
            size="small"
            @click="clearMessages"
          />
        </el-tooltip>
        <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏'">
          <el-button
            :icon="isFullscreen ? FullScreen : FullScreen"
            circle
            size="small"
            @click="toggleFullscreen"
          />
        </el-tooltip>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="messagesRef" class="chat-messages">
      <!-- 欢迎消息 -->
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">
          <el-icon><Promotion /></el-icon>
        </div>
        <h4>欢迎使用知识库问答</h4>
        <p>您可以询问关于本站博客内容的任何问题，我会基于已有知识为您解答。</p>
        <div class="suggestion-list">
          <span class="suggestion-label">试试这些问题：</span>
          <div class="suggestions">
            <el-button
              v-for="(item, index) in suggestions"
              :key="index"
              size="small"
              round
              @click="handleSuggestion(item)"
            >
              {{ item }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-item"
        :class="{ 'is-user': msg.role === 'user' }"
      >
        <div class="message-avatar">
          <el-icon v-if="msg.role === 'assistant'"><ChatDotRound /></el-icon>
          <el-icon v-else><User /></el-icon>
        </div>
        <div class="message-content">
          <div class="message-bubble">
            <div
              v-if="msg.role === 'assistant'"
              class="message-text markdown-body"
              v-html="renderMarkdown(msg.content)"
            />
            <div v-else class="message-text">{{ msg.content }}</div>
            <!-- 流式输出中的光标 -->
            <span v-if="msg.loading" class="typing-cursor" />
          </div>
          <!-- 引用来源 -->
          <div
            v-if="msg.references && msg.references.length > 0"
            class="message-references"
          >
            <span class="references-label">
              <el-icon><Document /></el-icon>
              参考来源：
            </span>
            <div class="references-list">
              <a
                v-for="ref in msg.references"
                :key="ref.document_id"
                class="reference-item"
                :href="getRefUrl(ref)"
                target="_blank"
              >
                {{ ref.title }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="isLoading && !streamContent" class="message-item">
        <div class="message-avatar">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="message-content">
          <div class="message-bubble loading-bubble">
            <span class="loading-dot" />
            <span class="loading-dot" />
            <span class="loading-dot" />
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="2"
        :disabled="isLoading"
        placeholder="输入您的问题... (Enter 发送，Shift+Enter 换行)"
        resize="none"
        @keydown="handleKeydown"
      />
      <div class="input-actions">
        <span class="input-tip">
          <el-icon><InfoFilled /></el-icon>
          回答基于博客知识库生成
        </span>
        <el-button
          type="primary"
          :loading="isLoading"
          :disabled="!inputText.trim()"
          @click="sendMessage"
        >
          <el-icon><Promotion /></el-icon>
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onUnmounted } from "vue";
import {
  ChatDotRound,
  User,
  Document,
  Promotion,
  Delete,
  FullScreen,
  InfoFilled
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { getAskStreamUrl, type Reference } from "@/api/knowledge";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Props
interface Props {
  suggestions?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  suggestions: () => [
    "博客有哪些功能？",
    "如何使用Anheyu-app?",
    "评论系统怎么使用？"
  ]
});

// 消息类型
interface Message {
  role: "user" | "assistant";
  content: string;
  references?: Reference[];
  loading?: boolean;
}

// 状态
const messages = ref<Message[]>([]);
const inputText = ref("");
const isLoading = ref(false);
const isFullscreen = ref(false);
const messagesRef = ref<HTMLElement | null>(null);
const streamContent = ref("");

// EventSource 实例
let eventSource: EventSource | null = null;

// 渲染 Markdown
const renderMarkdown = (content: string) => {
  try {
    const html = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(html);
  } catch {
    return content;
  }
};

// 获取引用链接
const getRefUrl = (ref: Reference) => {
  if (ref.source_url) return ref.source_url;
  if (ref.source_type === "article" && ref.source_id) {
    return `/post/${ref.source_id}`;
  }
  return "#";
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
};

// 处理建议点击
const handleSuggestion = (text: string) => {
  inputText.value = text;
  sendMessage();
};

// 处理键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

// 发送消息
const sendMessage = async () => {
  const question = inputText.value.trim();
  if (!question || isLoading.value) return;

  // 添加用户消息
  messages.value.push({
    role: "user",
    content: question
  });
  inputText.value = "";
  scrollToBottom();

  // 开始加载
  isLoading.value = true;
  streamContent.value = "";

  // 添加 AI 消息占位
  const aiMessageIndex = messages.value.length;
  messages.value.push({
    role: "assistant",
    content: "",
    loading: true
  });

  try {
    // 使用 SSE 流式获取回答
    const url = getAskStreamUrl(question);
    eventSource = new EventSource(url);

    eventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data);

        if (data.content) {
          streamContent.value += data.content;
          messages.value[aiMessageIndex].content = streamContent.value;
          scrollToBottom();
        }

        if (data.done) {
          messages.value[aiMessageIndex].loading = false;
          if (data.references) {
            messages.value[aiMessageIndex].references = data.references;
          }
          eventSource?.close();
          eventSource = null;
          isLoading.value = false;
        }
      } catch {
        // 忽略解析错误
      }
    };

    eventSource.onerror = () => {
      messages.value[aiMessageIndex].loading = false;
      if (!messages.value[aiMessageIndex].content) {
        messages.value[aiMessageIndex].content =
          "抱歉，发生了错误，请稍后重试。";
      }
      eventSource?.close();
      eventSource = null;
      isLoading.value = false;
    };
  } catch (error: any) {
    messages.value[aiMessageIndex].loading = false;
    messages.value[aiMessageIndex].content =
      error.message || "抱歉，发生了错误，请稍后重试。";
    isLoading.value = false;
  }
};

// 清空消息
const clearMessages = () => {
  messages.value = [];
  streamContent.value = "";
  ElMessage.success("对话已清空");
};

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// 组件卸载时关闭 EventSource
onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
});

// 暴露方法
defineExpose({
  clearMessages,
  sendMessage: (text: string) => {
    inputText.value = text;
    sendMessage();
  }
});
</script>

<style lang="scss" scoped>
.knowledge-chat {
  display: flex;
  flex-direction: column;
  height: 500px;
  background: var(--el-bg-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &.is-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100vh;
    border-radius: 0;
    z-index: 2000;
  }
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #49b1f5, #36d1dc);
  color: #fff;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;

    .el-icon {
      font-size: 22px;
    }
  }

  .header-info {
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .subtitle {
      font-size: 12px;
      opacity: 0.85;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;

    .el-button {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: #fff;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);

  .welcome-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #49b1f5, #36d1dc);
    border-radius: 20px;
    margin-bottom: 16px;

    .el-icon {
      font-size: 32px;
      color: #fff;
    }
  }

  h4 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0 0 20px;
    font-size: 14px;
    max-width: 300px;
  }

  .suggestion-list {
    .suggestion-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin-bottom: 12px;
      display: block;
    }

    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;

      .el-button {
        font-size: 13px;
      }
    }
  }
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 85%;

  &.is-user {
    flex-direction: row-reverse;
    align-self: flex-end;

    .message-content {
      align-items: flex-end;
    }

    .message-bubble {
      background: var(--anzhiyu-theme);
      color: #fff;
      border-radius: 16px 4px 16px 16px;
    }
  }

  .message-avatar {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-fill-color);
    border-radius: 50%;
    flex-shrink: 0;

    .el-icon {
      font-size: 18px;
      color: var(--el-text-color-secondary);
    }
  }

  .message-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .message-bubble {
    padding: 12px 16px;
    background: var(--el-fill-color-light);
    border-radius: 4px 16px 16px 16px;
    position: relative;

    &.loading-bubble {
      display: flex;
      gap: 4px;
      padding: 16px 20px;
    }
  }

  .message-text {
    font-size: 14px;
    line-height: 1.7;
    word-break: break-word;

    :deep(p) {
      margin: 0.5em 0;

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(code) {
      padding: 2px 6px;
      background: var(--el-fill-color);
      border-radius: 4px;
      font-size: 13px;
      font-family: "Fira Code", monospace;
    }

    :deep(pre) {
      margin: 12px 0;
      padding: 16px;
      background: var(--el-fill-color);
      border-radius: 8px;
      overflow-x: auto;

      code {
        padding: 0;
        background: none;
      }
    }

    :deep(ul),
    :deep(ol) {
      margin: 8px 0;
      padding-left: 20px;
    }

    :deep(li) {
      margin: 4px 0;
    }

    :deep(blockquote) {
      margin: 12px 0;
      padding: 8px 16px;
      border-left: 4px solid var(--anzhiyu-theme);
      background: var(--el-fill-color-light);
      border-radius: 0 8px 8px 0;

      p {
        margin: 0;
      }
    }

    :deep(a) {
      color: var(--anzhiyu-theme);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .typing-cursor {
    display: inline-block;
    width: 2px;
    height: 16px;
    background: var(--anzhiyu-theme);
    margin-left: 2px;
    animation: blink 1s infinite;
  }

  .loading-dot {
    width: 8px;
    height: 8px;
    background: var(--el-text-color-secondary);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }

  .message-references {
    padding: 8px 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    font-size: 12px;

    .references-label {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--el-text-color-secondary);
      margin-bottom: 6px;

      .el-icon {
        font-size: 14px;
      }
    }

    .references-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .reference-item {
      padding: 4px 10px;
      background: var(--el-fill-color);
      border-radius: 12px;
      color: var(--anzhiyu-theme);
      text-decoration: none;
      font-size: 12px;
      transition: all 0.2s;

      &:hover {
        background: var(--anzhiyu-theme);
        color: #fff;
      }
    }
  }
}

.chat-input {
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);

  :deep(.el-textarea__inner) {
    border-radius: 12px;
    padding: 12px 16px;
  }

  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;

    .input-tip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);

      .el-icon {
        font-size: 14px;
      }
    }

    .el-button {
      border-radius: 20px;
      padding: 8px 20px;
    }
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .knowledge-chat {
    height: 100%;
    border-radius: 0;
  }

  .chat-header {
    padding: 12px 16px;

    .header-icon {
      width: 36px;
      height: 36px;

      .el-icon {
        font-size: 18px;
      }
    }

    .header-info h3 {
      font-size: 15px;
    }
  }

  .chat-messages {
    padding: 16px;
  }

  .message-item {
    max-width: 90%;
    gap: 10px;

    .message-avatar {
      width: 32px;
      height: 32px;

      .el-icon {
        font-size: 16px;
      }
    }

    .message-bubble {
      padding: 10px 14px;
    }

    .message-text {
      font-size: 13px;
    }
  }

  .chat-input {
    padding: 12px 16px;
  }
}
</style>
