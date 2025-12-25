<template>
  <!-- 主分享对话框 -->
  <AnDialog
    v-model="localVisible"
    title="创建分享链接"
    width="580px"
    :show-footer="true"
    :confirm-loading="isSubmitting"
    :confirm-disabled="!isFormValid || isSubmitting"
    confirm-text="创建分享链接"
    @confirm="handleCreateShare"
    @closed="handleModalClosed"
  >
    <!-- 分享文件/文件夹信息 -->
    <div class="mb-4 share-info">
      <div class="flex items-center">
        <el-icon class="mr-2" :size="20">
          <component :is="isFolder ? Folder : Document" />
        </el-icon>
        <span class="font-medium">{{ shareFileName }}</span>
      </div>
      <div v-if="selectedCount > 1" class="text-sm text-gray-500">
        共选择 {{ selectedCount }} 个项目
      </div>
    </div>

    <div class="share-options">
      <!-- 超时自动过期 -->
      <div class="option-item" :class="{ active: shareForm.enableExpiration }">
        <div class="option-header" @click="toggleOption('enableExpiration')">
          <div class="option-title-wrapper">
            <el-switch
              v-model="shareForm.enableExpiration"
              class="option-switch"
              @click.stop
            />
            <div class="option-info">
              <div class="option-title">超时自动过期</div>
              <div class="option-desc">设置分享链接的有效期限</div>
            </div>
          </div>
          <i
            class="anzhiyufont anzhiyu-icon-arrow-down-s-line option-arrow"
            :class="{ expanded: shareForm.enableExpiration }"
          />
        </div>
        <Transition name="accordion">
          <div v-if="shareForm.enableExpiration" class="option-content">
            <div class="flex items-center gap-2">
              <el-input-number
                v-model="shareForm.expirationDays"
                :min="1"
                :max="365"
                :step="1"
                controls-position="right"
                class="flex-1"
              />
              <span class="text-sm">天后过期</span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 付费下载 -->
      <div class="option-item" :class="{ active: shareForm.enablePayment }">
        <div class="option-header" @click="toggleOption('enablePayment')">
          <div class="option-title-wrapper">
            <el-switch
              v-model="shareForm.enablePayment"
              class="option-switch"
              @click.stop
            />
            <div class="option-info">
              <div class="option-title">付费下载</div>
              <div class="option-desc">访问者需要支付才能下载</div>
            </div>
          </div>
          <i
            class="anzhiyufont anzhiyu-icon-arrow-down-s-line option-arrow"
            :class="{ expanded: shareForm.enablePayment }"
          />
        </div>
        <Transition name="accordion">
          <div v-if="shareForm.enablePayment" class="option-content">
            <div class="flex items-center gap-2">
              <el-input-number
                v-model="shareForm.paymentAmount"
                :min="0.01"
                :max="9999"
                :step="0.01"
                :precision="2"
                controls-position="right"
                class="flex-1"
              />
              <span class="text-sm">元</span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 密码保护 -->
      <div class="option-item" :class="{ active: shareForm.enablePassword }">
        <div class="option-header" @click="toggleOption('enablePassword')">
          <div class="option-title-wrapper">
            <el-switch
              v-model="shareForm.enablePassword"
              class="option-switch"
              @click.stop
            />
            <div class="option-info">
              <div class="option-title">密码保护</div>
              <div class="option-desc">需要密码才能访问链接</div>
            </div>
          </div>
          <i
            class="anzhiyufont anzhiyu-icon-arrow-down-s-line option-arrow"
            :class="{ expanded: shareForm.enablePassword }"
          />
        </div>
        <Transition name="accordion">
          <div v-if="shareForm.enablePassword" class="option-content">
            <div class="flex items-center gap-2">
              <el-input
                v-model="shareForm.password"
                type="text"
                placeholder="请输入4-8位密码"
                :maxlength="8"
                show-word-limit
                class="flex-1"
              />
              <el-button
                size="small"
                :icon="Refresh"
                @click="generateRandomPassword"
              >
                随机
              </el-button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 显示 README 文件 (仅文件夹) -->
      <div
        v-if="isFolder"
        class="option-item"
        :class="{ active: shareForm.showReadme }"
      >
        <div class="option-header" @click="toggleOption('showReadme')">
          <div class="option-title-wrapper">
            <el-switch
              v-model="shareForm.showReadme"
              class="option-switch"
              @click.stop
            />
            <div class="option-info">
              <div class="option-title">显示 README</div>
              <div class="option-desc">自动展示目录下的 README.md 文件</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 下载次数限制 (仅文件) -->
      <div
        v-if="!hasFolder"
        class="option-item"
        :class="{ active: shareForm.enableDownloadLimit }"
      >
        <div class="option-header" @click="toggleOption('enableDownloadLimit')">
          <div class="option-title-wrapper">
            <el-switch
              v-model="shareForm.enableDownloadLimit"
              class="option-switch"
              @click.stop
            />
            <div class="option-info">
              <div class="option-title">下载次数限制</div>
              <div class="option-desc">达到次数后自动失效</div>
            </div>
          </div>
          <i
            class="anzhiyufont anzhiyu-icon-arrow-down-s-line option-arrow"
            :class="{ expanded: shareForm.enableDownloadLimit }"
          />
        </div>
        <Transition name="accordion">
          <div v-if="shareForm.enableDownloadLimit" class="option-content">
            <div class="flex items-center gap-2">
              <el-input-number
                v-model="shareForm.downloadLimit"
                :min="1"
                :max="9999"
                :step="1"
                controls-position="right"
                class="flex-1"
              />
              <span class="text-sm">次后失效</span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 访问权限控制 -->
      <div
        class="option-item"
        :class="{ active: shareForm.enableUserGroupControl }"
      >
        <div
          class="option-header"
          @click="toggleOption('enableUserGroupControl')"
        >
          <div class="option-title-wrapper">
            <el-switch
              v-model="shareForm.enableUserGroupControl"
              class="option-switch"
              @click.stop
            />
            <div class="option-info">
              <div class="option-title">访问权限控制</div>
              <div class="option-desc">限制哪些用户组可以访问</div>
            </div>
          </div>
          <i
            class="anzhiyufont anzhiyu-icon-arrow-down-s-line option-arrow"
            :class="{ expanded: shareForm.enableUserGroupControl }"
          />
        </div>
        <Transition name="accordion">
          <div v-if="shareForm.enableUserGroupControl" class="option-content">
            <el-checkbox-group
              v-model="shareForm.allowedUserGroups"
              class="user-group-checkboxes"
            >
              <el-checkbox :value="1" label="管理员" />
              <el-checkbox :value="2" label="注册用户" />
              <el-checkbox :value="3" label="匿名访客" />
            </el-checkbox-group>
            <div class="mt-2 text-xs text-gray-500">至少选择一个用户组</div>
          </div>
        </Transition>
      </div>
    </div>
  </AnDialog>

  <!-- 分享结果对话框 -->
  <AnDialog
    v-model="showResultDialog"
    title="分享链接创建成功"
    width="520px"
    :show-footer="true"
    container-class="result-dialog"
  >
    <div class="share-result">
      <el-alert
        title="分享链接已创建"
        type="success"
        :closable="false"
        class="mb-4"
      />

      <div class="mb-3">
        <div class="mb-1 text-sm text-gray-600">分享链接：</div>
        <el-input v-model="shareResult.link" readonly class="mb-2">
          <template #append>
            <el-button :icon="CopyDocument" @click="copyLink"> 复制 </el-button>
          </template>
        </el-input>
      </div>

      <div v-if="shareResult.password" class="mb-3">
        <div class="mb-1 text-sm text-gray-600">访问密码：</div>
        <el-input v-model="shareResult.password" readonly>
          <template #append>
            <el-button :icon="CopyDocument" @click="copyPassword">
              复制
            </el-button>
          </template>
        </el-input>
      </div>

      <div v-if="shareResult.expirationTime" class="mb-3">
        <div class="text-sm text-gray-600">
          过期时间：{{ formatDateTime(shareResult.expirationTime) }}
        </div>
      </div>

      <div v-if="shareResult.downloadLimit" class="mb-3">
        <div class="text-sm text-gray-600">
          下载次数限制：{{ shareResult.downloadLimit }} 次
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end w-full">
        <el-button type="primary" @click="showResultDialog = false"
          >确定</el-button
        >
      </div>
    </template>
  </AnDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { PropType } from "vue";
