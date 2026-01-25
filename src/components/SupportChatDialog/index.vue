<!--
 * @Description: 售后支持聊天弹窗
 * @Author: 安知鱼
 * @Date: 2025-01-07
-->
<template>
  <AnDialog
    v-model="visible"
    title="售后支持"
    width="600px"
    :close-on-click-modal="false"
    hide-footer
    class="support-chat-dialog-wrapper"
  >
    <div class="support-chat-dialog">
      <!-- 工单信息头部 -->
      <div v-if="ticket" class="ticket-header">
        <div class="ticket-info">
          <span class="ticket-label">工单号：</span>
          <span class="ticket-value">{{ ticket.ticket_no }}</span>
          <span class="ticket-status" :class="getStatusClass(ticket.status)">
            {{ getStatusText(ticket.status) }}
          </span>
        </div>
        <div class="ticket-subject">{{ ticket.subject }}</div>
      </div>

      <!-- 首次发起工单表单 -->
      <div v-if="!ticket && !loading" class="create-ticket-form">
        <div class="form-header">
          <div class="form-icon">
            <el-icon><Service /></el-icon>
          </div>
          <div class="form-title">
            <h3>联系客服</h3>
            <p>请描述您遇到的问题，我们将尽快为您处理</p>
          </div>
        </div>
        <el-form ref="formRef" :model="form" :rules="formRules" label-width="0">
          <el-form-item prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="4"
              placeholder="请详细描述您的问题..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
          <el-form-item v-if="!userEmail" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入您的邮箱（用于接收回复通知）"
            />
          </el-form-item>
        </el-form>
        <div class="form-actions">
          <el-button @click="handleClose">取消</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!form.content.trim()"
            @click="handleCreateTicket"
          >
            发起工单
          </el-button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 聊天消息列表 -->
      <div v-if="ticket && !loading" class="chat-container">
        <div ref="messagesRef" class="messages-list">
          <div
            v-for="msg in ticket.messages"
            :key="msg.id"
            class="message-item"
            :class="{ 'is-self': msg.sender_type === 'USER' }"
          >
            <div class="message-avatar">
              <el-icon v-if="msg.sender_type === 'ADMIN'"><Headset /></el-icon>
              <el-icon v-else><User /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <div class="message-text" v-html="renderContent(msg.content)" />
              </div>
              <div class="message-time">{{ formatTime(msg.created_at) }}</div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div v-if="ticket.status !== 'CLOSED'" class="input-area">
          <el-input
            v-model="inputContent"
            type="textarea"
            :rows="2"
            placeholder="输入消息... (Ctrl+Enter 发送)"
            @keydown.ctrl.enter="handleSendMessage"
          />
          <div class="input-actions">
            <span class="input-tip">支持 Markdown 格式</span>
            <el-button
              type="primary"
              size="small"
              :loading="sending"
              :disabled="!inputContent.trim()"
              @click="handleSendMessage"
            >
              <el-icon><Promotion /></el-icon>
              发送
            </el-button>
          </div>
        </div>

        <!-- 工单已关闭提示 -->
        <div v-else class="closed-notice">
          <el-icon><Warning /></el-icon>
          <span>该工单已关闭</span>
          <el-button type="primary" size="small" @click="handleCreateNewTicket">
            发起新工单
          </el-button>
        </div>
      </div>

      <!-- 空消息列表提示 -->
      <div
        v-if="ticket && !loading && ticket.messages.length === 0"
        class="empty-messages"
      >
        <el-icon><ChatLineSquare /></el-icon>
        <span>暂无消息记录</span>
      </div>
    </div>
  </AnDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  Service,
  Headset,
  User,
  Promotion,
  Warning,
  ChatLineSquare
} from "@element-plus/icons-vue";
import AnDialog from "@/components/AnDialog/index.vue";
import {
  createTicketApi,
  getTicketByOrderNoApi,
  replyTicketApi,
  type TicketDetail
} from "@/api/support";
import { useUserStore } from "@/store/modules/user";
import { simpleMarkdownParse } from "@/utils/markdown";

interface Props {
  modelValue: boolean;
  orderNo: string;
  userEmail?: string;
}

