<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-27 12:35:13
 * @LastEditTime: 2025-12-08 13:21:25
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
  computed,
  watch,
  defineAsyncComponent
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElNotification, ElMessageBox } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { debounce } from "lodash-es";
import type { FormInstance } from "element-plus";

type ExposeParam = any;

// 使用懒加载避免影响首屏性能
const MarkdownEditor = defineAsyncComponent(
  () => import("@/components/MarkdownEditor/index.vue")
);
import PostActionButtons from "./components/PostActionButtons.vue";
import PublishDialog from "./components/PublishDialog.vue";

import { useNav } from "@/layout/hooks/useNav";
import {
  getArticle,
  createArticle,
  updateArticle,
  getCategoryList,
  getTagList,
  createTag,
  uploadArticleImage,
  getFullTextHiddenConfig,
  saveFullTextHiddenConfig,
  deleteFullTextHiddenConfig
} from "@/api/post";
import type {
  ArticleForm,
  PostCategory,
  PostTag,
  FullTextHiddenForm
} from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { constant } from "@/constant";
import { useAISummary } from "@/composables/useAISummary";

defineOptions({ name: "PostEdit" });

const route = useRoute();
const router = useRouter();
const siteConfigStore = useSiteConfigStore();

const { device, pureApp, toggleSideBar } = useNav();
let wasSidebarOpened = pureApp.getSidebarStatus;

const formRef = ref<FormInstance>();
const editorRef = ref<ExposeParam>();
const loading = ref(true);
const isSubmitting = ref(false);
const articleId = ref<string | null>(null);
const isPublishDialogVisible = ref(false);
const isFullTextConfigLoaded = ref(false); // 标记全文隐藏配置是否已加载

const form = reactive<
  ArticleForm & {
    review_status?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  }
>({
  title: "",
  content_md: "## 在这里开始你的创作...",
  cover_url: "",
  ip_location: "",
  status: "PUBLISHED",
  post_tag_ids: [],
  post_category_ids: [],
  show_on_home: true,
  home_sort: 0,
  pin_sort: 0,
  top_img_url: "",
  summaries: [],
  primary_color: "",
  is_primary_color_manual: false,
  abbrlink: "",
  copyright: true,
  copyright_author: "",
  copyright_author_href: "",
  copyright_url: "",
  keywords: "",
  review_status: "NONE"
});

const initialFormState = reactive({
  title: "",
  content_md: ""
});
const categoryOptions = ref<PostCategory[]>([]);
const tagOptions = ref<PostTag[]>([]);
const isEditMode = computed(
  () => !!articleId.value && articleId.value !== "new"
);

