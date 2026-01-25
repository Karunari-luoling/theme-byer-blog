<!--
 * @Description: 知识库问答弹窗组件
 * @Author: 安知鱼
 * @Date: 2025-01-23
-->
<template>
  <AnDialog
    v-model="visible"
    title=""
    width="700px"
    :close-on-click-modal="false"
    hide-footer
    hide-header
    class="knowledge-chat-dialog-wrapper"
  >
    <KnowledgeChat ref="chatRef" :suggestions="suggestions" />
  </AnDialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import AnDialog from "@/components/AnDialog/index.vue";
import KnowledgeChat from "@/components/KnowledgeChat/index.vue";

interface Props {
  modelValue: boolean;
  suggestions?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  suggestions: () => [
    "博客有哪些功能？",
    "如何使用Anheyu-app?",
    "评论系统怎么使用？"
  ]
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const chatRef = ref<InstanceType<typeof KnowledgeChat> | null>(null);

const visible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 暴露方法
defineExpose({
  sendMessage: (text: string) => {
    chatRef.value?.sendMessage(text);
  },
  clearMessages: () => {
    chatRef.value?.clearMessages();
  }
});
</script>

<style lang="scss">
.knowledge-chat-dialog-wrapper {
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
  }

  .el-dialog__body {
    padding: 0;
  }

  .knowledge-chat {
    height: 600px;
    border-radius: 0;
    box-shadow: none;
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .knowledge-chat-dialog-wrapper {
    .el-dialog {
      width: 95% !important;
      margin: 10px auto;
    }

    .knowledge-chat {
      height: 70vh;
    }
  }
}
</style>