const props = withDefaults(defineProps<Props>(), {
  userEmail: ""
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const userStore = useUserStore();

const visible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 状态
const loading = ref(false);
const submitting = ref(false);
const sending = ref(false);
const ticket = ref<TicketDetail | null>(null);
const inputContent = ref("");
const messagesRef = ref<HTMLElement | null>(null);

// 轮询定时器
let pollingTimer: ReturnType<typeof setInterval> | null = null;

// 表单
const formRef = ref<FormInstance>();
const form = ref({
  content: "",
  email: ""
});

const formRules: FormRules = {
  content: [{ required: true, message: "请描述您的问题", trigger: "blur" }],
  email: [
    {
      type: "email",
      message: "请输入正确的邮箱格式",
      trigger: ["blur", "change"]
    }
  ]
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "OPEN":
      return "待处理";
    case "REPLIED":
      return "已回复";
    case "CLOSED":
      return "已关闭";
    default:
      return status;
  }
};

// 获取状态样式类
const getStatusClass = (status: string) => {
  switch (status) {
    case "OPEN":
      return "status-open";
    case "REPLIED":
      return "status-replied";
    case "CLOSED":
      return "status-closed";
    default:
      return "";
  }
};

// 格式化时间
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// 渲染内容（Markdown）
const renderContent = (content: string) => {
  try {
    return simpleMarkdownParse(content);
  } catch {
    return content;
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
};

// 加载工单
const loadTicket = async () => {
  if (!props.orderNo) return;

  loading.value = true;
  try {
    const res = await getTicketByOrderNoApi(props.orderNo);
    if (res.code === 200 && res.data) {
      ticket.value = res.data;
      scrollToBottom();
      startPolling();
    }
  } catch {
    // 工单不存在，显示创建表单
    ticket.value = null;
  } finally {
    loading.value = false;
  }
};

// 创建工单
const handleCreateTicket = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const res = await createTicketApi({
      trade_no: props.orderNo,
      subject: `订单 ${props.orderNo} 售后咨询`,
      content: form.value.content,
      user_email: form.value.email || props.userEmail || userStore.email
    });

    if (res.code === 200 && res.data) {
      ticket.value = res.data as TicketDetail;
      ElMessage.success("工单已创建，客服将尽快处理");
      scrollToBottom();
      startPolling();
    } else {
      ElMessage.error(res.message || "创建工单失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "创建工单失败");
  } finally {
    submitting.value = false;
  }
};

// 发送消息
const handleSendMessage = async () => {
  if (!inputContent.value.trim() || !ticket.value) return;

  sending.value = true;
  try {
    const res = await replyTicketApi(ticket.value.id, {
      content: inputContent.value.trim()
    });

    if (res.code === 200 && res.data) {
      // 添加新消息到列表
      ticket.value.messages.push(res.data);
      inputContent.value = "";
      scrollToBottom();
    } else {
      ElMessage.error(res.message || "发送失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "发送失败");
  } finally {
    sending.value = false;
  }
};

// 开始轮询
const startPolling = () => {
  stopPolling();

  pollingTimer = setInterval(async () => {
    if (!ticket.value || ticket.value.status === "CLOSED") {
      stopPolling();
      return;
    }

    try {
      const res = await getTicketByOrderNoApi(props.orderNo);
      if (res.code === 200 && res.data) {
        const oldCount = ticket.value?.messages.length || 0;
        ticket.value = res.data;
        // 如果有新消息，滚动到底部
        if (res.data.messages.length > oldCount) {
          scrollToBottom();
        }
      }
    } catch {
      // 静默失败
    }
  }, 5000);
};

// 停止轮询
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

// 关闭弹窗
const handleClose = () => {
  visible.value = false;
};

// 发起新工单（当前工单已关闭时）
const handleCreateNewTicket = () => {
  stopPolling();
  ticket.value = null;
  form.value = { content: "", email: "" };
};

// 重置状态
const resetState = () => {
  ticket.value = null;
  inputContent.value = "";
  form.value = { content: "", email: "" };
  formRef.value?.resetFields();
};

// 监听显示状态
watch(
  () => props.modelValue,
  val => {
    if (val) {
      resetState();
      loadTicket();
    } else {
      stopPolling();
    }
  }
);

onUnmounted(() => {
  stopPolling();
});
</script>

<style lang="scss" scoped>
.support-chat-dialog {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.ticket-header {
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  margin-bottom: 16px;

  .ticket-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .ticket-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .ticket-value {
      font-family: monospace;
      font-size: 13px;
      color: var(--anzhiyu-theme);
    }

    .ticket-status {
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 10px;

      &.status-open {
        background: #fff3e0;
        color: #f57c00;
      }

      &.status-replied {
        background: #e8f5e9;
        color: #43a047;
      }

      &.status-closed {
        background: var(--el-fill-color);
        color: var(--el-text-color-secondary);
      }
    }
  }

  .ticket-subject {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.create-ticket-form {
  .form-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 24px;

    .form-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #49b1f5, #36d1dc);
      border-radius: 14px;
      flex-shrink: 0;

      .el-icon {
        font-size: 28px;
        color: #fff;
      }
    }

    .form-title {
      h3 {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }
}

.loading-state {
  padding: 20px 0;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.messages-list {
  flex: 1;
  max-height: 350px;
  overflow-y: auto;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 85%;

  &.is-self {
    flex-direction: row-reverse;
    align-self: flex-end;

    .message-content {
      align-items: flex-end;
    }

    .message-bubble {
      background: var(--anzhiyu-theme);
      color: #fff;
      border-radius: 16px 4px 16px 16px;

      .message-text {
        :deep(a) {
          color: #fff;
        }

        :deep(code) {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
      }
    }

    .message-time {
      text-align: right;
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
    gap: 4px;
  }

  .message-bubble {
    padding: 12px 16px;
    background: var(--el-fill-color-light);
    border-radius: 4px 16px 16px 16px;
  }

  .message-text {
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;

    :deep(p) {
      margin: 0.3em 0;

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
    }

    :deep(pre) {
      margin: 8px 0;
      padding: 12px;
      background: var(--el-fill-color);
      border-radius: 8px;
      overflow-x: auto;

      code {
        padding: 0;
        background: none;
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

  .message-time {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    padding: 0 4px;
  }
}

.input-area {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);

  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;

    .input-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.closed-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  margin-top: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  .el-icon {
    font-size: 16px;
    color: var(--el-color-warning);
  }
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);

  .el-icon {
    font-size: 40px;
    opacity: 0.5;
  }

  span {
    font-size: 14px;
  }
}

// 移动端适配
@media screen and (max-width: 600px) {
  .support-chat-dialog {
    min-height: 350px;
  }

  .messages-list {
    max-height: 280px;
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

  .create-ticket-form {
    .form-header {
      .form-icon {
        width: 48px;
        height: 48px;

        .el-icon {
          font-size: 24px;
        }
      }

      .form-title h3 {
        font-size: 16px;
      }
    }
  }
}
</style>
