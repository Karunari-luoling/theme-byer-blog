<template>
  <AnDialog
    v-model="visible"
    title="订单找回"
    width="480px"
    :close-on-click-modal="false"
    hide-footer
    class="order-recovery-dialog-wrapper"
  >
    <div class="order-recovery-dialog">
      <!-- 搜索表单 -->
      <div v-if="!recoveredOrder" class="search-section">
        <div class="search-tips">
          <el-icon><InfoFilled /></el-icon>
          <span>
            请输入支付成功后收到的第三方交易号（如支付宝/微信账单中的订单号）和购买时填写的邮箱，即可找回您的订单。
          </span>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="formRules"
          label-position="top"
          class="recovery-form"
        >
          <el-form-item label="第三方交易号" prop="tradeNo">
            <el-input
              v-model="form.tradeNo"
              placeholder="请输入支付宝/微信交易号"
              size="large"
              clearable
            />
          </el-form-item>
          <el-form-item label="邮箱地址" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入购买时填写的邮箱"
              type="email"
              size="large"
              clearable
            />
          </el-form-item>
        </el-form>

        <div class="form-actions">
          <el-button size="large" @click="handleClose">取消</el-button>
          <el-button
            type="primary"
            size="large"
            :loading="searching"
            @click="handleSearch"
          >
            查询订单
          </el-button>
        </div>
      </div>

      <!-- 订单结果 -->
      <div v-else class="result-section">
        <div class="order-card" :class="{ paid: isPaid }">
          <div class="order-header">
            <div class="status-badge" :class="statusClass">
              <el-icon v-if="isPaid"><CircleCheck /></el-icon>
              <el-icon v-else><Clock /></el-icon>
              <span>{{ statusText }}</span>
            </div>
          </div>

          <div class="order-info">
            <div class="info-row">
              <span class="label">商品名称</span>
              <span class="value">{{ recoveredOrder.product_title }}</span>
            </div>
            <div class="info-row">
              <span class="label">规格</span>
              <span class="value">{{ recoveredOrder.variant_name }}</span>
            </div>
            <div class="info-row">
              <span class="label">订单号</span>
              <span class="value mono">{{ recoveredOrder.order_no }}</span>
            </div>
            <div class="info-row">
              <span class="label">交易号</span>
              <span class="value mono">{{ recoveredOrder.trade_no }}</span>
            </div>
            <div class="info-row">
              <span class="label">金额</span>
              <span class="value price">
                ¥{{ (recoveredOrder.amount / 100).toFixed(2) }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">下单时间</span>
              <span class="value">{{ recoveredOrder.created_at }}</span>
            </div>
            <div v-if="recoveredOrder.paid_at" class="info-row">
              <span class="label">支付时间</span>
              <span class="value">{{ recoveredOrder.paid_at }}</span>
            </div>
          </div>

          <!-- 发货内容 -->
          <div
            v-if="isPaid && recoveredOrder.delivery_content"
            class="delivery-section"
          >
            <h4>
              <el-icon><Goods /></el-icon>
              发货内容
            </h4>
            <div class="delivery-content">
              <pre>{{ recoveredOrder.delivery_content }}</pre>
              <el-button
                type="primary"
                size="small"
                :icon="CopyDocument"
                @click="handleCopyContent"
              >
                复制内容
              </el-button>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <el-button size="large" @click="handleSearchAnother">
            查询其他订单
          </el-button>
          <el-button v-if="isPaid" size="default" @click="handleOpenSupport">
            <el-icon><Headset /></el-icon>
            联系客服
          </el-button>
          <el-button type="primary" size="large" @click="handleClose">
            完成
          </el-button>
        </div>
      </div>
    </div>
  </AnDialog>

  <!-- 售后支持对话框 -->
  <SupportChatDialog
    v-model="showSupportDialog"
    :order-no="form.tradeNo"
    :user-email="form.email"
  />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  InfoFilled,
  CircleCheck,
  Clock,
  Goods,
  CopyDocument,
  Headset
} from "@element-plus/icons-vue";
import AnDialog from "@/components/AnDialog/index.vue";
import SupportChatDialog from "@/components/SupportChatDialog/index.vue";
import {
  recoverProductOrderApi,
  type RecoverOrderResponse
} from "@/api/product";

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 表单
const formRef = ref<FormInstance>();
const form = ref({
  tradeNo: "",
  email: ""
});

