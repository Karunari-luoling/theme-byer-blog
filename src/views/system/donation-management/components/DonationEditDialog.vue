<template>
  <AnDialog
    v-model="dialogVisible"
    :title="mode === 'create' ? '添加打赏记录' : '编辑打赏记录'"
    width="600px"
    :close-on-click-modal="false"
    show-footer
    :confirm-loading="submitting"
    @closed="handleClosed"
    @confirm="handleSubmit"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
      <el-form-item label="打赏者姓名" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入打赏者姓名"
          clearable
        />
      </el-form-item>

      <el-form-item label="打赏金额" prop="amount">
        <el-input-number
          v-model="formData.amount"
          :min="0.01"
          :precision="2"
          :step="1"
          placeholder="请输入打赏金额"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="金额后缀" prop="suffix">
        <el-input
          v-model="formData.suffix"
          placeholder="例如：元、USDT 等（默认：元）"
          clearable
        />
      </el-form-item>

      <el-form-item label="排序顺序" prop="sort_order">
        <el-input-number
          v-model="formData.sort_order"
          :min="0"
          placeholder="数字越大越靠前"
          style="width: 100%"
        />
        <div class="form-tip">数字越大越靠前，默认为 0</div>
      </el-form-item>

      <el-form-item label="显示状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">显示</el-radio>
          <el-radio :value="2">隐藏</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="打赏时间" prop="custom_published_at">
        <el-date-picker
          v-model="customPublishedAt"
          type="datetime"
          placeholder="选择打赏时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DDTHH:mm:ss"
          style="width: 100%"
        />
        <div class="form-tip">留空则使用当前时间</div>
      </el-form-item>
    </el-form>
  </AnDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { AnDialog } from "@/components/AnDialog";
import {
  createDonationApi,
  updateDonationApi,
  type DonationItem,
  type CreateDonationRequest,
  type UpdateDonationRequest
} from "@/api/donation";

defineOptions({
  name: "DonationEditDialog"
});

interface Props {
  modelValue: boolean;
  donation: DonationItem | null;
  mode: "create" | "edit";
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "refresh"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const formRef = ref<FormInstance>();
const submitting = ref(false);
const customPublishedAt = ref<string>("");

// 表单数据
const formData = ref<CreateDonationRequest>({
  name: "",
  amount: 0,
  suffix: "元",
  status: 1,
  sort_order: 0,
  custom_published_at: undefined
});

// 表单验证规则
const rules: FormRules = {
  name: [{ required: true, message: "请输入打赏者姓名", trigger: "blur" }],
  amount: [
    { required: true, message: "请输入打赏金额", trigger: "blur" },
    {
      type: "number",
      min: 0.01,
      message: "金额必须大于 0",
      trigger: "blur"
    }
  ],
  status: [{ required: true, message: "请选择显示状态", trigger: "change" }]
};

// 监听对话框打开/关闭
watch(
  () => props.modelValue,
  visible => {
    if (visible) {
      resetForm();
      if (props.mode === "edit" && props.donation) {
        // 编辑模式，填充数据
        formData.value = {
          name: props.donation.name,
          amount: props.donation.amount,
          suffix: props.donation.suffix,
          status: props.donation.status,
          sort_order: props.donation.sort_order
        };
        // 设置自定义时间 - 使用本地时间格式
        if (props.donation.created_at) {
          const date = new Date(props.donation.created_at);
          // 转换为本地时间格式 YYYY-MM-DDTHH:mm:ss
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          const seconds = String(date.getSeconds()).padStart(2, "0");
          customPublishedAt.value = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        }
      }
    }
  }
);

// 重置表单
const resetForm = () => {
  formData.value = {
    name: "",
    amount: 0,
    suffix: "元",
    status: 1,
    sort_order: 0,
    custom_published_at: undefined
  };
  customPublishedAt.value = "";
  formRef.value?.clearValidate();
};

// 对话框关闭动画结束后的回调
const handleClosed = () => {
  resetForm();
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    submitting.value = true;

    // 设置自定义时间 - 添加正确的时区偏移（如 +08:00），而不是 Z（UTC）
    if (customPublishedAt.value) {
      // 获取本地时区偏移（分钟）
      const date = new Date(customPublishedAt.value);
      const timezoneOffset = -date.getTimezoneOffset(); // 注意：getTimezoneOffset 返回的是 UTC 减去本地时间的分钟数，所以要取反
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset >= 0 ? "+" : "-";
      const timezoneStr = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;
      formData.value.custom_published_at =
        customPublishedAt.value + timezoneStr;
    } else {
      formData.value.custom_published_at = undefined;
    }

    if (props.mode === "create") {
      // 创建
      await createDonationApi(formData.value);
      ElMessage.success({
        message: "添加成功",
        customClass: "high-z-index-message"
      });
    } else if (props.donation) {
      // 更新
      const updateData: UpdateDonationRequest = {
        name: formData.value.name,
        amount: formData.value.amount,
        suffix: formData.value.suffix,
        status: formData.value.status,
        sort_order: formData.value.sort_order
      };
      if (formData.value.custom_published_at) {
        updateData.custom_published_at = formData.value.custom_published_at;
      }
      await updateDonationApi(props.donation.id, updateData);
      ElMessage.success({
        message: "更新成功",
        customClass: "high-z-index-message"
      });
    }

    emit("refresh");
    dialogVisible.value = false;
  } catch (error: any) {
    if (error !== false) {
      // 不是表单验证错误
      console.error("提交失败:", error);
      ElMessage.error({
        message: props.mode === "create" ? "添加失败" : "更新失败",
        customClass: "high-z-index-message"
      });
    }
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
}
</style>
