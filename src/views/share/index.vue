<template>
  <div class="share-page">
    <!-- 加载中 -->
    <div v-if="loading" class="share-loading">
      <div class="loading-spinner" />
      <p class="mt-4 text-gray-600">加载分享内容中...</p>
    </div>

    <!-- 需要密码验证 -->
    <div
      v-else-if="shareInfo && shareInfo.requires_password && !isAuthenticated"
      class="share-password-form"
    >
      <div class="password-card">
        <div class="mb-6 text-center">
          <el-icon :size="60" class="mb-4 text-primary">
            <Lock />
          </el-icon>
          <h2 class="mb-2 text-2xl font-bold">此分享需要密码</h2>
          <p class="text-gray-600">请输入访问密码以查看内容</p>
        </div>

        <el-form @submit.prevent="handleVerifyPassword">
          <el-form-item>
            <el-input
              v-model="password"
              type="password"
              placeholder="请输入访问密码"
              size="large"
              show-password
              :disabled="verifying"
              @keyup.enter="handleVerifyPassword"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="verifying"
            :disabled="!password.trim()"
            class="w-full"
            @click="handleVerifyPassword"
          >
            {{ verifying ? "验证中..." : "访问分享" }}
          </el-button>
        </el-form>
      </div>
    </div>

    <!-- 分享已过期或不存在 -->
    <div v-else-if="error" class="share-error">
      <div class="error-card">
        <el-icon :size="60" class="mb-4 text-gray-400">
          <WarningFilled />
        </el-icon>
        <h2 class="mb-2 text-2xl font-bold">{{ errorTitle }}</h2>
        <p class="mb-6 text-gray-600">{{ errorMessage }}</p>
        <el-button
          v-if="shareInfo?.requires_upgrade"
          type="primary"
          @click="goToLogin"
        >
          前往登录
        </el-button>
        <el-button v-else type="primary" @click="goHome">返回首页</el-button>
      </div>
    </div>

    <!-- 分享内容 -->
    <div v-else-if="shareInfo" class="share-content">
      <!-- 分享信息头部 -->
      <div class="share-header">
        <div class="share-header-main">
          <div class="share-meta">
            <span v-if="shareInfo.creator_name" class="meta-item">
              <el-icon><User /></el-icon>
              {{ shareInfo.creator_name }}
            </span>
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              创建于 {{ formatDateTime(shareInfo.created_at) }}
            </span>
            <span v-if="shareInfo.expiration_time" class="meta-item">
              <el-icon><Clock /></el-icon>
              过期时间:{{ formatDateTime(shareInfo.expiration_time) }}
            </span>
          </div>
        </div>

        <!-- 下载统计 -->
        <div v-if="shareInfo.download_limit" class="share-stats">
          <el-progress
            :percentage="downloadPercentage"
            :status="downloadPercentage >= 100 ? 'exception' : undefined"
          />
          <p class="mt-2 text-sm text-gray-600">
            已下载 {{ shareInfo.download_count }} /
            {{ shareInfo.download_limit }} 次
          </p>
        </div>
      </div>

      <!-- README 内容 -->
      <div
        v-if="shareInfo.show_readme && shareInfo.readme_content"
        class="readme-section"
      >
        <div class="readme-header">
          <h3 class="readme-title">
            <el-icon><Document /></el-icon>
            README.md
          </h3>
        </div>
        <div class="readme-content markdown-body" v-html="renderedReadme" />
      </div>

      <!-- 付费提示（未购买时替代文件列表显示） -->
      <div
        v-if="
          shareInfo.payment_amount &&
          shareInfo.payment_amount > 0 &&
          !hasPurchased
        "
        class="payment-notice payment-notice-unpaid"
      >
        <div class="payment-icon">
          <el-icon :size="32">
            <Lock />
          </el-icon>
        </div>
        <div class="payment-content">
          <div class="payment-title">此分享为付费内容</div>
          <div class="payment-desc">完成支付后即可下载分享的文件</div>
          <div class="payment-amount">
            ¥<span class="amount-number">{{ shareInfo.payment_amount }}</span>
          </div>
        </div>
        <div class="payment-action">
          <el-button
            type="primary"
            size="large"
            class="payment-btn"
            @click="handleShowPayment"
          >
            立即支付
          </el-button>
          <el-button
            text
            type="info"
            size="small"
            class="mt-2"
            @click="handleShowOrderRecovery"
          >
            已购买？使用订单号找回
          </el-button>
        </div>
      </div>

      <!-- 已购买提示 -->
      <div
        v-if="
          shareInfo.payment_amount &&
          shareInfo.payment_amount > 0 &&
          hasPurchased
        "
        class="payment-notice payment-notice-paid"
      >
        <div class="payment-icon">
          <el-icon :size="24">
            <Check />
          </el-icon>
        </div>
        <div class="payment-content">
          <div class="payment-title">支付成功</div>
          <div class="payment-desc">您已购买此分享，可以下载所有文件</div>
        </div>
      </div>

      <!-- 文件浏览器区域（如果分享包含文件夹且可以访问） -->
      <div
        v-if="
          hasFolderInShare &&
          (!shareInfo.payment_amount ||
            shareInfo.payment_amount === 0 ||
            hasPurchased)
        "
        class="file-browser-section"
      >
        <div class="flex w-full mb-2">
          <ShareBreadcrumb
            class="flex-1"
            :segments="breadcrumbSegments"
            :current-folder-info="currentFolderInfo"
            :show-dropdown="!!currentFolderInfo"
            @navigate="handleNavigateToFolder"
            @download-folder="handleDownloadFolder"
          />
          <ShareToolbar
            class="min-h-[52px] ml-2"
            :view-mode="viewMode"
            :sort-key="sortKey"
            @set-view-mode="handleSetViewMode"
            @set-sort-key="handleSetSortKey"
          />
        </div>

        <div class="overflow-hidden file-browser-main rounded-2xl">
          <FileListView
            v-if="viewMode === 'list'"
            :files="sortedFiles"
            :loading="filesLoading"
            :selected-file-ids="selectedFileIds"
            :columns="defaultColumns"
            :sort-key="sortKey"
            :show-column-settings="false"
            @navigate-to="handleNavigateToFolder"
            @preview-file="handlePreviewFile"
            @select-single="handleSelectSingle"
            @toggle-selection="handleToggleSelection"
            @select-range="handleSelectRange"
            @select-all="handleSelectAll"
            @contextmenu="handleFileContextMenu"
          />
          <FileGridView
            v-else
            :files="sortedFiles"
            :loading="filesLoading"
            :selected-file-ids="selectedFileIds"
            @navigate-to="handleNavigateToFolder"
            @preview-file="handlePreviewFile"
            @select-single="handleSelectSingle"
            @toggle-selection="handleToggleSelection"
            @select-range="handleSelectRange"
            @select-all="handleSelectAll"
            @contextmenu="handleFileContextMenu"
          />
        </div>

        <!-- 批量操作工具栏 -->
        <transition name="slide-up">
          <div v-if="selectedFileIds.size > 0" class="batch-action-bar">
            <div class="batch-info">
              <span class="selected-count"
                >已选中 {{ selectedFileIds.size }} 项</span
              >
              <el-button
                text
                type="primary"
                @click="selectedFileIds = new Set()"
              >
                取消选择
              </el-button>
            </div>
            <div class="batch-actions">
              <el-button
                type="primary"
                :icon="Download"
                :disabled="hasSelectedFolder"
                @click="handleDownloadSelected"
              >
                下载选中
              </el-button>
            </div>
          </div>
        </transition>
      </div>

      <!-- 简单文件列表（如果只分享文件且可以访问） -->
      <div
        v-else-if="
          !hasFolderInShare &&
          (!shareInfo.payment_amount ||
            shareInfo.payment_amount === 0 ||
            hasPurchased)
        "
        class="files-section"
      >
        <div class="files-header">
          <h3 class="files-title">
            <el-icon><Folder /></el-icon>
            分享文件 ({{ shareInfo.files.length }})
          </h3>
        </div>

        <div class="files-list">
          <div v-for="file in shareInfo.files" :key="file.id" class="file-item">
            <div class="file-info">
              <el-icon :size="24" class="file-icon">
                <component
                  :is="file.type === FileType.Dir ? Folder : Document"
                />
              </el-icon>
              <div class="file-details">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-meta">
                  <span v-if="file.type === FileType.File">
                    {{ formatFileSize(file.size) }}
                  </span>
                  <span>{{ formatDateTime(file.updated_at) }}</span>
                </div>
              </div>
            </div>
            <div class="file-actions">
              <el-button
                v-if="canDownload && file.type === FileType.File"
                type="primary"
                :icon="Download"
                @click="handleDownloadFile(file)"
              >
                下载
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览组件 -->
    <AzImagePreview ref="imagePreviewRef" page="share" />
    <AzVideoPreview ref="videoPreviewRef" />
    <AzTextPreview ref="textPreviewRef" />

    <!-- 无支付方式提示弹窗 -->
    <AnDialog
      v-model="noPaymentMethodDialogVisible"
      title="无可用支付方式"
      width="480px"
      :show-footer="true"
      :hide-footer="false"
      confirm-text="我知道了"
      :show-close="true"
      @confirm="noPaymentMethodDialogVisible = false"
    >
      <div class="py-4">
        <p class="text-center text-gray-600">
          暂未配置支付方式，无法完成支付。请联系管理员配置支付宝或微信支付。
        </p>
      </div>
    </AnDialog>

    <!-- 支付方式确认弹窗 -->
    <AnDialog
      v-model="paymentConfirmDialogVisible"
      title="确认支付"
      width="480px"
      :show-footer="true"
      :hide-footer="false"
      confirm-text="确认支付"
      cancel-text="取消"
      @confirm="handleConfirmPaymentMethod"
      @close="paymentConfirmDialogVisible = false"
    >
      <div class="py-4">
        <p class="text-center text-gray-600">
          将使用{{ selectedPaymentProviderName }}支付 ¥{{
            shareInfo?.payment_amount
          }}
        </p>
      </div>
    </AnDialog>

    <!-- 订单找回对话框 -->
    <AnDialog
      v-model="orderRecoveryDialogVisible"
      title="使用订单号找回购买"
      width="480px"
      :show-footer="true"
      confirm-text="验证订单"
      cancel-text="取消"
      :confirm-loading="orderRecoveryLoading"
      @confirm="handleOrderRecovery"
    >
      <div class="order-recovery-content">
        <el-alert
          title="提示"
          type="info"
          :closable="false"
          class="mb-4"
          description="如果您已完成支付，请输入订单号或支付平台交易号来恢复购买状态"
        />

        <el-form label-position="top">
          <el-form-item label="订单号 / 交易号">
            <el-input
              v-model="orderRecoveryForm.order_no"
              placeholder="支持系统订单号或支付宝/微信交易号"
              clearable
              :disabled="orderRecoveryLoading"
              @keyup.enter="handleOrderRecovery"
            >
              <template #prefix>
                <el-icon><Document /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-form>

        <div class="text-sm text-gray-500">
          <p class="mb-1">提示：</p>
          <ul class="list-disc list-inside">
            <li>订单号可在支付完成页面或支付平台订单记录中查看</li>
            <li>验证成功后，购买凭证将保存在本地</li>
          </ul>
        </div>
      </div>
    </AnDialog>

    <!-- 统一支付弹窗 -->
    <AnDialog
      v-model="paymentDialogVisible"
      :title="
        paymentStep === 'select'
          ? '选择支付方式'
          : `${selectedPaymentProviderName}扫码支付`
      "
      :width="paymentStep === 'select' ? '520px' : '420px'"
      :show-close="true"
      :show-footer="paymentStep === 'qrcode'"
      confirm-text="已完成支付"
      cancel-text="取消支付"
      :close-on-click-modal="paymentStep === 'select'"
      @confirm="handleConfirmPaymentComplete"
      @close="handlePaymentDialogClose"
    >
      <!-- 步骤1：选择支付方式 -->
      <div v-if="paymentStep === 'select'" class="payment-selection-content">
        <div class="payment-amount">
          <span class="amount-label">支付金额</span>
          <span class="amount-value">¥{{ shareInfo?.payment_amount }}</span>
        </div>

        <div class="payment-methods">
          <div
            class="payment-method-card"
            :class="{
              loading: paymentLoading && selectedPaymentProvider === 'ALIPAY'
            }"
            @click="handleSelectPaymentMethod('ALIPAY')"
          >
            <div class="method-icon alipay">
              <svg
                class="icon"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M230.4 576.512c-12.288 9.728-25.088 24.064-28.672 41.984-5.12 24.576-1.024 55.296 22.528 79.872 28.672 29.184 72.704 37.376 91.648 38.912 51.2 3.584 105.984-22.016 147.456-50.688 16.384-11.264 44.032-34.304 70.144-69.632-59.392-30.72-133.632-64.512-212.48-61.44-40.448 1.536-69.632 9.728-90.624 20.992z m752.64 135.68c26.112-61.44 40.96-129.024 40.96-200.192C1024 229.888 794.112 0 512 0S0 229.888 0 512s229.888 512 512 512c170.496 0 321.536-83.968 414.72-211.968-88.064-43.52-232.96-115.712-322.56-159.232-42.496 48.64-105.472 97.28-176.64 118.272-44.544 13.312-84.992 18.432-126.976 9.728-41.984-8.704-72.704-28.16-90.624-47.616-9.216-10.24-19.456-22.528-27.136-37.888 0.512 1.024 1.024 2.048 1.024 3.072 0 0-4.608-7.68-7.68-19.456-1.536-6.144-3.072-11.776-3.584-17.92-0.512-4.096-0.512-8.704 0-12.8-0.512-7.68 0-15.872 1.536-24.064 4.096-20.48 12.8-44.032 35.328-65.536 49.152-48.128 114.688-50.688 148.992-50.176 50.176 0.512 138.24 22.528 211.968 48.64 20.48-43.52 33.792-90.112 41.984-121.344h-307.2v-33.28h157.696v-66.56H272.384V302.08h190.464V235.52c0-9.216 2.048-16.384 16.384-16.384h74.752V302.08h207.36v33.28h-207.36v66.56h165.888s-16.896 92.672-68.608 184.32c115.2 40.96 278.016 104.448 331.776 125.952z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div class="method-info">
              <h4>支付宝</h4>
              <p>使用支付宝扫码支付</p>
            </div>
            <el-icon
              v-if="!paymentLoading || selectedPaymentProvider !== 'ALIPAY'"
              class="arrow-icon"
            >
              <ArrowRight />
            </el-icon>
            <el-icon v-else class="loading-icon" :size="20">
              <Loading />
            </el-icon>
          </div>

          <div
            class="payment-method-card"
            :class="{
              loading: paymentLoading && selectedPaymentProvider === 'WECHAT'
            }"
            @click="handleSelectPaymentMethod('WECHAT')"
          >
            <div class="method-icon wechat">
              <svg
                class="icon"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1010.8 628c0-141.2-141.3-256.2-299.9-256.2-168 0-300.3 115.1-300.3 256.2 0 141.4 132.3 256.2 300.3 256.2 35.2 0 70.7-8.9 106-17.7l96.8 53-26.6-88.2c70.9-53.2 123.7-123.7 123.7-203.3zM618 588.8c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40c0 22-17.9 40-40 40z m194.3-0.3c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z"
                  fill="currentColor"
                />
                <path
                  d="M366.3 106.9c-194.1 0-353.1 132.3-353.1 300.3 0 97 52.9 176.6 141.3 238.4l-35.3 106.2 123.4-61.9c44.2 8.7 79.6 17.7 123.7 17.7 11.1 0 22.1-0.5 33-1.4-6.9-23.6-10.9-48.3-10.9-74 0-154.3 132.5-279.5 300.2-279.5 11.5 0 22.8 0.8 34 2.1C692 212.6 539.9 106.9 366.3 106.9zM247.7 349.2c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48z m246.6 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div class="method-info">
              <h4>微信支付</h4>
              <p>使用微信扫码支付</p>
            </div>
            <el-icon
              v-if="!paymentLoading || selectedPaymentProvider !== 'WECHAT'"
              class="arrow-icon"
            >
              <ArrowRight />
            </el-icon>
            <el-icon v-else class="loading-icon" :size="20">
              <Loading />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 步骤2：显示二维码 -->
      <div v-else-if="paymentStep === 'qrcode'" class="payment-qrcode-content">
        <p class="mb-4 text-center text-gray-600">
          请使用{{ selectedPaymentProviderName }}扫描下方二维码完成支付
        </p>
        <div class="flex justify-center">
          <img
            :src="paymentQrCode"
            alt="支付二维码"
            class="w-[200px] h-[200px] border border-gray-200 rounded-lg"
          />
        </div>
        <p class="mt-4 text-xs text-center text-gray-400">
          支付完成后将自动刷新
        </p>
      </div>
    </AnDialog>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  defineAsyncComponent
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Lock,
  WarningFilled,
  User,
  Calendar,
  Clock,
  Document,
  Folder,
  Download,
  Check,
  ArrowRight,
  Loading
} from "@element-plus/icons-vue";
import AnDialog from "@/components/AnDialog/index.vue";
import QRCode from "qrcode";
import {
  getShareInfoApi,
  verifySharePasswordApi,
  getShareFileListApi
} from "@/api/sys-file/sys-file";
import {
  createSharePaymentOrder,
  getOrderStatus,
  getOrderStatusByTradeNo,
  getPaymentConfigDetails,
  type CreateShareOrderRequest
} from "@/api/payment";
import type { ShareInfoData, FileItem } from "@/api/sys-file/type";
import { FileType } from "@/api/sys-file/type";
import ShareBreadcrumb from "./components/ShareBreadcrumb.vue";
import ShareToolbar from "./components/ShareToolbar.vue";
import FileListView from "@/views/system/file-management/components/FileListView.vue";
import FileGridView from "@/views/system/file-management/components/FileGridView.vue";
import type { SortKey } from "@/store/modules/fileStore";
import { useShareFilePreview } from "./hooks/useShareFilePreview";
import { useMonacoTheme } from "@/components/AzTextPreview/hooks/useMonacoTheme";
import AzImagePreview from "@/components/AzImagePreview";
import AzTextPreview from "@/components/AzTextPreview";
// 懒加载视频预览组件
const AzVideoPreview = defineAsyncComponent(
  () => import("@/components/AzVideoPreview")
);

