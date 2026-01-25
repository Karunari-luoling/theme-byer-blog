<!--
 * @Description: 定时发布设置Tab组件
 * @Author: 安知鱼
 * @Date: 2026-01-07
-->
<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { ref, computed, watch } from "vue";
import type { ArticleForm } from "@/api/post/type";
import {
  Clock,
  Calendar,
  InfoFilled,
  ArrowRight,
  Check
} from "@element-plus/icons-vue";
import dayjs from "dayjs";

const props = defineProps<{
  form: ArticleForm;
}>();

// 是否启用定时发布
const enableScheduled = ref(false);

// 是否显示说明信息
const showInfo = ref(false);

// 定时发布时间
const scheduledTime = ref<Date | null>(null);

// 快捷时间选项
const quickTimeOptions = [
  { label: "1小时后", hours: 1 },
  { label: "3小时后", hours: 3 },
  { label: "6小时后", hours: 6 },
  { label: "明天此时", hours: 24 },
  { label: "后天此时", hours: 48 },
  { label: "一周后", hours: 168 }
];

// 初始化：如果已有定时发布时间，则启用并设置
watch(
  () => props.form.scheduled_at,
  newVal => {
    if (newVal) {
      enableScheduled.value = true;
      scheduledTime.value = new Date(newVal);
    }
  },
  { immediate: true }
);

// 监听启用状态变化
watch(enableScheduled, enabled => {
  if (!enabled) {
    // 禁用时清除定时发布时间
    props.form.scheduled_at = undefined;
    scheduledTime.value = null;
    // 如果当前状态是 SCHEDULED，改回 DRAFT
    if (props.form.status === "SCHEDULED") {
      props.form.status = "DRAFT";
    }
  }
});

// 监听时间选择变化
watch(scheduledTime, newTime => {
  if (newTime && enableScheduled.value) {
    // 使用 ISO 8601 格式
    props.form.scheduled_at = newTime.toISOString();
    props.form.status = "SCHEDULED";
  } else {
    props.form.scheduled_at = undefined;
    if (props.form.status === "SCHEDULED") {
      props.form.status = "DRAFT";
    }
  }
});

// 应用快捷时间
const applyQuickTime = (hours: number) => {
  const now = new Date();
  scheduledTime.value = new Date(now.getTime() + hours * 60 * 60 * 1000);
  enableScheduled.value = true;
};

// 禁用过去的日期
const disablePastDate = (time: Date) => {
  return time.getTime() < Date.now() - 60 * 1000; // 允许1分钟的误差
};

// 格式化显示的时间
const formattedTime = computed(() => {
  if (!scheduledTime.value) return "";
  return dayjs(scheduledTime.value).format("YYYY年MM月DD日 HH:mm:ss");
});

// 计算距离发布还有多久
const timeUntilPublish = computed(() => {
  if (!scheduledTime.value) return "";
  const now = Date.now();
  const target = scheduledTime.value.getTime();
  const diff = target - now;

  if (diff <= 0) return "即将发布";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);

  return parts.length > 0 ? `${parts.join(" ")}后发布` : "即将发布";
});

// 是否显示当前状态为定时发布
const isCurrentlyScheduled = computed(() => {
  return props.form.status === "SCHEDULED" && props.form.scheduled_at;
});
</script>

