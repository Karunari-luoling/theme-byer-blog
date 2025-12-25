<script setup lang="ts">
import type {
  ArticleForm,
  PostCategory,
  PostTag,
  FullTextHiddenForm
} from "@/api/post/type";
import {
  Plus,
  Remove,
  Setting,
  InfoFilled,
  Edit,
  Delete,
  Link,
  Refresh
} from "@element-plus/icons-vue";
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ImageUpload from "@/components/ImageUpload/index.vue";
import {
  updateCategory,
  deleteCategory,
  createCategory,
  getPrimaryColor
} from "@/api/post";
import { useAISummary } from "@/composables/useAISummary";
import AnDialog from "@/components/AnDialog/index.vue";
import { useUserStoreHook } from "@/store/modules/user";
import {
  getCacheStatus,
  preCachePodcast,
  type CacheStatus,
  type StreamPodcastRequest
} from "@/api/ai-podcast";

const userStore = useUserStoreHook();

// 判断是否是管理员（普通用户也可以使用PRO高级功能，但只能操作自己的文章）
const isAdmin = computed(() => {
  return userStore.roles.includes("1");
});

const props = defineProps<{
  modelValue: boolean;
  form: ArticleForm;
  categoryOptions: PostCategory[];
  tagOptions: PostTag[];
  isSubmitting: boolean;
  categorySelectKey: number;
  tagSelectKey: number;
  contentHtml?: string; // 用于AI摘要生成的HTML内容
  fullTextHiddenConfig?: FullTextHiddenForm; // 全文隐藏配置
  articleId?: string | null; // 文章ID（用于获取AI播客状态）
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

// === 分类管理弹窗所需状态 ===
const newCategoryForm = ref({
  name: "",
  is_series: false
});
const isCreating = ref(false);
const editingCategoryId = ref<string | null>(null);
const editingCategoryName = ref("");
const loadingStates = ref<Record<string, boolean>>({}); // 用于跟踪每行的加载状态
const isFetchingColor = ref(false); // 用于跟踪主色调获取状态

// === 关键词标签相关状态 ===
const keywordTags = ref<string[]>([]);

// === AI摘要生成 ===
const { isGenerating: isGeneratingAISummary, generate: generateAI } =
  useAISummary({
    maxSummaryCount: 3,
    onSuccess: summary => {
      // 初始化summaries数组
      if (!internalForm.summaries) internalForm.summaries = [];
      // 添加AI生成的摘要
      internalForm.summaries.push(summary);
    }
  });

// === AI播客缓存相关状态 ===
const cacheStatus = ref<CacheStatus | null>(null);
const isCheckingCache = ref(false);
const isPreCaching = ref(false);
const cachePollingTimer = ref<number | null>(null);
const isPolling = ref(false);

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

    // 如果正在轮询且缓存已完成，停止轮询
    if (
      isPolling.value &&
      newStatus?.is_complete &&
      !newStatus?.is_generating
    ) {
      stopCachePolling();
      ElMessage.success("AI播客缓存已完成！");
    }

    // 如果检测到正在生成中，但还没有开始轮询，自动开始轮询
    if (
      newStatus?.is_generating &&
      !isPolling.value &&
      activeTab.value === "aiPodcast"
    ) {
      startCachePolling();
    }
  } catch (error: any) {
    console.error("[AI播客] 获取缓存状态失败:", error);
    // 只在非轮询时显示错误，避免轮询时频繁弹窗
    if (!isPolling.value) {
      ElMessage.error("获取缓存状态失败: " + (error.message || "未知错误"));
    }
  } finally {
    isCheckingCache.value = false;
  }
};

// 手动触发预缓存
const handlePreCache = async () => {
  if (!props.articleId || !props.contentHtml) {
    ElMessage.warning("文章ID或内容不可用");
    return;
  }

  // 确认操作
  try {
    await ElMessageBox.confirm(
      "生成AI播客缓存可能需要较长时间，是否继续？",
      "确认生成缓存",
      {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "info"
      }
    );
  } catch {
    return; // 用户取消
  }

  isPreCaching.value = true;
  try {
    const request: StreamPodcastRequest = {
      article_id: props.articleId,
      content_html: props.contentHtml
    };
    await preCachePodcast(request);
    ElMessage.success("预缓存任务已启动，正在后台生成中...");
    // 开始轮询缓存状态
    startCachePolling();
  } catch (error: any) {
    console.error("[AI播客] 启动预缓存失败:", error);
    ElMessage.error("启动预缓存失败: " + (error.message || "未知错误"));
  } finally {
    isPreCaching.value = false;
  }
};

