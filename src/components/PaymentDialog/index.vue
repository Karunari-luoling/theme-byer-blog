<template>
  <AnDialog
    v-model="visible"
    title="购买付费内容"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    hide-footer
    class="payment-dialog-wrapper"
  >
    <div class="payment-dialog">
      <div v-if="!showQRCode" class="step-one">
        <div class="article-info">
          <h3>{{ articleTitle }}</h3>
          <div class="price-info">
            <div
              v-if="props.originalPrice && props.originalPrice > props.price"
              class="price-group"
            >
              <span class="original-price"
                >{{ props.currencyUnit || "¥"
                }}{{ props.originalPrice?.toFixed(2) }}</span
              >
              <div class="current-price">
                <span class="current-price-currency">
                  {{ props.currencyUnit || "¥" }}
                </span>
                <span class="current-price-value"> {{ price.toFixed(2) }}</span>
              </div>
            </div>
            <div v-else class="single-price">
              <span class="price"
                >{{ props.currencyUnit || "¥" }}{{ price.toFixed(2) }}</span
              >
            </div>
          </div>
        </div>

        <div class="payment-methods">
          <h4>选择支付方式</h4>
          <el-radio-group v-model="selectedProvider" class="payment-options">
            <el-radio
              v-for="provider in enabledPaymentProviders"
              :key="provider.value"
              :value="provider.value"
              border
            >
              <span class="provider-icon">
                <component :is="provider.icon" />
              </span>
              <span class="provider-name">{{ provider.name }}</span>
            </el-radio>
          </el-radio-group>
        </div>

        <div class="user-info">
          <h4>联系信息</h4>
          <el-form
            ref="userFormRef"
            :model="userForm"
            :rules="formRules"
            label-width="0px"
          >
            <el-form-item label="" prop="email" :required="true">
              <el-input
                v-model="userForm.email"
                placeholder="请输入您的邮箱地址（必填）"
                type="email"
                size="large"
                clearable
              />
              <div class="form-help">用于接收购买凭证和内容访问链接</div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div v-if="showQRCode" class="step-two">
        <div class="qr-payment">
          <div class="qr-header">
            请使用
            <strong
              >{{ selectedProviderName }}
              <span class="provider-icon">
                <component
                  :is="
                    paymentProviders.find(p => p.value === selectedProvider)
                      ?.icon
                  "
                />
              </span>
            </strong>
            扫码支付
          </div>
          <div class="qr-container">
            <div v-loading="qrLoading" class="qr-code">
              <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="支付二维码" />
              <div v-else class="qr-placeholder">
                <el-icon><Picture /></el-icon>
                <p>正在生成二维码...</p>
              </div>
            </div>
          </div>
          <div class="qr-footer">
            <p>
              订单将在 <span class="expire-time">{{ expireTime }}</span> 内失效
            </p>
          </div>
        </div>
      </div>

      <div v-if="paymentStatus" class="payment-status">
        <el-alert
          :title="paymentStatus.title"
          :type="paymentStatus.type"
          :description="paymentStatus.description"
          show-icon
          :closable="false"
        />
      </div>

      <div class="dialog-footer">
        <el-button size="large" @click="handleCancel">取消</el-button>
        <el-button
          v-if="!showQRCode"
          type="primary"
          :loading="creatingOrder"
          :disabled="!canCreateOrder"
          size="large"
          @click="handleCreateOrder"
        >
          确认支付 {{ props.currencyUnit || "¥" }}{{ price.toFixed(2) }}
        </el-button>
        <el-button
          v-if="showQRCode"
          type="success"
          :loading="checkingPayment"
          size="large"
          @click="handleCheckPayment"
        >
          <el-icon class="el-icon--left"><CircleCheck /></el-icon>
          我已完成支付
        </el-button>
      </div>
    </div>
  </AnDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { Picture, CircleCheck } from "@element-plus/icons-vue";
import {
  createPaymentOrder,
  getOrderStatus,
  type CreateOrderRequest,
  type CreateOrderResponse,
  type OrderStatusResponse
} from "@/api/payment";
import AlipayIcon from "@/assets/icons/alipay.svg";
import WechatIcon from "@/assets/icons/wechat.svg";
import QRCode from "qrcode";
import AnDialog from "@/components/AnDialog/index.vue";