<template>
  <el-form :model="form" label-position="top">
    <!-- 定时发布开关 -->
    <el-form-item>
      <template #label>
        <div class="label-with-icon">
          <el-icon><Clock /></el-icon>
          <span>定时发布</span>
          <el-tooltip placement="top">
            <template #content>
              启用后，文章将在指定时间自动发布。<br />
              在此之前，文章对外不可见。
            </template>
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <el-switch v-model="enableScheduled" />
    </el-form-item>

    <!-- 定时发布时间选择 -->
    <template v-if="enableScheduled">
      <el-form-item label="发布时间">
        <el-date-picker
          v-model="scheduledTime"
          type="datetime"
          placeholder="选择定时发布时间"
          style="width: 100%"
          format="YYYY-MM-DD HH:mm:ss"
          :disabled-date="disablePastDate"
          :shortcuts="[]"
        />
        <div class="form-item-help">
          请选择一个未来的时间，文章将在该时间自动发布
        </div>
      </el-form-item>

      <!-- 快捷时间选择 -->
      <el-form-item label="快捷选择">
        <div class="quick-time-buttons">
          <el-button
            v-for="option in quickTimeOptions"
            :key="option.hours"
            size="small"
            @click="applyQuickTime(option.hours)"
          >
            {{ option.label }}
          </el-button>
        </div>
      </el-form-item>

      <!-- 发布预览信息 -->
      <el-form-item v-if="scheduledTime">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          class="schedule-preview"
        >
          <template #title>
            <div class="preview-content">
              <div class="preview-row">
                <el-icon><Calendar /></el-icon>
                <span>计划发布时间：{{ formattedTime }}</span>
              </div>
              <div class="preview-row countdown">
                <el-icon><Clock /></el-icon>
                <span>{{ timeUntilPublish }}</span>
              </div>
            </div>
          </template>
        </el-alert>
      </el-form-item>
    </template>

    <!-- 当前状态提示 -->
    <el-form-item v-if="isCurrentlyScheduled && !enableScheduled">
      <el-alert type="warning" :closable="false" show-icon>
        <template #title>
          此文章当前已设置定时发布，取消后将变为草稿状态
        </template>
      </el-alert>
    </el-form-item>

    <!-- 说明信息 -->
    <el-form-item>
      <div class="info-card" :class="{ expanded: showInfo }">
        <div class="info-card-header" @click="showInfo = !showInfo">
          <div class="info-card-title">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
            <span>关于定时发布</span>
          </div>
          <el-icon class="arrow-icon" :class="{ rotated: showInfo }">
            <ArrowRight />
          </el-icon>
        </div>
        <Transition name="slide-fade">
          <div v-show="showInfo" class="info-card-content">
            <div class="info-highlight">
              <span class="highlight-text">定时发布</span>
              功能允许您预先设置文章的发布时间，系统将在指定时间自动将文章状态改为已发布。
            </div>
            <div class="info-list">
              <div class="info-list-item">
                <el-icon class="item-icon"><Check /></el-icon>
                <span>定时发布的文章在发布前对外不可见</span>
              </div>
              <div class="info-list-item">
                <el-icon class="item-icon"><Check /></el-icon>
                <span>系统每分钟检查一次是否有需要发布的文章</span>
              </div>
              <div class="info-list-item">
                <el-icon class="item-icon"><Check /></el-icon>
                <span>发布时间到达后，文章会自动变为已发布状态</span>
              </div>
              <div class="info-list-item">
                <el-icon class="item-icon"><Check /></el-icon>
                <span>您可以随时修改或取消定时发布</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.label-with-icon {
  display: flex;
  align-items: center;
  gap: 6px;

  .info-icon {
    color: var(--el-text-color-secondary);
    cursor: help;
  }
}

.form-item-help {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.quick-time-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.schedule-preview {
  width: 100%;

  .preview-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .preview-row {
    display: flex;
    align-items: center;
    gap: 8px;

    &.countdown {
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }
}

// 说明卡片样式
.info-card {
  width: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-border-color);
  }

  &.expanded {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }
}

.info-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--el-fill-color-light);
  }
}

.info-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);

  .info-icon {
    color: var(--el-color-primary);
    font-size: 16px;
  }
}

.arrow-icon {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  transition: transform 0.3s ease;

  &.rotated {
    transform: rotate(90deg);
  }
}

.info-card-content {
  padding: 0 16px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-fill-color-lighter);
}

.info-highlight {
  padding: 12px 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;

  .highlight-text {
    color: var(--el-color-primary);
    font-weight: 600;
  }
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-list-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;

  .item-icon {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--el-color-success);
    font-size: 14px;
  }
}

// 展开/收起动画
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
