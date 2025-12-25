<template>
  <div class="custom-tabs" :class="{ bordered }">
    <div class="tabs-nav">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: modelValue === tab.key, disabled: tab.disabled }"
        @click="handleTabClick(tab)"
      >
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </div>
      <div class="tab-indicator" :style="indicatorStyle" />
    </div>

    <div class="tabs-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
  badge?: string | number;
}

interface Props {
  modelValue: string;
  tabs: TabItem[];
  bordered?: boolean;
}

interface Emits {
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  bordered: true
});

const emit = defineEmits<Emits>();

// 计算指示器位置
const indicatorStyle = computed(() => {
  const index = props.tabs.findIndex(tab => tab.key === props.modelValue);
  const width = 100 / props.tabs.length;
  return {
    transform: `translateX(${index * 100}%)`,
    width: `${width}%`
  };
});

// 处理标签页点击
const handleTabClick = (tab: TabItem) => {
  if (tab.disabled) return;
  emit("update:modelValue", tab.key);
  emit("change", tab.key);
};
</script>

<style lang="scss" scoped>
.custom-tabs {
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;

  &.bordered {
    border: 1px solid var(--el-border-color-light);
  }

  .tabs-nav {
    position: relative;
    display: flex;
    background: var(--el-fill-color-blank);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .tab-item {
      position: relative;
      display: flex;
      flex: 1;
      gap: 6px;
      align-items: center;
      justify-content: center;
      padding: 14px 20px;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
      text-align: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;

      &:hover:not(.disabled) {
        color: var(--el-text-color-primary);
        background: var(--el-fill-color-light);
      }

      &.active {
        color: var(--el-color-primary);
      }

      &.disabled {
        color: var(--el-text-color-disabled);
        cursor: not-allowed;
        opacity: 0.6;
      }

      .tab-label {
        flex-shrink: 0;
      }

      .tab-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 6px;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        color: white;
        background: var(--el-color-danger);
        border-radius: 9px;
        transform: scale(0.9);
      }
    }

    .tab-indicator {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      background: var(--el-color-primary);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .tabs-content {
    padding: 24px;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .custom-tabs {
    .tabs-nav .tab-item {
      padding: 12px 10px;
      font-size: 13px;
    }

    .tabs-content {
      padding: 16px;
    }
  }
}
</style>