// 全文隐藏配置
const fullTextHiddenConfig = ref<FullTextHiddenForm>({
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
const isDirty = computed(() => {
  return (
    form.title !== initialFormState.title ||
    form.content_md !== initialFormState.content_md
  );
});
const categorySelectKey = ref(0);
const tagSelectKey = ref(0);
const updateInitialState = () => {
  initialFormState.title = form.title;
  initialFormState.content_md = form.content_md;
};
const getDraftKey = () => `post_draft_${articleId.value || "new"}`;
const initPage = async () => {
  loading.value = true;
  const id = route.params.id as string;
  try {
    const fetchOptionsPromise = Promise.all([
      getCategoryList(),
      getTagList()
    ]).then(([catRes, tagRes]) => {
      categoryOptions.value = catRes.data;
      tagOptions.value = tagRes.data;
    });
    if (id !== "new") {
      articleId.value = id;
      const { data } = await getArticle(id);
      console.log("📥 [PostEdit] 加载文章数据:");
      console.log("  - 文章ID:", data.id);
      console.log("  - 标题:", data.title);
      console.log("  - 封面图 cover_url:", data.cover_url);
      console.log("  - 顶部大图 top_img_url:", data.top_img_url);
      Object.assign(form, data);
      form.post_category_ids = data.post_categories.map(c => c.id);
      form.post_tag_ids = data.post_tags.map(t => t.id);
      if (!Array.isArray(form.summaries)) {
        form.summaries = [];
      }
      console.log("📥 [PostEdit] 表单赋值后 cover_url:", form.cover_url);
    }
    await fetchOptionsPromise;
  } catch (error) {
    ElMessage.error("页面数据加载失败，请重试");
  } finally {
    loading.value = false;
    updateInitialState();
  }
};
const validateName = (name: string, type: "标签"): boolean => {
  const pattern = /^[\u4e00-\u9fa5a-zA-Z0-9_-]{1,30}$/;
  if (!pattern.test(name)) {
    ElMessage.error({
      message: `${type}名 "${name}" 格式不正确。只能包含中英文、数字、下划线或连字符，长度为1-30个字符。`,
      duration: 4000
    });
    return false;
  }
  return true;
};

// 校验付费内容区块数量
const validatePaidContent = (markdown: string): boolean => {
  // 使用正则表达式匹配付费内容区块
  const paidContentRegex = /:::paid-content[\s\S]*?:::/g;
  const matches = markdown.match(paidContentRegex);
  const count = matches ? matches.length : 0;

  if (count > 1) {
    ElMessage.error({
      message:
        "一篇文章只能包含一个付费内容区块，请删除多余的付费内容后再保存。",
      duration: 4000
    });
    return false;
  }

  return true;
};

// 校验密码保护内容区块数量和密码字段
const validatePasswordContent = (markdown: string): boolean => {
  // 使用正则表达式匹配密码保护内容区块
  const passwordContentRegex = /:::password-content[\s\S]*?:::/g;
  const matches = markdown.match(passwordContentRegex);
  const count = matches ? matches.length : 0;

  if (count > 1) {
    ElMessage.error({
      message:
        "一篇文章只能包含一个密码保护内容区块，请删除多余的密码保护内容后再保存。",
      duration: 4000
    });
    return false;
  }

  // 如果有密码保护内容，检查是否包含password字段
  if (count > 0) {
    const passwordContentBlocks = markdown.match(passwordContentRegex);
    for (const block of passwordContentBlocks || []) {
      // 提取开头标签行
      const headerLine = block.split("\n")[0];
      // 检查是否包含password属性
      const passwordMatch = headerLine.match(/password="([^"]*?)"/);

      if (
        !passwordMatch ||
        !passwordMatch[1] ||
        passwordMatch[1].trim() === ""
      ) {
        ElMessage.error({
          message:
            "密码保护内容必须设置密码。请编辑密码保护内容并确保提供有效的密码。",
          duration: 4000
        });
        return false;
      }
    }
  }

  return true;
};

// 核心改动点：简化此函数，移除处理分类创建的逻辑
const processTagsAndCategories = async () => {
  // 分类 ID 数组现在只包含有效的、已存在的 ID，无需处理
  if (Array.isArray(form.post_tag_ids)) {
    const tagPromises = form.post_tag_ids.map(async item => {
      // 如果 item 已经是 tagOptions 中的一个 id，直接返回
      if (tagOptions.value.some(opt => opt.id === item)) {
        return item;
      }
      // 否则，它是一个新创建的标签名称 (字符串)
      if (!validateName(item, "标签")) {
        throw new Error(`标签名 "${item}" 校验失败`);
      }
      const res = await createTag({ name: item });
      const newTag = res.data;
      tagOptions.value.push(newTag); // 更新前端的 tag 列表
      return newTag.id;
    });
    form.post_tag_ids = await Promise.all(tagPromises);
  }
};

const onSaveHandler = async (markdown: string, sanitizedHtml: string) => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    // 校验付费内容区块数量
    if (!validatePaidContent(markdown)) {
      isSubmitting.value = false;
      return;
    }

    // 校验密码保护内容区块数量
    if (!validatePasswordContent(markdown)) {
      isSubmitting.value = false;
      return;
    }

    // 🔧 在保存文章之前验证全文隐藏配置
    if (fullTextHiddenConfig.value.enabled) {
      if (
        !fullTextHiddenConfig.value.password ||
        fullTextHiddenConfig.value.password.trim() === ""
      ) {
        ElMessage.error("请设置全文隐藏的访问密码");
        isSubmitting.value = false;
        return;
      }
    }

    await processTagsAndCategories();

    console.log("📝 [PostEdit] 提交内容：");
    console.log("  - Markdown 长度:", markdown.length);
    console.log("  - HTML 长度:", sanitizedHtml.length);
    console.log("  - 封面图 cover_url:", form.cover_url);
    console.log("  - 顶部大图 top_img_url:", form.top_img_url);

    const dataToSubmit = {
      ...form,
      content_md: markdown,
      content_html: sanitizedHtml,
      summaries: form.summaries?.filter(s => s && s.trim() !== "") || []
    };
    console.log(
      "📦 [PostEdit] 完整提交数据:",
      JSON.stringify(dataToSubmit, null, 2)
    );
    let currentArticleId = articleId.value;

    if (isEditMode.value) {
      await updateArticle(articleId.value, dataToSubmit);
      ElMessage.success("更新成功");
    } else {
      const res = await createArticle(dataToSubmit);
      console.log("📦 创建文章API响应:", res);
      console.log("📦 响应数据 res.data:", res.data);
      console.log("📦 文章ID res.data.id:", res.data?.id);
      ElMessage.success("创建成功");
      currentArticleId = res.data?.id;
      console.log("✅ 文章创建成功，ID:", currentArticleId);
      // 立即更新 articleId，避免后续操作认为还在新增模式
      articleId.value = currentArticleId;
      localStorage.removeItem(getDraftKey());
      // 先不跳转，等全文隐藏配置保存完成后再跳转
    }

    // 保存全文隐藏配置
    if (currentArticleId) {
      try {
        await saveFullTextHidden(currentArticleId);
      } catch (error) {
        // 全文隐藏配置保存失败，但文章已保存，不影响主流程
        console.error("全文隐藏配置保存失败:", error);
      }
    }

    // 如果是新建文章，保存完全文隐藏配置后再跳转
    if (!isEditMode.value && currentArticleId) {
      console.log(
        "🔄 准备跳转到编辑页面:",
        `/admin/post-management/edit/${currentArticleId}`
      );
      // 使用 replace 而不是 push，确保路由真正改变
      await router.replace({
        name: "PostEdit",
        params: { id: currentArticleId }
      });
      console.log("✅ 路由跳转完成");
    }

    // 移除密码配置清空操作，现在由后端自动处理
    localStorage.removeItem(getDraftKey());
    updateInitialState();
    await siteConfigStore.fetchSystemSettings([
      constant.KeySidebarSiteInfoTotalPostCount,
      constant.KeySidebarSiteInfoTotalWordCount
    ]);
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("校验失败"))) {
      ElMessage.error(isEditMode.value ? "更新失败" : "创建失败");
    }
  } finally {
    isSubmitting.value = false;
  }
};
const handleSubmit = (isPublish = false) => {
  if (!form.title || form.title.trim() === "") {
    ElNotification({
      title: "提交错误",
      message: "文章标题不能为空，请输入标题后再保存。",
      type: "error"
    });
    return;
  }
  if (isPublish) {
    form.status = "PUBLISHED";
  } else {
    form.status = "DRAFT";
  }
  editorRef.value?.triggerSave();
};
const handleOpenPublishDialog = async () => {
  if (!form.title || form.title.trim() === "") {
    ElNotification({
      title: "操作无效",
      message: "发布前请先填写文章标题。",
      type: "warning"
    });
    return;
  }

  // 延迟加载全文隐藏配置：只在打开发布对话框时加载一次
  if (isEditMode.value && !isFullTextConfigLoaded.value && articleId.value) {
    try {
      const fullTextRes = await getFullTextHiddenConfig(articleId.value);
      if (fullTextRes.data) {
        fullTextHiddenConfig.value = {
          enabled: fullTextRes.data.enabled,
          password: fullTextRes.data.password || "",
          modal_top_description:
            fullTextRes.data.modal_top_description ||
            "<p>请输入密码查看完整内容</p>",
          button_text: fullTextRes.data.button_text || "查看全文",
          qr_code_url: fullTextRes.data.qr_code_url || "",
          input_placeholder:
            fullTextRes.data.input_placeholder || "请输入密码查看全文",
          initial_visible_height:
            fullTextRes.data.initial_visible_height || 300,
          preview_char_count: fullTextRes.data.preview_char_count || 500,
          max_attempts: fullTextRes.data.max_attempts || 5
        };
      }
      isFullTextConfigLoaded.value = true;
    } catch (error) {
      console.log("未找到全文隐藏配置或加载失败，使用默认配置");
      isFullTextConfigLoaded.value = true;
    }
  }

  isPublishDialogVisible.value = true;
};
const handleConfirmPublish = async () => {
  isPublishDialogVisible.value = false;
  // 不再强制设置状态，使用用户在 PublishDialog 中选择的状态
  editorRef.value?.triggerSave();
};

