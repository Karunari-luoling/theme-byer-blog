<!--
 * @Description: 微信二维码登录弹窗
 * @Author: 安知鱼
 * @Date: 2025-11-16
 * @LastEditTime: 2025-11-16
 * @LastEditors: 安知鱼
-->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="微信扫码登录"
    width="500px"
    :close-on-click-modal="false"
    :before-close="handleClose"
    class="wechat-login-dialog"
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
          <img
            :src="qrcodeData.qrcode_url"
            alt="微信二维码"
            class="qrcode-image"
          />

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
            <p class="status-text success">登录成功!</p>
          </template>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  createWechatLoginQRCode,
  getWechatQRCodeStatus,
  type WechatQRCodeData,
  type WechatQRCodeStatus
} from "@/api/oauth";
import { message } from "@/utils/message";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { useRouter } from "vue-router";
import { setToken } from "@/utils/auth";

defineOptions({
  name: "WechatQRCodeLoginDialog"
});

const props = defineProps<{
  modelValue: boolean;
  /** 跳过登录后的页面跳转（用于弹窗登录场景，由父组件控制跳转） */
  skipNavigation?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const router = useRouter();
const userStore = useUserStoreHook();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
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

    const res = await createWechatLoginQRCode();

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

        // 登录成功
        if (newStatus === "confirmed") {
          stopPolling();

          // 处理登录
          const loginData = res.data as any;
          if (loginData.token) {
            // 保存token
            setToken({
              accessToken: loginData.token,
              refreshToken: loginData.refresh_token || "",
              userInfo: loginData.user_info || {},
              roles: loginData.roles || []
            });

            // 获取用户信息
            await userStore.fetchUserInfo();

            message("登录成功", { type: "success" });

            // 初始化路由
            await initRouter();

            // 延迟关闭弹窗
            setTimeout(() => {
              emit("success");
              handleClose();
              // 如果不跳过导航（页面登录场景），则跳转到管理面板
              if (!props.skipNavigation) {
                router.push(getTopMenu(true).path);
              }
            }, 1000);
          }
        }
        // 二维码过期
        else if (newStatus === "expired") {
          stopPolling();
        }
      }
    } catch (err: any) {
      console.error("查询二维码状态失败:", err);
      // 兼容 axios error 与后端标准响应体两种形态
      const msg =
        err?.message || err?.response?.data?.message || "查询二维码状态失败";
      error.value = msg;
      stopPolling();
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
  newVal => {
    if (newVal) {
      loadQRCode();
    } else {
      stopPolling();
    }
  }
);
</script>

<style scoped lang="scss">
.wechat-login-dialog {
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
      color: var(--el-color-warning);
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
  background: rgb(255 255 255 / 95%);
  border-radius: 16px;

  .scanned-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    text-align: center;

    :deep(svg) {
      width: 3rem;
      height: 3rem;
      color: var(--el-color-success);
    }

    p {
      font-size: 1rem;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);

      &.hint {
        font-size: 0.85rem;
        font-weight: normal;
        color: var(--anzhiyu-secondtext);
      }
    }
  }
}

.qrcode-tips {
  display: flex;
  gap: 2rem;

  .tip-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.9rem;
    color: var(--anzhiyu-secondtext);

    :deep(svg) {
      width: 1.2rem;
      height: 1.2rem;
    }
  }
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  text-align: center;

  .status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    transition: all 0.3s;

    :deep(svg) {
      width: 2rem;
      height: 2rem;
    }

    &.pending {
      background: var(--el-color-info-light-9);

      :deep(svg) {
        color: var(--el-color-info);
      }
    }

    &.scanned {
      background: var(--el-color-warning-light-9);

      :deep(svg) {
        color: var(--el-color-warning);
      }
    }

    &.confirmed {
      background: var(--el-color-success-light-9);

      :deep(svg) {
        color: var(--el-color-success);
      }
    }
  }

  .status-text {
    font-size: 0.95rem;
    color: var(--anzhiyu-fontcolor);

    &.success {
      font-weight: 600;
      color: var(--el-color-success);
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 移动端适配
@media (width <= 768px) {
  .wechat-login-dialog {
    :deep(.el-dialog) {
      width: 90% !important;
    }
  }

  .qrcode-image-wrapper {
    .qrcode-image {
      width: 200px;
      height: 200px;
    }
  }

  .qrcode-tips {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
