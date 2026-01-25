<!--
 * @Description: AI 助手操作栏 - 简洁高级风格
-->
<template>
  <div class="action-bar">
    <!-- 左侧：清空按钮 -->
    <button class="icon-btn" title="清空对话" @click="$emit('clear')">
      <IconifyIconOnline icon="ri:delete-bin-line" />
    </button>

    <!-- 中间：模式切换 -->
    <div class="mode-switch">
      <div class="switch-track">
        <div class="switch-thumb" :class="{ search: mode === 'search' }" />
      </div>
      <button
        class="switch-option"
        :class="{ active: mode === 'chat' }"
        @click="$emit('update:mode', 'chat')"
      >
        <IconifyIconOnline icon="ri:chat-3-line" />
        <span>聊天</span>
      </button>
      <button
        class="switch-option"
        :class="{ active: mode === 'search' }"
        @click="$emit('update:mode', 'search')"
      >
        <IconifyIconOnline icon="ri:search-line" />
        <span>搜索</span>
      </button>
    </div>

    <!-- 右侧：关闭按钮 -->
    <button class="icon-btn" title="关闭" @click="$emit('close')">
      <IconifyIconOnline icon="ri:close-line" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "@/components/ReIcon";

defineProps<{
  mode: "chat" | "search";
}>();

defineEmits<{
  "update:mode": [value: "chat" | "search"];
  clear: [];
  close: [];
}>();
</script>

<style lang="scss" scoped>
.action-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  margin-bottom: 10px;
}

// 图标按钮
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 16px;
  color: var(--anzhiyu-secondtext);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    color: var(--anzhiyu-fontcolor);
    background: var(--anzhiyu-card-btn-bg);
  }

  &:active {
    transform: scale(0.92);
  }
}

// 模式切换
.mode-switch {
  position: relative;
  display: flex;
  gap: 0;
  align-items: center;
  height: 32px;
  padding: 2px;
  background: var(--anzhiyu-card-btn-bg);
  border-radius: 10px;

  .switch-track {
    position: absolute;
    top: 2px;
    left: 2px;
    width: calc(50% - 2px);
    height: calc(100% - 4px);
    pointer-events: none;
  }

  .switch-thumb {
    width: 100%;
    height: 100%;
    background: var(--anzhiyu-card-bg);
    border-radius: 8px;
    box-shadow: var(--anzhiyu-shadow-border);
    transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);

    &.search {
      transform: translateX(100%);
    }
  }

  .switch-option {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
    width: 68px;
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
    font-weight: 500;
    color: var(--anzhiyu-secondtext);
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 8px;
    transition: color 0.2s;

    &.active {
      color: var(--anzhiyu-fontcolor);
    }

    &:not(.active):hover {
      color: var(--anzhiyu-fontcolor);
    }

    span {
      font-size: 12px;
    }
  }
}

// 移动端优化
@media screen and (max-width: 640px) {
  .action-bar {
    gap: 8px;
    padding: 0;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    font-size: 18px;
    background: var(--anzhiyu-card-btn-bg);
    border-radius: 10px;

    &:active {
      background: var(--anzhiyu-main-op);
    }
  }

  .mode-switch {
    flex: 1;
    max-width: 200px;
    justify-content: center;
    height: 36px;
    border-radius: 12px;

    .switch-track {
      top: 3px;
      left: 3px;
      height: calc(100% - 6px);
    }

    .switch-thumb {
      border-radius: 10px;
    }

    .switch-option {
      flex: 1;
      width: auto;
      min-width: 60px;
      height: 30px;
      gap: 5px;
      padding: 0 10px;
      font-size: 12px;
      border-radius: 10px;

      span {
        display: inline;
      }
    }
  }
}
</style>