// 开始轮询缓存状态
const startCachePolling = () => {
  // 清除之前的定时器
  if (cachePollingTimer.value) {
    clearInterval(cachePollingTimer.value);
  }

  isPolling.value = true;

  // 立即获取一次状态
  fetchCacheStatus();

  // 每3秒轮询一次
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

// 格式化字节数
const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

// 格式化时间
const formatTime = (timestamp: number): string => {
  if (!timestamp || timestamp === 0) return "未知";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// 监听tab切换，切换到AI播客tab时获取状态
watch(activeTab, newTab => {
  if (newTab === "aiPodcast" && props.articleId && props.contentHtml) {
    fetchCacheStatus().then(() => {
      // 如果正在生成中或缓存不完整，开始轮询
      if (
        cacheStatus.value?.is_generating ||
        (cacheStatus.value?.has_cache && !cacheStatus.value.is_complete)
      ) {
        startCachePolling();
      }
    });
  } else {
    // 切换到其他tab时停止轮询
    stopCachePolling();
  }
});

// 监听对话框打开/关闭
watch(
  () => props.modelValue,
  isVisible => {
    if (!isVisible) {
      // 关闭对话框时停止轮询
      stopCachePolling();
    } else if (
      isVisible &&
      activeTab.value === "aiPodcast" &&
      props.articleId &&
      props.contentHtml
    ) {
      // 打开对话框且当前在AI播客tab时，获取状态
      fetchCacheStatus().then(() => {
        // 如果正在生成中或缓存不完整，开始轮询
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

const hasSeriesCategory = computed(() => {
  if (
    !internalForm.post_category_ids ||
    internalForm.post_category_ids.length === 0
  ) {
    return false;
  }
  const selectedId = internalForm.post_category_ids[0];
  const category = props.categoryOptions.find(c => c.id === selectedId);
  return category?.is_series ?? false;
});

const hasMultipleRegularCategories = computed(() => {
  return (
    internalForm.post_category_ids &&
    internalForm.post_category_ids.length > 0 &&
    !hasSeriesCategory.value
  );
});

watch(
  () => props.modelValue,
  isVisible => {
    if (isVisible) {
      activeTab.value = "common";
      copyrightType.value = props.form.copyright_author
        ? "reprint"
        : "original";
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

const statusOptions = [
  { value: "PUBLISHED", label: "发布" },
  { value: "DRAFT", label: "草稿" },
  { value: "ARCHIVED", label: "归档" }
];

const isCategoryNameExists = (name: string): boolean => {
  return props.categoryOptions.some(
    cat => cat.name.toLowerCase() === name.toLowerCase()
  );
};

// === 分类管理弹窗相关方法 ===

// 开始行内编辑
const handleEditCategory = (category: PostCategory) => {
  editingCategoryId.value = category.id;
  editingCategoryName.value = category.name;
  nextTick(() => {
    // 聚焦输入框
    const inputEl = document.querySelector(
      `#category-edit-input-${category.id} input`
    );
    if (inputEl) {
      (inputEl as HTMLElement).focus();
    }
  });
};

// 取消编辑
const cancelEdit = () => {
  editingCategoryId.value = null;
  editingCategoryName.value = "";
};

// 提交名称更新
const handleUpdateCategoryName = async (category: PostCategory) => {
  if (
    !editingCategoryName.value.trim() ||
    editingCategoryName.value.trim() === category.name
  ) {
    cancelEdit();
    return;
  }
  loadingStates.value[category.id] = true;
  try {
    await updateCategory(category.id, { name: editingCategoryName.value });
    ElMessage.success("分类名称更新成功");
    emit("refresh-categories");
    cancelEdit();
  } catch (error: any) {
    ElMessage.error(error.message || "更新失败");
  } finally {
    loadingStates.value[category.id] = false;
  }
};

// 切换分类类型
const toggleCategoryType = async (category: PostCategory) => {
  const newIsSeries = !category.is_series;
  const action = newIsSeries ? "设置为系列" : "设置为普通分类";
  try {
    await ElMessageBox.confirm(
      `确定要将分类 "${category.name}" ${action}吗？`,
      "确认操作",
      {
        type: "warning"
      }
    );
    loadingStates.value[category.id] = true;
    await updateCategory(category.id, { is_series: newIsSeries });
    ElMessage.success(`${action}成功`);
    emit("refresh-categories");
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message || "操作失败");
  } finally {
    loadingStates.value[category.id] = false;
  }
};

// 删除分类
const handleDeleteCategory = async (category: PostCategory) => {
  const message =
    category.count > 0
      ? `此操作将删除分类 "${category.name}"，其下的 ${category.count} 篇文章将不再属于该分类。是否继续？`
      : `确定要删除分类 "${category.name}" 吗？此操作不可恢复。`;

  try {
    await ElMessageBox.confirm(message, "警告", {
      type: "warning",
      confirmButtonText: "确认删除"
    });
    loadingStates.value[category.id] = true;
    await deleteCategory(category.id);
    ElMessage.success("删除成功");
    emit("refresh-categories");
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message || "删除失败");
  } finally {
    loadingStates.value[category.id] = false;
  }
};

// 创建新分类
const handleCreateCategory = async () => {
  const name = newCategoryForm.value.name.trim();
  if (!name) {
    ElMessage.warning("分类名称不能为空");
    return;
  }
  if (isCategoryNameExists(name)) {
    ElMessage.error(`分类 "${name}" 已存在`);
    return;
  }
  isCreating.value = true;
  try {
    await createCategory({ name, is_series: newCategoryForm.value.is_series });
    ElMessage.success("创建成功");
    newCategoryForm.value.name = "";
    newCategoryForm.value.is_series = false;
    emit("refresh-categories");
  } catch (error: any) {
    ElMessage.error(error.message || "创建失败");
  } finally {
    isCreating.value = false;
  }
};

const addSummaryInput = () => {
  if (!internalForm.summaries) internalForm.summaries = [];
  if (internalForm.summaries.length < 3) internalForm.summaries.push("");
};

const removeSummaryInput = (index: number) => {
  internalForm.summaries.splice(index, 1);
};

// 生成AI摘要
const generateAISummary = async () => {
  const htmlContent = props.contentHtml || "";
  const summaries = internalForm.summaries || [];

  // 调试输出
  console.log("[PublishDialog] 尝试生成AI摘要");
  console.log("[PublishDialog] HTML内容长度:", htmlContent.length);
  console.log("[PublishDialog] 当前摘要数量:", summaries.length);
  await generateAI(htmlContent, summaries);
};

// 禁用未来日期
const disabledFutureDate = (time: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDate = new Date(
    time.getFullYear(),
    time.getMonth(),
    time.getDate()
  );

  // 禁用今天之后的所有日期
  return selectedDate.getTime() > today.getTime();
};

// 禁用未来的小时（仅当选择的是今天时）
const disabledFutureHours = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const disabledHours: number[] = [];

  // 如果当前选择的日期是今天，禁用当前小时之后的所有小时
  if (internalForm.custom_published_at) {
    const selectedDate = new Date(internalForm.custom_published_at);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    if (selectedDay.getTime() === today.getTime()) {
      // 禁用当前小时之后的所有小时（24小时制）
      for (let i = currentHour + 1; i < 24; i++) {
        disabledHours.push(i);
      }
    }
  }

  return disabledHours;
};

// 禁用未来的分钟（仅当选择的是今天且是当前小时时）
const disabledFutureMinutes = (hour: number) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const disabledMinutes: number[] = [];

  if (internalForm.custom_published_at) {
    const selectedDate = new Date(internalForm.custom_published_at);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    // 如果选择的是今天且是当前小时，禁用当前分钟之后的所有分钟
    if (selectedDay.getTime() === today.getTime() && hour === currentHour) {
      for (let i = currentMinute + 1; i < 60; i++) {
        disabledMinutes.push(i);
      }
    }
  }

  return disabledMinutes;
};

// 禁用未来的秒（仅当选择的是今天且是当前小时和当前分钟时）
const disabledFutureSeconds = (hour: number, minute: number) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();
  const disabledSeconds: number[] = [];

  if (internalForm.custom_published_at) {
    const selectedDate = new Date(internalForm.custom_published_at);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    // 如果选择的是今天且是当前小时和当前分钟，禁用当前秒之后的所有秒
    if (
      selectedDay.getTime() === today.getTime() &&
      hour === currentHour &&
      minute === currentMinute
    ) {
      for (let i = currentSecond + 1; i < 60; i++) {
        disabledSeconds.push(i);
      }
    }
  }

  return disabledSeconds;
};

const handleConfirm = () => {
  // 验证发布时间不能是未来时间
  if (internalForm.custom_published_at) {
    const publishedTime = new Date(internalForm.custom_published_at);
    const now = new Date();
    if (publishedTime.getTime() > now.getTime()) {
      ElMessage.error("发布时间不能设置为未来时间");
      return;
    }
  }

  // 验证全文隐藏配置：如果启用了全文隐藏，密码不能为空
  if (fullTextHiddenForm.value.enabled) {
    if (
      !fullTextHiddenForm.value.password ||
      fullTextHiddenForm.value.password.trim() === ""
    ) {
      ElMessage.error("请设置全文隐藏的访问密码");
      // 切换到全文隐藏标签页
      activeTab.value = "fullTextHidden";
      return;
    }
  }

  internalForm.copyright = true;
  // 将关键词标签数组转换为逗号分隔的字符串
  internalForm.keywords = keywordTags.value.join(", ");
  // 提交全文隐藏配置
  emit("update:fullTextHiddenConfig", fullTextHiddenForm.value);
  emit("confirm-publish");
};

// 手动获取主色调
const handleFetchPrimaryColor = async () => {
  const imageUrl = internalForm.top_img_url || internalForm.cover_url;

  if (!imageUrl) {
    ElMessage.warning("请先上传封面图或顶部大图");
    return;
  }

  console.log("[PublishDialog] 开始获取主色调，图片URL:", imageUrl);
  isFetchingColor.value = true;

  try {
    const response = await getPrimaryColor(imageUrl);
    console.log("[PublishDialog] 主色调响应:", response);

    if (response?.data?.primary_color) {
      internalForm.primary_color = response.data.primary_color;
      ElMessage.success(`主色调获取成功: ${response.data.primary_color}`);
    } else {
      console.error("[PublishDialog] 响应格式异常:", response);
      ElMessage.error("主色调获取失败：响应格式异常");
    }
  } catch (error: any) {
    console.error("[PublishDialog] 主色调获取失败:", error);
    const errorMsg =
      error?.response?.data?.message || error?.message || "主色调获取失败";
    ElMessage.error(errorMsg);
  } finally {
    isFetchingColor.value = false;
    console.log("[PublishDialog] 主色调获取完成");
  }
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
          <el-form :model="internalForm" label-position="top">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="分类" prop="post_category_ids">
                  <template #label>
                    <span>分类</span>
                    <el-tooltip placement="top" :show-arrow="false">
                      <template #content>
                        一篇文章可选择多个普通分类，或单个系列分类。<br />
                        如需增改，请点击右侧按钮进行管理。
                      </template>
                      <el-icon class="label-icon"><InfoFilled /></el-icon>
                    </el-tooltip>
                    <el-button
                      type="primary"
                      :icon="Setting"
                      text
                      size="small"
                      class="manage-btn"
                      @click="isCategoryManagerVisible = true"
                    >
                      管理分类
                    </el-button>
                  </template>
                  <el-select
                    :key="props.categorySelectKey"
                    v-model="internalForm.post_category_ids"
                    multiple
                    filterable
                    placeholder="请选择分类"
                    style="width: 100%"
                    no-data-text="暂无分类，请在'管理分类'中添加"
                    :multiple-limit="hasSeriesCategory ? 1 : 3"
                    popper-class="hide-selected-check"
                    @change="values => emit('change-category', values)"
                  >
                    <el-option
                      v-for="item in categoryOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                      :disabled="
                        (hasSeriesCategory &&
                          item.id !== internalForm.post_category_ids[0]) ||
                        (hasMultipleRegularCategories && item.is_series)
                      "
                    >
                      <div class="category-option-item">
                        <span>{{ item.name }}</span>
                        <el-tag
                          v-if="item.is_series"
                          type="success"
                          size="small"
                          effect="light"
                          round
                          >系列</el-tag
                        >
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="标签" prop="post_tag_ids">
                  <el-select
                    :key="props.tagSelectKey"
                    v-model="internalForm.post_tag_ids"
                    multiple
                    filterable
                    allow-create
                    default-first-option
                    placeholder="选择或创建标签"
                    style="width: 100%"
                    no-data-text="输入名称后按回车键创建"
                    @change="values => emit('change-tag', values)"
                  >
                    <el-option
                      v-for="item in tagOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="封面图" prop="cover_url">
                  <ImageUpload
                    v-model="internalForm.cover_url"
                    :can-upload="isAdmin"
                  />
                  <el-input
                    v-model="internalForm.cover_url"
                    placeholder="或直接输入图片URL"
                    style="margin-top: 8px"
                  >
                    <template #prefix>
                      <el-icon><Link /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="顶部大图 (可选)" prop="top_img_url">
                  <ImageUpload
                    v-model="internalForm.top_img_url"
                    :can-upload="isAdmin"
                  />
                  <el-input
                    v-model="internalForm.top_img_url"
                    placeholder="或直接输入图片URL"
                    style="margin-top: 8px"
                  >
                    <template #prefix>
                      <el-icon><Link /></el-icon>
                    </template>
                  </el-input>
                  <div class="form-item-help">若不填, 将自动使用封面图URL</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="状态" prop="status">
                  <el-radio-group
                    v-model="internalForm.status"
                    class="status-radio-group"
                  >
                    <el-radio-button
                      v-for="item in statusOptions"
                      :key="item.value"
                      :value="item.value"
                      >{{ item.label }}</el-radio-button
                    >
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="文章类型">
                  <el-radio-group v-model="copyrightType">
                    <el-radio-button value="original">原创</el-radio-button>
                    <el-radio-button value="reprint">转载</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <div v-if="copyrightType === 'reprint'">
                  <el-form-item label="版权作者 (可选)" prop="copyright_author">
                    <el-input
                      v-model="internalForm.copyright_author"
                      placeholder="请输入原文作者"
                    />
                  </el-form-item>
                </div>
              </el-col>
              <el-col :span="24">
                <el-form-item label="摘要" prop="summaries">
                  <template #label>
                    <span>摘要</span>
                    <el-button
                      type="primary"
                      text
                      size="small"
                      class="ai-summary-btn"
                      :loading="isGeneratingAISummary"
                      :disabled="
                        !props.contentHtml ||
                        (internalForm.summaries &&
                          internalForm.summaries.length >= 3)
                      "
                      @click="generateAISummary"
                    >
                      <i class="anzhiyufont anzhiyu-icon-bilibili" />
                      {{ isGeneratingAISummary ? "生成中..." : "AI生成" }}
                    </el-button>
                  </template>
                  <div
                    v-for="(summary, index) in internalForm.summaries"
                    :key="index"
                    class="summary-item"
                  >
                    <el-input
                      v-model="internalForm.summaries[index]"
                      placeholder="请输入单行摘要..."
                    />
                    <el-button
                      :icon="Remove"
                      type="danger"
                      circle
                      plain
                      @click="removeSummaryInput(index)"
                    />
                  </div>
                  <el-button
                    v-if="
                      !internalForm.summaries ||
                      internalForm.summaries.length < 3
                    "
                    :icon="Plus"
                    type="primary"
                    plain
                    style="width: 100%"
                    @click="addSummaryInput"
                  >
                    新增摘要 ({{ internalForm.summaries?.length || 0 }}/3)
                  </el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- PRO高级功能：全文隐藏（管理员和普通用户都可以使用） -->
        <el-tab-pane label="全文隐藏" name="fullTextHidden">
          <el-form :model="fullTextHiddenForm" label-position="top">
            <el-row :gutter="24">
              <el-col :span="24">
                <el-alert
                  title="全文隐藏功能"
                  type="info"
                  :closable="false"
                  show-icon
                >
                  <template #default>
                    <p>
                      全文隐藏功能允许您对整篇文章设置密码保护，用户需要输入正确的密码才能查看完整内容。
                    </p>
                    <p>
                      启用后，文章将只显示预览内容，点击"查看全文"按钮后需要验证密码。
                    </p>
                    <p>优先级：全文隐藏 > 密码保护内容 > 付费内容</p>
                  </template>
                </el-alert>
              </el-col>

              <el-col :span="24">
                <el-form-item label="启用全文隐藏">
                  <div>
                    <el-switch v-model="fullTextHiddenForm.enabled" />
                    <div class="form-item-help">
                      启用后，用户需要输入密码才能查看完整文章内容
                    </div>
                  </div>
                </el-form-item>
              </el-col>

              <template v-if="fullTextHiddenForm.enabled">
                <el-col :span="24">
                  <el-form-item label="访问密码" prop="password" required>
                    <el-input
                      v-model="fullTextHiddenForm.password"
                      type="password"
                      show-password
                      placeholder="请输入访问密码"
                    />
                    <div class="form-item-help">
                      用户需要输入此密码才能查看完整内容，请妥善保管
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="按钮文案" prop="button_text">
                    <el-input
                      v-model="fullTextHiddenForm.button_text"
                      placeholder="查看全文"
                    />
                    <div class="form-item-help">显示在文章末尾的按钮文字</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="输入框提示" prop="input_placeholder">
                    <el-input
                      v-model="fullTextHiddenForm.input_placeholder"
                      placeholder="请输入密码查看全文"
                    />
                    <div class="form-item-help">密码输入框的提示文字</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item
                    label="初始显示高度(px)"
                    prop="initial_visible_height"
                  >
                    <el-input-number
                      v-model="fullTextHiddenForm.initial_visible_height"
                      :min="100"
                      :max="1000"
                      :step="50"
                      controls-position="right"
                      style="width: 100%"
                    />
                    <div class="form-item-help">
                      文章初始显示的高度，超出部分将被隐藏
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="预览字符数" prop="preview_char_count">
                    <el-input-number
                      v-model="fullTextHiddenForm.preview_char_count"
                      :min="100"
                      :max="5000"
                      :step="100"
                      controls-position="right"
                      style="width: 100%"
                    />
                    <div class="form-item-help">
                      未验证密码时显示的文章字符数量
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="最大尝试次数" prop="max_attempts">
                    <el-input-number
                      v-model="fullTextHiddenForm.max_attempts"
                      :min="0"
                      :max="100"
                      controls-position="right"
                      style="width: 100%"
                    />
                    <div class="form-item-help">
                      0表示不限制，建议设置为3-10次
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="二维码链接(可选)" prop="qr_code_url">
                    <el-input
                      v-model="fullTextHiddenForm.qr_code_url"
                      placeholder="https://example.com/qrcode"
                    />
                    <div class="form-item-help">
                      可用于引导用户付费或关注以获取密码
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :span="24">
                  <el-form-item
                    label="弹窗顶部描述(支持HTML)"
                    prop="modal_top_description"
                  >
                    <el-input
                      v-model="fullTextHiddenForm.modal_top_description"
                      type="textarea"
                      :rows="3"
                      placeholder="<p>请输入密码查看完整内容</p>"
                    />
                    <div class="form-item-help">
                      在密码输入框上方显示的描述文字，支持HTML标签
                    </div>
                  </el-form-item>
                </el-col>
              </template>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- PRO高级功能：付费设置（仅管理员可用） -->
        <el-tab-pane v-if="isAdmin" label="付费设置" name="paid">
          <el-form :model="internalForm" label-position="top">
            <el-row :gutter="24">
              <el-col :span="24">
                <el-alert
                  title="付费内容功能"
                  type="info"
                  :closable="false"
                  show-icon
                >
                  <template #default>
                    <p>
                      在文章中使用
                      <code>:::paid-content</code> 标签包裹需要付费的内容。
                    </p>
                    <p>
                      支持自定义付费标题和价格：使用
                      <code>paid-title="标题"</code> 和
                      <code>price="9.99"</code> 参数。
                    </p>
                    <p>
                      支持在付费内容中使用所有 Markdown
                      语法，包括代码块、图片、列表等。
                    </p>
                    <p>用户需要购买后才能查看被标签包裹的内容。</p>
                  </template>
                </el-alert>
              </el-col>

              <el-col :span="24">
                <el-form-item label="付费内容预览">
                  <div class="paid-content-preview">
                    <div class="paid-content-example">
                      <h4>示例：如何在文章中使用付费内容标签</h4>

                      <div class="example-section">
                        <h5>基础用法：</h5>
                        <pre><code>:::paid-content
这里是要付费才能查看的内容。

支持多段落内容：
- 列表项
- 代码块
- 图片等

```javascript
console.log("付费代码示例");
```
:::</code></pre>
                      </div>

                      <div class="example-section">
                        <h5>带参数的用法：</h5>
                        <pre><code>:::paid-content paid-title="高级教程" price="9.99"
# 这是付费内容标题

这里是付费内容，包含：
- 高级技巧分享
- 完整代码实现
- 详细解析过程

```typescript
// 付费代码示例
function advancedFeature() {
  return "这是高级功能实现";
}
```
:::</code></pre>
                      </div>

                      <div class="example-section">
                        <h5>参数说明：</h5>
                        <pre><code>:::paid-content title="标题" price="价格"
或
:::paid-content paid-title="标题" price="价格"

- paid-title: 付费内容标题（推荐）
- title: 付费内容标题（向下兼容）
- price: 付费价格，支持小数（如：9.99）

如果同时设置 paid-title 和 title，优先使用 paid-title
:::</code></pre>
                      </div>
                    </div>

                    <div class="paid-content-tips">
                      <h5>使用提示：</h5>
                      <ul>
                        <li>
                          在 Markdown 编辑器中点击工具栏的 💰
                          按钮快速插入付费内容标签
                        </li>
                        <li>
                          付费内容标签必须成对出现：<code>:::paid-content</code>
                          开始，<code>:::</code> 结束
                        </li>
                        <li>
                          支持参数设置：使用
                          <code>paid-title="标题"</code> 设置付费内容标题，使用
                          <code>price="价格"</code> 设置价格
                        </li>
                        <li>
                          参数优先级：<code>paid-title</code> >
                          <code>title</code> > 默认标题
                        </li>
                        <li>支持在付费内容中使用所有 Markdown 语法</li>
                        <li>
                          付费内容将在文章发布后生效，编辑时显示为预览状态
                        </li>
                      </ul>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="高级设置" name="advanced">
          <el-form :model="internalForm" label-position="top">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="自定义永久链接 (可选)" prop="abbrlink">
                  <el-input
                    v-model="internalForm.abbrlink"
                    placeholder="例如: my-awesome-post"
                  />
                  <div class="form-item-help">唯一、友好，留空则自动生成。</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="IP 属地 (可选)" prop="ip_location">
                  <el-input
                    v-model="internalForm.ip_location"
                    placeholder="留空则自动获取"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="关键词 (可选)" prop="keywords">
                  <el-input-tag
                    v-model="keywordTags"
                    tag-type="primary"
                    tag-effect="light"
                    placeholder="输入关键词后按回车添加"
                  />
                  <div class="form-item-help">
                    用于SEO优化，建议添加3-5个关键词
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="在首页显示">
                  <div>
                    <el-switch
                      v-model="internalForm.show_on_home"
                      active-text="是"
                      inactive-text="否"
                    />
                    <div class="form-item-help">
                      控制文章发布后是否在首页展示
                    </div>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="首页推荐排序">
                  <el-input-number
                    v-model="internalForm.home_sort"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    placeholder="0"
                  />
                  <div class="form-item-help">
                    0则不推荐, >0则推荐, 值越小越靠前
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="文章置顶排序">
                  <el-input-number
                    v-model="internalForm.pin_sort"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    placeholder="0"
                  />
                  <div class="form-item-help">
                    0则不置顶, >0则置顶, 值越小越靠前
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手动指定主色调">
                  <el-switch v-model="internalForm.is_primary_color_manual" />
                </el-form-item>
                <el-form-item
                  v-if="internalForm.is_primary_color_manual"
                  label="主色调"
                  prop="primary_color"
                >
                  <div>
                    <div class="primary-color-controls">
                      <el-color-picker v-model="internalForm.primary_color" />
                      <el-button
                        type="primary"
                        size="small"
                        :loading="isFetchingColor"
                        :disabled="
                          !internalForm.cover_url && !internalForm.top_img_url
                        "
                        @click="handleFetchPrimaryColor"
                      >
                        {{ isFetchingColor ? "获取中..." : "从图片获取" }}
                      </el-button>
                    </div>
                    <div class="form-item-help">
                      <div>可以从封面图或顶部大图自动提取主色调</div>
                    </div>
                  </div>
                </el-form-item>
                <el-form-item
                  v-else-if="
                    !internalForm.is_primary_color_manual &&
                    internalForm.primary_color
                  "
                  label="主色调 (自动获取)"
                >
                  <el-color-picker
                    v-model="internalForm.primary_color"
                    disabled
                  />
                  <div class="form-item-help" style="margin-left: 10px">
                    由封面图自动提取
                  </div>
                </el-form-item>
              </el-col>
              <el-col v-if="copyrightType === 'reprint'" :span="12">
                <el-form-item
                  label="版权作者链接 (可选)"
                  prop="copyright_author_href"
                >
                  <el-input
                    v-model="internalForm.copyright_author_href"
                    placeholder="https://..."
                  />
                </el-form-item>
                <el-form-item label="版权来源链接 (可选)" prop="copyright_url">
                  <el-input
                    v-model="internalForm.copyright_url"
                    placeholder="转载文章的原始链接"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="自定义发布时间 (可选)">
                  <el-date-picker
                    v-model="internalForm.custom_published_at"
                    type="datetime"
                    placeholder="选择发布时间"
                    style="width: 100%"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DDTHH:mm:ssZ"
                    :disabled-date="disabledFutureDate"
                    :disabled-hours="disabledFutureHours"
                    :disabled-minutes="disabledFutureMinutes"
                    :disabled-seconds="disabledFutureSeconds"
                  />
                  <div class="form-item-help">
                    留空则使用当前时间，可用于回溯发布（不允许设置未来时间）
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="自定义更新时间 (可选)">
                  <el-date-picker
                    v-model="internalForm.custom_updated_at"
                    type="datetime"
                    placeholder="选择更新时间"
                    style="width: 100%"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DDTHH:mm:ssZ"
                  />
                  <div class="form-item-help">
                    留空则使用当前时间，可用于手动调整更新时间
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="AI播客缓存" name="aiPodcast">
          <div class="ai-podcast-cache-section">
            <el-alert
              v-if="!articleId || articleId === 'new'"
              title="提示"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>请先保存文章后再进行AI播客缓存操作</p>
              </template>
            </el-alert>

            <div v-else class="cache-content">
              <div class="cache-header">
                <h3>AI播客缓存状态</h3>
                <div class="header-actions">
                  <el-tag v-if="isPolling" type="info" effect="plain">
                    <el-icon class="is-loading" style="margin-right: 4px">
                      <Refresh />
                    </el-icon>
                    正在更新...
                  </el-tag>
                  <el-button
                    :disabled="isCheckingCache"
                    @click="fetchCacheStatus"
                  >
                    <el-icon :class="{ 'is-loading': isCheckingCache }">
                      <Refresh />
                    </el-icon>
                    刷新状态
                  </el-button>
                </div>
              </div>

              <div
                v-if="isCheckingCache && !cacheStatus"
                class="loading-status"
              >
                <el-skeleton :rows="5" animated />
              </div>

              <div
                v-else-if="
                  cacheStatus &&
                  (cacheStatus.has_cache || cacheStatus.is_generating)
                "
                class="cache-status"
              >
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="缓存状态">
                    <div class="status-tags">
                      <el-tag
                        v-if="cacheStatus.is_generating"
                        type="info"
                        size="large"
                        effect="dark"
                      >
                        <el-icon class="is-loading" style="margin-right: 4px">
                          <Refresh />
                        </el-icon>
                        正在生成中
                      </el-tag>
                      <el-tag
                        v-else
                        :type="cacheStatus.is_complete ? 'success' : 'warning'"
                        size="large"
                      >
                        {{ cacheStatus.is_complete ? "完整" : "不完整" }}
                      </el-tag>
                    </div>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="cacheStatus.has_cache"
                    label="缓存进度"
                  >
                    <div class="progress-wrapper">
                      <el-progress
                        :percentage="Math.round(cacheStatus.progress)"
                        :status="
                          cacheStatus.is_complete ? 'success' : undefined
                        "
                        :stroke-width="8"
                      />
                      <span class="progress-text">
                        {{ Math.round(cacheStatus.progress) }}%
                      </span>
                    </div>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="cacheStatus.has_cache && cacheStatus.total_rounds > 0"
                    label="总轮次"
                  >
                    <span class="value-text">
                      {{ cacheStatus.total_rounds || 0 }}
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="cacheStatus.has_cache && cacheStatus.total_rounds > 0"
                    label="已缓存轮次"
                  >
                    <span class="value-text">
                      {{ cacheStatus.cached_rounds || 0 }} /
                      {{ cacheStatus.total_rounds || 0 }}
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="cacheStatus.has_cache && cacheStatus.total_bytes > 0"
                    label="总大小"
                  >
                    <span class="value-text">
                      {{ formatBytes(cacheStatus.total_bytes) }}
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="cacheStatus.has_cache && cacheStatus.cached_bytes > 0"
                    label="已缓存大小"
                  >
                    <span class="value-text">
                      {{ formatBytes(cacheStatus.cached_bytes) }}
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="cacheStatus.created_at"
                    label="创建时间"
                    :span="2"
                  >
                    <span class="value-text">
                      {{ formatTime(cacheStatus.created_at) }}
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="
                      cacheStatus.missing_rounds &&
                      cacheStatus.missing_rounds.length > 0
                    "
                    label="缺失轮次"
                    :span="2"
                  >
                    <div class="missing-rounds">
                      <el-tag
                        v-for="round in cacheStatus.missing_rounds"
                        :key="round"
                        type="danger"
                        effect="plain"
                        size="small"
                      >
                        第{{ round }}轮
                      </el-tag>
                      <span
                        v-if="cacheStatus.missing_rounds.length === 0"
                        class="no-missing"
                      >
                        无缺失
                      </span>
                    </div>
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <div
                v-else-if="cacheStatus && cacheStatus.is_generating"
                class="generating-status"
              >
                <el-alert
                  title="正在生成中"
                  type="info"
                  :closable="false"
                  show-icon
                >
                  <template #default>
                    <p>后台正在生成AI播客缓存，请稍候...</p>
                    <p class="hint-text">
                      生成完成后会自动更新状态，您可以继续编辑文章
                    </p>
                  </template>
                </el-alert>
              </div>

              <div v-else class="no-cache">
                <el-empty description="暂无缓存数据">
                  <template #image>
                    <el-icon :size="80" color="#c0c4cc">
                      <Setting />
                    </el-icon>
                  </template>
                  <template #description>
                    <p>该文章尚未生成AI播客缓存</p>
                    <p class="empty-hint">
                      点击下方按钮开始生成缓存，生成完成后用户访问时将直接使用缓存，提升加载速度
                    </p>
                  </template>
                </el-empty>
              </div>

              <div class="cache-actions">
                <el-button
                  type="primary"
                  size="large"
                  :disabled="
                    cacheStatus?.is_complete ||
                    isPreCaching ||
                    cacheStatus?.is_generating
                  "
                  @click="handlePreCache"
                >
                  <el-icon
                    :class="{ 'is-loading': isPreCaching }"
                    style="margin-right: 4px"
                  >
                    <Setting />
                  </el-icon>
                  {{
                    cacheStatus?.is_complete
                      ? "缓存已完成"
                      : cacheStatus?.is_generating
                        ? "正在生成中..."
                        : isPreCaching
                          ? "正在启动..."
                          : "手动生成缓存"
                  }}
                </el-button>
                <el-alert
                  v-if="cacheStatus?.is_generating"
                  title="提示"
                  type="info"
                  :closable="false"
                  show-icon
                  style="margin-top: 16px"
                >
                  <template #default>
                    <p>
                      后台正在生成缓存，系统会自动更新状态。您可以继续编辑文章，无需等待。
                    </p>
                  </template>
                </el-alert>
                <el-alert
                  v-else-if="isPolling || isPreCaching"
                  title="提示"
                  type="info"
                  :closable="false"
                  show-icon
                  style="margin-top: 16px"
                >
                  <template #default>
                    <p>
                      {{
                        isPreCaching
                          ? "正在启动缓存生成任务..."
                          : "缓存生成中，请保持页面打开。生成完成后会自动更新状态。"
                      }}
                    </p>
                  </template>
                </el-alert>
                <el-alert
                  v-else-if="
                    cacheStatus &&
                    !cacheStatus.is_complete &&
                    cacheStatus.has_cache
                  "
                  title="提示"
                  type="warning"
                  :closable="false"
                  show-icon
                  style="margin-top: 16px"
                >
                  <template #default>
                    <p>
                      缓存不完整，部分轮次缺失。可以重新生成完整缓存，或等待下次生成时自动补全。
                    </p>
                  </template>
                </el-alert>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="isVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="isSubmitting"
          @click="handleConfirm"
        >
          {{ form.status === "PUBLISHED" ? "确认更新" : "确认发布" }}
        </el-button>
      </template>
    </AnDialog>

    <AnDialog v-model="isCategoryManagerVisible" title="管理分类" width="720px">
      <div class="category-manager-body">
        <div class="create-category-form">
          <el-input
            v-model="newCategoryForm.name"
            placeholder="输入新分类名称"
          />
          <el-switch
            v-model="newCategoryForm.is_series"
            active-text="设为系列"
            style="width: 250px; margin: 0 20px"
          />
          <el-button
            type="primary"
            :loading="isCreating"
            @click="handleCreateCategory"
          >
            添加分类
          </el-button>
        </div>

        <el-table
          v-loading="!categoryOptions"
          :data="categoryOptions"
          :style="{ width: '100%' }"
          height="350px"
        >
          <el-table-column prop="name" label="分类名称" min-width="150">
            <template #default="scope">
              <div v-if="editingCategoryId === scope.row.id" class="edit-cell">
                <el-input
                  :id="`category-edit-input-${scope.row.id}`"
                  v-model="editingCategoryName"
                  size="small"
                  @blur="handleUpdateCategoryName(scope.row)"
                  @keydown.enter="handleUpdateCategoryName(scope.row)"
                />
              </div>
              <span v-else>{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="count"
            label="文章数"
            width="90"
            align="center"
          />
          <el-table-column label="类型" width="100" align="center">
            <template #default="scope">
              <el-tag
                :type="scope.row.is_series ? 'success' : 'info'"
                size="small"
                effect="light"
              >
                {{ scope.row.is_series ? "系列" : "普通" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" align="center">
            <template #default="scope">
              <div v-loading="loadingStates[scope.row.id]">
                <el-button-group>
                  <el-tooltip
                    :show-arrow="false"
                    content="编辑名称"
                    placement="top"
                  >
                    <el-button
                      :icon="Edit"
                      type="primary"
                      link
                      @click="handleEditCategory(scope.row)"
                    />
                  </el-tooltip>
                  <el-button
                    type="primary"
                    style="margin: 0 4px"
                    link
                    @click="toggleCategoryType(scope.row)"
                  >
                    {{ scope.row.is_series ? "转为普通" : "转为系列" }}
                  </el-button>
                  <el-tooltip
                    content="删除分类"
                    placement="top"
                    :show-arrow="false"
                  >
                    <el-button
                      :icon="Delete"
                      type="danger"
                      link
                      @click="handleDeleteCategory(scope.row)"
                    />
                  </el-tooltip>
                </el-button-group>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="isCategoryManagerVisible = false">关闭</el-button>
      </template>
    </AnDialog>
  </div>
</template>

<!-- 全局样式：隐藏下拉框选中项的勾选符号 -->
<style lang="scss">
.hide-selected-check .el-select-dropdown__item.is-selected::after {
  display: none;
}
</style>

<style lang="scss" scoped>
.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--anzhiyu-secondtext);
}

.primary-color-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-item {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;

  .el-input {
    flex-grow: 1;
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

.ai-podcast-cache-section {
  padding: 20px 0;

  .cache-content {
    .cache-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
    }

    .loading-status {
      margin: 20px 0;
    }

    .cache-status {
      margin-bottom: 24px;

      .status-tags {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .progress-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;

        .el-progress {
          flex: 1;
        }

        .progress-text {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          min-width: 45px;
          text-align: right;
        }
      }

      .value-text {
        font-size: 14px;
        color: var(--el-text-color-regular);
      }

      .missing-rounds {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;

        .no-missing {
          color: var(--el-color-success);
          font-size: 14px;
        }
      }
    }

    .generating-status {
      margin: 20px 0;

      .hint-text {
        margin-top: 8px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    .no-cache {
      padding: 60px 0;
      text-align: center;

      .empty-hint {
        margin-top: 12px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        line-height: 1.6;
      }
    }

    .cache-actions {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--el-border-color-lighter);

      .el-button {
        width: 100%;
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 只对图标应用旋转动画
.is-loading {
  animation: rotate 1s linear infinite;
}

// 修复 Element Plus 按钮加载状态时文本被旋转的问题
// Element Plus 按钮加载时会在内部添加 loading 图标，只让图标旋转，文本不旋转
:deep(.el-button.is-loading) {
  animation: none !important;
  transform: none !important;

  // 确保按钮文本内容不被旋转
  > span {
    animation: none !important;
    transform: none !important;
  }

  // Element Plus loading 图标的容器和图标本身应该旋转
  .el-button__loading,
  .el-button__loading .el-icon {
    animation: rotate 1s linear infinite;
  }
}

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

    .anzhiyufont {
      margin-right: 4px;
      font-size: 14px;
    }
  }
}

.category-option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.category-manager-body {
  .create-category-form {
    display: flex;
    align-items: center;
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: var(--style-border-always);
  }

  .edit-cell {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.paid-content-preview {
  .paid-content-example {
    padding: 16px;
    margin-bottom: 20px;
    background: var(--anzhiyu-background);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;

    h4 {
      margin: 0 0 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .example-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      h5 {
        margin: 0 0 8px;
        font-size: 13px;
        font-weight: 600;
        color: var(--anzhiyu-fontcolor);
      }

      pre {
        padding: 12px;
        margin: 0;
        overflow-x: auto;
        font-size: 12px;
        line-height: 1.5;
        background: var(--anzhiyu-card-bg);
        border: var(--style-border-always);
        border-radius: 4px;

        code {
          font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
          color: var(--anzhiyu-fontcolor);
        }
      }
    }
  }

  .paid-content-tips {
    h5 {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    ul {
      padding-left: 16px;
      margin: 0;
      font-size: 12px;
      line-height: 1.6;
      color: var(--anzhiyu-fontcolor);

      li {
        margin-bottom: 4px;

        code {
          padding: 2px 4px;
          font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
          font-size: 11px;
          background: var(--anzhiyu-background);
          border: 1px solid var(--el-border-color-light);
          border-radius: 3px;
        }
      }
    }
  }
}
</style>
