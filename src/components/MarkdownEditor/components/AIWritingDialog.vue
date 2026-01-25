<!--
 * @Description: AI写作对话框组件
 * @Author: 安知鱼
 * @Date: 2025-12-27
-->
<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import {
  useAIWriting,
  type AIWritingRequest
} from "@/composables/useAIWriting";
import { getArticleList, getArticle } from "@/api/post";
import { useSnackbar } from "@/composables/useSnackbar";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "insert", content: string): void;
}>();

const { showSnackbar } = useSnackbar();

// === AI 写作功能 ===
const aiWritingForm = reactive<AIWritingRequest>({
  topic: "",
  style: "professional",
  length: "medium",
  useTags: true,
  customPrompt: "",
  learnFromHistory: false,
  historyArticleCount: 3,
  historyArticleSamples: ""
});
const aiWritingPreview = ref("");
const showAIWritingPreview = ref(false);
const isLoadingHistory = ref(false);
const aiWritingError = ref("");
const aiWritingStatus = ref("");

// 写作风格选项
const writingStyleOptions = [
  { value: "professional", label: "专业技术", description: "适合技术文章" },
  { value: "casual", label: "轻松随意", description: "适合生活分享" },
  { value: "academic", label: "学术严谨", description: "适合学术讨论" },
  { value: "creative", label: "创意文学", description: "适合创意写作" }
];

// 文章长度选项
const writingLengthOptions = [
  { value: "short", label: "短篇 (0~800字)" },
  { value: "medium", label: "中篇 (800~2000字)" },
  { value: "long", label: "长篇 (2000~5000字)" }
];

const {
  isGenerating: isAIWriting,
  generatedContent: streamingContent,
  generateStream: generateAIWritingStream,
  cancelGeneration: cancelAIWriting
} = useAIWriting({
  onSuccess: content => {
    aiWritingPreview.value = content;
    showAIWritingPreview.value = true;
    aiWritingError.value = "";
    aiWritingStatus.value = "";
  },
  onError: error => {
    console.error("AI 写作失败:", error);
    aiWritingError.value = error.message || "生成失败，请重试";
    aiWritingStatus.value = "";
  },
  onStream: _chunk => {
    aiWritingPreview.value = streamingContent.value;
    if (!showAIWritingPreview.value) {
      showAIWritingPreview.value = true;
    }
  }
});

// 重置对话框状态
const resetDialog = () => {
  aiWritingForm.topic = "";
  aiWritingForm.style = "professional";
  aiWritingForm.length = "medium";
  aiWritingForm.useTags = true;
  aiWritingForm.customPrompt = "";
  aiWritingForm.learnFromHistory = false;
  aiWritingForm.historyArticleCount = 3;
  aiWritingForm.historyArticleSamples = "";
  aiWritingPreview.value = "";
  showAIWritingPreview.value = false;
  isLoadingHistory.value = false;
  aiWritingError.value = "";
  aiWritingStatus.value = "";
};

// 监听对话框打开状态
watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      resetDialog();
    }
  }
);

// 关闭对话框
const closeDialog = () => {
  emit("update:modelValue", false);
};

// 获取历史文章样本
const fetchHistoryArticleSamples = async (count: number): Promise<string> => {
  try {
    isLoadingHistory.value = true;

    const result = await getArticleList({
      page: 1,
      pageSize: count,
      status: "PUBLISHED"
    });

    if (result.code === 200 && result.data?.list?.length > 0) {
      const articlePromises = result.data.list.map(article =>
        getArticle(article.id).catch(err => {
          console.warn(`获取文章 ${article.id} 详情失败:`, err);
          return null;
        })
      );

      const articleDetails = await Promise.all(articlePromises);

      const samples = articleDetails
        .filter(res => res?.code === 200 && res.data?.content_md?.trim())
        .map((res, index) => {
          const article = res!.data;
          const content = article.content_md || "";
          const truncatedContent =
            content.length > 2000
              ? content.substring(0, 2000) + "..."
              : content;
          return `--- 参考文章 ${index + 1}：《${article.title}》 ---\n${truncatedContent}`;
        })
        .join("\n\n");

      return samples;
    }
    return "";
  } catch (error) {
    console.error("获取历史文章失败:", error);
    return "";
  } finally {
    isLoadingHistory.value = false;
  }
};

