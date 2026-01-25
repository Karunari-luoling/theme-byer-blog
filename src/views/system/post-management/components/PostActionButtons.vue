<script setup lang="ts">
import { computed } from "vue";
import { Clock, Close } from "@element-plus/icons-vue";

const props = defineProps<{
  isSubmitting: boolean;
  isEditMode: boolean;
  status?: string;
  postId?: string;
  postSlug?: string;
  reviewStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  isDoc?: boolean;
}>();

const emit = defineEmits(["save", "publish", "showHistory"]);

// 是否显示查看文章按钮（编辑模式下有ID就显示）
const showViewButton = computed(() => {
  return props.isEditMode && (props.postSlug || props.postId);
});

// 是否处于待审核状态
const isPendingReview = computed(() => {
  return props.reviewStatus === "PENDING";
});

// 是否被拒绝
const isRejected = computed(() => {
  return props.reviewStatus === "REJECTED";
});

// 查看按钮的提示文字
const viewButtonTooltip = computed(() => {
  if (isPendingReview.value) {
    return "文章正在审核中，审核通过后其他用户才能看到";
  }
  if (isRejected.value) {
    return "文章审核未通过，仅您和管理员可见";
  }
  if (props.status === "DRAFT") {
    return "文章为草稿状态，仅您和管理员可见";
  }
  return "";
});

// 查看文章
const viewPost = () => {
  if (props.postId) {
    // 如果是文档类型，跳转到文档详情页
    if (props.isDoc) {
      window.open(`/doc/${props.postId}`, "_blank");
    } else {
      // 普通文章：优先使用 abbrlink，如果没有则使用 id
      const identifier = props.postSlug || props.postId;
      window.open(`/posts/${identifier}`, "_blank");
    }
  }
};
</script>

<template>
  <div class="action-buttons">
    <el-tooltip
      v-if="isEditMode && status === 'PUBLISHED'"
      content="历史版本"
      placement="bottom"
    >
      <el-button :icon="Clock" @click="emit('showHistory')" />
    </el-tooltip>
    <el-button :loading="isSubmitting" @click="emit('save')"
      >存为草稿</el-button
    >
    <el-tooltip
      v-if="showViewButton"
      :content="viewButtonTooltip"
      :disabled="!viewButtonTooltip"
      placement="bottom"
    >
      <el-button
        :type="isPendingReview ? 'warning' : isRejected ? 'danger' : 'success'"
        @click="viewPost"
      >
        <template v-if="isPendingReview">
          <el-icon class="mr-1"><Clock /></el-icon>
          审核中 · 预览
        </template>
        <template v-else-if="isRejected">
          <el-icon class="mr-1"><Close /></el-icon>
          已拒绝 · 预览
        </template>
        <template v-else> 查看文章 </template>
      </el-button>
    </el-tooltip>
    <el-button
      style="width: 120px"
      type="primary"
      :loading="isSubmitting"
      @click="emit('publish')"
    >
      {{ isEditMode && status === "PUBLISHED" ? "更新文章" : "发布文章" }}
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