import { ElMessage } from "element-plus";
import {
  Folder,
  Document,
  Refresh,
  CopyDocument
} from "@element-plus/icons-vue";
import type { FileItem } from "@/api/sys-file/type";
import { FileType } from "@/api/sys-file/type";
import { useClipboard } from "@vueuse/core";
import { createShareLinkApi } from "@/api/sys-file/sys-file";
import type { CreateShareLinkRequest } from "@/api/sys-file/type";
import AnDialog from "@/components/AnDialog/index.vue";

// Props & Emits
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  selectedItems: { type: Array as PropType<FileItem[]>, default: () => [] }
});

const emit = defineEmits(["update:modelValue", "success"]);

// 表单数据
interface ShareForm {
  enableExpiration: boolean;
  expirationDays: number;
  enablePayment: boolean;
  paymentAmount: number;
  enablePassword: boolean;
  password: string;
  showReadme: boolean;
  enableDownloadLimit: boolean;
  downloadLimit: number;
  enableUserGroupControl: boolean;
  allowedUserGroups: number[];
}

const shareForm = ref<ShareForm>({
  enableExpiration: false,
  expirationDays: 7,
  enablePayment: false,
  paymentAmount: 1.0,
  enablePassword: false,
  password: "",
  showReadme: false,
  enableDownloadLimit: false,
  downloadLimit: 100,
  enableUserGroupControl: false,
  allowedUserGroups: [1, 2, 3] // 默认全部用户组
});

