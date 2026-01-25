<script setup lang="ts">
import type {
  ArticleForm,
  PostCategory,
  PostTag,
  FullTextHiddenForm
} from "@/api/post/type";
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import AnDialog from "@/components/AnDialog/index.vue";
import { useUserStoreHook } from "@/store/modules/user";
import {
  getCacheStatus,
  preCachePodcast,
  type CacheStatus,
  type StreamPodcastRequest
} from "@/api/ai-podcast";

// 导入子组件
import {
  CommonSettingsTab,
  FullTextHiddenTab,
  PaidContentTab,
  AdvancedSettingsTab,
  AIPodcastCacheTab,
  DocSettingsTab,
  ScheduledPublishTab
} from "./tabs";
import { CategoryManagerDialog } from "./dialogs";

const userStore = useUserStoreHook();

// 判断是否是管理员
const isAdmin = computed(() => userStore.roles.includes("1"));

const props = defineProps<{
  modelValue: boolean;
  form: ArticleForm;
  categoryOptions: PostCategory[];
  tagOptions: PostTag[];
  isSubmitting: boolean;
  categorySelectKey: number;
  tagSelectKey: number;
  contentHtml?: string;
  fullTextHiddenConfig?: FullTextHiddenForm;
  articleId?: string | null;
}>();

const emit = defineEmits([
  "update:modelValue",
  "change-category",
  "change-tag",
  "confirm-publish",
  "refresh-categories",
  "update:fullTextHiddenConfig"
]);

const activeTab = ref("common");
const internalForm = props.form;
const copyrightType = ref<"original" | "reprint">("original");
const isCategoryManagerVisible = ref(false);

// === 全文隐藏配置 ===
const fullTextHiddenForm = ref<FullTextHiddenForm>({
  enabled: false,
  password: "",
  modal_top_description: "<p>请输入密码查看完整内容</p>",
  button_text: "查看全文",
  qr_code_url: "",
  input_placeholder: "请输入密码查看全文",
  initial_visible_height: 300,
  preview_char_count: 500,
  max_attempts: 5
});

// === 关键词标签相关状态 ===
const keywordTags = ref<string[]>([]);

// === AI播客缓存相关状态 ===
const cacheStatus = ref<CacheStatus | null>(null);
const isCheckingCache = ref(false);
const isPreCaching = ref(false);
const cachePollingTimer = ref<number | null>(null);
const isPolling = ref(false);

// 处理 AI 播客启用开关变更
const handleAIPodcastEnableChange = (value: boolean) => {
  if (!internalForm.extra_config) {
    internalForm.extra_config = {};
  }
  internalForm.extra_config.enable_ai_podcast = value;
};

// 获取缓存状态
const fetchCacheStatus = async () => {
  if (!props.articleId || !props.contentHtml) {
    return;
  }

  isCheckingCache.value = true;
  try {
    const request: StreamPodcastRequest = {
      article_id: props.articleId,
      content_html: props.contentHtml
    };
    const res = await getCacheStatus(request);
    const newStatus = res.data;
    cacheStatus.value = newStatus;

    if (
      isPolling.value &&
      newStatus?.is_complete &&
      !newStatus?.is_generating
    ) {
      stopCachePolling();
      ElMessage.success({
        message: "AI播客缓存已完成！",
        customClass: "high-z-index-message"
      });
    }

    if (
      newStatus?.is_generating &&
      !isPolling.value &&
      activeTab.value === "aiPodcast"
    ) {
      startCachePolling();
    }
  } catch (error: any) {
    console.error("[AI播客] 获取缓存状态失败:", error);
    if (!isPolling.value) {
      ElMessage.error({
        message: "获取缓存状态失败: " + (error.message || "未知错误"),
        customClass: "high-z-index-message"
      });
    }
  } finally {
    isCheckingCache.value = false;
  }
};