// 生成 AI 写作内容（流式）
const handleGenerateAIWriting = async () => {
  const totalStartTime = performance.now();
  console.log("[AI写作UI] ===== 点击开始生成 =====");

  aiWritingError.value = "";
  aiWritingStatus.value = "";
  aiWritingPreview.value = "";
  showAIWritingPreview.value = false;

  if (!aiWritingForm.topic.trim()) {
    aiWritingError.value = "请输入写作主题或大纲";
    return;
  }

  if (aiWritingForm.learnFromHistory) {
    aiWritingStatus.value = "正在分析历史文章风格...";
    const historyStartTime = performance.now();
    const samples = await fetchHistoryArticleSamples(
      aiWritingForm.historyArticleCount || 3
    );
    console.log(
      `[AI写作UI] 获取历史文章耗时: ${(performance.now() - historyStartTime).toFixed(0)}ms`
    );
    if (samples) {
      aiWritingForm.historyArticleSamples = samples;
      console.log(`[AI写作UI] 历史文章样本长度: ${samples.length} 字符`);
      aiWritingStatus.value = "历史文章分析完成，开始流式生成...";
    } else {
      aiWritingStatus.value = "未找到可参考的历史文章，使用默认风格生成...";
      aiWritingForm.learnFromHistory = false;
    }
  } else {
    aiWritingForm.historyArticleSamples = "";
    aiWritingStatus.value = "AI 正在创作中，内容将实时显示...";
  }

  console.log(
    `[AI写作UI] 准备阶段耗时: ${(performance.now() - totalStartTime).toFixed(0)}ms`
  );
  console.log(
    `[AI写作UI] 发送参数: learnFromHistory=${aiWritingForm.learnFromHistory}, historyArticleSamples长度=${aiWritingForm.historyArticleSamples?.length || 0}`
  );

  await generateAIWritingStream(aiWritingForm);
  console.log(
    `[AI写作UI] ===== 全部完成，总耗时: ${(performance.now() - totalStartTime).toFixed(0)}ms =====`
  );
};

// 插入 AI 生成的内容
const insertAIWritingContent = () => {
  if (!aiWritingPreview.value) return;

  emit("insert", aiWritingPreview.value);
  closeDialog();
  showAIWritingPreview.value = false;
  aiWritingPreview.value = "";
  showSnackbar("AI 写作内容已插入");
};

