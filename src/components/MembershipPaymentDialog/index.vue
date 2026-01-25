<template>
  <AnDialog
    v-model="visible"
    title="会员开通"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    hide-footer
    class="membership-payment-dialog-wrapper"
  >
    <div class="membership-payment-dialog">
      <!-- 第一步：填写信息 -->
      <div v-if="!showQRCode && !paymentSuccess" class="step-one">
        <!-- 套餐信息 -->
        <div class="plan-info">
          <div class="plan-badge">
            <el-icon><Medal /></el-icon>
            <span>会员套餐</span>
          </div>
          <h3 class="plan-name">{{ plan.name }}</h3>
          <div v-if="plan.description" class="plan-desc">
            {{ plan.description }}
          </div>
          <div class="price-info">
            <span v-if="plan.original_price" class="original-price">
              ¥{{ formatPrice(plan.original_price) }}
            </span>
            <span class="current-price">¥{{ formattedPrice }}</span>
            <span class="duration">/ {{ plan.duration_days }}天</span>
          </div>
        </div>

        <!-- 支付方式选择 -->
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
          <div v-if="enabledPaymentProviders.length === 0" class="no-payment">
            暂无可用的支付方式，请联系管理员配置
          </div>
        </div>

        <!-- 邮箱信息 -->
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
              <div class="form-help">用于接收会员开通凭证</div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 第二步：扫码支付 -->
      <div v-if="showQRCode && !paymentSuccess" class="step-two">
        <div class="qr-payment">
          <div class="qr-header">
            请使用
            <strong>
              {{ selectedProviderName }}
              <span class="provider-icon">
                <component :is="selectedProviderIcon" />
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
              订单将在
              <span class="expire-time">{{ expireTimeDisplay }}</span> 内失效
            </p>
          </div>
        </div>
      </div>

      <!-- 支付成功 -->
      <div v-if="paymentSuccess" class="payment-success">
        <div class="success-animation">
          <div class="success-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
        </div>
        <h3 class="success-title">开通成功</h3>
        <p class="success-desc">
          恭喜您已成为会员！会员权益已立即生效，尽享全站付费内容。
        </p>
      </div>

      <!-- 支付状态提示 -->
      <div v-if="paymentStatus" class="payment-status">
        <el-alert
          :title="paymentStatus.title"
          :type="paymentStatus.type"
          :description="paymentStatus.description"
          show-icon
          :closable="false"
        />
      </div>

      <!-- 底部按钮 -->
      <div class="dialog-footer">
        <el-button size="large" @click="handleCancel">
          {{ paymentSuccess ? "完成" : "取消" }}
        </el-button>
        <el-button
          v-if="!showQRCode && !paymentSuccess"
          type="primary"
          :loading="creatingOrder"
          :disabled="!canCreateOrder"
          size="large"
          @click="handleCreateOrder"
        >
          确认支付 ¥{{ formattedPrice }}
        </el-button>
        <el-button
          v-if="showQRCode && !paymentSuccess"
          type="primary"
          :loading="checkingPayment"
          size="large"
          @click="handleCheckPayment"
        >
          <el-icon><CircleCheck /></el-icon>
          <span>我已完成支付</span>
        </el-button>
      </div>
    </div>
  </AnDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { Picture, CircleCheck, Medal } from "@element-plus/icons-vue";
import AnDialog from "@/components/AnDialog/index.vue";
import {
  createMembershipOrderApi,
  type MembershipPlan
} from "@/api/membership";
import { getOrderStatus } from "@/api/payment";
import AlipayIcon from "@/assets/icons/alipay.svg";
import WechatIcon from "@/assets/icons/wechat.svg";
import QRCode from "qrcode";

interface PaymentProvider {
  value: "ALIPAY" | "WECHAT";
  name: string;
  icon: any;
  enabled: boolean;
}