const route = useRoute();
const router = useRouter();

// 预览组件 refs
const imagePreviewRef = ref<any>(null);
const videoPreviewRef = ref<any>(null);
const textPreviewRef = ref<any>(null);

// 主题管理
const { monacoTheme } = useMonacoTheme();

// 文件预览 hook
const { previewFile } = useShareFilePreview();

// 状态
const loading = ref(true);
const error = ref(false);
const errorTitle = ref("");
const errorMessage = ref("");
const shareInfo = ref<ShareInfoData | null>(null);
const isAuthenticated = ref(false);
const password = ref("");
const verifying = ref(false);
const accessSign = ref<string | undefined>(undefined);

// 文件浏览状态
const currentFolderId = ref<string>("");
const currentFiles = ref<FileItem[]>([]);
const filesLoading = ref(false);
const breadcrumbSegments = ref<Array<{ id: string; name: string }>>([]);
const currentFolderInfo = ref<{ id: string; name: string } | null>(null);
const viewMode = ref<"list" | "grid">("list");
const sortKey = ref<SortKey>("name_asc");

// 文件选中状态
const selectedFileIds = ref<Set<string>>(new Set());

// 支付相关状态
const hasPurchased = ref(false);
const paymentLoading = ref(false);
const paymentProvider = ref<"ALIPAY" | "WECHAT">("ALIPAY");
const paymentQrCode = ref("");
const currentOrderNo = ref("");
const pollingTimer = ref<number | null>(null);

