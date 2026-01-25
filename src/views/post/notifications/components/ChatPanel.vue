<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from "vue";
import type { TicketDetail } from "@/api/support";
import type { EmojiPackage } from "../hooks/useEmoji";
import { formatFullTime } from "../utils";
import { highlightCodeBlocks } from "@/utils/markdown";

const props = defineProps<{
  ticket: TicketDetail;
  loading: boolean;
  renderedContent: (content: string) => string;
  getStatusText: (status: string) => string;
  getStatusClass: (status: string) => string;
  emojiData: EmojiPackage[] | null;
}>();

const emit = defineEmits<{
  back: [];
  send: [content: string];
}>();

const chatInput = ref("");
const chatInputRef = ref<HTMLTextAreaElement | null>(null);
const showEmojiPicker = ref(false);
const activeEmojiPackageIndex = ref(0);
const emojiContainerRef = ref<HTMLElement | null>(null);
const chatMessagesRef = ref<HTMLElement | null>(null);

const handleSend = () => {
  if (!chatInput.value.trim()) return;
  emit("send", chatInput.value.trim());
  chatInput.value = "";
};

const insertTextAtCursor = (text: string) => {
  const textarea = chatInputRef.value;
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const oldContent = chatInput.value;
    chatInput.value =
      oldContent.substring(0, start) + text + oldContent.substring(end);
    const newPos = start + text.length;
    textarea.focus();
    nextTick(() => textarea.setSelectionRange(newPos, newPos));
  } else {
    chatInput.value += text;
  }
};

const addEmoji = (emojiText: string) => {
  insertTextAtCursor(` ${emojiText} `);
  showEmojiPicker.value = false;
};

// 高亮代码块
const highlightMessages = async () => {
  await nextTick();
  await highlightCodeBlocks(chatMessagesRef.value);
};

// 监听消息变化，高亮代码块
watch(
  () => props.ticket.messages,
  () => {
    highlightMessages();
  },
  { deep: true }
);

onMounted(() => {
  highlightMessages();
});
</script>

<template>
  <div v-loading="loading" class="chat-view">
    <button class="back-btn" @click="emit('back')">← 返回列表</button>
    <div class="chat-header">
      <h2 class="chat-title">{{ ticket.subject }}</h2>
      <div class="chat-meta">
        <span>工单号: {{ ticket.ticket_no }}</span>
        <span class="ticket-status" :class="getStatusClass(ticket.status)">
          {{ getStatusText(ticket.status) }}
        </span>
      </div>
    </div>

    <div ref="chatMessagesRef" class="chat-messages">
      <div
        v-for="msg in ticket.messages"
        :key="msg.id"
        class="chat-message"
        :class="{ 'is-self': msg.sender_type === 'USER' }"
      >
        <div class="message-avatar">
          <svg
            v-if="msg.sender_type === 'ADMIN'"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
          </svg>
        </div>
        <div class="message-bubble">
          <div
            class="message-text comment-content"
            v-html="renderedContent(msg.content)"
          />
          <div class="message-time">{{ formatFullTime(msg.created_at) }}</div>
        </div>
      </div>
    </div>

    <!-- 聊天输入框 -->
    <div v-if="ticket.status !== 'CLOSED'" class="chat-input-area">
      <div class="input-toolbar">
        <div
          ref="emojiContainerRef"
          class="emoji-btn"
          :class="{ active: showEmojiPicker }"
          @click.stop="showEmojiPicker = !showEmojiPicker"
        >
          😊
          <Transition name="emoji-fade">
            <div v-if="showEmojiPicker && emojiData" class="emoji-picker">
              <div class="emoji-items">
                <span
                  v-for="emoji in emojiData[activeEmojiPackageIndex]?.items"
                  :key="emoji.text"
                  class="emoji-item"
                  :title="emoji.text"
                  @click.stop="addEmoji(emoji.text)"
                >
                  <img :src="emoji.icon" :alt="emoji.text" />
                </span>
              </div>
              <div class="emoji-tabs">
                <span
                  v-for="(pkg, index) in emojiData"
                  :key="pkg.name"
                  class="emoji-tab"
                  :class="{ active: activeEmojiPackageIndex === index }"
                  @click.stop="activeEmojiPackageIndex = index"
                  v-html="pkg.icon"
                />
              </div>
            </div>
          </Transition>
        </div>
        <span class="input-tip">支持 Markdown 格式</span>
      </div>
      <textarea
        ref="chatInputRef"
        v-model="chatInput"
        class="chat-textarea"
        placeholder="输入消息... (Ctrl+Enter 发送)"
        rows="3"
        @keydown.ctrl.enter="handleSend"
      />
      <button
        class="send-btn"
        :disabled="!chatInput.trim()"
        @click="handleSend"
      >
        发送
      </button>
    </div>
    <div v-else class="chat-closed-notice">该工单已关闭</div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/style/article-content-base.scss" as *;