// 重新生成
const regenerateAIWriting = async () => {
  showAIWritingPreview.value = false;
  aiWritingPreview.value = "";
  await handleGenerateAIWriting();
};
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="ai-writing-dialog-overlay">
      <div class="ai-writing-dialog">
        <!-- AI 生成中遮罩 -->
        <div
          v-if="isAIWriting && !showAIWritingPreview"
          class="ai-generating-mask"
        >
          <div class="generating-content">
            <div class="generating-spinner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                />
              </svg>
            </div>
            <div class="generating-text">
              <h4>AI 正在创作中...</h4>
              <p>{{ aiWritingStatus || "正在生成精彩内容，请稍候" }}</p>
            </div>
            <button class="cancel-generating-btn" @click="cancelAIWriting">
              <svg
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              停止生成
            </button>
          </div>
        </div>

        <div class="dialog-header">
          <div class="dialog-title">
            <div class="title-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                />
                <path d="M20 3v4" />
                <path d="M22 5h-4" />
                <path d="M4 17v2" />
                <path d="M5 18H3" />
              </svg>
            </div>
            <div class="title-text">
              <h3>AI 写作助手</h3>
              <span class="title-subtitle">让 AI 帮你创作精彩内容</span>
            </div>
          </div>
          <button class="dialog-close-btn" @click="closeDialog">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <!-- 错误提示 -->
        <div v-if="aiWritingError" class="dialog-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
          <span>{{ aiWritingError }}</span>
          <button class="error-close" @click="aiWritingError = ''">×</button>
        </div>

        <div class="dialog-body">
          <!-- 输入区域 -->
          <div v-if="!showAIWritingPreview" class="ai-writing-form">
            <!-- 主题输入区 -->
            <div class="form-section topic-section">
              <div class="topic-input-wrapper">
                <textarea
                  v-model="aiWritingForm.topic"
                  rows="4"
                  placeholder="描述你想要创作的内容...（必填）"
                  class="topic-textarea"
                />
                <div class="input-hints">
                  <span
                    class="hint-item"
                    @click="aiWritingForm.topic = '介绍 Vue 3 的新特性'"
                    >💡 介绍 Vue 3 的新特性</span
                  >
                  <span
                    class="hint-item"
                    @click="aiWritingForm.topic = '分享博客搭建经验'"
                    >📝 分享博客搭建经验</span
                  >
                  <span
                    class="hint-item"
                    @click="aiWritingForm.topic = 'TypeScript 高级类型解析'"
                    >🔧 TypeScript 高级类型解析</span
                  >
                </div>
              </div>
            </div>

            <!-- 配置选项区 -->
            <div class="form-section config-section">
              <div class="config-grid">
                <!-- 写作风格 -->
                <div class="config-block">
                  <div class="config-label">
                    <svg
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
                      <path
                        d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"
                      />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                      <path d="m5 12-3 3 3 3" />
                      <path d="m9 18 3-3-3-3" />
                    </svg>
                    <span>写作风格</span>
                  </div>
                  <div class="style-cards">
                    <div
                      v-for="style in writingStyleOptions"
                      :key="style.value"
                      class="style-card"
                      :class="{ active: aiWritingForm.style === style.value }"
                      @click="
                        aiWritingForm.style =
                          style.value as AIWritingRequest['style']
                      "
                    >
                      <span class="style-name">{{ style.label }}</span>
                      <span class="style-hint">{{ style.description }}</span>
                      <div class="card-check">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="3"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 文章长度 -->
                <div class="config-block">
                  <div class="config-label">
                    <svg
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
                      <line x1="21" x2="14" y1="4" y2="4" />
                      <line x1="10" x2="3" y1="4" y2="4" />
                      <line x1="21" x2="12" y1="12" y2="12" />
                      <line x1="8" x2="3" y1="12" y2="12" />
                      <line x1="21" x2="16" y1="20" y2="20" />
                      <line x1="12" x2="3" y1="20" y2="20" />
                    </svg>
                    <span>文章长度</span>
                  </div>
                  <div class="length-pills">
                    <div
                      v-for="length in writingLengthOptions"
                      :key="length.value"
                      class="length-pill"
                      :class="{
                        active: aiWritingForm.length === length.value
                      }"
                      @click="
                        aiWritingForm.length =
                          length.value as AIWritingRequest['length']
                      "
                    >
                      <span class="pill-label">{{
                        length.label.split(" ")[0]
                      }}</span>
                      <span class="pill-count">{{
                        length.label.match(/\(([^)]+)\)/)?.[1] || ""
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 增强选项区 -->
            <div class="form-section enhance-section">
              <div class="enhance-options">
                <label
                  class="enhance-option"
                  :class="{ active: aiWritingForm.useTags }"
                >
                  <input v-model="aiWritingForm.useTags" type="checkbox" />
                  <div class="option-content">
                    <div class="option-text">
                      <span class="option-title">博客标签插件</span>
                      <span class="option-desc"
                        >使用提示框、折叠、选项卡等丰富内容</span
                      >
                    </div>
                  </div>
                  <div class="option-toggle">
                    <div class="toggle-track">
                      <div class="toggle-thumb" />
                    </div>
                  </div>
                </label>

                <label
                  class="enhance-option"
                  :class="{ active: aiWritingForm.learnFromHistory }"
                >
                  <input
                    v-model="aiWritingForm.learnFromHistory"
                    type="checkbox"
                  />
                  <div class="option-content">
                    <div class="option-text">
                      <span class="option-title">学习写作风格</span>
                      <span class="option-desc"
                        >参考历史文章，模仿你的表达方式</span
                      >
                    </div>
                  </div>
                  <div class="option-toggle">
                    <div class="toggle-track">
                      <div class="toggle-thumb" />
                    </div>
                  </div>
                </label>
              </div>

              <!-- 历史文章数量选择 -->
              <div v-if="aiWritingForm.learnFromHistory" class="history-config">
                <div class="history-label">参考文章数量</div>
                <div class="history-chips">
                  <div
                    v-for="count in [2, 3, 5]"
                    :key="count"
                    class="history-chip"
                    :class="{
                      active: aiWritingForm.historyArticleCount === count
                    }"
                    @click="aiWritingForm.historyArticleCount = count"
                  >
                    {{ count }} 篇
                  </div>
                </div>
                <div class="history-note">
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
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  AI 将分析你最近发布的文章，学习写作风格后再创作
                </div>
              </div>
            </div>

            <!-- 高级选项 -->
            <details class="advanced-section">
              <summary class="advanced-toggle">
                <svg
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
                  <path
                    d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>高级选项</span>
                <svg
                  class="chevron"
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
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div class="advanced-content">
                <label class="advanced-label">自定义提示词</label>
                <textarea
                  v-model="aiWritingForm.customPrompt"
                  rows="3"
                  placeholder="添加额外的写作要求或指导..."
                  class="advanced-textarea"
                />
              </div>
            </details>
          </div>

          <!-- 预览区域（流式生成时也显示） -->
          <div v-else class="ai-writing-preview">
            <div class="preview-header">
              <span class="preview-label">
                <template v-if="isAIWriting">
                  <span class="streaming-indicator">
                    <span class="streaming-dot" />
                    AI 正在创作中...
                  </span>
                </template>
                <template v-else> AI 生成内容预览 </template>
              </span>
              <button
                v-if="!isAIWriting"
                class="regenerate-btn"
                @click="regenerateAIWriting"
              >
                <svg
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
                  <path
                    d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
                  />
                </svg>
                重新生成
              </button>
              <button v-else class="cancel-btn" @click="cancelAIWriting">
                <svg
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
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                停止生成
              </button>
            </div>
            <div class="preview-content" :class="{ streaming: isAIWriting }">
              <pre>{{ aiWritingPreview }}<span v-if="isAIWriting" class="cursor-blink">|</span></pre>
            </div>
            <div class="streaming-status">
              <span class="char-count">
                <template v-if="isAIWriting">
                  <span class="streaming-dot" /> 正在生成...
                </template>
                已生成 {{ aiWritingPreview.length }} 字
              </span>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeDialog">
            <svg
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            取消
          </button>
          <button
            v-if="!showAIWritingPreview"
            class="btn-generate"
            :disabled="isAIWriting || !aiWritingForm.topic.trim()"
            @click="handleGenerateAIWriting"
          >
            <svg
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
              <path
                d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
              />
              <path d="M20 3v4" />
              <path d="M22 5h-4" />
              <path d="M4 17v2" />
              <path d="M5 18H3" />
            </svg>
            开始生成
          </button>
          <button v-else class="btn-insert" @click="insertAIWritingContent">
            <svg
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
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            插入到编辑器
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.ai-writing-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  backdrop-filter: blur(6px);
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.ai-writing-dialog {
  position: relative;
  background: var(--anzhiyu-card-bg);
  border-radius: 14px;
  width: 92%;
  max-width: 540px;
  max-height: 85vh;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: var(--style-border);
  background: var(--anzhiyu-secondbg);
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;

  .title-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--anzhiyu-theme);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--anzhiyu-shadow-lightblack);

    svg {
      color: var(--anzhiyu-white);
      width: 16px;
      height: 16px;
    }
  }

  .title-text {
    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .title-subtitle {
      font-size: 11px;
      color: var(--anzhiyu-secondtext);
      margin-top: 1px;
      display: block;
    }
  }
}