// AnDialog 弹窗控制状态
const noPaymentMethodDialogVisible = ref(false);
const paymentConfirmDialogVisible = ref(false);
const paymentDialogVisible = ref(false); // 统一的支付弹窗
const paymentStep = ref<"select" | "qrcode">("select"); // 支付步骤：选择方式 | 显示二维码
const selectedPaymentProvider = ref<"ALIPAY" | "WECHAT">("ALIPAY");

// 订单找回弹窗
const orderRecoveryDialogVisible = ref(false);
const orderRecoveryForm = ref({ order_no: "" });
const orderRecoveryLoading = ref(false);

// 默认列配置
const defaultColumns = [
  { type: 0 }, // 名称
  { type: 1 }, // 大小
  { type: 2 } // 修改时间
];

// 计算属性
const shareId = computed(() => route.params.id as string);

const downloadPercentage = computed(() => {
  if (!shareInfo.value || !shareInfo.value.download_limit) return 0;
  return Math.min(
    100,
    (shareInfo.value.download_count / shareInfo.value.download_limit) * 100
  );
});

const canDownload = computed(() => {
  if (!shareInfo.value) return false;
  if (shareInfo.value.is_expired) return false;
  if (
    shareInfo.value.download_limit &&
    shareInfo.value.download_count >= shareInfo.value.download_limit
  ) {
    return false;
  }
  return true;
});

const hasFolderInShare = computed(() => {
  return (
    shareInfo.value?.files.some(file => file.type === FileType.Dir) || false
  );
});

// 判断选中的文件中是否包含文件夹
const hasSelectedFolder = computed(() => {
  const selectedFiles = currentFiles.value.filter(f =>
    selectedFileIds.value.has(f.id)
  );
  return selectedFiles.some(file => file.type === FileType.Dir);
});

