<!--
 * @Description: AI 智能助手组件 - Apple 风格设计
 * @Author: 安知鱼
 * @Date: 2025-01-23
-->
<template>
  <Teleport to="body">
    <!-- 浮动按钮 -->
    <FloatingButton :visible="enabled && !visible" @click="openPanel" />

    <!-- 遮罩层 -->
    <Transition name="overlay-fade">
      <div v-if="visible" class="ai-overlay" @click="closePanel" />
    </Transition>

    <!-- 主面板 -->
    <Transition name="panel-slide">
      <div v-if="visible" class="ai-panel">
        <!-- 消息列表 -->
        <MessageList
          ref="messageListRef"
          :messages="messages"
          :assistant-name="assistantName"
          :welcome-text="welcomeText"
          :suggestions="currentSuggestions"
          :mode="mode"
          @open-result="openResult"
          @select-suggestion="handleSuggestion"
        />

        <!-- 底部区域 -->
        <div class="panel-footer">
          <!-- 输入框 -->
          <InputBar
            ref="inputBarRef"
            v-model="inputText"
            :placeholder="
              mode === 'chat' ? '请输入你的问题...' : '搜索文章内容...'
            "
            :disabled="isLoading"
            @submit="sendMessage"
          />

          <!-- 操作栏 -->
          <ActionBar
            v-model:mode="mode"
            @clear="clearMessages"
            @close="closePanel"
          />

          <!-- 免责提示 -->
          <div class="disclaimer">
            {{ assistantName }}可能会生成错误的信息，请注意核实。
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import {
  getAskStreamUrl,
  searchKnowledge,
  type Reference
} from "@/api/knowledge";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import FloatingButton from "./components/FloatingButton.vue";
import MessageList from "./components/MessageList.vue";
import InputBar from "./components/InputBar.vue";
import ActionBar from "./components/ActionBar.vue";
import type { Message, SearchResult, ChatMode, LoadingStage } from "./types";

// Props
interface Props {
  assistantName?: string;
  welcomeText?: string;
  chatSuggestions?: string[]; // 聊天模式预设问题
  searchSuggestions?: string[]; // 搜索模式预设问题
}

const props = withDefaults(defineProps<Props>(), {
  assistantName: "洪墨AI",
  welcomeText: "如果有问题欢迎问我哦！",
  chatSuggestions: () => ["你是谁?", "博客有哪些功能?", "如何使用Anheyu-app?"],
  searchSuggestions: () => ["前端开发", "后端开发", "Anheyu-App使用"]
});

// 根据当前模式获取预设问题
const currentSuggestions = computed(() => {
  return mode.value === "chat"
    ? props.chatSuggestions
    : props.searchSuggestions;
});

// Store
const siteConfigStore = useSiteConfigStore();

// Refs
const messageListRef = ref<InstanceType<typeof MessageList> | null>(null);
const inputBarRef = ref<InstanceType<typeof InputBar> | null>(null);

// 状态
const visible = ref(false);
const enabled = ref(true);
const mode = ref<ChatMode>("chat");
const messages = ref<Message[]>([]);
const inputText = ref("");
const isLoading = ref(false);
const streamContent = ref("");

// EventSource
let eventSource: EventSource | null = null;

// 从配置中获取是否启用
onMounted(() => {
  const config = siteConfigStore.getSiteConfig;
  // 后端 unflatten 后的结构: ai_assistant.enable -> {ai_assistant: {enable: ...}}
  const configEnabled = config?.ai_assistant?.enable;
  if (configEnabled !== undefined) {
    enabled.value = configEnabled === "true" || configEnabled === true;
  }
});

// 打开面板
const openPanel = () => {
  visible.value = true;
  nextTick(() => {
    inputBarRef.value?.focus();
  });
};

// 关闭面板
const closePanel = () => {
  visible.value = false;
};

// 清空消息
const clearMessages = () => {
  messages.value = [];
  streamContent.value = "";
  ElMessage.success("已清空");
};

// 打开搜索结果
const openResult = (result: SearchResult) => {
  if (result.url) {
    window.open(result.url, "_blank");
  } else if (result.source_id) {
    window.open(`/post/${result.source_id}`, "_blank");
  }
};

// 处理建议问题点击
const handleSuggestion = (text: string) => {
  inputText.value = text;
  sendMessage();
};

// 发送消息
const sendMessage = async () => {
  const question = inputText.value.trim();
  if (!question || isLoading.value) return;

  // 添加用户消息
  messages.value.push({ role: "user", content: question });
  inputText.value = "";

  // 开始加载
  isLoading.value = true;
  streamContent.value = "";

  // 根据模式选择不同的处理方式
  if (mode.value === "search") {
    await handleSearchMode(question);
  } else {
    await handleChatMode(question);
  }
};