// 保存全文隐藏配置
const saveFullTextHidden = async (currentArticleId: string) => {
  if (!fullTextHiddenConfig.value.enabled) {
    // 如果未启用，尝试删除已有配置
    try {
      await deleteFullTextHiddenConfig(currentArticleId);
      console.log("全文隐藏已禁用，配置已删除");
    } catch (error) {
      // 如果删除失败，可能是配置本来就不存在，忽略错误
      console.log("删除全文隐藏配置失败或配置不存在");
    }
    return;
  }

  // 验证必填字段
  if (
    !fullTextHiddenConfig.value.password ||
    fullTextHiddenConfig.value.password.trim() === ""
  ) {
    ElMessage.error("请设置全文隐藏的访问密码");
    throw new Error("全文隐藏密码不能为空");
  }

  try {
    await saveFullTextHiddenConfig(
      currentArticleId,
      fullTextHiddenConfig.value
    );
    console.log("全文隐藏配置保存成功");
  } catch (error) {
    console.error("保存全文隐藏配置失败:", error);
    ElMessage.error("保存全文隐藏配置失败");
    throw error;
  }
};

// 更新全文隐藏配置
const handleUpdateFullTextHiddenConfig = (config: FullTextHiddenForm) => {
  fullTextHiddenConfig.value = { ...config };
};