.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.chat-header {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: var(--style-border);
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor, #333);
  margin: 0 0 4px;
  line-height: 1.4;
}

.chat-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--anzhiyu-secondtext, #999);
}

.ticket-status {
  padding: 1px 6px;
  font-size: 11px;
  border-radius: 4px;

  &.status-open {
    background: #fff3e0;
    color: #f57c00;
  }

  &.status-replied {
    background: #e8f5e9;
    color: #43a047;
  }

  &.status-closed {
    background: var(--anzhiyu-main, #f5f5f5);
    color: var(--anzhiyu-secondtext, #999);
  }
}

.chat-messages {
  flex: 1;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chat-message {
  display: flex;
  gap: 10px;
  max-width: 85%;

  &.is-self {
    flex-direction: row-reverse;
    align-self: flex-end;

    .message-bubble {
      background: var(--anzhiyu-theme, #49b1f5);
      color: #fff;
      border-radius: 12px 4px 12px 12px;
    }

    .message-time {
      text-align: right;
      color: rgba(255, 255, 255, 0.7);
    }

    // 自己的消息内容样式调整
    .message-text {
      :deep(a) {
        color: #fff;
        border-bottom-color: rgba(255, 255, 255, 0.5);
      }

      :deep(code:not(.hljs)) {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }

      :deep(blockquote) {
        background: rgba(255, 255, 255, 0.1);
        border-left-color: rgba(255, 255, 255, 0.5);
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--anzhiyu-main, #f0f0f0);
  border-radius: 50%;
  flex-shrink: 0;
  color: var(--anzhiyu-secondtext, #999);

  svg {
    width: 18px;
    height: 18px;
  }
}

.message-bubble {
  padding: 10px 12px;
  background: var(--anzhiyu-main, #f5f5f5);
  border-radius: 4px 12px 12px 12px;
}

// 消息内容使用与评论区一致的样式
.message-text {
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;

  @include article-content-base;

  // 覆盖一些不需要的样式
  :deep(p) {
    margin: 0.3rem 0;
    font-size: 14px;
  }

  :deep(p:first-child) {
    margin-top: 0;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
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

  // 行内代码
  :deep(code:not(.hljs)) {
    padding: 1px 4px;
    margin: 0 2px;
    font-size: 0.9em;
    line-height: 1.4;
  }

  // 代码块
  :deep(pre) {
    margin: 8px 0;
    padding: 10px;
    font-size: 12px;
    border-radius: 6px;
    overflow-x: auto;
  }

  // 引用块
  :deep(blockquote) {
    margin: 8px 0;
    padding: 6px 10px;
    font-size: 13px;
  }

  // 图片
  :deep(img:not(.chat-emoji):not(.anzhiyu-owo-emotion)) {
    max-width: 100%;
    max-height: 200px;
    margin: 6px 0;
    border-radius: 6px;
  }
}

.message-time {
  margin-top: 4px;
  font-size: 11px;
  color: var(--anzhiyu-secondtext, #999);
}

// 聊天输入区域
.chat-input-area {
  padding-top: 12px;
  border-top: var(--style-border);
}

.input-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.input-tip {
  font-size: 11px;
  color: var(--anzhiyu-secondtext, #999);
}

.emoji-btn {
  position: relative;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: var(--anzhiyu-main, #f5f5f5);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover,
  &.active {
    background: #e8f7ff;
  }
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 280px;
  margin-bottom: 6px;
  background: var(--anzhiyu-card-bg, #fff);
  border: var(--style-border);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 100;
}

.emoji-items {
  max-height: 180px;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.emoji-item {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background: var(--anzhiyu-main, #f5f5f5);
  }

  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
}

.emoji-tabs {
  display: flex;
  padding: 6px;
  border-top: var(--style-border);
  background: var(--anzhiyu-main, #fafafa);
  overflow-x: auto;
}

.emoji-tab {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;

  &:hover,
  &.active {
    background: var(--anzhiyu-card-bg, #fff);
  }
}

.chat-textarea {
  width: 100%;
  padding: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--anzhiyu-fontcolor, #333);
  background: var(--anzhiyu-main, #f5f5f5);
  border: var(--style-border);
  border-radius: 8px;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;

  &:focus {
    border-color: var(--anzhiyu-theme, #49b1f5);
    background: var(--anzhiyu-card-bg, #fff);
  }

  &::placeholder {
    color: var(--anzhiyu-secondtext, #999);
  }
}

.send-btn {
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--anzhiyu-theme, #49b1f5);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.chat-closed-notice {
  padding: 12px;
  text-align: center;
  font-size: 13px;
  color: var(--anzhiyu-secondtext, #999);
  background: var(--anzhiyu-main, #f5f5f5);
  border-radius: 8px;
  margin-top: 12px;
}

// 动画
.emoji-fade-enter-active,
.emoji-fade-leave-active {
  transition: all 0.2s ease;
}

.emoji-fade-enter-from,
.emoji-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

// ==================== 移动端适配 ====================
@media screen and (width <= 600px) {
  .back-btn {
    font-size: 12px;
    margin-bottom: 10px;
  }

  .chat-header {
    margin-bottom: 10px;
    padding-bottom: 8px;
  }

  .chat-title {
    font-size: 15px;
    margin-bottom: 3px;
  }

  .chat-meta {
    font-size: 11px;
    gap: 8px;
    flex-wrap: wrap;
  }

  .chat-messages {
    min-height: 180px;
    max-height: 320px;
    padding: 10px 0;
    gap: 12px;
  }

  .chat-message {
    max-width: 90%;
  }

  .message-avatar {
    width: 28px;
    height: 28px;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  .message-bubble {
    padding: 8px 10px;
  }

  .message-text {
    font-size: 13px;

    :deep(p) {
      font-size: 13px;
    }

    :deep(pre) {
      padding: 8px;
      font-size: 11px;
    }

    :deep(img:not(.chat-emoji):not(.anzhiyu-owo-emotion)) {
      max-height: 150px;
    }
  }

  .message-time {
    font-size: 10px;
    margin-top: 3px;
  }

  .chat-input-area {
    padding-top: 10px;
  }

  .input-toolbar {
    gap: 6px;
    margin-bottom: 5px;
  }

  .input-tip {
    font-size: 10px;
  }

  .emoji-btn {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }

  .emoji-picker {
    width: 260px;
    left: 0;
    right: auto;
  }

  .emoji-items {
    max-height: 150px;
    padding: 8px;
    gap: 3px;
  }

  .emoji-item {
    width: 28px;
    height: 28px;

    img {
      width: 22px;
      height: 22px;
    }
  }

  .chat-textarea {
    font-size: 14px;
    padding: 10px;
    min-height: 60px;
  }

  .send-btn {
    padding: 12px;
    font-size: 14px;
  }

  .chat-closed-notice {
    padding: 10px;
    font-size: 12px;
  }
}

@media screen and (width <= 480px) {
  .chat-messages {
    max-height: 280px;
  }

  .chat-message {
    max-width: 92%;
    gap: 8px;
  }

  .message-avatar {
    width: 26px;
    height: 26px;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  .emoji-picker {
    width: calc(100vw - 40px);
    max-width: 280px;
  }
}
</style>
