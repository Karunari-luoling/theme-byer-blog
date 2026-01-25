<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import type { Product, ProductVariant } from "@/api/product";
import ProductPaymentDialog from "@/components/ProductPaymentDialog/index.vue";
import OrderRecoveryDialog from "@/components/OrderRecoveryDialog/index.vue";
import SupportChatDialog from "@/components/SupportChatDialog/index.vue";
import { getPaymentStatus } from "@/api/payment";

interface Props {
  product: Product;
  selectedVariant: ProductVariant | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [variant: ProductVariant];
}>();

const showPaymentDialog = ref(false);
const showRecoveryDialog = ref(false);
const showSupportDialog = ref(false);
const availableProviders = ref<string[]>([]);
const currentSupportOrderNo = ref("");
const currentSupportEmail = ref("");

// 获取支付方式状态
const loadPaymentStatus = async () => {
  try {
    const response = await getPaymentStatus();
    if (response.code === 200 && response.data?.available_providers) {
      availableProviders.value = response.data.available_providers;
    } else {
      availableProviders.value = [];
    }
  } catch (error) {
    console.error("获取支付配置失败:", error);
    availableProviders.value = [];
  }
};

// 组件挂载时加载支付方式
onMounted(() => {
  loadPaymentStatus();
});

const formatPrice = (cents: number) => {
  return (cents / 100).toFixed(2);
};

const currentPrice = computed(() => {
  return props.selectedVariant
    ? formatPrice(props.selectedVariant.price)
    : "0.00";
});

// 检查库存是否充足
const isStockAvailable = computed(() => {
  if (!props.selectedVariant) return false;

  // 固定内容商品（FIXED_REPLY）库存无限，始终可用
  if (props.selectedVariant.delivery_method === "FIXED_REPLY") {
    return true;
  }

  // 卡密库商品（STOCK_ITEM）需要检查库存
  if (props.selectedVariant.delivery_method === "STOCK_ITEM") {
    if (props.selectedVariant.stock_count === undefined) return true; // 未设置库存视为有库存
    return props.selectedVariant.stock_count > 0;
  }

  // 其他情况默认有库存
  return true;
});

// 库存状态文本
const stockStatusText = computed(() => {
  if (!props.selectedVariant) return "";

  // 固定内容商品不显示库存状态
  if (props.selectedVariant.delivery_method === "FIXED_REPLY") {
    return "";
  }

  // 卡密库商品才显示库存状态
  if (props.selectedVariant.delivery_method === "STOCK_ITEM") {
    if (props.selectedVariant.stock_count === undefined) return "";
    if (props.selectedVariant.stock_count === 0) return "库存不足";
    if (props.selectedVariant.stock_count < 10) return "库存紧张";
  }

  return "";
});

// 是否可以购买
const canBuy = computed(() => {
  return (
    props.selectedVariant &&
    isStockAvailable.value &&
    availableProviders.value.length > 0
  );
});

// 购买按钮点击 - 打开支付弹窗
const handleBuy = () => {
  if (!props.selectedVariant) {
    ElMessage.warning("请选择商品规格");
    return;
  }

  if (!isStockAvailable.value) {
    ElMessage.warning("当前库存不足");
    return;
  }

  if (availableProviders.value.length === 0) {
    ElMessage.warning("暂无可用的支付方式，请联系管理员配置");
    return;
  }

  // 打开支付弹窗
  showPaymentDialog.value = true;
};

// 支付成功
const handlePaymentSuccess = () => {
  // 支付弹窗保持打开，让用户可以看到成功页面和联系客服入口
  ElMessage.success("支付成功！发货信息已发送到您的邮箱。");
};

// 打开售后支持（从支付成功页面）
const handleOpenSupport = (orderNo: string, userEmail: string) => {
  currentSupportOrderNo.value = orderNo;
  currentSupportEmail.value = userEmail;
  showPaymentDialog.value = false;
  showSupportDialog.value = true;
};