interface Props {
  modelValue: boolean;
  plan: MembershipPlan;
  availableProviders: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 格式化价格
const formatPrice = (cents: number) => {
  return (cents / 100).toFixed(2);
};

const formattedPrice = computed(() => {
  return formatPrice(props.plan.price);
});

// 支付方式配置
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

const enabledPaymentProviders = computed(() => {
  return paymentProviders.value.filter(p => p.enabled);
});

const selectedProvider = ref<"ALIPAY" | "WECHAT">("ALIPAY");

const selectedProviderName = computed(() => {
  return (
    paymentProviders.value.find(p => p.value === selectedProvider.value)
      ?.name || ""
  );
});

const selectedProviderIcon = computed(() => {
  return paymentProviders.value.find(p => p.value === selectedProvider.value)
    ?.icon;
});

// 表单
const userFormRef = ref<FormInstance>();
const userForm = ref({
  email: ""
});

const formRules: FormRules = {
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
const creatingOrder = ref(false);
const checkingPayment = ref(false);
const qrLoading = ref(false);
const showQRCode = ref(false);
const paymentSuccess = ref(false);
const qrCodeUrl = ref("");
const orderNo = ref("");
const expireTime = ref("");

const paymentStatus = ref<{
  title: string;
  type: "info" | "success" | "warning" | "error";
  description: string;
} | null>(null);

// 当前时间，用于倒计时
const currentTime = ref(Date.now());
let countdownTimer: ReturnType<typeof setInterval> | null = null;
let pollingTimer: ReturnType<typeof setInterval> | null = null;

// 是否可以创建订单
const canCreateOrder = computed(() => {
  const hasEmail = userForm.value.email.trim() !== "";
  const hasProvider = selectedProvider.value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(userForm.value.email.trim());
  return hasEmail && hasProvider && isValidEmail;
});

// 过期时间显示
const expireTimeDisplay = computed(() => {
  if (!expireTime.value) return "15:00";
  const expire = new Date(expireTime.value).getTime();
  const diff = Math.max(0, expire - currentTime.value);
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}分${seconds.toString().padStart(2, "0")}秒`;
});

// 启动倒计时
const startCountdown = () => {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    currentTime.value = Date.now();
    // 检查是否过期
    if (expireTime.value) {
      const expire = new Date(expireTime.value).getTime();
      if (Date.now() >= expire) {
        stopAllTimers();
        paymentStatus.value = {
          title: "订单已过期",
          type: "error",
          description: "请重新创建订单"
        };
      }
    }
  }, 1000);
};

// 停止所有定时器
const stopAllTimers = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

// 生成二维码图片
const generateQRCode = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: 220,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" }
    });
  } catch (error) {
    console.error("生成二维码失败:", error);
    throw new Error("生成二维码失败");
  }
};

// 创建订单
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
  } catch {
    ElMessage.error("请填写正确的邮箱地址");
    return;
  }

  creatingOrder.value = true;
  paymentStatus.value = null;
  qrLoading.value = true;

  try {
    const res = await createMembershipOrderApi({
      plan_id: props.plan.id,
      payment_provider: selectedProvider.value,
      user_email: userForm.value.email.trim()
    });

    if (res.code === 200 && res.data) {
      orderNo.value = res.data.order_no;
      expireTime.value = res.data.expire_time;

      // 处理二维码
      const paymentResult = res.data.payment_result;
      if (paymentResult.qr_code) {
        const qrCodeContent = paymentResult.qr_code;

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
          qrCodeUrl.value = await generateQRCode(qrCodeContent);
        }
      } else if (paymentResult.payment_url) {
        window.open(paymentResult.payment_url, "_blank");
        paymentStatus.value = {
          title: "订单已创建",
          type: "success",
          description: "已在新标签页中打开支付页面，请完成支付"
        };
      }

      showQRCode.value = true;
      startCountdown();
      startPaymentPolling();
    } else {
      ElMessage.error(res.message || "创建订单失败");
      paymentStatus.value = {
        title: "创建订单失败",
        type: "error",
        description: res.message || "请稍后重试"
      };
    }
  } catch (error: any) {
    console.error("创建订单失败:", error);
    ElMessage.error(error.message || "创建订单失败");
    paymentStatus.value = {
      title: "创建订单失败",
      type: "error",
      description: error.message || "请稍后重试"
    };
  } finally {
    creatingOrder.value = false;
    qrLoading.value = false;
  }
};

// 轮询支付状态
const startPaymentPolling = () => {
  if (pollingTimer) clearInterval(pollingTimer);

  let pollCount = 0;
  const maxPolls = 60; // 最多轮询60次（约3分钟）

  const poll = async () => {
    if (!orderNo.value || paymentSuccess.value) return;

    pollCount++;
    if (pollCount > maxPolls) {
      stopAllTimers();
      return;
    }

    try {
      const res = await getOrderStatus(orderNo.value);
      if (res.data?.payment_status === "SUCCESS") {
        handlePaymentSuccess();
      }
    } catch {
      // 静默失败
    }
  };

  // 5秒后开始轮询，然后每3秒一次
  setTimeout(() => {
    poll();
    pollingTimer = setInterval(poll, 3000);
  }, 5000);
};

// 手动检查支付状态
const handleCheckPayment = async () => {
  if (!orderNo.value) return;

  checkingPayment.value = true;
  try {
    const res = await getOrderStatus(orderNo.value);
    if (res.data?.payment_status === "SUCCESS") {
      handlePaymentSuccess();
    } else {
      ElMessage.info("暂未收到支付结果，请稍后重试");
    }
  } catch {
    ElMessage.error("查询支付状态失败");
  } finally {
    checkingPayment.value = false;
  }
};

// 支付成功处理
const handlePaymentSuccess = () => {
  stopAllTimers();
  paymentSuccess.value = true;
  paymentStatus.value = null;
  emit("success");
};

// 取消/关闭
const handleCancel = () => {
  stopAllTimers();
  visible.value = false;
};

// 重置状态
const resetState = () => {
  showQRCode.value = false;
  paymentSuccess.value = false;
  qrCodeUrl.value = "";
  orderNo.value = "";
  expireTime.value = "";
  paymentStatus.value = null;
  userForm.value.email = "";
  currentTime.value = Date.now();
  if (userFormRef.value) {
    userFormRef.value.clearValidate();
  }
  // 默认选中第一个可用的支付方式
  if (enabledPaymentProviders.value.length > 0) {
    selectedProvider.value = enabledPaymentProviders.value[0].value;
  }
};

// 监听显示状态
watch(
  () => props.modelValue,
  val => {
    if (val) {
      resetState();
    } else {
      stopAllTimers();
    }
  }
);

onUnmounted(() => {
  stopAllTimers();
});
</script>

<style lang="scss" scoped>
.membership-payment-dialog {
  h4 {
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  // 第一步：套餐信息和表单
  .step-one {
    .plan-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 20px;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #fef9e7 0%, #fdf2e9 100%);
      border-radius: 12px;
      border: 1px solid rgba(246, 211, 101, 0.3);

      [data-theme="dark"] & {
        background: linear-gradient(
          135deg,
          rgba(246, 211, 101, 0.1) 0%,
          rgba(253, 160, 133, 0.1) 100%
        );
        border-color: rgba(246, 211, 101, 0.2);
      }

      .plan-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        border-radius: 20px;
        align-self: flex-start;

        .el-icon {
          font-size: 14px;
        }
      }

      .plan-name {
        margin: 8px 0 0;
        font-size: 20px;
        font-weight: 700;
        color: var(--el-text-color-primary);
      }

      .plan-desc {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }

      .price-info {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin-top: 8px;

        .original-price {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          text-decoration: line-through;
        }

        .current-price {
          font-size: 28px;
          font-weight: 700;
          color: var(--anzhiyu-red);
        }

        .duration {
          font-size: 14px;
          color: var(--el-text-color-secondary);
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

        .provider-icon {
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

      .no-payment {
        padding: 16px;
        text-align: center;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        background: var(--el-fill-color-light);
        border-radius: 8px;
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
  }

  // 第二步：扫码支付
  .step-two {
    text-align: center;

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
        padding: 12px;
        background: white;
        border: 1px solid var(--el-border-color);
        border-radius: 12px;

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

            .el-icon {
              font-size: 40px;
              margin-bottom: 8px;
            }
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

  // 支付成功
  .payment-success {
    text-align: center;
    padding: 32px 20px 16px;

    .success-animation {
      margin-bottom: 20px;

      .success-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
        border-radius: 50%;
        animation: success-bounce 0.5s ease-out;

        .el-icon {
          font-size: 42px;
          color: #fff;
        }
      }
    }

    .success-title {
      margin: 0 0 12px;
      font-size: 22px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .success-desc {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
      line-height: 1.6;
    }
  }

  // 支付状态
  .payment-status {
    margin-top: 20px;
  }

  // 底部按钮
  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 20px;
    margin-top: 24px;
    border-top: 1px solid var(--el-border-color-lighter);

    .el-button {
      min-width: 120px;

      :deep(.el-button__content) {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
    }
  }
}

@keyframes success-bounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
