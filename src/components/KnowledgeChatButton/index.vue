<!--
 * @Description: 知识库问答浮动按钮
 * @Author: 安知鱼
 * @Date: 2025-01-23
-->
<template>
  <div v-if="enabled" class="knowledge-chat-button-wrapper">
    <!-- 浮动按钮 -->
    <el-tooltip content="AI 知识助手" placement="left" :show-after="500">
      <div
        class="chat-fab"
        :class="{ 'is-active': showDialog }"
        @click="toggleDialog"
      >
        <el-icon v-if="!showDialog"><ChatDotRound /></el-icon>
        <el-icon v-else><Close /></el-icon>
      </div>
    </el-tooltip>

    <!-- 问答弹窗 -->
    <KnowledgeChatDialog v-model="showDialog" :suggestions="suggestions" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ChatDotRound, Close } from "@element-plus/icons-vue";
import KnowledgeChatDialog from "@/components/KnowledgeChatDialog/index.vue";

interface Props {
  suggestions?: string[];
}

withDefaults(defineProps<Props>(), {
  suggestions: () => [
    "博客有哪些功能？",
    "如何使用Anheyu-app?",
    "评论系统怎么使用？"
  ]
});

const showDialog = ref(false);
const enabled = ref(true); // 可以从后端配置中读取

// 切换弹窗
const toggleDialog = () => {
  showDialog.value = !showDialog.value;
};

// 暴露方法
defineExpose({
  open: () => {
    showDialog.value = true;
  },
  close: () => {
    showDialog.value = false;
  },
  toggle: toggleDialog
});
</script>

<style lang="scss" scoped>
.knowledge-chat-button-wrapper {
  position: fixed;
  right: 24px;
  bottom: 100px;
  z-index: 1000;
}

.chat-fab {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #49b1f5, #36d1dc);
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(73, 177, 245, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .el-icon {
    font-size: 26px;
    transition: transform 0.3s;
  }

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 24px rgba(73, 177, 245, 0.5);
  }

  &:active {
    transform: scale(0.95);
  }

  &.is-active {
    background: #666;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);

    .el-icon {
      transform: rotate(180deg);
    }
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .knowledge-chat-button-wrapper {
    right: 16px;
    bottom: 80px;
  }

  .chat-fab {
    width: 48px;
    height: 48px;

    .el-icon {
      font-size: 22px;
    }
  }
}
</style>