const formRules: FormRules = {
  tradeNo: [{ required: true, message: "请输入第三方交易号", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    {
      type: "email",
      message: "请输入正确的邮箱格式",
      trigger: ["blur", "change"]
    }
  ]
};

// 状态
const searching = ref(false);
const recoveredOrder = ref<RecoverOrderResponse | null>(null);
const showSupportDialog = ref(false);

// 计算属性
const isPaid = computed(() => {
  return recoveredOrder.value?.payment_status === "SUCCESS";
});

const statusClass = computed(() => {
  const status = recoveredOrder.value?.payment_status;
  if (status === "SUCCESS") return "success";
  if (status === "PENDING") return "pending";
  if (status === "EXPIRED") return "expired";
  return "unknown";
});

const statusText = computed(() => {
  const status = recoveredOrder.value?.payment_status;
  if (status === "SUCCESS") return "支付成功";
  if (status === "PENDING") return "待支付";
  if (status === "EXPIRED") return "已过期";
  return "未知状态";
});

// 查询订单
const handleSearch = async () => {
  if (!formRef.value) return;

  try {
    const isValid = await formRef.value.validate();
    if (!isValid) return;
  } catch {
    return;
  }

  searching.value = true;
  try {
    const res = await recoverProductOrderApi({
      trade_no: form.value.tradeNo.trim(),
      email: form.value.email.trim()
    });

    if (res.code === 200 && res.data) {
      recoveredOrder.value = res.data;
      ElMessage.success("订单找回成功");
    } else {
      ElMessage.error(res.message || "订单查询失败");
    }
  } catch (error: any) {
    console.error("订单查询失败:", error);
    ElMessage.error(
      error.response?.data?.message || "订单查询失败，请检查信息是否正确"
    );
  } finally {
    searching.value = false;
  }
};

// 复制发货内容
const handleCopyContent = async () => {
  if (!recoveredOrder.value?.delivery_content) return;

  try {
    await navigator.clipboard.writeText(recoveredOrder.value.delivery_content);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败，请手动复制");
  }
};

// 查询其他订单
const handleSearchAnother = () => {
  recoveredOrder.value = null;
  form.value = { tradeNo: "", email: "" };
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

// 关闭
const handleClose = () => {
  visible.value = false;
  // 延迟重置，避免关闭动画中看到状态变化
  setTimeout(() => {
    recoveredOrder.value = null;
    form.value = { tradeNo: "", email: "" };
    if (formRef.value) {
      formRef.value.clearValidate();
    }
  }, 300);
};

// 打开售后支持
const handleOpenSupport = () => {
  showSupportDialog.value = true;
};
</script>

<style lang="scss" scoped>
.order-recovery-dialog {
  .search-section {
    .search-tips {
      display: flex;
      gap: 10px;
      padding: 14px 16px;
      margin-bottom: 24px;
      font-size: 13px;
      line-height: 1.6;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-light);
      border-radius: 10px;

      .el-icon {
        flex-shrink: 0;
        margin-top: 2px;
        font-size: 16px;
        color: var(--el-color-primary);
      }
    }

    .recovery-form {
      :deep(.el-form-item__label) {
        font-weight: 500;
      }
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 16px;
      margin-top: 8px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }

  .result-section {
    .order-card {
      padding: 20px;
      background: var(--el-fill-color-light);
      border-radius: 12px;
      border: 1px solid var(--el-border-color-lighter);

      &.paid {
        border-color: var(--el-color-success-light-5);
        background: var(--el-color-success-light-9);
      }

      .order-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 16px;

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 20px;

          &.success {
            color: var(--el-color-success);
            background: var(--el-color-success-light-8);
          }

          &.pending {
            color: var(--el-color-warning);
            background: var(--el-color-warning-light-8);
          }

          &.expired {
            color: var(--el-text-color-secondary);
            background: var(--el-fill-color);
          }
        }
      }

      .order-info {
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px dashed var(--el-border-color-lighter);

          &:last-child {
            border-bottom: none;
          }

          .label {
            font-size: 13px;
            color: var(--el-text-color-secondary);
          }

          .value {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-primary);
            max-width: 60%;
            text-align: right;
            word-break: break-all;

            &.mono {
              font-family: "SF Mono", Monaco, Consolas, monospace;
              font-size: 12px;
            }

            &.price {
              color: var(--anzhiyu-red);
              font-size: 16px;
              font-weight: 600;
            }
          }
        }
      }

      .delivery-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--el-border-color);

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          font-size: 15px;
          font-weight: 600;
          color: var(--el-text-color-primary);

          .el-icon {
            color: var(--el-color-success);
          }
        }

        .delivery-content {
          padding: 16px;
          background: var(--anzhiyu-card-bg);
          border-radius: 8px;
          border: 1px solid var(--el-border-color-lighter);

          pre {
            margin: 0 0 12px;
            font-family: "SF Mono", Monaco, Consolas, monospace;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-all;
            color: var(--el-text-color-primary);
          }
        }
      }
    }

    .result-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 20px;
      margin-top: 20px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
}
</style>
