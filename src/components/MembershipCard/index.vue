<template>
  <div class="membership-card">
    <div class="card-header">
      <div class="header-icon">
        <el-icon><Medal /></el-icon>
      </div>
      <div class="header-content">
        <h3 class="title">成为会员</h3>
        <p class="subtitle">解锁全站付费内容</p>
      </div>
    </div>

    <!-- 会员权益说明 -->
    <div class="benefits-section">
      <h4 class="section-title">
        <el-icon><Star /></el-icon>
        <span>会员专属权益</span>
      </h4>
      <ul class="benefits-list">
        <li>
          <el-icon class="benefit-icon"><Check /></el-icon>
          <span>免费获取本商品资源</span>
        </li>
        <li>
          <el-icon class="benefit-icon"><Check /></el-icon>
          <span>免费访问全站会员内容</span>
        </li>
        <li>
          <el-icon class="benefit-icon"><Check /></el-icon>
          <span>会员期内无限次使用</span>
        </li>
        <li>
          <el-icon class="benefit-icon"><Check /></el-icon>
          <span>更多会员专属内容</span>
        </li>
      </ul>
    </div>

    <!-- 套餐列表 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="2" animated />
    </div>

    <div v-else-if="plans.length > 0" class="plans-section">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="plan-item"
        :class="{ active: selectedPlan?.id === plan.id }"
        @click="selectPlan(plan)"
      >
        <div class="plan-radio">
          <div class="radio-inner" />
        </div>
        <div class="plan-info">
          <div class="plan-name">{{ plan.name }}</div>
          <div v-if="plan.description" class="plan-desc">
            {{ plan.description }}
          </div>
        </div>
        <div class="plan-price">
          <span v-if="plan.original_price" class="original-price">
            ¥{{ formatPrice(plan.original_price) }}
          </span>
          <span class="current-price">¥{{ formatPrice(plan.price) }}</span>
          <span class="duration">/ {{ plan.duration_days }}天</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>暂无可用的会员套餐</p>
    </div>

    <!-- 购买按钮 -->
    <button
      class="buy-button"
      :disabled="!selectedPlan || plans.length === 0"
      @click="handleBuy"
    >
      <el-icon><ShoppingCart /></el-icon>
      <span>{{ buttonText }}</span>
    </button>

    <!-- 提示信息 -->
    <div class="tips">
      <p>
        <el-icon><InfoFilled /></el-icon>
        购买后立即生效，会员权益有效期内可无限使用
      </p>
    </div>

    <!-- 支付弹窗 -->
    <MembershipPaymentDialog
      v-if="selectedPlan"
      v-model="showPaymentDialog"
      :plan="selectedPlan"
      :available-providers="availableProviders"
      @success="handlePaymentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  Medal,
  Star,
  Check,
  ShoppingCart,
  InfoFilled
} from "@element-plus/icons-vue";
import { useMembershipStore } from "@/store/modules/membership";
import type { MembershipPlan } from "@/api/membership";
import { getPaymentStatus } from "@/api/payment";
import MembershipPaymentDialog from "@/components/MembershipPaymentDialog/index.vue";

defineOptions({
  name: "MembershipCard"
});

const emit = defineEmits<{
  success: [];
}>();

const membershipStore = useMembershipStore();

const selectedPlan = ref<MembershipPlan | null>(null);
const availableProviders = ref<string[]>([]);
const showPaymentDialog = ref(false);

// 使用 store 中的数据
const loading = computed(
  () => membershipStore.loading && !membershipStore.isLoaded
);
const plans = computed(() => membershipStore.activePlans);

// 格式化价格
const formatPrice = (cents: number) => {
  return (cents / 100).toFixed(2);
};

// 按钮文本
const buttonText = computed(() => {
  if (!selectedPlan.value) {
    return "请选择套餐";
  }
  return `立即开通 ¥${formatPrice(selectedPlan.value.price)}`;
});

// 当套餐列表变化时，默认选中第一个
watch(
  () => plans.value,
  newPlans => {
    if (newPlans.length > 0 && !selectedPlan.value) {
      selectedPlan.value = newPlans[0];
    }
  },
  { immediate: true }
);

// 获取支付方式
const fetchPaymentStatus = async () => {
  try {
    const res = await getPaymentStatus();
    if (res.code === 200 && res.data?.available_providers) {
      availableProviders.value = res.data.available_providers;
    }
  } catch (error) {
    console.error("获取支付状态失败:", error);
  }
};