const sortedFiles = computed(() => {
  // 为文件添加 path 字段，以兼容 FileListView 组件
  const files = [...currentFiles.value].map(file => ({
    ...file,
    // 使用分享 URI 格式：anzhiyu://shareId/fileId
    path: `anzhiyu://${shareId.value}/${file.id}`
  }));

  const [key, direction] = sortKey.value.split("_") as [string, "asc" | "desc"];

  files.sort((a, b) => {
    // 文件夹总是排在前面
    if (a.type === FileType.Dir && b.type === FileType.File) return -1;
    if (a.type === FileType.File && b.type === FileType.Dir) return 1;

    let aVal: any;
    let bVal: any;

    switch (key) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "size":
        aVal = a.size;
        bVal = b.size;
        break;
      case "updated":
        aVal = new Date(a.updated_at).getTime();
        bVal = new Date(b.updated_at).getTime();
        break;
      case "created":
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
      default:
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
    }

    const compare = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return direction === "asc" ? compare : -compare;
  });

  return files;
});

const renderedReadme = computed(() => {
  if (!shareInfo.value?.readme_content) return "";
  // 简单的 markdown 转换
  let html = shareInfo.value.readme_content;

  // 标题
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // 粗体
  html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");

  // 斜体
  html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");

  // 链接
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/gim,
    '<a href="$2" target="_blank">$1</a>'
  );

  // 代码块
  html = html.replace(/`([^`]+)`/gim, "<code>$1</code>");

  // 换行
  html = html.replace(/\n/gim, "<br>");

  return html;
});

const selectedPaymentProviderName = computed(() => {
  return selectedPaymentProvider.value === "ALIPAY" ? "支付宝" : "微信";
});

// ===== 本地存储管理 =====
const STORAGE_KEY_PREFIX = "share_purchase_";

// 保存购买凭证到本地存储
const savePurchaseToLocal = (shareId: string, orderNo: string) => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${shareId}`;
    const data = {
      order_no: orderNo,
      purchased_at: new Date().toISOString(),
      share_id: shareId
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log("购买凭证已保存到本地:", data);
  } catch (error) {
    console.error("保存购买凭证失败:", error);
  }
};

// 从本地存储获取购买凭证
const getPurchaseFromLocal = (shareId: string): string | null => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${shareId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const purchase = JSON.parse(data);
      console.log("从本地读取到购买凭证:", purchase);
      return purchase.order_no;
    }
  } catch (error) {
    console.error("读取购买凭证失败:", error);
  }
  return null;
};

// 清除本地购买凭证
const clearPurchaseFromLocal = (shareId: string) => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${shareId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("清除购买凭证失败:", error);
  }
};

// 方法
const loadShareInfo = async () => {
  loading.value = true;
  error.value = false;

  try {
    const response = await getShareInfoApi(shareId.value, accessSign.value);

    if (response.code === 200 && response.data) {
      shareInfo.value = response.data;

      // 检查用户组权限
      if (shareInfo.value.access_denied) {
        error.value = true;
        errorTitle.value = "无权访问";

        // 根据允许的用户组生成友好的提示信息
        const allowedGroups = shareInfo.value.allowed_user_groups || [];
        const groupNames = {
          1: "管理员",
          2: "注册用户",
          3: "匿名访客"
        };
        const allowedGroupNames = allowedGroups
          .map(id => groupNames[id as keyof typeof groupNames])
          .filter(Boolean);

        if (shareInfo.value.requires_upgrade) {
          errorMessage.value = `此分享仅限 ${allowedGroupNames.join("、")} 访问，请先登录您的账号。`;
        } else {
          errorMessage.value = `此分享仅限 ${allowedGroupNames.join("、")} 访问，您的账号权限不足。`;
        }
      }
      // 检查是否已过期
      else if (shareInfo.value.is_expired) {
        error.value = true;
        errorTitle.value = "分享已过期";
        errorMessage.value = "此分享链接已过期，无法访问。";
      }
      // 检查是否需要密码且未验证
      else if (shareInfo.value.requires_password && !isAuthenticated.value) {
        // 显示密码验证界面
      } else {
        // 如果分享包含文件夹，初始化文件列表
        if (hasFolderInShare.value) {
          currentFiles.value = shareInfo.value.files;
        }

        // 检查是否为付费分享，且未购买
        if (
          shareInfo.value.payment_amount &&
          shareInfo.value.payment_amount > 0 &&
          !hasPurchased.value
        ) {
          // 尝试从本地存储恢复购买状态
          const localOrderNo = getPurchaseFromLocal(shareId.value);
          if (localOrderNo) {
            console.log("检测到本地购买凭证，尝试验证订单:", localOrderNo);
            await verifyPurchaseByOrderNo(localOrderNo);
          }
        }
      }
    } else {
      error.value = true;
      errorTitle.value = "分享不存在";
      errorMessage.value = "此分享链接不存在或已被删除。";
    }
  } catch (err: any) {
    console.error("加载分享信息失败:", err);
    error.value = true;
    errorTitle.value = "加载失败";
    errorMessage.value = err.message || "无法加载分享内容，请稍后重试。";
  } finally {
    loading.value = false;
  }
};

const handleVerifyPassword = async () => {
  if (!password.value.trim()) {
    ElMessage.warning("请输入访问密码");
    return;
  }

  verifying.value = true;

  try {
    const response = await verifySharePasswordApi({
      share_id: shareId.value,
      password: password.value
    });

    if (response.code === 200 && response.data) {
      accessSign.value = response.data.token;
      isAuthenticated.value = true;
      ElMessage.success("密码验证成功");
      // 重新加载分享信息
      await loadShareInfo();
    } else {
      ElMessage.error(response.message || "密码错误，请重试");
    }
  } catch (err: any) {
    console.error("密码验证失败:", err);
    ElMessage.error(err.message || "密码验证失败，请重试");
  } finally {
    verifying.value = false;
  }
};

const handleNavigateToFolder = async (pathOrId: string) => {
  // 清空选中状态
  selectedFileIds.value = new Set();

  if (!pathOrId) {
    // 返回根目录
    currentFiles.value = shareInfo.value?.files || [];
    breadcrumbSegments.value = [];
    currentFolderId.value = "";
    currentFolderInfo.value = null;
    return;
  }

  filesLoading.value = true;

  try {
    // 智能提取文件夹 ID
    let folderId = pathOrId;

    // 如果是完整的 URI 格式（anzhiyu://shareId/fileId）
    if (folderId.startsWith("anzhiyu://")) {
      const uriParts = folderId.split("/");
      // 取最后一部分作为文件 ID
      folderId = uriParts[uriParts.length - 1];
    }
    // 如果是路径格式（/fileId）
    else if (folderId.startsWith("/")) {
      folderId = folderId.substring(1);
    }

    // 检查是否是通过面包屑返回（后退导航）
    const existingIndex = breadcrumbSegments.value.findIndex(
      seg => seg.id === folderId
    );
    const isBackNavigation = existingIndex !== -1;

    // 在更新 currentFiles 之前先获取文件夹信息（仅在前进导航时需要）
    const folder = isBackNavigation ? null : findFolderById(folderId);

    // 构建 URI：anzhiyu://shareId/folderId
    const uri = `anzhiyu://${shareId.value}/${folderId}`;
    const response = await getShareFileListApi(uri, accessSign.value);

    if (response.code === 200 && response.data) {
      currentFiles.value = response.data.files;
      currentFolderId.value = folderId;

      // 更新面包屑
      if (isBackNavigation) {
        // 后退导航：截断面包屑到点击的位置
        breadcrumbSegments.value = breadcrumbSegments.value.slice(
          0,
          existingIndex + 1
        );
        currentFolderInfo.value = breadcrumbSegments.value[existingIndex];
      } else if (folder) {
        // 前进导航：添加新的面包屑段
        breadcrumbSegments.value.push({
          id: folderId,
          name: folder.name
        });
        currentFolderInfo.value = {
          id: folderId,
          name: folder.name
        };
      }
    } else {
      ElMessage.error("无法加载文件夹内容");
    }
  } catch (err: any) {
    console.error("加载文件夹内容失败:", err);
    ElMessage.error(err.message || "加载文件夹内容失败");
  } finally {
    filesLoading.value = false;
  }
};