// 手动触发预缓存
const handlePreCache = async () => {
  if (!props.articleId || !props.contentHtml) {
    ElMessage.warning({
      message: "文章ID或内容不可用",
      customClass: "high-z-index-message"
    });
    return;
  }

  try {
    await ElMessageBox.confirm(
      "生成AI播客缓存可能需要较长时间，是否继续？",
      "确认生成缓存",
      {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "info",
        customClass: "high-z-index-message-box"
      }
    );
  } catch {
    return;
  }

  isPreCaching.value = true;
  try {
    const request: StreamPodcastRequest = {
      article_id: props.articleId,
      content_html: props.contentHtml
    };
    await preCachePodcast(request);
    ElMessage.success({
      message: "预缓存任务已启动，正在后台生成中...",
      customClass: "high-z-index-message"
    });
    startCachePolling();
  } catch (error: any) {
    console.error("[AI播客] 启动预缓存失败:", error);
    ElMessage.error({
      message: "启动预缓存失败: " + (error.message || "未知错误"),
      customClass: "high-z-index-message"
    });
  } finally {
    isPreCaching.value = false;
  }
};

// 开始轮询缓存状态
const startCachePolling = () => {
  if (cachePollingTimer.value) {
    clearInterval(cachePollingTimer.value);
  }

  isPolling.value = true;
  fetchCacheStatus();

  cachePollingTimer.value = window.setInterval(() => {
    fetchCacheStatus();
  }, 3000);
};

// 停止轮询
const stopCachePolling = () => {
  if (cachePollingTimer.value) {
    clearInterval(cachePollingTimer.value);
    cachePollingTimer.value = null;
  }
  isPolling.value = false;
};

// 监听tab切换
watch(activeTab, newTab => {
  if (newTab === "aiPodcast" && props.articleId && props.contentHtml) {
    fetchCacheStatus().then(() => {
      if (
        cacheStatus.value?.is_generating ||
        (cacheStatus.value?.has_cache && !cacheStatus.value.is_complete)
      ) {
        startCachePolling();
      }
    });
  } else {
    stopCachePolling();
  }
});

// 监听对话框打开/关闭
watch(
  () => props.modelValue,
  isVisible => {
    if (!isVisible) {
      stopCachePolling();
    } else if (
      isVisible &&
      activeTab.value === "aiPodcast" &&
      props.articleId &&
      props.contentHtml
    ) {
      fetchCacheStatus().then(() => {
        if (
          cacheStatus.value?.is_generating ||
          (cacheStatus.value?.has_cache && !cacheStatus.value.is_complete)
        ) {
          startCachePolling();
        }
      });
    }
  }
);

// 组件卸载时清理定时器
onUnmounted(() => {
  stopCachePolling();
});

const isVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

watch(
  () => props.modelValue,
  isVisible => {
    if (isVisible) {
      activeTab.value = "common";
      copyrightType.value = props.form.is_reprint ? "reprint" : "original";
      // 初始化关键词标签
      if (internalForm.keywords) {
        keywordTags.value = internalForm.keywords
          .split(",")
          .map(k => k.trim())
          .filter(k => k !== "");
      } else {
        keywordTags.value = [];
      }
      // 加载全文隐藏配置
      if (props.fullTextHiddenConfig) {
        fullTextHiddenForm.value = { ...props.fullTextHiddenConfig };
      }
    }
  }
);

// 监听全文隐藏配置变化
watch(
  () => props.fullTextHiddenConfig,
  newConfig => {
    if (newConfig) {
      fullTextHiddenForm.value = { ...newConfig };
    }
  },
  { deep: true }
);

watch(copyrightType, newType => {
  if (newType === "original") {
    internalForm.copyright_author = "";
    internalForm.copyright_author_href = "";
    internalForm.copyright_url = "";
  }
});

const handleConfirm = () => {
  // 验证发布时间不能是未来时间
  if (internalForm.custom_published_at) {
    const publishedTime = new Date(internalForm.custom_published_at);
    const now = new Date();
    if (publishedTime.getTime() > now.getTime()) {
      ElMessage.error({
        message: "发布时间不能设置为未来时间",
        customClass: "high-z-index-message"
      });
      return;
    }
  }

  // 验证全文隐藏配置
  if (fullTextHiddenForm.value.enabled) {
    if (
      !fullTextHiddenForm.value.password ||
      fullTextHiddenForm.value.password.trim() === ""
    ) {
      ElMessage.error({
        message: "请设置全文隐藏的访问密码",
        customClass: "high-z-index-message"
      });
      activeTab.value = "fullTextHidden";
      return;
    }
  }

  internalForm.copyright = true;
  // 设置文章类型（原创/转载）
  internalForm.is_reprint = copyrightType.value === "reprint";
  internalForm.keywords = keywordTags.value.join(", ");
  emit("update:fullTextHiddenConfig", fullTextHiddenForm.value);
  emit("confirm-publish");
};

