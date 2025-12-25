<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`预览 - ${pageData?.title || '页面'}`"
    width="80%"
    :close-on-click-modal="false"
    append-to-body
    @close="handleClose"
  >
    <div v-if="pageData" class="preview-container">
      <div class="preview-header">
        <div class="page-info">
          <h3>{{ pageData.title }}</h3>
          <p class="path">{{ pageData.path }}</p>
          <p class="description">{{ pageData.description || "暂无描述" }}</p>
        </div>
        <div class="page-meta">
          <el-tag :type="pageData.is_published ? 'success' : 'info'">
            {{ pageData.is_published ? "已发布" : "未发布" }}
          </el-tag>
          <span class="sort">排序: {{ pageData.sort }}</span>
        </div>
      </div>

      <div class="preview-content" v-html="pageData.content" />
    </div>

    <div v-else class="no-data">
      <el-empty description="暂无页面数据" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleOpenInNewTab">
          在新标签页中打开
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PageData } from "@/api/page-management";

// Props
interface Props {
  visible: boolean;
  pageData?: PageData | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  pageData: null
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
};

// 在新标签页中打开
const handleOpenInNewTab = () => {
  if (props.pageData) {
    const url = window.location.origin + props.pageData.path;
    window.open(url, "_blank");
  }
};
</script>

<style scoped lang="scss">
.preview-container {
  .preview-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px;
    margin-bottom: 20px;
    background-color: var(--anzhiyu-background);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;

    .page-info {
      flex: 1;

      h3 {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 600;
        color: var(--anzhiyu-fontcolor);
      }

      .path {
        margin: 0 0 4px;
        font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
        font-size: 14px;
        color: var(--anzhiyu-fontcolor);
      }

      .description {
        margin: 0;
        font-size: 14px;
        color: var(--anzhiyu-secondtext);
      }
    }

    .page-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;

      .sort {
        font-size: 12px;
        color: var(--anzhiyu-secondtext);
      }
    }
  }

  .preview-content {
    max-width: 100%;
    overflow-x: auto;

    // 样式化HTML内容
    :deep(h1) {
      margin-bottom: 1.5rem;
      font-size: 2.5rem;
      font-weight: bold;
      color: var(--anzhiyu-fontcolor);
    }

    :deep(h2) {
      margin: 2rem 0 1rem;
      font-size: 2rem;
      font-weight: bold;
      color: var(--anzhiyu-fontcolor);
    }

    :deep(h3) {
      margin: 1.5rem 0 0.75rem;
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--anzhiyu-fontcolor);
    }

    :deep(p) {
      margin-bottom: 1rem;
      line-height: 1.6;
      color: var(--anzhiyu-fontcolor);
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 2rem;
      margin: 1rem 0;

      li {
        margin-bottom: 0.5rem;
        line-height: 1.6;
        color: var(--anzhiyu-fontcolor);
      }
    }

    :deep(strong) {
      font-weight: bold;
      color: var(--anzhiyu-fontcolor);
    }

    :deep(a) {
      color: var(--anzhiyu-theme);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    :deep(blockquote) {
      padding: 1rem;
      margin: 1rem 0;
      color: var(--anzhiyu-fontcolor);
      background-color: var(--anzhiyu-background);
    }

    :deep(code) {
      padding: 0.2rem 0.4rem;
      font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
      font-size: 0.9em;
      background-color: var(--anzhiyu-background);
      border-radius: 4px;
    }

    :deep(pre) {
      padding: 1rem;
      margin: 1rem 0;
      overflow-x: auto;
      background-color: var(--anzhiyu-background);
      border-radius: 8px;

      code {
        padding: 0;
        background: none;
      }
    }

    :deep(table) {
      width: 100%;
      margin: 1rem 0;
      border-collapse: collapse;

      th,
      td {
        padding: 8px 12px;
        text-align: left;
        border: var(--style-border-always);
      }

      th {
        font-weight: bold;
        background-color: var(--anzhiyu-background);
      }
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }
  }
}

.no-data {
  padding: 40px 0;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