// 选择套餐
const selectPlan = (plan: MembershipPlan) => {
  selectedPlan.value = plan;
};

// 点击购买
const handleBuy = () => {
  if (!selectedPlan.value) {
    ElMessage.warning("请选择会员套餐");
    return;
  }

  if (availableProviders.value.length === 0) {
    ElMessage.warning("暂无可用的支付方式，请联系管理员");
    return;
  }

  showPaymentDialog.value = true;
};

// 支付成功
const handlePaymentSuccess = () => {
  showPaymentDialog.value = false;
  ElMessage.success("会员开通成功！");
  emit("success");
};

onMounted(async () => {
  // 确保套餐数据已加载（如果父组件没有预加载的话）
  if (!membershipStore.isLoaded) {
    await membershipStore.fetchActivePlans();
  }
  fetchPaymentStatus();
});
</script>

<style lang="scss" scoped>
.membership-card {
  background: var(--anzhiyu-card-bg);
  border-radius: 16px;
  padding: 24px;
  border: var(--style-border);
  box-shadow: var(--anzhiyu-shadow-border);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;

  .header-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
    border-radius: 14px;
    box-shadow: 0 4px 12px rgba(253, 160, 133, 0.3);

    .el-icon {
      font-size: 28px;
      color: #fff;
    }
  }

  .header-content {
    flex: 1;

    .title {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 700;
      color: var(--anzhiyu-fontcolor);
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--anzhiyu-secondtext);
    }
  }
}

.benefits-section {
  background: var(--anzhiyu-background);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);

    .el-icon {
      color: #f6d365;
    }
  }

  .benefits-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--anzhiyu-secondtext);

      .benefit-icon {
        color: #67c23a;
        font-size: 14px;
        flex-shrink: 0;
      }
    }
  }
}

.loading-state {
  padding: 20px 0;
}

.plans-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.plan-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--anzhiyu-background);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--anzhiyu-theme-op);
  }

  &.active {
    border-color: var(--anzhiyu-theme);
    background: var(--el-fill-color-extra-light);

    .plan-radio .radio-inner {
      background: var(--anzhiyu-theme);
      transform: scale(1);
    }
  }

  .plan-radio {
    width: 20px;
    height: 20px;
    border: 2px solid var(--anzhiyu-border-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: border-color 0.2s;

    .radio-inner {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--anzhiyu-theme);
      transform: scale(0);
      transition: transform 0.2s;
    }
  }

  &.active .plan-radio {
    border-color: var(--anzhiyu-theme);
  }

  .plan-info {
    flex: 1;
    min-width: 0;

    .plan-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
      margin-bottom: 2px;
    }

    .plan-desc {
      font-size: 12px;
      color: var(--anzhiyu-secondtext);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .plan-price {
    display: flex;
    align-items: baseline;
    gap: 4px;
    flex-shrink: 0;

    .original-price {
      font-size: 12px;
      color: var(--anzhiyu-secondtext);
      text-decoration: line-through;
    }

    .current-price {
      font-size: 20px;
      font-weight: 700;
      color: var(--anzhiyu-red);
    }

    .duration {
      font-size: 12px;
      color: var(--anzhiyu-secondtext);
    }
  }
}

.empty-state {
  padding: 32px;
  text-align: center;
  color: var(--anzhiyu-secondtext);

  p {
    margin: 0;
  }
}

.buy-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(253, 160, 133, 0.3);

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    background: var(--el-disabled-bg-color);
    color: var(--el-disabled-text-color);
    cursor: not-allowed;
    box-shadow: none;
  }

  .el-icon {
    font-size: 18px;
  }
}

.tips {
  margin-top: 16px;

  p {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--anzhiyu-secondtext);

    .el-icon {
      font-size: 14px;
      color: var(--anzhiyu-theme);
      flex-shrink: 0;
    }
  }
}

@media (max-width: 768px) {
  .membership-card {
    padding: 20px;
  }

  .card-header {
    .header-icon {
      width: 48px;
      height: 48px;

      .el-icon {
        font-size: 24px;
      }
    }

    .header-content .title {
      font-size: 18px;
    }
  }

  .benefits-section .benefits-list {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .plan-item {
    flex-wrap: wrap;
    padding: 14px;

    .plan-info {
      flex: 1 1 calc(100% - 50px);
    }

    .plan-price {
      flex-basis: 100%;
      justify-content: flex-end;
      margin-top: 8px;
      padding-left: 34px;
    }
  }
}
</style>
