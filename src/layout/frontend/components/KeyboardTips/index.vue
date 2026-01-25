<template>
  <div
    v-if="!isMobile"
    class="shortcut-guide-wrapper"
    :class="{ show: visible }"
  >
    <div class="keyboard-header">
      <div class="keyboardTitle">
        <i class="anzhiyufont anzhiyu-icon-keyboard" />
        博客快捷键
      </div>
      <div class="keyboard-subtitle">按住 Shift 键查看可用快捷键</div>
    </div>
    <div class="keybordList">
      <div
        v-for="(shortcut, index) in shortcuts"
        :key="index"
        class="keybordItem"
      >
        <div class="keyGroup">
          <kbd v-for="key in shortcut.keys" :key="key" class="key">
            {{ key }}
          </kbd>
        </div>
        <div class="keyContent">
          <div class="content">{{ shortcut.description }}</div>
        </div>
      </div>
    </div>
    <div class="keyboard-footer">
      <div class="footer-text">松开 Shift 键或点击外部区域关闭</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "ShortcutGuide"
});

interface Shortcut {
  keys: string[];
  description: string;
}

interface Props {
  visible: boolean;
  shortcuts: Shortcut[];
}

const props = defineProps<Props>();

// 检测是否为移动端
const isMobile = deviceDetection();
</script>

<style lang="scss" scoped>
.shortcut-guide-wrapper {
  position: fixed;
  top: 80px;
  left: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  min-width: 320px;
  max-width: 400px;
  padding: 24px;
  pointer-events: none;
  visibility: hidden;
  user-select: none;
  background: var(--anzhiyu-maskbgdeep);
  backdrop-filter: blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border: var(--style-border);
  border-radius: 16px;
  box-shadow: var(--anzhiyu-shadow-border);
  opacity: 0;
  transition:
    opacity 0.15s ease,
    visibility 0.15s ease,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  transform: translateY(-10px) scale(0.95);

  &.show {
    pointer-events: all;
    visibility: visible;
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.keyboard-header {
  margin-bottom: 16px;
}

.keyboardTitle {
  margin-bottom: 4px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--anzhiyu-fontcolor);
}

.keyboard-subtitle {
  font-size: 12px;
  line-height: 1.2;
  color: var(--anzhiyu-secondtext);
  opacity: 0.8;
}

.keybordList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keybordItem {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgb(0 0 0 / 5%);

    .keyContent .content {
      color: var(--anzhiyu-lighttext);
      cursor: auto;
    }

    .key {
      color: var(--anzhiyu-card-bg);
      cursor: auto;
      background: var(--anzhiyu-lighttext);
      box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
      transform: translateY(-1px);
    }
  }
}

.keyContent .content {
  font-size: 14px;
  line-height: 1.3;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  transition: color 0.2s ease;
}

.keyGroup {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  width: 150px;
  transform: translateY(1px);
}

.key {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 28px;
  padding: 6px 10px;
  margin-right: 6px;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas,
    "Courier New", monospace;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  background-color: var(--anzhiyu-card-bg);
  border: 1px solid var(--anzhiyu-secondtext);
  border-bottom: 2px solid var(--anzhiyu-secondtext);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  transition: all 0.2s ease;

  &:last-child {
    margin-right: 0;
  }
}

.keyboard-footer {
  padding-top: 16px;
  text-align: center;
  border-top: var(--style-border);
}

.footer-text {
  font-size: 11px;
  line-height: 1.2;
  color: var(--anzhiyu-secondtext);
  opacity: 0.7;
}

// 响应式设计
@media (width <= 768px) {
  .shortcut-guide-wrapper {
    right: 10px;
    left: 10px;
    min-width: auto;
    max-width: none;
  }

  .keyGroup {
    width: 80px;
  }

  .key {
    height: 24px;
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>