const findFolderById = (id: string): FileItem | undefined => {
  return currentFiles.value.find(file => file.id === id);
};

const handleDownloadFile = async (file: FileItem) => {
  if (!canDownload.value) {
    ElMessage.warning("无法下载：分享已过期或已达下载限制");
    return;
  }

  // 检查是否需要付费
  if (
    shareInfo.value?.payment_amount &&
    shareInfo.value.payment_amount > 0 &&
    !hasPurchased.value
  ) {
    ElMessage.warning(
      `此分享需要支付 ¥${shareInfo.value.payment_amount} 后才能下载`
    );
    // 显示支付对话框
    handleShowPayment();
    return;
  }

  try {
    ElMessage.info(`正在准备下载：${file.name}`);

    // 使用 fetch + blob 方式下载，支持外部存储
    await downloadFileWithProgress(file.id, file.name);

    ElMessage.success(`下载成功：${file.name}`);

    // 更新下载计数（不刷新页面，保持在当前目录）
    if (shareInfo.value) {
      shareInfo.value.download_count =
        (shareInfo.value.download_count || 0) + 1;
    }
  } catch (err: any) {
    console.error("下载文件失败:", err);
    ElMessage.error(err.message || "下载失败，请稍后重试");
  }
};

const handlePreviewFile = async (file: FileItem) => {
  await previewFile(
    file,
    currentFiles.value,
    { imagePreviewRef, videoPreviewRef, textPreviewRef },
    monacoTheme.value,
    shareId.value,
    accessSign.value
  );
};

const handleFileContextMenu = (event: MouseEvent, file: FileItem) => {
  // 分享页面暂不支持右键菜单
  event.preventDefault();
};

const handleSetViewMode = (mode: "list" | "grid") => {
  viewMode.value = mode;
};

const handleSetSortKey = (key: SortKey) => {
  sortKey.value = key;
};

// 文件选中处理
const handleSelectSingle = (fileId: string) => {
  selectedFileIds.value = new Set([fileId]);
};

const handleToggleSelection = (fileId: string) => {
  const newSet = new Set(selectedFileIds.value);
  if (newSet.has(fileId)) {
    newSet.delete(fileId);
  } else {
    newSet.add(fileId);
  }
  selectedFileIds.value = newSet;
};

const handleSelectRange = (fileId: string) => {
  const fileIds = sortedFiles.value.map(f => f.id);
  const selectedIds = Array.from(selectedFileIds.value);

  if (selectedIds.length === 0) {
    selectedFileIds.value = new Set([fileId]);
    return;
  }

  const lastSelectedId = selectedIds[selectedIds.length - 1];
  const currentIndex = fileIds.indexOf(fileId);
  const lastIndex = fileIds.indexOf(lastSelectedId);

  if (currentIndex === -1 || lastIndex === -1) return;

  const start = Math.min(currentIndex, lastIndex);
  const end = Math.max(currentIndex, lastIndex);
  const rangeIds = fileIds.slice(start, end + 1);

  selectedFileIds.value = new Set([...selectedFileIds.value, ...rangeIds]);
};

const handleSelectAll = () => {
  if (selectedFileIds.value.size === sortedFiles.value.length) {
    selectedFileIds.value = new Set();
  } else {
    selectedFileIds.value = new Set(sortedFiles.value.map(f => f.id));
  }
};

const handleDownloadFolder = async (folderId: string) => {
  // 查找文件夹信息
  const folder = currentFiles.value.find(file => file.id === folderId);
  if (!folder) {
    ElMessage.warning("无法找到文件夹信息");
    return;
  }

  try {
    ElMessage.info(`正在打包下载：${folder.name}`);

    // TODO: 实现文件夹下载
    // 需要后端提供按文件夹ID打包下载的API
    ElMessage.warning("文件夹单独下载功能开发中，请使用「下载全部」功能");
  } catch (err: any) {
    console.error("下载文件夹失败:", err);
    ElMessage.error(err.message || "下载失败，请稍后重试");
  }
};