// 打开售后支持（从入口链接）
const handleOpenSupportLink = () => {
  // 如果没有订单号，让用户输入
  if (!currentSupportOrderNo.value) {
    // 打开订单找回弹窗，用户可以从那里输入订单号
    showRecoveryDialog.value = true;
  } else {
    showSupportDialog.value = true;
  }
};
</script>

<template>
  <div class="product-variants">
    <!-- 规格选择 -->
    <div class="variant-section">
      <h3 class="card-label">选择规格</h3>
      <div class="variant-list">
        <div
          v-for="variant in product.variants"
          :key="variant.id"
          class="variant-item"
          :class="{
            active: selectedVariant?.id === variant.id,
            'is-out-of-stock':
              variant.delivery_method === 'STOCK_ITEM' &&
              variant.stock_count !== undefined &&
              variant.stock_count === 0
          }"
          @click="emit('select', variant)"
        >
          <div class="variant-row-top">
            <span class="variant-name">{{ variant.name }}</span>
            <span class="variant-price">¥{{ formatPrice(variant.price) }}</span>
          </div>
          <div
            v-if="
              variant.delivery_method === 'STOCK_ITEM' &&
              variant.stock_count !== undefined &&
              variant.stock_count === 0
            "
            class="variant-row-bottom"
          >
            <span class="stock-label">库存不足</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 应付金额 -->
    <div class="price-display">
      <span class="price-label">应付金额</span>
      <div class="price-value">
        <span class="currency">¥</span>
        <span class="amount">{{ currentPrice }}</span>
      </div>
    </div>

    <div class="divider" />

    <!-- 购买按钮 -->
    <button class="buy-button" :disabled="!canBuy" @click="handleBuy">
      <span>立即购买</span>
    </button>

    <!-- 库存警告 -->
    <div v-if="selectedVariant && !isStockAvailable" class="stock-warning">
      当前库存不足，补货中
    </div>

    <!-- 支付方式提示 -->
    <div v-if="availableProviders.length === 0" class="no-payment-warning">
      暂无可用的支付方式
    </div>

    <!-- 安全提示 -->
    <div class="security-tips">
      <el-icon><Lock /></el-icon>
      <span>SSL 安全支付加密</span>
    </div>

    <!-- 订单找回入口 -->
    <div class="order-recovery-link">
      <span>已支付但未收到？</span>
      <a href="#recover-order" @click.prevent="showRecoveryDialog = true">
        找回订单
      </a>
    </div>

    <!-- 售后支持入口 -->
    <div class="support-link">
      <span>售后问题？</span>
      <a href="#support" @click.prevent="handleOpenSupportLink">
        <el-icon><Headset /></el-icon>
        联系客服
      </a>
    </div>

    <!-- 支付对话框 -->
    <ProductPaymentDialog
      v-if="selectedVariant"
      v-model="showPaymentDialog"
      :variant-id="selectedVariant.id"
      :product-title="product.title"
      :variant-name="selectedVariant.name"
      :price="selectedVariant.price"
      :available-providers="availableProviders"
      success-message="购买成功！发货信息已发送至您的邮箱"
      @success="handlePaymentSuccess"
      @open-support="handleOpenSupport"
    />

    <!-- 订单找回对话框 -->
    <OrderRecoveryDialog v-model="showRecoveryDialog" />

    <!-- 售后支持对话框 -->
    <SupportChatDialog
      v-model="showSupportDialog"
      :order-no="currentSupportOrderNo"
      :user-email="currentSupportEmail"
    />
  </div>
</template>

<script lang="ts">
import { Lock, Headset } from "@element-plus/icons-vue";
export default {
  components: { Lock, Headset }
};
</script>