// 搜索模式处理
const handleSearchMode = async (question: string) => {
  // 添加 AI 消息占位
  const aiMessageIndex = messages.value.length;
  messages.value.push({
    role: "assistant",
    content: "",
    loading: true,
    loadingStage: "searching",
    query: question,
    searchResults: [],
    mode: "search"
  });

  try {
    const res = await searchKnowledge(question, 5);

    if (res.code === 200 && res.data) {
      const msg = messages.value[aiMessageIndex];
      msg.loading = false;
      msg.loadingStage = "done";
      const results = res.data.results || [];
      msg.content =
        results.length > 0
          ? `我为你找到了关于"${question}"的 ${results.length} 条结果`
          : `抱歉，没有找到关于"${question}"的相关内容`;
      msg.searchResults = results.map(item => ({
        title: item.title,
        summary: item.summary,
        url: item.url,
        source_id: item.source_id
      }));
    } else {
      messages.value[aiMessageIndex].loading = false;
      messages.value[aiMessageIndex].content = "抱歉，搜索失败，请稍后重试。";
    }
  } catch (error: unknown) {
    messages.value[aiMessageIndex].loading = false;
    messages.value[aiMessageIndex].content =
      (error as Error).message || "抱歉，搜索失败，请稍后重试。";
  } finally {
    isLoading.value = false;
  }
};

// 聊天模式处理
const handleChatMode = async (question: string) => {
  // 添加 AI 消息占位
  const aiMessageIndex = messages.value.length;
  messages.value.push({
    role: "assistant",
    content: "",
    loading: true,
    loadingStage: "understanding",
    mode: "chat"
  });

  try {
    // 切换到搜索知识库阶段
    setTimeout(() => {
      if (messages.value[aiMessageIndex]?.loading) {
        messages.value[aiMessageIndex].loadingStage = "searching";
      }
    }, 800);

    const url = getAskStreamUrl(question);
    eventSource = new EventSource(url);

    let firstChunkReceived = false;

    eventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data);

        if (data.content) {
          // 收到第一个内容时，切换到生成阶段
          if (!firstChunkReceived) {
            firstChunkReceived = true;
            messages.value[aiMessageIndex].loadingStage = "generating";
          }

          streamContent.value += data.content;
          messages.value[aiMessageIndex].content = streamContent.value;
        }

        if (data.done) {
          messages.value[aiMessageIndex].loading = false;
          messages.value[aiMessageIndex].loadingStage = "done";
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
      messages.value[aiMessageIndex].loadingStage = "done";
      if (!messages.value[aiMessageIndex].content) {
        messages.value[aiMessageIndex].content =
          "抱歉，发生了错误，请稍后重试。";
      }
      eventSource?.close();
      eventSource = null;
      isLoading.value = false;
    };
  } catch (error: unknown) {
    messages.value[aiMessageIndex].loading = false;
    messages.value[aiMessageIndex].loadingStage = "done";
    messages.value[aiMessageIndex].content =
      (error as Error).message || "抱歉，发生了错误，请稍后重试。";
    isLoading.value = false;
  }
};

// 键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && visible.value) {
    closePanel();
  }
};

// 监听显示状态
watch(visible, val => {
  if (val) {
    nextTick(() => inputBarRef.value?.focus());
  }
});

// 监听打开 AI 助手的事件（移动端顶部按钮触发）
const handleOpenAIAssistantEvent = () => {
  if (enabled.value) {
    openPanel();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener(
    "frontend-open-ai-assistant",
    handleOpenAIAssistantEvent
  );
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener(
    "frontend-open-ai-assistant",
    handleOpenAIAssistantEvent
  );
  if (eventSource) {
    eventSource.close();
  }
});

// 暴露方法
defineExpose({
  open: openPanel,
  close: closePanel,
  toggle: () => (visible.value = !visible.value)
});
</script>

<style lang="scss" scoped>
// 遮罩层
.ai-overlay {
  position: fixed;
  inset: 0;
  z-index: 1999;
  background: var(--anzhiyu-maskbg);
  backdrop-filter: blur(4px);
}

// 主面板
.ai-panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  left: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  max-width: 560px;
  max-height: calc(100vh - 40px);
  margin: 0 auto;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  backdrop-filter: saturate(180%) blur(30px);
  border: var(--style-border);
  border-radius: 20px;
  box-shadow: var(--anzhiyu-shadow-border);
}

// 底部区域
.panel-footer {
  padding: 12px 16px 16px;
  background: transparent;
}

// 免责提示
.disclaimer {
  padding-top: 6px;
  font-size: 10px;
  color: var(--anzhiyu-secondtext);
  text-align: center;
  letter-spacing: 0.02em;
}

// 遮罩动画
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: all 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0);
}

// 面板动画 - 桌面端
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

// 移动端面板动画 - 从底部滑入
@media screen and (max-width: 640px) {
  .panel-slide-enter-from,
  .panel-slide-leave-to {
    opacity: 1;
    transform: translateY(100%);
  }

  .panel-slide-enter-active,
  .panel-slide-leave-active {
    transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  }
}

// 移动端优化 - 更沉浸的体验
@media screen and (max-width: 640px) {
  .ai-panel {
    right: 0;
    bottom: 0;
    left: 0;
    max-width: 100%;
    max-height: 85vh;
    border-radius: 20px 20px 0 0;
    border-bottom: none;
  }

  .panel-footer {
    padding: 10px 14px calc(env(safe-area-inset-bottom, 12px) + 10px);
    background: var(--anzhiyu-card-bg);
  }

  .disclaimer {
    padding-top: 6px;
    font-size: 10px;
    opacity: 0.7;
  }
}

// 小屏幕进一步优化
@media screen and (max-width: 380px) {
  .ai-panel {
    max-height: 90vh;
  }
}
</style>