// 初始化AI摘要composable
const { getHtmlFromEditor } = useAISummary();

// 获取当前的HTML内容（用于AI摘要生成）
const getCurrentHtml = (): string => {
  const html = getHtmlFromEditor(editorRef);
  console.log("[PostEdit] getCurrentHtml 被调用，HTML长度:", html.length);
  return html;
};

const handleImageUploadForMdV3 = async (
  files: File[],
  callback: (urls: string[]) => void
) => {
  const loadingInstance = ElMessage.info({
    message: "正在上传图片...",
    duration: 0
  });
  try {
    const urls = await Promise.all(
      files.map(async file => {
        const res = await uploadArticleImage(file);
        const url = res?.data?.url;
        if (!url) {
          throw new Error(`图片 ${file.name} 上传失败: 服务器未返回有效URL`);
        }
        return url;
      })
    );
    callback(urls);
    ElMessage.success("图片上传成功！");
  } catch (error: any) {
    console.error("图片上传失败:", error);
    ElMessage.error(error.message || "图片上传失败，请稍后再试。");
  } finally {
    loadingInstance.close();
  }
};
const handleGoBack = () => {
  if (isDirty.value) {
    ElMessageBox.confirm(
      "您有未保存的更改，确定要离开吗？所有未保存的更改都将丢失。",
      "警告",
      {
        confirmButtonText: "确定离开",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(() => {
        router.push({ name: "PostManagement" });
      })
      .catch(() => {});
  } else {
    router.push({ name: "PostManagement" });
  }
};

const handleCategoryChange = () => {
  // 这个函数现在可以保留为空，或者用于其他逻辑
  // 主要目的是保留 @change 事件，以触发可能的 re-render
  // 由于我们强制 key 更新，这个函数体不是必须的
};

const handleTagChange = (currentValues: string[]) => {
  const isNewItemAdded = currentValues.some(
    val => !tagOptions.value.some(opt => opt.id === val)
  );
  if (isNewItemAdded) {
    tagSelectKey.value++;
  }
};
const refreshCategories = async () => {
  try {
    const { data } = await getCategoryList();
    categoryOptions.value = data;
    categorySelectKey.value++;
  } catch (error) {
    ElMessage.error("刷新分类列表失败");
  }
};
watch(
  () => [form.title, form.content_md],
  debounce(newData => {
    if (loading.value) return;
    const draft = {
      title: newData[0],
      content_md: newData[1],
      saveTime: new Date().toLocaleString()
    };
    localStorage.setItem(getDraftKey(), JSON.stringify(draft));
  }, 2000),
  { deep: true }
);

// 监听路由参数变化，当从新增模式切换到编辑模式时重新加载
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId && newId !== "new") {
      await initPage();
      // 重置全文隐藏配置加载状态，以便在编辑新文章时重新加载
      isFullTextConfigLoaded.value = false;
    }
  }
);

