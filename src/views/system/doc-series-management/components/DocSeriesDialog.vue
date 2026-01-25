<!--
 * @Description: 文档系列编辑对话框
 * @Author: 安知鱼
 * @Date: 2025-12-30
-->
<script setup lang="ts">
import { ref, watch } from "vue";
import type { DocSeries, DocSeriesForm } from "@/api/post/type";
import type { FormInstance, FormRules } from "element-plus";
import ImageUpload from "@/components/ImageUpload/index.vue";
import AnDialog from "@/components/AnDialog/index.vue";
import { Link } from "@element-plus/icons-vue";

const props = defineProps<{
  modelValue: boolean;
  title: string;
  series: DocSeries | null;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", form: DocSeriesForm): void;
}>();

const formRef = ref<FormInstance>();

// 表单数据
const form = ref<DocSeriesForm>({
  name: "",
  description: "",
  cover_url: "",
  sort: 0
});

// 表单校验规则
const rules: FormRules = {
  name: [
    { required: true, message: "请输入系列名称", trigger: "blur" },
    { min: 1, max: 50, message: "长度在 1 到 50 个字符", trigger: "blur" }
  ]
};

// 监听 series 变化，填充表单
watch(
  () => props.series,
  newVal => {
    if (newVal) {
      form.value = {
        name: newVal.name,
        description: newVal.description,
        cover_url: newVal.cover_url,
        sort: newVal.sort
      };
    } else {
      form.value = {
        name: "",
        description: "",
        cover_url: "",
        sort: 0
      };
    }
  },
  { immediate: true }
);

// 保存
const handleConfirm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    emit("save", form.value);
  } catch (error) {
    console.log("表单校验失败:", error);
  }
};

// 关闭时重置表单
const handleClosed = () => {
  formRef.value?.resetFields();
};

// 关闭对话框
const handleClose = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <AnDialog
    :model-value="modelValue"
    :title="title"
    width="500px"
    :show-footer="true"
    :confirm-loading="isSubmitting"
    confirm-text="保存"
    :close-on-click-modal="false"
    @update:model-value="val => emit('update:modelValue', val)"
    @confirm="handleConfirm"
    @closed="handleClosed"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="系列名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入系列名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          placeholder="请输入系列描述（可选）"
          :rows="3"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="封面图" prop="cover_url">
        <ImageUpload v-model="form.cover_url" />
        <el-input
          v-model="form.cover_url"
          placeholder="或直接输入图片URL"
          style="margin-top: 8px"
        >
          <template #prefix>
            <el-icon><Link /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number
          v-model="form.sort"
          :min="0"
          :max="9999"
          style="width: 100%"
        />
        <div class="form-help">数值越小越靠前</div>
      </el-form-item>
    </el-form>
  </AnDialog>
</template>

<style lang="scss" scoped>
.form-help {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
