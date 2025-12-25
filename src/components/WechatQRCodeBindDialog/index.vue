<!--
 * @Description: 微信二维码绑定弹窗
 * @Author: 安知鱼
 * @Date: 2025-11-16
 * @LastEditTime: 2025-11-16
 * @LastEditors: 安知鱼
-->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="绑定微信账号"
    width="500px"
    :close-on-click-modal="false"
    :before-close="handleClose"
    class="wechat-bind-dialog"
    draggable
  >
    <div class="qrcode-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner" />
        <p>正在生成二维码...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <IconifyIconOffline icon="ri:error-warning-fill" />
        <p>{{ error }}</p>
        <el-button type="primary" @click="loadQRCode">重新加载</el-button>
      </div>

      <div v-else-if="qrcodeData" class="qrcode-content">
        <div v-if="status === 'expired'" class="expired-overlay">
          <div class="expired-content">
            <IconifyIconOffline icon="ri:time-fill" />
            <p>二维码已过期</p>
            <el-button type="primary" @click="loadQRCode">刷新二维码</el-button>
          </div>
        </div>

        <div class="qrcode-image-wrapper">
          <img :src="qrcodeData.qrcode_url" alt="微信二维码" class="qrcode-image" />

          <div v-if="status === 'scanned'" class="scanned-overlay">
            <div class="scanned-content">
              <IconifyIconOffline icon="ri:check-fill" />
              <p>扫码成功</p>
              <p class="hint">请在手机上确认登录</p>
            </div>
          </div>
        </div>

        <div class="qrcode-tips">
          <div class="tip-item">
            <IconifyIconOffline icon="ri:smartphone-fill" />
            <span>请使用微信扫描二维码</span>
          </div>
          <div class="tip-item">
            <IconifyIconOffline icon="ri:time-fill" />
            <span>二维码 {{ expireTimeText }}</span>
          </div>
        </div>

        <div class="status-info">
          <template v-if="status === 'pending'">
            <div class="status-icon pending">
              <IconifyIconOffline icon="ri:qr-code-fill" />
            </div>
            <p class="status-text">等待扫码...</p>
          </template>
          <template v-else-if="status === 'scanned'">
            <div class="status-icon scanned">
              <IconifyIconOffline icon="ri:check-fill" />
            </div>
            <p class="status-text">已扫码，等待确认...</p>
          </template>
          <template v-else-if="status === 'confirmed'">
            <div class="status-icon confirmed">
              <IconifyIconOffline icon="ri:checkbox-circle-fill" />
            </div>
            <p class="status-text success">绑定成功!</p>
          </template>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  createWechatBindQRCode,
  getWechatQRCodeStatus,
  type WechatQRCodeData,
  type WechatQRCodeStatus
} from "@/api/oauth";
import { message } from "@/utils/message";

defineOptions({
  name: "WechatQRCodeBindDialog"
});

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
});

const loading = ref(false);
const error = ref("");
const qrcodeData = ref<WechatQRCodeData | null>(null);
const status = ref<string>("pending"); // pending, scanned, confirmed, expired
let pollingTimer: number | null = null;