// 分享结果
interface ShareResult {
  link: string;
  password?: string;
  expirationTime?: string;
  downloadLimit?: number;
}

const shareResult = ref<ShareResult>({
  link: ""
});

// 状态
const localVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const isSubmitting = ref(false);
const showResultDialog = ref(false);

// 计算属性
const selectedCount = computed(() => props.selectedItems.length);

const shareFileName = computed(() => {
  if (selectedCount.value === 0) return "";
  if (selectedCount.value === 1) return props.selectedItems[0].name;
  return `${props.selectedItems[0].name} 等 ${selectedCount.value} 个项目`;
});

const isFolder = computed(() => {
  if (selectedCount.value !== 1) return false;
  return props.selectedItems[0].type === FileType.Dir;
});

// 检查选中的项目中是否包含文件夹
const hasFolder = computed(() => {
  return props.selectedItems.some(item => item.type === FileType.Dir);
});

const isFormValid = computed(() => {
  // 如果启用了密码保护，必须填写密码
  if (shareForm.value.enablePassword && !shareForm.value.password.trim()) {
    return false;
  }
  // 如果启用了密码保护，密码长度必须在4-8位之间
  if (
    shareForm.value.enablePassword &&
    (shareForm.value.password.length < 4 || shareForm.value.password.length > 8)
  ) {
    return false;
  }
  // 如果启用了用户组控制，必须至少选择一个用户组
  if (
    shareForm.value.enableUserGroupControl &&
    shareForm.value.allowedUserGroups.length === 0
  ) {
    return false;
  }
  return true;
});

// 方法
const toggleOption = (key: keyof ShareForm) => {
  const value = shareForm.value[key];
  if (typeof value === "boolean") {
    (shareForm.value[key] as boolean) = !value;
  }
};

const generateRandomPassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  shareForm.value.password = password;
};

const handleCreateShare = async () => {
  if (!isFormValid.value) {
    ElMessage.warning("请完善分享设置");
    return;
  }

  isSubmitting.value = true;

  try {
    // 构建请求参数
    const params: CreateShareLinkRequest = {
      file_ids: props.selectedItems.map(item => item.id)
    };

    // 超时自动过期
    if (shareForm.value.enableExpiration) {
      params.expiration_days = shareForm.value.expirationDays;
    }

    // 付费下载
    if (shareForm.value.enablePayment) {
      params.payment_amount = shareForm.value.paymentAmount;
    }

    // 密码保护
    if (shareForm.value.enablePassword) {
      params.password = shareForm.value.password;
    }

    // 显示 README (仅文件夹)
    if (isFolder.value && shareForm.value.showReadme) {
      params.show_readme = true;
    }

    // 下载次数限制 (仅文件)
    if (shareForm.value.enableDownloadLimit && !hasFolder.value) {
      params.download_limit = shareForm.value.downloadLimit;
    }

    // 访问权限控制
    if (shareForm.value.enableUserGroupControl) {
      params.allowed_user_groups = shareForm.value.allowedUserGroups;
    }

    // 调用实际的 API
    const response = await createShareLinkApi(params);

    if (response.code === 200 && response.data) {
      // 后端只返回分享ID，前端需要构建完整的分享链接
      const shareId = response.data.link; // 后端返回的是分享ID
      const fullShareLink = `${window.location.origin}/share/${shareId}`;

      shareResult.value = {
        link: fullShareLink, // 使用完整的URL
        password: response.data.password,
        expirationTime: response.data.expiration_time,
        downloadLimit: response.data.download_limit
      };

      localVisible.value = false;

      // 等待主对话框关闭动画完成后，打开结果对话框
      setTimeout(() => {
        showResultDialog.value = true;
      }, 300);

      emit("success");
      ElMessage.success("分享链接创建成功");
    } else {
      ElMessage.error(response.message || "创建分享链接失败");
    }
  } catch (error: any) {
    console.error("创建分享链接失败:", error);
    ElMessage.error(error.message || "创建分享链接失败");
  } finally {
    isSubmitting.value = false;
  }
};

