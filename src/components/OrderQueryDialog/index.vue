<template>
  <el-dialog
    v-model="visible"
    title="查询已购买订单"
    width="550px"
    :close-on-click-modal="false"
    append-to-body
    class="order-query-dialog-wrapper"
  >
    <div class="order-query-dialog">
      <div class="query-form">
        <p class="dialog-description">
          请输入您的第三方支付订单号（如支付宝交易号、微信支付单号等）来查询和获取已购买的内容。
        </p>

        <el-form
          ref="queryFormRef"
          :model="queryForm"
          :rules="formRules"
          label-width="120px"
        >
          <el-form-item label="第三方订单号" prop="tradeNo" required>
            <el-input
              v-model="queryForm.tradeNo"
              placeholder="请输入支付宝交易号或微信支付单号"
              size="large"
              clearable
              maxlength="64"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="联系邮箱" prop="email">
            <el-input
              v-model="queryForm.email"
              placeholder="请输入购买时使用的邮箱（选填）"
              type="email"
              size="large"
              clearable
            />
            <div class="form-help">用于验证身份，提高查询准确性（选填）</div>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="queryResult" class="query-result">
        <el-alert
          :title="queryResult.title"
          :type="queryResult.type"
          :description="queryResult.description"
          show-icon
          :closable="false"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button size="large" @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="querying"
          :disabled="!canQuery"
          size="large"
          @click="handleQueryOrder"
        >
          查询订单
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { queryOrderByTradeNo, getArticleContent } from "@/api/payment";

const props = defineProps<{
  modelValue: boolean;
  articleId: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (
    e: "success",
    data: {
      content_html: string;
      content_markdown: string;
      orderNo: string;
      accessToken: string;
    }
  ): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const queryForm = ref({
  tradeNo: "",
  email: ""
});

const queryFormRef = ref<FormInstance>();

// 表单校验规则
const formRules: FormRules = {
  tradeNo: [
    {
      required: true,
      message: "请输入第三方订单号",
      trigger: "blur"
    },
    {
      min: 10,
      message: "订单号长度不能少于10位",
      trigger: "blur"
    }
  ],
  email: [
    {
      type: "email",
      message: "请输入正确的邮箱格式",
      trigger: ["blur", "change"]
    }
  ]
};

const querying = ref(false);
const queryResult = ref<{
  title: string;
  type: "info" | "success" | "warning" | "error";
  description: string;
} | null>(null);

const canQuery = computed(() => {
  return queryForm.value.tradeNo.trim().length >= 10;
});

const handleQueryOrder = async () => {
  if (!canQuery.value) return;

  // 表单验证
  if (!queryFormRef.value) return;

  try {
    const isValid = await queryFormRef.value.validate();
    if (!isValid) {
      return;
    }
  } catch (error) {
    return;
  }

  querying.value = true;
  queryResult.value = null;

  try {
    // 1. 先查询订单
    const orderResponse = await queryOrderByTradeNo({
      trade_no: queryForm.value.tradeNo.trim(),
      email: queryForm.value.email.trim() || undefined
    });

    if (orderResponse.code !== 200) {
      throw new Error(orderResponse.message || "查询订单失败");
    }

    const orderData = orderResponse.data;

    // 检查订单状态
    if (orderData.payment_status !== "SUCCESS") {
      queryResult.value = {
        title: "订单未支付完成",
        type: "warning",
        description: `订单状态: ${getStatusText(orderData.payment_status)}，请完成支付后再试。`
      };
      return;
    }

    // 检查订单是否匹配当前文章
    if (orderData.article_id !== props.articleId) {
      queryResult.value = {
        title: "订单不匹配",
        type: "error",
        description: "该订单不是针对当前文章的购买订单。"
      };
      return;
    }

    // 2. 获取访问令牌
    const accessToken = orderData.access_token;
    if (!accessToken) {
      throw new Error("未找到访问令牌");
    }

    // 3. 使用访问令牌获取文章内容
    const contentResponse = await getArticleContent(props.articleId, {
      access_token: accessToken
    });

    if (contentResponse.code !== 200) {
      throw new Error(contentResponse.message || "获取文章内容失败");
    }

    queryResult.value = {
      title: "查询成功！",
      type: "success",
      description: "找到您的订单，正在加载完整内容..."
    };

    // 保存访问令牌到本地存储
    const TokenManager = (await import("@/utils/tokenManager")).default;
    TokenManager.saveToken({
      token: accessToken,
      articleId: props.articleId,
      orderNo: orderData.order_no
    });

    // 通知父组件更新内容
    emit("success", {
      content_html: contentResponse.data.content_html,
      content_markdown: contentResponse.data.content_markdown,
      orderNo: orderData.order_no,
      accessToken: accessToken
    });

    ElMessage.success("内容已解锁，享受阅读吧！");

    // 延迟关闭对话框
    setTimeout(() => {
      visible.value = false;
    }, 2000);
  } catch (error: any) {
    console.error("查询订单失败:", error);
    queryResult.value = {
      title: "查询失败",
      type: "error",
      description: error.message || "查询过程中出现错误，请检查订单号是否正确。"
    };
  } finally {
    querying.value = false;
  }
};

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

const handleCancel = () => {
  // 重置表单验证状态
  if (queryFormRef.value) {
    queryFormRef.value.clearValidate();
  }
  visible.value = false;
};

watch(visible, newVal => {
  if (newVal) {
    // 重置状态
    queryResult.value = null;
    queryForm.value.tradeNo = "";
    queryForm.value.email = "";
    // 重置表单验证状态
    if (queryFormRef.value) {
      queryFormRef.value.clearValidate();
    }
  }
});
</script>

<style lang="scss" scoped>
.order-query-dialog-wrapper {
  :deep(.el-dialog__body) {
    padding: 20px 25px;
  }
}

.order-query-dialog {
  .dialog-description {
    padding: 16px;
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  .query-form {
    .form-help {
      margin-top: 6px;
      font-size: 12px;
      line-height: 1.4;
      color: var(--el-text-color-secondary);
    }

    :deep(.el-form-item) {
      margin-bottom: 24px;
    }

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  .query-result {
    margin-top: 20px;
  }
}

.dialog-footer {
  .el-button {
    min-width: 120px;
  }
}
</style>