// 分类管理相关
const handleRefreshCategories = () => {
  emit("refresh-categories");
};
</script>

<template>
  <div>
    <AnDialog
      v-model="isVisible"
      :title="form.status === 'PUBLISHED' ? '更新文章' : '发布文章'"
      width="860px"
      max-height="90vh"
      container-class="publish-dialog"
    >
      <el-tabs v-model="activeTab" class="publish-tabs">
        <el-tab-pane label="常用设置" name="common">
          <CommonSettingsTab
            :form="internalForm"
            :category-options="categoryOptions"
            :tag-options="tagOptions"
            :category-select-key="categorySelectKey"
            :tag-select-key="tagSelectKey"
            :copyright-type="copyrightType"
            :content-html="contentHtml"
            @change-category="values => emit('change-category', values)"
            @change-tag="values => emit('change-tag', values)"
            @update:copyright-type="val => (copyrightType = val)"
            @open-category-manager="isCategoryManagerVisible = true"
          />
        </el-tab-pane>

        <el-tab-pane label="全文隐藏" name="fullTextHidden">
          <FullTextHiddenTab v-model:form="fullTextHiddenForm" />
        </el-tab-pane>

        <el-tab-pane v-if="isAdmin" label="付费设置" name="paid">
          <PaidContentTab />
        </el-tab-pane>

        <el-tab-pane label="文档模式" name="docSettings">
          <DocSettingsTab :form="internalForm" />
        </el-tab-pane>

        <el-tab-pane label="高级设置" name="advanced">
          <AdvancedSettingsTab
            v-model:keyword-tags="keywordTags"
            :form="internalForm"
            :copyright-type="copyrightType"
          />
        </el-tab-pane>

        <el-tab-pane label="AI播客缓存" name="aiPodcast">
          <AIPodcastCacheTab
            :form="internalForm"
            :article-id="articleId"
            :cache-status="cacheStatus"
            :is-checking-cache="isCheckingCache"
            :is-pre-caching="isPreCaching"
            :is-polling="isPolling"
            @update:enable-ai-podcast="handleAIPodcastEnableChange"
            @fetch-cache-status="fetchCacheStatus"
            @pre-cache="handlePreCache"
          />
        </el-tab-pane>

        <el-tab-pane label="定时发布" name="scheduled">
          <ScheduledPublishTab :form="internalForm" />
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="isVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="isSubmitting"
          @click="handleConfirm"
        >
          {{
            form.status === "SCHEDULED"
              ? "设置定时发布"
              : form.status === "PUBLISHED"
                ? "确认更新"
                : "确认发布"
          }}
        </el-button>
      </template>
    </AnDialog>

    <CategoryManagerDialog
      v-model="isCategoryManagerVisible"
      :category-options="categoryOptions"
      @refresh-categories="handleRefreshCategories"
    />
  </div>
</template>

<!-- 全局样式：隐藏下拉框选中项的勾选符号 -->
<style lang="scss">
.hide-selected-check .el-select-dropdown__item.is-selected::after {
  display: none;
}
</style>

<style lang="scss" scoped>
.publish-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}

:deep(.el-form-item__label) {
  .label-icon {
    margin-left: 4px;
    color: var(--anzhiyu-secondtext);
    vertical-align: middle;
  }

  .manage-btn,
  .ai-summary-btn {
    margin-left: auto;
    font-weight: normal;
  }
}

.status-radio-group {
  width: 100%;

  :deep(.el-radio-button) {
    width: calc(100% / 3);

    .el-radio-button__inner {
      width: 100%;
    }
  }
}
</style>