const handleModalClosed = () => {
  // 重置表单
  shareForm.value = {
    enableExpiration: false,
    expirationDays: 7,
    enablePayment: false,
    paymentAmount: 1.0,
    enablePassword: false,
    password: "",
    showReadme: false,
    enableDownloadLimit: false,
    downloadLimit: 100,
    enableUserGroupControl: false,
    allowedUserGroups: [1, 2, 3]
  };
};

// 复制功能
const { copy } = useClipboard();

const copyLink = async () => {
  try {
    await copy(shareResult.value.link);
    ElMessage.success("链接已复制到剪贴板");
  } catch (error) {
    ElMessage.error("复制失败");
  }
};

const copyPassword = async () => {
  try {
    await copy(shareResult.value.password || "");
    ElMessage.success("密码已复制到剪贴板");
  } catch (error) {
    ElMessage.error("复制失败");
  }
};

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// 监听弹窗打开，自动为文件夹勾选显示 README
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && isFolder.value) {
      shareForm.value.showReadme = true;
    }
  }
);

// 监听选中项变化，如果包含文件夹则禁用下载次数限制
watch(
  () => hasFolder.value,
  newValue => {
    if (newValue && shareForm.value.enableDownloadLimit) {
      shareForm.value.enableDownloadLimit = false;
    }
  }
);
</script>

<style lang="scss" scoped>
.share-info {
  padding: 14px 16px;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border);
  border-radius: 12px;
}

// 分享选项容器
.share-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// 选项卡片
.option-item {
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: 1px solid var(--anzhiyu-card-border, rgb(0 0 0 / 8%));
  border-radius: 12px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: var(--anzhiyu-theme-op, rgb(79 107 246 / 20%));
    box-shadow: 0 2px 8px var(--anzhiyu-theme-op, rgb(79 107 246 / 10%));
  }

  &.active {
    background: var(--anzhiyu-theme-op, rgb(79 107 246 / 5%));
    border-color: var(--anzhiyu-theme);
  }
}

// 选项头部
.option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.option-title-wrapper {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
}

// 选项信息
.option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--anzhiyu-fontcolor);
}

.option-desc {
  font-size: 12px;
  line-height: 1.4;
  color: var(--anzhiyu-secondtext);
}

// 箭头图标
.option-arrow {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--anzhiyu-secondtext);
  transition: transform 0.2s ease;
  will-change: transform;

  &.expanded {
    transform: rotate(180deg);
  }
}

// 选项内容
.option-content {
  padding: 0 16px 14px 52px;
  color: var(--anzhiyu-fontcolor);

  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-input) {
    .el-input__wrapper {
      border-radius: 8px;
    }
  }

  :deep(.el-button) {
    border-radius: 8px;
  }
}

// 手风琴动画
.accordion-enter-active {
  overflow: hidden;
  transition:
    opacity 0.15s ease-out,
    max-height 0.2s ease-out;
  will-change: opacity, max-height;
}

.accordion-leave-active {
  overflow: hidden;
  transition:
    opacity 0.12s ease-in,
    max-height 0.15s ease-in;
  will-change: opacity, max-height;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 200px;
  opacity: 1;
}

// 分享结果样式
.share-result {
  :deep(.el-alert) {
    border-radius: 12px;
  }

  :deep(.el-input-group__append) {
    padding: 0;

    .el-button {
      margin: 0;
      border-radius: 0 8px 8px 0;
    }
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px 0 0 8px;
  }
}

// 用户组复选框样式
.user-group-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 12px;

  :deep(.el-checkbox) {
    display: flex;
    align-items: center;
    margin-right: 0;

    .el-checkbox__label {
      color: var(--anzhiyu-fontcolor);
      font-size: 14px;
      padding-left: 8px;
    }
  }
}

// 移动端优化
@media (width <= 768px) {
  .option-content {
    padding-left: 48px;
  }
}
</style>