onMounted(async () => {
  await initPage();
  wasSidebarOpened = pureApp.getSidebarStatus;
  if (device.value !== "mobile" && pureApp.getSidebarStatus) {
    toggleSideBar();
  }
  const draftKey = getDraftKey();
  const draft = localStorage.getItem(draftKey);
  if (draft) {
    const parsedDraft = JSON.parse(draft);
    ElMessageBox.confirm(
      `检测到您在 ${parsedDraft.saveTime} 有一份未保存的本地草稿，是否恢复？`,
      "发现本地草稿",
      {
        confirmButtonText: "恢复",
        cancelButtonText: "放弃",
        type: "info"
      }
    )
      .then(() => {
        form.title = parsedDraft.title;
        form.content_md = parsedDraft.content_md;
        ElMessage.success("草稿已恢复");
      })
      .catch(() => {
        localStorage.removeItem(draftKey);
        ElMessage.info("已放弃本地草稿");
      });
  }
});
onUnmounted(() => {
  if (
    device.value !== "mobile" &&
    !pureApp.getSidebarStatus &&
    wasSidebarOpened
  ) {
    toggleSideBar();
  }
});
</script>

<template>
  <div v-loading="loading" class="post-edit-page">
    <header class="post-edit-header">
      <div class="header-left">
        <el-tooltip content="返回列表" placement="bottom" :show-arrow="false">
          <el-button :icon="ArrowLeft" text circle @click="handleGoBack" />
        </el-tooltip>
        <div class="title-container">
          <el-input
            v-model="form.title"
            placeholder="请输入文章标题..."
            class="title-input"
          />
        </div>
      </div>
      <div class="header-right">
        <PostActionButtons
          :is-submitting="isSubmitting"
          :is-edit-mode="isEditMode"
          :status="form.status"
          :post-id="articleId"
          :post-slug="form.abbrlink"
          :review-status="form.review_status"
          @save="handleSubmit(false)"
          @publish="handleOpenPublishDialog"
        />
      </div>
    </header>

    <main class="post-edit-main">
      <MarkdownEditor
        ref="editorRef"
        v-model="form.content_md"
        :on-upload-img="handleImageUploadForMdV3"
        @onSave="onSaveHandler"
      />
    </main>

    <PublishDialog
      v-model="isPublishDialogVisible"
      :form="form"
      :category-options="categoryOptions"
      :tag-options="tagOptions"
      :is-submitting="isSubmitting"
      :category-select-key="categorySelectKey"
      :tag-select-key="tagSelectKey"
      :content-html="getCurrentHtml()"
      :full-text-hidden-config="fullTextHiddenConfig"
      :article-id="articleId"
      @change-category="handleCategoryChange"
      @change-tag="handleTagChange"
      @confirm-publish="handleConfirmPublish"
      @refresh-categories="refreshCategories"
      @update:full-text-hidden-config="handleUpdateFullTextHiddenConfig"
    />
  </div>
</template>

<style lang="scss" scoped>
.post-edit-page {
  display: flex;
  flex-direction: column;
  height: calc(100%);
  background-color: var(--anzhiyu-background);
}

.post-edit-header {
  z-index: 10;
  display: flex;
  flex-shrink: 0;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 20px;
  background-color: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-left,
.header-right {
  display: flex;
  gap: 16px;
  align-items: center;
}

.header-left {
  flex-grow: 1;
  min-width: 0;
}

.header-right {
  flex-shrink: 0;
}

.title-container {
  flex-grow: 1;
  min-width: 0;

  .title-input {
    :deep(.el-input__wrapper) {
      padding: 0;
      font-size: 20px;
      font-weight: 600;
      background: transparent;
      box-shadow: none !important;
    }
  }
}

.post-edit-main {
  flex-grow: 1;
  height: 500px;
  min-height: 0;
  padding: 8px;
  background-color: var(--anzhiyu-card-bg);
}

:deep(.md-editor-preview .md-editor-code .md-editor-code-head) {
  z-index: 99 !important;
}

@media (width <= 768px) {
  .post-edit-page {
    margin: 0;
  }

  .post-edit-header {
    flex-wrap: wrap;
    height: auto;
    padding: 10px;
    gap: 10px;
  }

  .header-left {
    flex: 1;
    flex-grow: 1;
    min-width: 0;
    gap: 12px;

    :deep(.el-button) {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
    }
  }

  .title-container {
    flex: 1;
    min-width: 0;

    .title-input {
      :deep(.el-input__wrapper) {
        font-size: 16px;
      }
    }
  }

  .header-right {
    width: 100%;
    flex-shrink: 0;
    justify-content: flex-end;
  }
}
</style>