// 过期时间文本
const expireTimeText = computed(() => {
  if (!qrcodeData.value) return "";

  const now = Date.now();
  const expireTime = qrcodeData.value.expire_at * 1000;
  const remainingSeconds = Math.floor((expireTime - now) / 1000);

  if (remainingSeconds <= 0) {
    return "已过期";
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  if (minutes > 0) {
    return `${minutes}分${seconds}秒后过期`;
  }
  return `${seconds}秒后过期`;
});

// 加载二维码
const loadQRCode = async () => {
  try {
    loading.value = true;
    error.value = "";
    status.value = "pending";

    const res = await createWechatBindQRCode();

    if (res.code === 200 && res.data) {
      qrcodeData.value = res.data;
      startPolling();
    } else {
      error.value = res.message || "生成二维码失败";
    }
  } catch (err: any) {
    console.error("生成二维码失败:", err);
    error.value = err?.message || "生成二维码失败";
  } finally {
    loading.value = false;
  }
};

// 开始轮询状态
const startPolling = () => {
  stopPolling();

  pollingTimer = window.setInterval(async () => {
    if (!qrcodeData.value) return;

    try {
      const res = await getWechatQRCodeStatus(qrcodeData.value.scene_id);

      if (res.code === 200 && res.data) {
        const newStatus = res.data.status;
        status.value = newStatus;

        // 绑定成功
        if (newStatus === "confirmed") {
          stopPolling();
          message("绑定成功", { type: "success" });

          // 延迟关闭弹窗
          setTimeout(() => {
            emit("success");
            handleClose();
          }, 1500);
        }
        // 二维码过期
        else if (newStatus === "expired") {
          stopPolling();
        }
      }
    } catch (err) {
      console.error("查询二维码状态失败:", err);
    }
  }, 2000); // 每2秒轮询一次
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
  stopPolling();
  qrcodeData.value = null;
  status.value = "pending";
  error.value = "";
  dialogVisible.value = false;
};

// 监听弹窗打开
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      loadQRCode();
    } else {
      stopPolling();
    }
  }
);
</script>

<style scoped lang="scss">
.wechat-bind-dialog {
  :deep(.el-dialog__header) {
    padding: 1.5rem;
    text-align: center;
    background: var(--anzhiyu-card-bg);
    border-bottom: 1px solid var(--anzhiyu-card-border);
  }

  :deep(.el-dialog__body) {
    padding: 2rem;
    background: var(--anzhiyu-background);
  }
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  min-height: 400px;

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--anzhiyu-card-border);
    border-top-color: var(--anzhiyu-main);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    font-size: 0.95rem;
    color: var(--anzhiyu-secondtext);
  }
}

.error-state {
  :deep(svg) {
    width: 3rem;
    height: 3rem;
    color: var(--el-color-danger);
  }
}

.qrcode-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  width: 100%;
}

.qrcode-image-wrapper {
  position: relative;
  padding: 1rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);

  .qrcode-image {
    display: block;
    width: 240px;
    height: 240px;
  }
}

.expired-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 95%);
  border-radius: 16px;

  .expired-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    text-align: center;

    :deep(svg) {
      width: 3rem;
      height: 3rem;
      color: var(--anzhiyu-secondtext);
    }

    p {
      font-size: 1rem;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }
  }
}

.scanned-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(7 193 96 / 95%);
  border-radius: 12px;

  .scanned-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    text-align: center;

    :deep(svg) {
      width: 3rem;
      height: 3rem;
      color: white;
    }

    p {
      font-size: 1rem;
      font-weight: 600;
      color: white;

      &.hint {
        font-size: 0.85rem;
        font-weight: 400;
        opacity: 0.9;
      }
    }
  }
}

.qrcode-tips {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;

  .tip-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    color: var(--anzhiyu-secondtext);
    background: var(--anzhiyu-card-bg);
    border-radius: 12px;

    :deep(svg) {
      width: 1.25rem;
      height: 1.25rem;
      color: var(--anzhiyu-main);
    }
  }
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem;
  margin-top: 0.5rem;

  .status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    transition: all 0.3s;

    :deep(svg) {
      width: 1.75rem;
      height: 1.75rem;
    }

    &.pending {
      background: var(--anzhiyu-background);

      :deep(svg) {
        color: var(--anzhiyu-main);
      }
    }

    &.scanned {
      background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);

      :deep(svg) {
        color: white;
      }
    }

    &.confirmed {
      background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);

      :deep(svg) {
        color: white;
      }
    }
  }

  .status-text {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);

    &.success {
      color: #52c41a;
    }
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

// 移动端适配
@media (width <= 768px) {
  .wechat-bind-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      max-width: 95% !important;
    }
  }

  .qrcode-image-wrapper {
    .qrcode-image {
      width: 200px;
      height: 200px;
    }
  }
}
</style>