.dialog-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--anzhiyu-secondtext);
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.15s;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: var(--anzhiyu-theme-op);
    color: var(--anzhiyu-red);
  }
}

.ai-generating-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  animation: fadeIn 0.3s ease-out;

  .generating-content {
    text-align: center;
    color: white;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .generating-spinner {
    svg {
      width: 48px;
      height: 48px;
      animation: sparkle 2s ease-in-out infinite;
      filter: drop-shadow(0 0 12px rgba(73, 177, 245, 0.6));
    }
  }

  .generating-text {
    h4 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: white;
    }

    p {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
    }
  }

  .cancel-generating-btn {
    margin-top: 8px;
    padding: 10px 24px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.5);
    }
  }
}

@keyframes sparkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.1) rotate(180deg);
    opacity: 0.8;
  }
}

.dialog-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--anzhiyu-theme-op);
  border-bottom: var(--style-border);
  color: var(--anzhiyu-red);
  font-size: 12px;
  animation: slideDown 0.2s ease-out;

  svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  }

  span {
    flex: 1;
  }

  .error-close {
    background: none;
    border: none;
    color: var(--anzhiyu-red);
    cursor: pointer;
    font-size: 14px;
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.15s;

    &:hover {
      background: var(--anzhiyu-theme-op);
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 16px;
  position: relative;
}

.ai-writing-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-section {
  background: var(--anzhiyu-secondbg);
  border-radius: 10px;
  padding: 12px;
}

.topic-section {
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .section-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--anzhiyu-theme);
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      color: var(--anzhiyu-white);
      width: 14px;
      height: 14px;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;

    .title {
      font-size: 13px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .required-badge {
      font-size: 10px;
      padding: 2px 6px;
      background: var(--anzhiyu-theme-op);
      color: var(--anzhiyu-red);
      border-radius: 4px;
      font-weight: 500;
    }
  }
}