interface PaymentProvider {
  value: "ALIPAY" | "WECHAT";
  name: string;
  icon: any;
  enabled: boolean;
}

const props = defineProps<{
  modelValue: boolean;
  articleId: string;
  articleTitle: string;
  price: number;
  originalPrice?: number;
  currencyUnit?: string;
  availableProviders: string[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success", data: { orderNo: string; accessToken: string }): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 只显示支付宝和微信支付选项（支付通道对用户透明）
const paymentProviders = computed<PaymentProvider[]>(() => [
  {
    value: "ALIPAY",
    name: "支付宝",
    icon: AlipayIcon,
    enabled: props.availableProviders.includes("ALIPAY")
  },
  {
    value: "WECHAT",
    name: "微信支付",
    icon: WechatIcon,
    enabled: props.availableProviders.includes("WECHAT")
  }
]);

// 只显示已开启的支付方式
const enabledPaymentProviders = computed(() => {
  return paymentProviders.value.filter(p => p.enabled);
});

const selectedProvider = ref<"ALIPAY" | "WECHAT">(
  (enabledPaymentProviders.value[0]?.value as "ALIPAY" | "WECHAT") || "ALIPAY"
);

const selectedProviderName = computed(() => {
  return (
    paymentProviders.value.find(p => p.value === selectedProvider.value)
      ?.name || ""
  );
});

const userForm = ref({
  email: ""
});

const userFormRef = ref<FormInstance>();

// 邮箱校验规则
const formRules: FormRules = {
  email: [
    {
      required: true,
      message: "请输入邮箱地址",
      trigger: "blur"
    },
    {
      type: "email",
      message: "请输入正确的邮箱格式",
      trigger: ["blur", "change"]
    }
  ]
};

const orderData = ref<CreateOrderResponse | null>(null);
const creatingOrder = ref(false);
const checkingPayment = ref(false);
const qrLoading = ref(false);
const qrCodeUrl = ref("");

const paymentStatus = ref<{
  title: string;
  type: "info" | "success" | "warning" | "error";
  description: string;
} | null>(null);

const showQRCode = computed(() => !!orderData.value?.payment_result.qr_code);

// 当前时间，用于倒计时
const currentTime = ref(Date.now());
let countdownTimer: NodeJS.Timeout | null = null;

// 启动倒计时定时器
const startCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  countdownTimer = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
};

// 停止倒计时定时器
const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

const expireTime = computed(() => {
  if (!orderData.value?.expire_time) return "";
  const expire = new Date(orderData.value.expire_time);
  const diff = expire.getTime() - currentTime.value;
  const minutes = Math.max(0, Math.floor(diff / 60000));
  const seconds = Math.max(0, Math.floor((diff % 60000) / 1000));
  return `${minutes}分${seconds.toString().padStart(2, "0")}秒`;
});

const canCreateOrder = computed(() => {
  // 检查邮箱是否不为空且选择了支付方式
  const hasEmail = userForm.value.email.trim() !== "";
  const hasProvider = selectedProvider.value;
  // 简单的邮箱格式校验
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(userForm.value.email.trim());

  return hasEmail && hasProvider && isValidEmail;
});

// 生成二维码图片
const generateQRCode = async (text: string): Promise<string> => {
  try {
    const qrDataURL = await QRCode.toDataURL(text, {
      width: 220,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });
    return qrDataURL;
  } catch (error) {
    console.error("生成二维码失败:", error);
    throw new Error("生成二维码失败");
  }
};

const handleCreateOrder = async () => {
  if (!canCreateOrder.value) return;

  // 表单验证
  if (!userFormRef.value) return;

  try {
    const isValid = await userFormRef.value.validate();
    if (!isValid) {
      ElMessage.error("请填写正确的邮箱地址");
      return;
    }
  } catch (error) {
    ElMessage.error("请填写正确的邮箱地址");
    return;
  }

  creatingOrder.value = true;
  paymentStatus.value = null;
  console.log("================== [创建订单] 开始 ==================");
  try {
    const request: CreateOrderRequest = {
      article_id: props.articleId,
      payment_provider: selectedProvider.value,
      user_email: userForm.value.email.trim()
    };
    console.log("[创建订单] 请求参数:", request);
    const response = await createPaymentOrder(request);
    orderData.value = response.data;
    console.log("[创建订单] ✅ 订单创建成功:", orderData.value);
    console.log("[创建订单] 订单号:", orderData.value.order_no);
    console.log("[创建订单] 过期时间:", orderData.value.expire_time);
    console.log("[创建订单] 支付结果:", orderData.value.payment_result);

    // 启动倒计时
    startCountdown();

    // 处理二维码显示
    if (orderData.value.payment_result.qr_code) {
      const qrCodeContent = orderData.value.payment_result.qr_code;

      // 判断 qr_code 的内容类型
      // 如果是 URL（http/https/weixin 等协议）或普通字符串，需要通过 QRCode 库生成二维码图片
      // 如果是 base64 图片数据，则直接使用
      const isBase64Image =
        qrCodeContent.startsWith("data:image/") ||
        /^[A-Za-z0-9+/]+=*$/.test(qrCodeContent.replace(/\s/g, ""));
      const isUrl =
        qrCodeContent.startsWith("http://") ||
        qrCodeContent.startsWith("https://") ||
        qrCodeContent.startsWith("weixin://");

      if (isBase64Image && !isUrl) {
        // 是 base64 图片数据，直接使用（原生微信支付返回的二维码）
        qrCodeUrl.value = qrCodeContent.startsWith("data:")
          ? qrCodeContent
          : `data:image/png;base64,${qrCodeContent}`;
      } else {
        // 是 URL 或支付链接字符串，需要生成二维码图片（支付宝当面付或易支付返回的链接）
        try {
          qrCodeUrl.value = await generateQRCode(qrCodeContent);
        } catch (error) {
          ElMessage.error("生成支付二维码失败");
          paymentStatus.value = {
            title: "二维码生成失败",
            type: "error",
            description: "无法生成支付二维码，请稍后重试"
          };
          return;
        }
      }
    } else if (orderData.value.payment_result.payment_url) {
      window.open(orderData.value.payment_result.payment_url, "_blank");
      paymentStatus.value = {
        title: "订单已创建",
        type: "success",
        description: "已在新标签页中打开支付页面，请完成支付"
      };
    }
    startPaymentPolling();
  } catch (error: any) {
    ElMessage.error(error.message || "创建订单失败");
    paymentStatus.value = {
      title: "创建订单失败",
      type: "error",
      description: error.message || "请稍后重试"
    };
  } finally {
    creatingOrder.value = false;
  }
};

const handleCheckPayment = async () => {
  if (!orderData.value) return;
  checkingPayment.value = true;
  console.log(`[手动检查支付] 开始检查订单状态: ${orderData.value.order_no}`);
  try {
    const response = await getOrderStatus(orderData.value.order_no);
    const orderStatus = response.data;
    console.log(`[手动检查支付] 后端返回状态:`, orderStatus);

    if (orderStatus.payment_status === "SUCCESS") {
      console.log(`[手动检查支付] ✅ 支付成功!`);
      paymentStatus.value = {
        title: "支付成功！",
        type: "success",
        description: "您现在可以访问全部内容了。"
      };
      emit("success", {
        orderNo: orderData.value.order_no,
        accessToken: orderStatus.access_token || `token_${Date.now()}`
      });
      setTimeout(() => {
        visible.value = false;
      }, 2000);
    } else if (orderStatus.payment_status === "FAILED") {
      console.log(`[手动检查支付] ❌ 支付失败`);
      paymentStatus.value = {
        title: "支付失败",
        type: "error",
        description: "支付未成功，请重试或选择其他支付方式。"
      };
    } else {
      console.log(
        `[手动检查支付] ⏳ 订单状态为: ${orderStatus.payment_status}, 等待支付`
      );
      ElMessage.info("订单尚未支付，请扫码完成后再试。");
    }
  } catch (error: any) {
    console.error(`[手动检查支付] 查询失败:`, error);
    ElMessage.error("检查支付状态失败");
  } finally {
    checkingPayment.value = false;
  }
};

let pollingTimeout: NodeJS.Timeout | null = null;
let pollingCount = 0;
let pollingErrorCount = 0;

// 智能轮询策略：开始频率高，逐渐降低
const getPollingInterval = (count: number): number => {
  if (count < 10) return 2000; // 前10次：2秒间隔
  if (count < 20) return 3000; // 10-20次：3秒间隔
  if (count < 30) return 5000; // 20-30次：5秒间隔
  return 10000; // 30次后：10秒间隔
};

const startPaymentPolling = () => {
  if (pollingTimeout) {
    clearTimeout(pollingTimeout);
  }
  pollingCount = 0;
  pollingErrorCount = 0;

  const pollOrderStatus = async () => {
    if (!orderData.value) return;

    pollingCount++;

    try {
      console.log(
        `[支付轮询] 第${pollingCount}次查询订单状态: ${orderData.value.order_no}`
      );

      const response = await getOrderStatus(orderData.value.order_no);
      const orderStatus = response.data;
      console.log(`[支付轮询] 后端返回:`, {
        payment_status: orderStatus.payment_status,
        order_no: orderStatus.order_no,
        trade_no: orderStatus.trade_no,
        access_token: orderStatus.access_token ? "已返回" : "未返回"
      });

      // 重置错误计数器
      pollingErrorCount = 0;

      if (orderStatus.payment_status === "SUCCESS") {
        console.log(
          `[支付轮询] ✅ 检测到支付成功! 订单: ${orderData.value.order_no}`
        );
        console.log(`[支付轮询] access_token: ${orderStatus.access_token}`);
        stopPolling();

        paymentStatus.value = {
          title: "支付成功！",
          type: "success",
          description: "您现在可以访问全部内容了。"
        };

        emit("success", {
          orderNo: orderData.value.order_no,
          accessToken: orderStatus.access_token || `token_${Date.now()}`
        });

        setTimeout(() => {
          visible.value = false;
        }, 2000);
        return;
      }

      if (
        orderStatus.payment_status === "FAILED" ||
        orderStatus.payment_status === "CANCELLED" ||
        new Date(orderData.value.expire_time) < new Date()
      ) {
        console.log(
          `[支付轮询] 订单失效: ${orderData.value.order_no}, 状态: ${orderStatus.payment_status}`
        );
        stopPolling();

        paymentStatus.value = {
          title: "订单已失效",
          type: "error",
          description: "此订单已过期或支付失败，请重新创建订单。"
        };
        return;
      }

      // 检查是否超过最大轮询次数（最多轮询5分钟）
      if (pollingCount >= 30) {
        console.log(
          `[支付轮询] 达到最大轮询次数，停止轮询: ${orderData.value.order_no}`
        );
        stopPolling();

        paymentStatus.value = {
          title: "轮询超时",
          type: "warning",
          description: "长时间未检测到支付状态变化，请手动检查支付状态。"
        };
        return;
      }

      // 继续下一次轮询
      const nextInterval = getPollingInterval(pollingCount);
      console.log(
        `[支付轮询] 订单待支付，${nextInterval / 1000}秒后进行下一次查询`
      );

      pollingTimeout = setTimeout(pollOrderStatus, nextInterval);
    } catch (error: any) {
      pollingErrorCount++;
      console.warn(
        `[支付轮询] 查询失败 (第${pollingErrorCount}次): ${error.message}`
      );

      // 如果连续错误次数过多，停止轮询
      if (pollingErrorCount >= 5) {
        console.error(
          `[支付轮询] 连续错误次数过多，停止轮询: ${orderData.value.order_no}`
        );
        stopPolling();

        paymentStatus.value = {
          title: "查询错误",
          type: "error",
          description: "查询支付状态时发生错误，请手动检查或刷新页面重试。"
        };
        return;
      }

      // 错误后延长轮询间隔
      const errorInterval = Math.min(pollingErrorCount * 5000, 15000);
      pollingTimeout = setTimeout(pollOrderStatus, errorInterval);
    }
  };

  // 等待5秒后开始第一次查询，给用户足够的时间扫码支付
  console.log(
    `[支付轮询] 订单创建成功，5秒后开始查询支付状态: ${orderData.value?.order_no}`
  );
  pollingTimeout = setTimeout(pollOrderStatus, 5000);
};

const stopPolling = () => {
  if (pollingTimeout) {
    clearTimeout(pollingTimeout);
    pollingTimeout = null;
  }
  console.log(`[支付轮询] 停止轮询，总查询次数: ${pollingCount}`);
};

const handleCancel = () => {
  stopPolling();
  stopCountdown();

  // 重置表单验证状态
  if (userFormRef.value) {
    userFormRef.value.clearValidate();
  }
  visible.value = false;
};

watch(visible, newVal => {
  if (!newVal) {
    stopPolling();
    stopCountdown();
  }
  if (newVal) {
    // 重置状态
    orderData.value = null;
    paymentStatus.value = null;
    qrCodeUrl.value = "";
    userForm.value.email = "";
    currentTime.value = Date.now();
    // 重置选中的支付方式为第一个已开启的
    selectedProvider.value =
      enabledPaymentProviders.value[0]?.value || "ALIPAY";
    // 重置表单验证状态
    if (userFormRef.value) {
      userFormRef.value.clearValidate();
    }
  }
});

// 组件卸载时清理定时器
onUnmounted(() => {
  stopPolling();
  stopCountdown();
});
</script>

<style lang="scss" scoped>
.payment-dialog {
  h4 {
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .article-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    margin-bottom: 24px;
    background: var(--el-fill-color-light);
    border-radius: 8px;

    h3 {
      flex: 1;
      padding-right: 16px;
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }

    .price-info {
      .single-price .price,
      .price-group .current-price {
        font-size: 26px;
        font-weight: 700;
        color: var(--anzhiyu-red);

        .current-price-currency {
          margin-right: 4px;
          font-size: 15px;
        }
      }

      .price-group {
        display: flex;
        gap: 8px;
        align-items: baseline;

        .original-price {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          text-decoration: line-through;
        }
      }
    }
  }

  .payment-methods {
    margin-bottom: 24px;

    .payment-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;

      :deep(.el-radio) {
        width: 100%;
        height: 55px;
        padding: 0 16px;
        margin: 0;
        border-radius: 8px;

        .el-radio__input {
          display: none;
        }

        .el-radio__label {
          display: flex;
          gap: 8px;
          align-items: center;
          padding-left: 0;
        }
      }

      :deep(.provider-icon) {
        width: 24px;
        height: 24px;

        svg {
          width: 24px;
          height: 24px;
        }
      }

      .provider-name {
        font-size: 15px;
        font-weight: 500;
      }
    }
  }

  .user-info {
    margin-bottom: 20px;

    .form-help {
      width: 100%;
      margin-top: 6px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .payment-status {
    margin-top: 20px;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 20px;
    margin-top: 24px;
    border-top: 1px solid var(--el-border-color-lighter);

    .el-button {
      min-width: 120px;
    }
  }

  .step-two {
    text-align: center;
  }

  .qr-payment {
    .qr-header {
      display: flex;
      gap: 6px;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      font-size: 16px;
      color: var(--el-text-color-regular);

      strong {
        display: inline-flex;
        gap: 6px;
        align-items: center;
      }

      .provider-icon {
        width: 22px;
        height: 22px;

        svg {
          width: 22px;
          height: 22px;
        }
      }
    }

    .qr-container {
      display: inline-block;
      padding: 10px;
      background: white;
      border: 1px solid var(--el-border-color);
      border-radius: 8px;

      .qr-code {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 220px;
        height: 220px;
        overflow: hidden;
        border-radius: 4px;

        img {
          width: 100%;
          height: 100%;
        }

        .qr-placeholder {
          color: var(--el-text-color-secondary);
          text-align: center;
        }
      }
    }

    .qr-footer {
      margin-top: 16px;
      font-size: 14px;
      color: var(--el-text-color-secondary);

      .expire-time {
        font-weight: 600;
        color: var(--el-color-warning);
      }
    }
  }
}
</style>
