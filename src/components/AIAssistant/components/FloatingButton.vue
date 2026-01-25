<!--
 * @Description: AI 助手浮动按钮
-->
<template>
  <Transition name="fab-slide">
    <div v-if="visible" class="ai-fab" @click="$emit('click')">
      <div class="fab-button">
        <IconifyIconOnline icon="ri:robot-2-line" />
      </div>
      <span class="fab-label">AI 助手</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "@/components/ReIcon";

defineProps<{
  visible: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<style lang="scss" scoped>
.ai-fab {
  position: fixed;
  left: 20px;
  bottom: 70px; // 上移避免与音乐播放器重叠
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0;
  height: 36px;
  padding-right: 0;
  overflow: hidden;
  cursor: pointer;
  background: var(--anzhiyu-card-bg);
  backdrop-filter: saturate(180%) blur(20px);
  border: var(--style-border);
  border-radius: 18px;
  transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);

  .fab-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 16px;
    color: var(--anzhiyu-fontcolor);
    transition: color 0.3s;
  }

  .fab-label {
    width: 0;
    padding-right: 0;
    overflow: hidden;
    font-size: 12px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
    white-space: nowrap;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  }

  &:hover {
    background: var(--anzhiyu-main);

    .fab-button {
      color: #fff;
    }

    .fab-label {
      width: 48px;
      padding-right: 12px;
      color: #fff;
      opacity: 1;
    }
  }
}

// 动画
.fab-slide-enter-active,
.fab-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.fab-slide-enter-from,
.fab-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

// 移动端隐藏浮动按钮（移动端使用顶部导航栏的 AI 按钮）
@media screen and (max-width: 768px) {
  .ai-fab {
    display: none;
  }
}
</style>