.topic-input-wrapper {
  .topic-textarea {
    width: 100%;
    padding: 10px 12px;
    border: var(--style-border);
    border-radius: 8px;
    background: var(--anzhiyu-card-bg);
    color: var(--anzhiyu-fontcolor);
    font-size: 13px;
    line-height: 1.5;
    resize: none;
    transition: all 0.2s;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: var(--anzhiyu-main);
      box-shadow: var(--anzhiyu-shadow-lightblack);
    }

    &::placeholder {
      color: var(--anzhiyu-secondtext);
    }
  }

  .input-hints {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;

    .hint-item {
      font-size: 11px;
      padding: 4px 8px;
      background: var(--anzhiyu-card-bg);
      border: var(--style-border);
      border-radius: 12px;
      color: var(--anzhiyu-secondtext);
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        border-color: var(--anzhiyu-main);
        color: var(--anzhiyu-main);
        background: var(--anzhiyu-theme-op);
      }
    }
  }
}

.config-section {
  padding: 10px;
}

.config-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-block {
  .config-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--anzhiyu-secondtext);
    margin-bottom: 8px;

    svg {
      width: 14px;
      height: 14px;
      opacity: 0.7;
    }
  }
}

.style-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.style-card {
  position: relative;
  padding: 8px 6px;
  border: var(--style-border);
  border-radius: 8px;
  background: var(--anzhiyu-card-bg);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;

  .style-name {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
    margin-bottom: 2px;
  }

  .style-hint {
    display: block;
    font-size: 9px;
    color: var(--anzhiyu-secondtext);
    line-height: 1.2;
  }

  .card-check {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--anzhiyu-main);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.15s;

    svg {
      color: white;
      width: 8px;
      height: 8px;
    }
  }

  &:hover {
    border-color: var(--anzhiyu-theme);
    background: var(--anzhiyu-theme-op);
  }

  &.active {
    border-color: var(--anzhiyu-main);
    background: var(--anzhiyu-theme-op);

    .card-check {
      opacity: 1;
      transform: scale(1);
    }

    .style-name {
      color: var(--anzhiyu-main);
    }
  }
}

.length-pills {
  display: flex;
  gap: 6px;
}

.length-pill {
  flex: 1;
  padding: 8px 6px;
  border: var(--style-border);
  border-radius: 8px;
  background: var(--anzhiyu-card-bg);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;

  .pill-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .pill-count {
    display: block;
    font-size: 10px;
    color: var(--anzhiyu-secondtext);
    margin-top: 2px;
  }

  &:hover {
    border-color: var(--anzhiyu-theme);
  }

  &.active {
    border-color: var(--anzhiyu-main);
    background: var(--anzhiyu-main);

    .pill-label,
    .pill-count {
      color: white;
    }
  }
}

.enhance-section {
  background: transparent;
  padding: 0;
}

.enhance-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.enhance-option {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: var(--anzhiyu-secondbg);
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;

  input[type="checkbox"] {
    display: none;
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }

  .option-text {
    flex: 1;

    .option-title {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .option-desc {
      display: block;
      font-size: 10px;
      color: var(--anzhiyu-secondtext);
      margin-top: 2px;
    }
  }

  .option-toggle {
    .toggle-track {
      width: 36px;
      height: 20px;
      background: var(--anzhiyu-card-border);
      border-radius: 10px;
      position: relative;
      transition: all 0.2s;

      .toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background: white;
        border-radius: 50%;
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
    }
  }

  &:hover {
    background: var(--anzhiyu-theme-op);
  }

  &.active {
    border-color: var(--anzhiyu-theme);
    background: var(--anzhiyu-theme-op);

    .option-toggle .toggle-track {
      background: var(--anzhiyu-main);

      .toggle-thumb {
        left: 18px;
      }
    }
  }
}

.history-config {
  margin-top: 8px;
  padding: 10px 12px;
  background: var(--anzhiyu-theme-op);
  border: var(--style-border);
  border-radius: 8px;
  animation: slideDown 0.2s ease-out;

  .history-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--anzhiyu-secondtext);
    margin-bottom: 8px;
  }

  .history-chips {
    display: flex;
    gap: 6px;
  }

  .history-chip {
    flex: 1;
    padding: 6px 10px;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border);
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    color: var(--anzhiyu-fontcolor);
    text-align: center;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      border-color: var(--anzhiyu-main);
    }

    &.active {
      background: var(--anzhiyu-main);
      border-color: var(--anzhiyu-main);
      color: white;
    }
  }

  .history-note {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 10px;
    color: var(--anzhiyu-secondtext);

    svg {
      flex-shrink: 0;
      opacity: 0.6;
    }
  }
}