<style lang="scss" scoped>
.product-variants {
  .card-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
    margin: 0 0 12px 0;
  }

  .variant-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 24px;
  }

  .variant-item {
    border: 2px solid var(--anzhiyu-border-color);
    border-radius: 12px;
    padding: 12px 16px;
    transition: all 0.2s ease;
    position: relative;
    cursor: pointer;
    background: var(--anzhiyu-card-bg);

    &:hover:not(.is-out-of-stock) {
      border-color: var(--anzhiyu-theme);
    }

    &.active {
      border-color: var(--anzhiyu-theme);
      background: var(--el-fill-color-extra-light);
    }

    &.active.is-out-of-stock {
      border-color: var(--anzhiyu-border-color);
      background-color: var(--el-fill-color-lighter);
      opacity: 0.8;
      cursor: not-allowed;
    }

    &.is-out-of-stock:not(.active) {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .variant-row-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .variant-name {
      font-weight: 500;
      color: var(--anzhiyu-fontcolor);
      font-size: 14px;
    }

    .variant-price {
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
      font-size: 14px;
    }

    .variant-row-bottom {
      margin-top: 4px;
    }

    .stock-label {
      font-size: 12px;
      color: var(--anzhiyu-red);
      font-weight: 500;
    }
  }

  .price-display {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 20px;
  }

  .price-label {
    font-size: 14px;
    color: var(--anzhiyu-secondtext);
    padding-bottom: 4px;
  }

  .price-value {
    color: var(--anzhiyu-red);
    font-weight: 700;
    line-height: 1;
    display: flex;
    align-items: baseline;

    .currency {
      font-size: 18px;
      margin-right: 2px;
    }

    .amount {
      font-size: 32px;
    }
  }

  .divider {
    height: 1px;
    background: var(--anzhiyu-border-color);
    margin: 0 -24px 24px -24px;
  }

  .buy-button {
    width: 100%;
    padding: 14px;
    background: var(--anzhiyu-theme);
    color: var(--anzhiyu-white);
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    &:disabled {
      background: var(--el-disabled-bg-color);
      color: var(--el-disabled-text-color);
      cursor: not-allowed;
      transform: none;
    }
  }

  .stock-warning {
    text-align: center;
    color: var(--anzhiyu-red);
    font-size: 13px;
    margin-top: 12px;
    font-weight: 500;
  }

  .no-payment-warning {
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    margin-top: 12px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  .security-tips {
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    color: var(--anzhiyu-secondtext);

    .el-icon {
      font-size: 14px;
    }
  }

  .order-recovery-link {
    margin-top: 12px;
    text-align: center;
    font-size: 12px;
    color: var(--anzhiyu-secondtext);

    a {
      color: var(--anzhiyu-theme);
      margin-left: 4px;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .support-link {
    margin-top: 8px;
    text-align: center;
    font-size: 12px;
    color: var(--anzhiyu-secondtext);

    a {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      color: var(--anzhiyu-theme);
      margin-left: 4px;
      text-decoration: none;

      .el-icon {
        font-size: 13px;
      }

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@media screen and (width <= 768px) {
  .product-variants {
    .section-title {
      font-size: 1.15rem;
      margin-bottom: 16px;
    }

    .variants-list {
      gap: 10px;
      margin-bottom: 24px;

      .variant-item {
        flex: 1;
        min-width: calc(50% - 5px);
        max-width: none;
        padding: 14px 12px;

        &.active {
          &::after {
            width: 18px;
            height: 18px;
            font-size: 11px;
            top: 6px;
            right: 6px;
          }
        }

        .variant-name {
          font-size: 14px;
          margin-bottom: 6px;
        }

        .variant-price {
          font-size: 1.1rem;
          margin-bottom: 4px;
        }

        .variant-stock {
          font-size: 0.75rem;
          margin-top: 6px;
          padding-top: 6px;
        }
      }
    }

    .purchase-section {
      padding-top: 24px;

      .price-info-card {
        padding: 18px 20px;
        margin-bottom: 24px;

        .price-info {
          .price-value {
            .price-currency {
              font-size: 16px;
            }

            .price-number {
              font-size: 28px;
            }
          }
        }
      }

      .payment-action {
        .buy-button {
          height: 48px;
          font-size: 15px;
        }
      }

      .purchase-tips {
        padding: 14px;
        font-size: 0.8rem;
      }
    }
  }
}
</style>
