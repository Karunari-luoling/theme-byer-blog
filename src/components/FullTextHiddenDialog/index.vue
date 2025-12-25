<!--
 * @Description: 全文隐藏密码验证对话框
 * @Author: 安知鱼
 * @Date: 2025-10-15
 -->
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import AnDialog from "@/components/AnDialog/index.vue";
import { verifyFullTextHiddenPassword } from "@/api/post";
import { ElMessage } from "element-plus";

interface FullTextHiddenConfig {
  button_text?: string;
  modal_top_description?: string;
  qr_code_url?: string;
  input_placeholder?: string;
  initial_visible_height?: number;
}

const props = defineProps<{
  modelValue: boolean;
  articleId: string;
  config?: FullTextHiddenConfig;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [token: string];
}>();

const password = ref("");
const isVerifying = ref(false);
const errorMessage = ref("");
const attemptsCount = ref(0);

// 计算属性
const modalDescription = computed(
  () => props.config?.modal_top_description || "<p>请输入密码查看完整内容</p>"
);

const inputPlaceholder = computed(
  () => props.config?.input_placeholder || "请输入密码查看全文"
);

const qrCodeUrl = computed(() => props.config?.qr_code_url || "");

// 关闭对话框
const handleClose = () => {
  emit("update:modelValue", false);
};

// 重置表单
const resetForm = () => {
  password.value = "";
  errorMessage.value = "";
  attemptsCount.value = 0;
};

// 验证密码
const handleVerify = async () => {
  // 清除错误信息
  errorMessage.value = "";

  // 验证密码不为空
  if (!password.value.trim()) {
    errorMessage.value = "请输入密码";
    return;
  }

  isVerifying.value = true;

  try {
    console.log("🔑 [全文隐藏] 开始验证密码...");
    const response = await verifyFullTextHiddenPassword(
      props.articleId,
      password.value
    );

    console.log("📡 [全文隐藏] API响应:", response);

    if (response.code === 200 && response.data.success) {
      console.log("✅ [全文隐藏] 密码验证成功");
      ElMessage.success("密码验证成功！正在加载完整内容...");

      // 发送成功事件，传递token
      emit("success", response.data.token || "");

      // 关闭对话框
      handleClose();

      // 重置表单
      resetForm();
    } else {
      console.log("❌ [全文隐藏] 密码验证失败:", response.data.message);
      attemptsCount.value++;
      errorMessage.value =
        response.data.message || response.message || "密码错误，请重试";
    }
  } catch (error: any) {
    console.error("❌ [全文隐藏] 验证失败:", error);
    attemptsCount.value++;
    errorMessage.value =
      error?.response?.data?.message || error?.message || "验证失败，请重试";
  } finally {
    isVerifying.value = false;
  }
};

// 处理回车键
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !isVerifying.value) {
    event.preventDefault();
    handleVerify();
  }
};

// 监听对话框打开/关闭
watch(
  () => props.modelValue,
  newValue => {
    if (!newValue) {
      // 对话框关闭时延迟重置，避免动画未完成就清空
      setTimeout(() => {
        resetForm();
      }, 300);
    }
  }
);
</script>

<template>
  <AnDialog
    :model-value="modelValue"
    title="查看全文"
    width="520px"
    :show-footer="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="full-text-hidden-dialog">
      <!-- 顶部描述 -->
      <div class="dialog-description" v-html="modalDescription" />

      <!-- 密码输入 -->
      <div class="password-input-wrapper">
        <el-input
          v-model="password"
          type="password"
          :placeholder="inputPlaceholder"
          size="large"
          show-password
          clearable
          :disabled="isVerifying"
          @keydown="handleKeydown"
        >
          <template #prefix>
            <i class="anzhiyufont anzhiyu-icon-lock" />
          </template>
        </el-input>

        <!-- 错误提示 -->
        <transition name="fade">
          <div v-if="errorMessage" class="error-message">
            <i class="anzhiyufont anzhiyu-icon-circle-exclamation" />
            <span>{{ errorMessage }}</span>
          </div>
        </transition>
      </div>

      <!-- 二维码 -->
      <div v-if="qrCodeUrl" class="qr-code-section">
        <div class="qr-code-container">
          <img :src="qrCodeUrl" alt="扫码获取密码" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button size="large" @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          size="large"
          :loading="isVerifying"
          :disabled="!password.trim()"
          @click="handleVerify"
        >
          {{ isVerifying ? "验证中..." : "解锁查看" }}
        </el-button>
      </div>

      <!-- 提示信息 -->
      <div v-if="attemptsCount > 2" class="tips-section">
        <i class="anzhiyufont anzhiyu-icon-circle-info" />
        <span>多次密码错误？请检查密码是否正确或联系作者获取密码</span>
      </div>
    </div>
  </AnDialog>
</template>

<style lang="scss" scoped>
.full-text-hidden-dialog {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dialog-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--anzhiyu-fontcolor);
  text-align: center;

  :deep(p) {
    margin: 0.5rem 0;
  }

  :deep(a) {
    color: var(--anzhiyu-main);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.password-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  :deep(.el-input) {
    .el-input__wrapper {
      padding: 12px 16px;
      background: var(--anzhiyu-secondbg);
      border: 1px solid var(--anzhiyu-card-border);
      border-radius: 12px;
      box-shadow: none;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--anzhiyu-main);
      }

      &.is-focus {
        border-color: var(--anzhiyu-main);
        box-shadow: 0 0 0 3px rgba(var(--anzhiyu-main-rgb), 0.1);
      }
    }

    .el-input__prefix {
      font-size: 1.1rem;
      color: var(--anzhiyu-secondtext);
    }
  }
}

.error-message {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--anzhiyu-white);
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);

  i {
    font-size: 1rem;
  }

  span {
    flex: 1;
  }
}

.qr-code-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0.5rem 0;
}

.qr-code-divider {
  position: relative;
  text-align: center;

  &::before {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
    content: "";
    background: var(--anzhiyu-card-border);
  }

  span {
    position: relative;
    z-index: 1;
    padding: 0 1rem;
    font-size: 0.875rem;
    color: var(--anzhiyu-secondtext);
    background: var(--anzhiyu-card-bg);
  }
}

.qr-code-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border);
  border-radius: 12px;

  img {
    width: 160px;
    height: 160px;
    border-radius: 8px;
  }
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;

  :deep(.el-button) {
    min-width: 100px;
    padding: 12px 24px;
    font-weight: 500;
    border-radius: 10px;
    transition: all 0.3s ease;

    &.el-button--primary {
      background: linear-gradient(
        135deg,
        var(--anzhiyu-main) 0%,
        var(--anzhiyu-main) 100%
      );
      border: none;
      box-shadow: 0 4px 12px rgba(var(--anzhiyu-main-rgb), 0.3);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(var(--anzhiyu-main-rgb), 0.4);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.6;
      }
    }
  }
}

.tips-section {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  padding: 0.875rem 1rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--anzhiyu-secondtext);
  background: var(--anzhiyu-secondbg);
  border-left: 3px solid var(--anzhiyu-main);
  border-radius: 6px;

  i {
    flex-shrink: 0;
    margin-top: 0.125rem;
    font-size: 1rem;
    color: var(--anzhiyu-main);
  }
}

// 动画效果
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

// 移动端适配
@media (width <= 768px) {
  .qr-code-container img {
    width: 140px;
    height: 140px;
  }

  .action-buttons {
    :deep(.el-button) {
      min-width: 80px;
      padding: 10px 20px;
    }
  }
}
</style>