.advanced-section {
  margin-top: 4px;

  summary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    color: var(--anzhiyu-secondtext);
    transition: all 0.15s;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    svg {
      width: 14px;
      height: 14px;
      opacity: 0.6;
    }

    .chevron {
      margin-left: auto;
      transition: transform 0.2s;
    }

    &:hover {
      color: var(--anzhiyu-main);
      background: var(--anzhiyu-theme-op);
    }
  }

  &[open] summary .chevron {
    transform: rotate(180deg);
  }

  .advanced-content {
    padding: 12px;
    margin-top: 8px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;
    animation: slideDown 0.2s ease-out;
  }

  .advanced-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: var(--anzhiyu-secondtext);
    margin-bottom: 6px;
  }

  .advanced-textarea {
    width: 100%;
    padding: 8px 10px;
    border: var(--style-border);
    border-radius: 6px;
    background: var(--anzhiyu-card-bg);
    color: var(--anzhiyu-fontcolor);
    font-size: 12px;
    line-height: 1.4;
    resize: none;
    transition: all 0.15s;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: var(--anzhiyu-main);
    }

    &::placeholder {
      color: var(--anzhiyu-secondtext);
    }
  }
}

.ai-writing-preview {
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .preview-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .regenerate-btn,
  .cancel-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    background: var(--anzhiyu-secondbg);
    border: none;
    border-radius: 6px;
    color: var(--anzhiyu-fontcolor);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 11px;

    svg {
      width: 12px;
      height: 12px;
    }

    &:hover {
      background: var(--anzhiyu-main);
      color: white;
    }
  }

  .cancel-btn {
    background: var(--anzhiyu-red-op);
    color: var(--anzhiyu-red);

    &:hover {
      background: var(--anzhiyu-red);
      color: white;
    }
  }

  .streaming-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--anzhiyu-main);
  }

  .streaming-dot {
    width: 8px;
    height: 8px;
    background: var(--anzhiyu-main);
    border-radius: 50%;
    animation: streamingPulse 1s ease-in-out infinite;
  }

  @keyframes streamingPulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.8);
    }
  }

  .preview-content {
    max-height: 320px;
    overflow-y: auto;
    padding: 12px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;

    &.streaming {
      border: 1px solid var(--anzhiyu-main-op);
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
      font-size: 12px;
      line-height: 1.7;
      color: var(--anzhiyu-fontcolor);
    }

    .cursor-blink {
      animation: cursorBlink 0.8s ease-in-out infinite;
      color: var(--anzhiyu-main);
      font-weight: bold;
    }

    @keyframes cursorBlink {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0;
      }
    }
  }

  .streaming-status {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-top: 8px;
    padding: 8px 12px;
    background: var(--anzhiyu-main-op);
    border-radius: 6px;
    font-size: 11px;

    .char-count {
      color: var(--anzhiyu-secondtext);
      font-weight: 500;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: var(--style-border);
  background: var(--anzhiyu-secondbg);
}

.btn-cancel,
.btn-generate,
.btn-insert {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:focus-visible {
    outline: 2px solid var(--anzhiyu-theme);
    outline-offset: 1px;
  }
}

.btn-cancel {
  background: var(--anzhiyu-card-bg);
  color: var(--anzhiyu-secondtext);
  border: var(--style-border);

  &:hover {
    background: var(--anzhiyu-card-bg);
    border-color: var(--anzhiyu-theme);
    color: var(--anzhiyu-fontcolor);
  }
}

.btn-generate {
  background: var(--anzhiyu-main);
  color: white;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-insert {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;

  &:hover {
    filter: brightness(1.08);
  }
}

@media (max-width: 480px) {
  .dialog-footer {
    padding: 10px 14px;
    gap: 6px;
  }

  .btn-cancel,
  .btn-generate,
  .btn-insert {
    flex: 1;
    justify-content: center;
    padding: 8px 12px;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
