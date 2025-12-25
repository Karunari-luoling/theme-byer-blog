<!--
 * @Description: 订单详情弹窗组件
 * @Author: 安知鱼
-->
<template>
  <AnDialog
    v-model="dialogVisible"
    title="订单详情"
    width="680px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="order" class="order-detail">
      <!-- 订单状态头部 -->
      <div class="order-header">
        <div class="order-status">
          <el-tag :type="getStatusTagType(order.payment_status)" size="large">
            {{ getStatusText(order.payment_status) }}
          </el-tag>
          <span class="order-amount">￥{{ formatAmount(order.amount) }}</span>
        </div>
        <div class="order-no">
          <span class="label">订单号：</span>
          <span class="value">{{ order.order_no }}</span>
          <el-button link type="primary" size="small" @click="copyOrderNo">
            复制
          </el-button>
        </div>
      </div>

      <!-- 订单信息 -->
      <el-descriptions :column="2" border class="order-info">
        <el-descriptions-item label="订单类型">
          <el-tag
            :type="getOrderTypeTagType(order)"
            size="small"
            effect="light"
          >
            {{ getOrderTypeText(order) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">
          <el-tag
            :type="getProviderTagType(order.payment_provider)"
            size="small"
            effect="light"
          >
            {{ getProviderText(order.payment_provider) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="order.article_id" label="文章ID">
          <el-link type="primary" :underline="false">
            {{ order.article_id }}
          </el-link>
        </el-descriptions-item>
        <el-descriptions-item v-if="order.share_id" label="分享ID">
          <el-link type="primary" :underline="false">
            {{ order.share_id }}
          </el-link>
        </el-descriptions-item>
        <el-descriptions-item label="用户ID">
          {{ order.user_id || "匿名用户" }}
        </el-descriptions-item>
        <el-descriptions-item label="用户邮箱">
          {{ order.user_email || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="第三方交易号" :span="2">
          <div class="trade-no">
            {{ order.trade_no || "-" }}
            <el-button
              v-if="order.trade_no"
              link
              type="primary"
              size="small"
              @click="copyTradeNo"
            >
              复制
            </el-button>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDateTime(order.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">
          <span
            :class="{
              'text-success': order.pay_time,
              'text-muted': !order.pay_time
            }"
          >
            {{ order.pay_time ? formatDateTime(order.pay_time) : "未支付" }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="过期时间">
          {{ formatDateTime(order.expire_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="客户端IP">
          {{ order.client_ip || "-" }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 用户代理信息 -->
      <el-descriptions :column="1" border class="order-ua">
        <el-descriptions-item label="用户代理">
          <div class="ua-content">
            {{ order.user_agent || "-" }}
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="danger" :icon="Delete" @click="handleDelete">
        删除订单
      </el-button>
    </template>
  </AnDialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Delete } from "@element-plus/icons-vue";
import dayjs from "dayjs";
import { message } from "@/utils/message";
import type { AdminOrderInfo } from "@/api/payment";
import AnDialog from "@/components/AnDialog/index.vue";

// Props
const props = defineProps<{
  modelValue: boolean;
  order: AdminOrderInfo | null;
}>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  close: [];
  delete: [order: AdminOrderInfo];
}>();

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit("update:modelValue", val)
});

// 状态标签类型
type TagType = "success" | "warning" | "info" | "danger" | "primary";

// 获取状态标签类型
const getStatusTagType = (status: string): TagType => {
  const statusMap: Record<string, TagType> = {
    PENDING: "warning",
    SUCCESS: "success",
    FAILED: "danger",
    CANCELLED: "info",
    EXPIRED: "danger"
  };
  return statusMap[status] || "info";
};

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: "待支付",
    SUCCESS: "支付成功",
    FAILED: "支付失败",
    CANCELLED: "已取消",
    EXPIRED: "已过期"
  };
  return statusMap[status] || status;
};

// 获取支付方式标签类型
const getProviderTagType = (provider: string): TagType => {
  return provider === "ALIPAY" ? "success" : "primary";
};

// 获取支付方式文本
const getProviderText = (provider: string): string => {
  const providerMap: Record<string, string> = {
    ALIPAY: "支付宝",
    WECHAT: "微信支付",
    EPAY: "易支付",
    HUPIJIAO: "虎皮椒V3"
  };
  return providerMap[provider] || provider;
};

// 获取订单类型标签类型
const getOrderTypeTagType = (order: AdminOrderInfo): TagType => {
  if (order.share_id) return "primary";
  if (order.article_id) return "success";
  return "info";
};

// 获取订单类型文本
const getOrderTypeText = (order: AdminOrderInfo): string => {
  if (order.share_id) return "分享购买";
  if (order.article_id) return "文章购买";
  return "未知类型";
};

// 格式化金额
const formatAmount = (amount: number): string => {
  return Number(amount).toFixed(2);
};

// 格式化日期时间
const formatDateTime = (dateTime: string): string => {
  if (!dateTime) return "-";
  return dayjs(dateTime).format("YYYY-MM-DD HH:mm:ss");
};

// 复制订单号
const copyOrderNo = () => {
  if (props.order) {
    navigator.clipboard.writeText(props.order.order_no);
    message("订单号已复制", { type: "success" });
  }
};

// 复制交易号
const copyTradeNo = () => {
  if (props.order?.trade_no) {
    navigator.clipboard.writeText(props.order.trade_no);
    message("交易号已复制", { type: "success" });
  }
};

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false;
  emit("close");
};

// 删除订单
const handleDelete = () => {
  if (props.order) {
    emit("delete", props.order);
  }
};
</script>

<style lang="scss" scoped>
.order-detail {
  .order-header {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    margin-bottom: 16px;
    background: var(--anzhiyu-secondbg);
    border-radius: 12px;

    .order-status {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .order-amount {
        font-size: 28px;
        font-weight: 700;
        color: var(--anzhiyu-red);
      }
    }

    .order-no {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;

      .label {
        color: var(--anzhiyu-secondtext);
      }

      .value {
        font-family: monospace;
        color: var(--anzhiyu-fontcolor);
      }
    }
  }

  .order-info {
    margin-bottom: 16px;

    :deep(.el-descriptions__body) {
      .el-descriptions__table {
        .el-descriptions__cell {
          padding: 10px 14px;
        }
      }
    }

    .trade-no {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: monospace;
      word-break: break-all;
    }
  }

  .order-ua {
    :deep(.el-descriptions__body) {
      .el-descriptions__table {
        .el-descriptions__cell {
          padding: 10px 14px;
        }
      }
    }

    .ua-content {
      font-size: 12px;
      color: var(--anzhiyu-secondtext);
      word-break: break-all;
      line-height: 1.6;
    }
  }

  .text-success {
    color: var(--anzhiyu-green);
    font-weight: 500;
  }

  .text-muted {
    color: var(--anzhiyu-secondtext);
    opacity: 0.7;
  }
}
</style>