// 使用浏览器原生下载（支持客户端直连下载，可在浏览器下载管理器中看到进度）
const downloadFileWithProgress = async (
  fileId: string,
  fileName: string
): Promise<void> => {
  try {
    // 首先获取下载信息
    const downloadInfoUrl = accessSign.value
      ? `/api/files/share/${shareId.value}/download-url/${fileId}?sign=${encodeURIComponent(accessSign.value)}`
      : `/api/files/share/${shareId.value}/download-url/${fileId}`;

    const response = await fetch(downloadInfoUrl);
    if (!response.ok) {
      throw new Error(`获取下载地址失败: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.code !== 200 || !result.data) {
      throw new Error(result.message || "获取下载地址失败");
    }

    const downloadInfo = result.data;
    const downloadUrl = downloadInfo.download_url;

    // 创建隐藏的 <a> 标签并触发下载
    // 这种方式让浏览器原生处理下载，可以在下载管理器中看到进度
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = downloadInfo.file_name || fileName; // 使用服务器返回的文件名
    link.style.display = "none";

    // 对于云存储的直连链接，不需要 target="_blank"
    // 对于本地存储的API链接，可能需要
    if (downloadInfo.type === "local") {
      link.target = "_blank";
    }

    document.body.appendChild(link);
    link.click();

    // 延迟移除，确保下载已开始
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error("下载文件失败:", error);
    throw error;
  }
};

// 下载选中的文件
const handleDownloadSelected = async () => {
  const selectedFiles = sortedFiles.value.filter(f =>
    selectedFileIds.value.has(f.id)
  );

  if (selectedFiles.length === 0) {
    ElMessage.warning("请先选择要下载的文件");
    return;
  }

  // 检查是否选中了文件夹
  const hasFolderSelected = selectedFiles.some(
    file => file.type === FileType.Dir
  );
  if (hasFolderSelected) {
    ElMessage.warning("不支持下载文件夹，请只选择文件");
    return;
  }

  // 检查下载权限
  if (!canDownload.value) {
    ElMessage.warning("无法下载：分享已过期或已达下载限制");
    return;
  }

  // 检查是否需要付费
  if (
    shareInfo.value?.payment_amount &&
    shareInfo.value.payment_amount > 0 &&
    !hasPurchased.value
  ) {
    ElMessage.warning(
      `此分享需要支付 ¥${shareInfo.value.payment_amount} 后才能下载`
    );
    handleShowPayment();
    return;
  }

  try {
    if (selectedFiles.length === 1) {
      // 单个文件直接下载
      ElMessage.info(`正在准备下载：${selectedFiles[0].name}`);
      await downloadFileWithProgress(
        selectedFiles[0].id,
        selectedFiles[0].name
      );
      ElMessage.success(`下载成功：${selectedFiles[0].name}`);

      // 更新下载计数
      if (shareInfo.value) {
        shareInfo.value.download_count =
          (shareInfo.value.download_count || 0) + 1;
      }

      // 清除选中状态
      selectedFileIds.value = new Set();
    } else {
      // 多个文件，逐个下载
      ElMessage.info(`开始下载 ${selectedFiles.length} 个文件，请稍候...`);

      let successCount = 0;
      let failCount = 0;

      // 逐个下载，避免并发过多
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          await downloadFileWithProgress(file.id, file.name);
          successCount++;
          // 每个文件下载后等待一段时间
          if (i < selectedFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`下载文件 ${file.name} 失败:`, error);
          failCount++;
        }
      }

      // 更新下载计数
      if (shareInfo.value) {
        shareInfo.value.download_count =
          (shareInfo.value.download_count || 0) + successCount;
      }

      // 显示结果
      if (failCount === 0) {
        ElMessage.success(`所有文件下载完成（${successCount}个）`);
      } else {
        ElMessage.warning(
          `下载完成：成功 ${successCount} 个，失败 ${failCount} 个`
        );
      }

      // 清除选中状态
      selectedFileIds.value = new Set();
    }
  } catch (err: any) {
    console.error("下载选中文件失败:", err);
    ElMessage.error(err.message || "下载失败，请稍后重试");
  }
};

const goHome = () => {
  router.push("/");
};

const goToLogin = () => {
  // 保存当前路径，登录后返回
  const currentPath = route.fullPath;
  router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
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

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// ===== 支付相关方法 =====

// 通过订单号验证购买状态
const verifyPurchaseByOrderNo = async (orderNo: string): Promise<boolean> => {
  try {
    const response = await getOrderStatus(orderNo);

    if (response.code === 200 && response.data) {
      const orderData = response.data;

      // 检查订单是否支付成功
      if (orderData.payment_status === "SUCCESS") {
        // 验证订单是否属于当前分享
        if (orderData.share_id === shareId.value || !orderData.share_id) {
          hasPurchased.value = true;
          console.log("订单验证成功，已恢复购买状态");
          return true;
        } else {
          console.warn("订单不属于当前分享，清除无效凭证");
          clearPurchaseFromLocal(shareId.value); // 清除无效凭证
        }
      } else {
        console.log("订单未支付或已取消，状态:", orderData.payment_status);
        clearPurchaseFromLocal(shareId.value); // 清除无效凭证
      }
    }
  } catch (error) {
    console.error("验证订单失败:", error);
  }

  return false;
};

// 显示订单找回对话框
const handleShowOrderRecovery = () => {
  orderRecoveryForm.value.order_no = "";
  orderRecoveryDialogVisible.value = true;
};

// 判断订单号类型：系统订单号 或 第三方交易号
const detectOrderNoType = (orderNo: string): "system" | "trade" => {
  // 系统订单号格式：ORDER20250111... (以 ORDER 开头)
  // 第三方交易号格式：2025101123001469101459518068 (纯数字，较长)
  if (orderNo.startsWith("ORDER")) {
    return "system";
  }
  return "trade";
};

// 处理订单找回
const handleOrderRecovery = async () => {
  const orderNo = orderRecoveryForm.value.order_no.trim();

  if (!orderNo) {
    ElMessage.warning("请输入订单号");
    return;
  }

  orderRecoveryLoading.value = true;

  try {
    // 自动识别订单号类型
    const orderType = detectOrderNoType(orderNo);
    let success = false;
    let systemOrderNo = orderNo;

    if (orderType === "trade") {
      console.log("检测到第三方交易号，使用 trade 接口查询:", orderNo);
      // 使用第三方交易号查询
      const response = await getOrderStatusByTradeNo(orderNo);
      if (response.code === 200 && response.data) {
        const orderData = response.data;
        systemOrderNo = orderData.order_no; // 获取系统订单号

        // 检查订单状态和归属
        if (orderData.payment_status === "SUCCESS") {
          if (orderData.share_id === shareId.value || !orderData.share_id) {
            hasPurchased.value = true;
            success = true;
            console.log("订单验证成功（交易号）:", systemOrderNo);
          } else {
            console.warn("订单不属于当前分享");
            ElMessage.error("该订单不属于当前分享内容");
          }
        } else {
          console.log("订单未支付，状态:", orderData.payment_status);
          ElMessage.error("订单未支付或已取消");
        }
      }
    } else {
      console.log("检测到系统订单号，使用 order 接口查询:", orderNo);
      // 使用系统订单号查询
      success = await verifyPurchaseByOrderNo(orderNo);
      systemOrderNo = orderNo;
    }

    if (success) {
      // 保存系统订单号到本地存储
      savePurchaseToLocal(shareId.value, systemOrderNo);
      ElMessage.success("订单验证成功！已恢复购买状态");
      orderRecoveryDialogVisible.value = false;
    } else if (orderType === "system") {
      // 只有系统订单号查询失败时才显示这个通用错误
      ElMessage.error("订单验证失败，请检查订单号是否正确或订单是否已支付");
    }
  } catch (error: any) {
    console.error("订单找回失败:", error);
    ElMessage.error(error.message || "订单找回失败，请检查订单号是否正确");
  } finally {
    orderRecoveryLoading.value = false;
  }
};

// 显示支付对话框
const handleShowPayment = async () => {
  if (!shareInfo.value || !shareInfo.value.payment_amount) {
    return;
  }

  try {
    // 先检查支付配置
    const configResponse = await getPaymentConfigDetails();

    if (configResponse.code !== 200) {
      ElMessage.error("无法获取支付配置，请稍后再试");
      return;
    }

    const paymentConfig = configResponse.data;
    const availableProviders = paymentConfig.available_providers || [];

    // 检查是否有可用的支付方式
    if (availableProviders.length === 0) {
      noPaymentMethodDialogVisible.value = true;
      return;
    }

    // 只有一种支付方式时，直接使用该方式
    if (availableProviders.length === 1) {
      const provider = availableProviders[0] as "ALIPAY" | "WECHAT";
      selectedPaymentProvider.value = provider;
      paymentConfirmDialogVisible.value = true;
      return;
    }

    // 两种支付方式都可用，让用户选择
    paymentStep.value = "select";
    paymentDialogVisible.value = true;
  } catch (error: any) {
    console.error("检查支付配置失败:", error);
    ElMessage.error("检查支付配置失败，请稍后再试");
  }
};

// 创建支付订单
const handleCreatePayment = async (provider: "ALIPAY" | "WECHAT") => {
  if (!shareInfo.value || !shareInfo.value.payment_amount) {
    return;
  }

  try {
    paymentLoading.value = true;
    paymentProvider.value = provider;
    selectedPaymentProvider.value = provider;

    const request: CreateShareOrderRequest = {
      share_id: shareId.value,
      amount: shareInfo.value.payment_amount,
      payment_provider: provider
    };

    const response = await createSharePaymentOrder(request);

    if (response.code === 200) {
      const orderData = response.data;
      currentOrderNo.value = orderData.order_no;

      // 根据支付方式处理二维码
      if (provider === "ALIPAY") {
        // 支付宝：后端返回的是当面付链接，前端生成二维码
        const paymentUrl = orderData.payment_result.qr_code || "";

        try {
          // 使用 qrcode 库生成二维码图片
          const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
            width: 200,
            margin: 1,
            color: {
              dark: "#000000",
              light: "#FFFFFF"
            }
          });
          paymentQrCode.value = qrCodeDataUrl;
        } catch (qrError) {
          console.error("生成支付宝二维码失败:", qrError);
          ElMessage.error("生成支付二维码失败");
          return;
        }
      } else {
        // 微信：后端返回的是Base64编码的二维码图片数据，需要加上data URL前缀
        const base64Data = orderData.payment_result.qr_code || "";
        paymentQrCode.value = base64Data
          ? `data:image/png;base64,${base64Data}`
          : "";
      }

      // 切换到二维码步骤
      paymentStep.value = "qrcode";

      // 开始轮询订单状态
      startPollingOrderStatus();
    } else {
      ElMessage.error(response.message || "创建订单失败");
    }
  } catch (error: any) {
    console.error("创建支付订单失败:", error);
    ElMessage.error(error.message || "创建订单失败");
  } finally {
    paymentLoading.value = false;
  }
};

// 处理确认支付方式
const handleConfirmPaymentMethod = () => {
  paymentConfirmDialogVisible.value = false;
  handleCreatePayment(selectedPaymentProvider.value);
};

// 处理选择支付方式
const handleSelectPaymentMethod = async (
  provider: "ALIPAY" | "WECHAT"
) => {
  // 如果正在加载中，禁止重复点击
  if (paymentLoading.value) return;

  selectedPaymentProvider.value = provider;
  await handleCreatePayment(provider);
};

// 处理已完成支付确认
const handleConfirmPaymentComplete = async () => {
  const success = await checkPaymentStatus();
  if (success) {
    paymentDialogVisible.value = false;
  } else {
    ElMessage.warning("未检测到支付，请完成支付后再确认");
  }
};

// 处理支付弹窗关闭
const handlePaymentDialogClose = () => {
  stopPollingOrderStatus();
  paymentDialogVisible.value = false;
  // 重置步骤到选择支付方式
  setTimeout(() => {
    paymentStep.value = "select";
    paymentQrCode.value = "";
    currentOrderNo.value = "";
  }, 300); // 等待关闭动画完成
};

// 开始轮询订单状态
const startPollingOrderStatus = () => {
  stopPollingOrderStatus(); // 先停止之前的轮询

  pollingTimer.value = window.setInterval(async () => {
    const success = await checkPaymentStatus();
    if (success) {
      stopPollingOrderStatus();
    }
  }, 2000); // 每2秒检查一次
};

// 停止轮询订单状态
const stopPollingOrderStatus = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value);
    pollingTimer.value = null;
  }
};

// 检查支付状态
const checkPaymentStatus = async (): Promise<boolean> => {
  if (!currentOrderNo.value) {
    return false;
  }

  try {
    const response = await getOrderStatus(currentOrderNo.value);

    if (response.code === 200) {
      const orderData = response.data;

      if (orderData.payment_status === "SUCCESS") {
        // 支付成功
        hasPurchased.value = true;

        // 保存购买凭证到本地存储
        savePurchaseToLocal(shareId.value, currentOrderNo.value);

        ElMessage.success("支付成功！现在可以下载文件了");

        // 关闭支付对话框
        paymentDialogVisible.value = false;
        // 重置步骤
        setTimeout(() => {
          paymentStep.value = "select";
        }, 300);

        return true;
      }
    }
  } catch (error) {
    console.error("检查支付状态失败:", error);
  }

  return false;
};

// 生命周期
onMounted(() => {
  loadShareInfo();
});

// 组件卸载时清理定时器
onUnmounted(() => {
  stopPollingOrderStatus();
});
</script>

<style lang="scss" scoped>
// 批量操作工具栏过渡动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// 支付方式选择弹窗样式
.payment-selection-content {
  .payment-amount {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    margin-bottom: 20px;
    border: var(--style-border);
    border-radius: 12px;

    .amount-label {
      font-size: 14px;
    }

    .amount-value {
      font-size: 28px;
      color: var(--anzhiyu-red);
      font-weight: 700;
    }
  }

  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .payment-method-card {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 20px;
    cursor: pointer;
    background: var(--anzhiyu-card-bg);
    border: 2px solid var(--anzhiyu-card-border);
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover:not(.loading) {
      border-color: var(--anzhiyu-theme);
      background: var(--anzhiyu-theme-op);
    }

    &.loading {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .method-icon {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;

      .icon {
        width: 28px;
        height: 28px;
        color: white;
      }

      &.alipay {
        background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
      }

      &.wechat {
        background: linear-gradient(135deg, #00c250 0%, #00a542 100%);
      }
    }

    .method-info {
      flex: 1;

      h4 {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 600;
        color: var(--anzhiyu-fontcolor);
      }

      p {
        margin: 0;
        font-size: 13px;
        color: var(--anzhiyu-secondtext);
      }
    }

    .arrow-icon {
      flex-shrink: 0;
      font-size: 20px;
      color: var(--anzhiyu-secondtext);
      transition: transform 0.3s ease;
    }

    .loading-icon {
      flex-shrink: 0;
      color: var(--anzhiyu-theme);
      animation: rotating 1s linear infinite;
    }

    &:hover:not(.loading) .arrow-icon {
      transform: translateX(4px);
      color: var(--anzhiyu-theme);
    }
  }
}

// 二维码内容区
.payment-qrcode-content {
  padding: 20px 0;
}

// 订单找回内容区
.order-recovery-content {
  :deep(.el-alert) {
    border-radius: 8px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--anzhiyu-fontcolor);
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }

  ul {
    margin-top: 8px;

    li {
      margin-bottom: 4px;
    }
  }
}

// 旋转动画
@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.share-page {
  padding: 40px 20px;
  background: var(--anzhiyu-background);
}

// 加载中状态
.share-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--anzhiyu-theme-op, rgb(79 107 246 / 20%));
    border-top-color: var(--anzhiyu-theme);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

// 密码验证表单
.share-password-form {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;

  .password-card {
    width: 100%;
    max-width: 450px;
    padding: 40px;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border);
    border-radius: 8px;
    box-shadow: 0 4px 16px var(--anzhiyu-shadow);
  }
}

// 错误状态
.share-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;

  .error-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
    text-align: center;
  }
}

// 分享内容
.share-content {
  max-width: 1200px;
  margin: 0 auto;
}

// 分享信息头部
.share-header {
  padding: 10px 20px;
  margin-bottom: 24px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 8px;

  .share-title {
    margin-bottom: 12px;
    font-size: 28px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .share-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    color: var(--anzhiyu-secondtext);

    .meta-item {
      display: flex;
      gap: 6px;
      align-items: center;
      font-size: 14px;

      .el-icon {
        font-size: 16px;
      }
    }
  }
}

// README 区域
.readme-section {
  padding: 24px;
  margin-bottom: 24px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 8px;

  .readme-header {
    padding-bottom: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--anzhiyu-card-border);

    .readme-title {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 18px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }
  }

  .readme-content {
    line-height: 1.8;
    color: var(--anzhiyu-fontcolor);
  }
}

// 文件浏览器区域
.file-browser-section {
  position: relative;
  padding: 24px;
  margin-bottom: 24px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 8px;

  .file-browser-main {
    height: calc(100vh - 500px); // 动态计算高度，适应不同屏幕
    min-height: 400px; // 最小高度保证可用性
    max-height: 800px; // 最大高度避免过高
    background: var(--anzhiyu-secondbg);
  }

  // 批量操作工具栏
  .batch-action-bar {
    position: absolute;
    right: 24px;
    bottom: 24px;
    left: 24px;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: var(--anzhiyu-white);
    border: 1px solid var(--anzhiyu-theme);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

    .batch-info {
      display: flex;
      gap: 16px;
      align-items: center;

      .selected-count {
        font-size: 14px;
        font-weight: 500;
        color: var(--anzhiyu-fontcolor);
      }
    }

    .batch-actions {
      display: flex;
      gap: 12px;
    }
  }
}

// 文件列表区域
.files-section {
  padding: 24px;
  margin-bottom: 24px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 8px;

  .files-header {
    padding-bottom: 12px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--anzhiyu-card-border);

    .files-title {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 18px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }
  }

  .files-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: var(--anzhiyu-secondbg);
    border: 1px solid var(--anzhiyu-card-border);
    border-radius: 12px;
    transition: all 0.2s;

    &:hover {
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 2px 8px var(--anzhiyu-theme-op);
    }

    .file-info {
      display: flex;
      flex: 1;
      gap: 12px;
      align-items: center;

      .file-icon {
        color: var(--anzhiyu-theme);
      }

      .file-details {
        flex: 1;
        min-width: 0;

        .file-name {
          margin-bottom: 4px;
          overflow: hidden;
          font-size: 15px;
          font-weight: 500;
          color: var(--anzhiyu-fontcolor);
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-meta {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: var(--anzhiyu-secondtext);
        }
      }
    }
  }

  .files-footer {
    padding-top: 20px;
    margin-top: 20px;
    text-align: center;
    border-top: 1px solid var(--anzhiyu-card-border);
  }
}

// 付费提示
.payment-notice {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 40px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(250, 250, 250, 0.95) 100%
  );
  border: var(--style-border);
  border-radius: 8px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  // 添加微妙的纹理效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(0, 0, 0, 0.01) 10px,
      rgba(0, 0, 0, 0.01) 20px
    );
    pointer-events: none;
  }

  .payment-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 16px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
  }

  .payment-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    z-index: 1;
  }

  .payment-title {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }

  .payment-desc {
    font-size: 15px;
    opacity: 0.6;
    line-height: 1.6;
    font-weight: 400;
  }

  .payment-amount {
    margin-top: 6px;
    font-size: 16px;
    font-weight: 600;
    color: var(--anzhiyu-red);
    display: flex;
    align-items: baseline;
    gap: 2px;

    .amount-number {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--anzhiyu-red);
    }
  }

  .payment-action {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    position: relative;
    z-index: 1;
  }

  .payment-btn {
    min-width: 140px;
    height: 50px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 10px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(135deg, #000 0%, #333 100%);
    border-color: #000;
    letter-spacing: 0.02em;

    &:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      background: linear-gradient(135deg, #1a1a1a 0%, #404040 100%);
    }

    &:active {
      transform: translateY(0) scale(0.98);
    }
  }

  // 响应式布局
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 32px 24px;
    gap: 20px;

    .payment-icon {
      width: 64px;
      height: 64px;
    }

    .payment-content {
      align-items: center;
    }

    .payment-amount {
      justify-content: center;
    }

    .payment-action {
      width: 100%;

      .payment-btn {
        width: 100%;
      }
    }
  }

  // 暗色模式
  @media (prefers-color-scheme: dark) {
    background: linear-gradient(
      135deg,
      rgba(30, 30, 30, 0.95) 0%,
      rgba(20, 20, 20, 0.95) 100%
    );
    border-color: rgba(255, 255, 255, 0.1);

    &::before {
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(255, 255, 255, 0.02) 10px,
        rgba(255, 255, 255, 0.02) 20px
      );
    }

    &:hover {
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
    }

    .payment-amount {
      color: var(--anzhiyu-red);

      .amount-number {
        color: var(--anzhiyu-red);
      }
    }

    .payment-btn {
      background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
      color: #000;
      border-color: #fff;

      &:hover {
        background: linear-gradient(135deg, #f5f5f5 0%, #d0d0d0 100%);
        box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
      }
    }
  }
}

// 未支付状态
.payment-notice-unpaid {
  .payment-icon {
    background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
    color: #1a1a1a;
    border: var(--style-border);

    &:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    }
  }

  .payment-title {
    color: #000;
  }

  .payment-desc {
    color: #1a1a1a;
  }

  // 暗色模式
  @media (prefers-color-scheme: dark) {
    .payment-icon {
      background: linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%);
      color: #fff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);

      &:hover {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      }
    }

    .payment-title {
      color: #fff;
    }

    .payment-desc {
      color: #fff;
    }
  }
}

// 已支付状态
.payment-notice-paid {
  border: var(--style-border);
  margin-bottom: 1rem;
  padding: 16px 20px; // 减小 padding
  gap: 12px; // 减小间距

  .payment-icon {
    width: 40px; // 减小图标尺寸
    height: 40px;
    background: var(--anzhiyu-green);
    color: #fff;
  }

  .payment-content {
    gap: 2px; // 减小内容间距
  }

  .payment-title {
    font-size: 15px; // 减小标题字体
    color: #000;
    font-weight: 600;
  }

  .payment-desc {
    font-size: 13px; // 减小描述字体
    color: #1a1a1a;
    opacity: 0.7;
  }

  // 暗色模式适配
  @media (prefers-color-scheme: dark) {
    background: linear-gradient(135deg, #252525 0%, #1a1a1a 100%);
    border-color: rgba(255, 255, 255, 0.15);

    &::after {
      background: radial-gradient(
        circle at center,
        rgba(255, 255, 255, 0.05) 0%,
        transparent 70%
      );
    }

    .payment-icon {
      background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
      color: #000;
      box-shadow: 0 6px 20px rgba(255, 255, 255, 0.1);

      &:hover {
        box-shadow: 0 8px 24px rgba(255, 255, 255, 0.15);
      }
    }

    .payment-title {
      color: #fff;
    }

    .payment-desc {
      color: #fff;
      opacity: 0.7;
    }

    &:hover {
      background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
    }
  }
}

// 响应式
@media (width <= 768px) {
  .share-page {
    padding: 20px 16px;
  }

  .share-header {
    padding: 10px;

    .share-title {
      font-size: 22px;
    }

    .share-meta {
      flex-direction: column;
      gap: 8px;
    }
  }

  .password-card {
    padding: 30px 24px !important;
  }

  .file-item {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start !important;

    .file-actions {
      width: 100%;

      .el-button {
        width: 100%;
      }
    }
  }

  .payment-selection-content {
    .payment-amount {
      padding: 16px;

      .amount-value {
        font-size: 24px;
      }
    }

    .payment-method-card {
      padding: 16px;

      .method-icon {
        width: 40px;
        height: 40px;

        .icon {
          width: 24px;
          height: 24px;
        }
      }
    }
  }
}
</style>
