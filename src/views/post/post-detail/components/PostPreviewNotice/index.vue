<script setup lang="ts">
import { computed } from "vue";
import EyeIcon from "@iconify-icons/ri/eye-line";
import ClockIcon from "@iconify-icons/ri/time-line";
import CloseIcon from "@iconify-icons/ri/close-circle-line";
import EditIcon from "@iconify-icons/ri/edit-line";

const props = defineProps<{
  status: string;
  reviewStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
}>();

defineOptions({
  name: "PostPreviewNotice"
});

/**
 * 根据审核状态和文章状态获取提示信息
 */
const noticeInfo = computed(() => {
  // 优先检查审核状态
  if (props.reviewStatus === "PENDING") {
    return {
      type: "pending",
      icon: ClockIcon,
      message: "文章正在审核中，审核通过后其他用户才能看到"
    };
  }

  if (props.reviewStatus === "REJECTED") {
    return {
      type: "rejected",
      icon: CloseIcon,
      message: "文章审核未通过，仅您和管理员可见"
    };
  }

  // 检查文章状态
  if (props.status === "DRAFT") {
    return {
      type: "draft",
      icon: EditIcon,
      message: "文章为草稿状态，仅您和管理员可见"
    };
  }

  // 其他未发布状态
  return {
    type: "preview",
    icon: EyeIcon,
    message: "您正在预览未公开的文章"
  };
});
</script>

<template>
  <div class="post-preview-notice" :class="`notice-${noticeInfo.type}`">
    <IconifyIconOffline :icon="noticeInfo.icon" />
    <span>{{ noticeInfo.message }}</span>
  </div>
</template>

<style lang="scss" scoped>
.post-preview-notice {
  position: relative;
  display: flex;
  gap: 0.5em;
  align-items: center;
  padding: 0.75em 1em;
  padding-left: 1.5em;
  font-size: 0.9em;
  border-radius: 6px;

  // 小短竖线
  &::before {
    content: "";
    position: absolute;
    left: 0.5em;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 1.2em;
    border-radius: 2px;
  }

  svg {
    flex-shrink: 0;
    width: 1.2em;
    height: 1.2em;
  }

  // 待审核 - 黄色
  &.notice-pending {
    color: #946200;
    background-color: #fff8e6;

    &::before {
      background-color: #ffc107;
    }

    [data-theme="dark"] & {
      color: #ffd54f;
      background-color: rgba(255, 193, 7, 0.15);
    }
  }

  // 已拒绝 - 红色
  &.notice-rejected {
    color: #c62828;
    background-color: #ffebee;

    &::before {
      background-color: #f44336;
    }

    [data-theme="dark"] & {
      color: #ef9a9a;
      background-color: rgba(244, 67, 54, 0.15);
    }
  }

  // 草稿 - 灰色
  &.notice-draft {
    color: #616161;
    background-color: #f5f5f5;

    &::before {
      background-color: #9e9e9e;
    }

    [data-theme="dark"] & {
      color: #bdbdbd;
      background-color: rgba(158, 158, 158, 0.15);
    }
  }

  // 预览 - 蓝色
  &.notice-preview {
    color: #1565c0;
    background-color: #e3f2fd;

    &::before {
      background-color: #2196f3;
    }

    [data-theme="dark"] & {
      color: #90caf9;
      background-color: rgba(33, 150, 243, 0.15);
    }
  }
}
</style>
