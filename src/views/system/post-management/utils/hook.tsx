/*
 * @Description: 文章管理 Hook
 * @Author: 安知鱼
 */

import { formatToChina } from "@/utils/dayjs";
import { message } from "@/utils/message";
import { getArticleList, deleteArticle, batchDeleteArticles } from "@/api/post";
import type { Article, GetArticleListParams } from "@/api/post/type";
import {
  approveArticle,
  rejectArticle,
  takedownArticle,
  restoreArticle,
  ReviewStatus,
  type ReviewStatusType
} from "@/api/article-review";
import { reactive, ref, onMounted, h, computed } from "vue";
import { useRouter } from "vue-router";
import type { PaginationProps, LoadingConfig } from "@pureadmin/table";
import {
  ElTag,
  ElMessageBox,
  ElImage,
  ElAvatar,
  ElTooltip
} from "element-plus";
import { useArticleStore } from "@/store/modules/articleStore";
import { useUserStoreHook } from "@/store/modules/user";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { IconifyIconOnline } from "@/components/ReIcon";
import md5 from "blueimp-md5";

// 扩展搜索参数类型
interface ExtendedSearchParams extends GetArticleListParams {
  review_status?: ReviewStatusType | "";
}

export function usePostManagement() {
  const router = useRouter();
  const articleStore = useArticleStore();
  const userStore = useUserStoreHook();
  const siteConfigStore = useSiteConfigStore();

  // 判断是否是管理员
  const isAdmin = computed(() => {
    return userStore.roles.includes("1");
  });

  const form = reactive<ExtendedSearchParams>({
    query: "",
    status: "",
    review_status: ""
  });

  const dataList = ref<Article[]>([]);
  const loading = ref(true);
  const selectedIds = ref<string[]>([]);

  // 导入导出相关
  const showImportExportDialog = ref(false);

  // 拒绝对话框相关
  const showRejectDialog = ref(false);
  const rejectingArticle = ref<Article | null>(null);
  const rejectReason = ref("");

  // 下架对话框相关
  const showTakedownDialog = ref(false);
  const takedowningArticle = ref<Article | null>(null);
  const takedownReason = ref("");

  // 状态选项
  const statusOptions = [
    { value: "", label: "全部状态" },
    {
      value: "PUBLISHED",
      label: "已发布",
      type: "success",
      color: "var(--anzhiyu-green)"
    },
    {
      value: "DRAFT",
      label: "草稿",
      type: "warning",
      color: "var(--anzhiyu-yellow)"
    },
    {
      value: "SCHEDULED",
      label: "定时发布",
      type: "primary",
      color: "var(--anzhiyu-blue)"
    },
    { value: "ARCHIVED", label: "已归档", type: "info", color: "#909399" }
  ];

  // 审核状态选项
  const reviewStatusOptions = [
    { value: "", label: "全部审核状态" },
    {
      value: ReviewStatus.PENDING,
      label: "待审核",
      color: "var(--anzhiyu-orange)"
    },
    {
      value: ReviewStatus.APPROVED,
      label: "已通过",
      color: "var(--anzhiyu-green)"
    },
    {
      value: ReviewStatus.REJECTED,
      label: "已拒绝",
      color: "var(--anzhiyu-red)"
    }
  ];

  // 获取状态标签类型
  const getStatusTagType = (
    status: string,
    reviewStatus?: string,
    isTakedownStatus?: boolean
  ): "success" | "warning" | "danger" | "info" | "primary" => {
    if (isTakedownStatus) return "danger";
    if (reviewStatus === ReviewStatus.PENDING) return "warning";
    if (reviewStatus === ReviewStatus.REJECTED) return "danger";
    if (status === "PUBLISHED") return "success";
    if (status === "SCHEDULED") return "primary";
    if (status === "DRAFT") return "info";
    return "info";
  };

  // 获取状态信息
  const getStatusInfo = (
    status: string,
    reviewStatus?: string,
    isTakedownStatus?: boolean
  ) => {
    if (isTakedownStatus) {
      return {
        value: "TAKEDOWN",
        label: "已下架",
        type: "danger",
        color: "var(--anzhiyu-red)"
      };
    }
    if (reviewStatus && reviewStatus !== "NONE") {
      switch (reviewStatus) {
        case "PENDING":
          return {
            value: "PENDING",
            label: "审核中",
            type: "warning",
            color: "var(--anzhiyu-orange)"
          };
        case "APPROVED":
          return statusOptions.find(s => s.value === status);
        case "REJECTED":
          return {
            value: "REJECTED",
            label: "已拒绝",
            type: "danger",
            color: "var(--anzhiyu-red)"
          };
      }
    }
    return statusOptions.find(s => s.value === status);
  };

  // 获取作者显示名称
  const getAuthorDisplayName = (row: Article): string => {
    if (row.owner_nickname?.trim()) return row.owner_nickname;
    if (row.owner_name?.trim()) return row.owner_name;
    if (row.owner_id && row.owner_id > 0) return `用户 #${row.owner_id}`;
    return "管理员";
  };

  // 获取作者头像
  const getAuthorAvatar = (row: Article): string => {
    if (
      row.owner_avatar?.trim() &&
      (row.owner_avatar.startsWith("http://") ||
        row.owner_avatar.startsWith("https://"))
    ) {
      return row.owner_avatar;
    }
    const config = siteConfigStore.getSiteConfig;
    const baseUrl = config?.GRAVATAR_URL || "https://cravatar.cn";
    const defaultType = config?.DEFAULT_GRAVATAR_TYPE || "mp";
    if (row.owner_email?.trim()) {
      const emailMd5 = md5(row.owner_email.trim().toLowerCase());
      return `${baseUrl}/avatar/${emailMd5}?s=64&d=${defaultType}`;
    }
    return `${baseUrl}/avatar/?s=64&d=${defaultType}`;
  };

  // 获取作者邮箱
  const getAuthorEmail = (row: Article): string => {
    return row.owner_email?.trim() || "";
  };

  // 表格列配置
  const columns: TableColumnList = [
    {
      type: "selection",
      width: 55,
      align: "center",
      headerAlign: "left",
      hide: () => !isAdmin.value
    },
    {
      label: "作者",
      prop: "owner_name",
      width: 160,
      align: "left",
      headerAlign: "left",
      hide: () => !isAdmin.value,
      cellRenderer: ({ row }) => {
        return h(
          "div",
          {
            class: "user-cell",
            style:
              "display: flex; align-items: center; gap: 10px; cursor: pointer;",
            onClick: () => handleAuthorClick(row)
          },
          [
            h(ElAvatar, { src: getAuthorAvatar(row), size: 36 }),
            h(
              "div",
              {
                style:
                  "display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1;"
              },
              [
                h(
                  "span",
                  {
                    style:
                      "font-size: 14px; font-weight: 600; color: var(--anzhiyu-fontcolor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                  },
                  getAuthorDisplayName(row)
                ),
                getAuthorEmail(row)
                  ? h(
                      ElTooltip,
                      {
                        content: getAuthorEmail(row),
                        placement: "top",
                        showAfter: 300
                      },
                      {
                        default: () =>
                          h(
                            "span",
                            {
                              style:
                                "font-size: 12px; color: var(--anzhiyu-secondtext); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                            },
                            getAuthorEmail(row)
                          )
                      }
                    )
                  : h(
                      "span",
                      {
                        style:
                          "font-size: 12px; color: var(--anzhiyu-secondtext); font-style: italic; opacity: 0.6;"
                      },
                      "暂无邮箱"
                    )
              ]
            )
          ]
        );
      }
    },
    {
      label: "文章",
      prop: "title",
      minWidth: 280,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "div",
          { style: "display: flex; align-items: center; gap: 12px;" },
          [
            h(
              "div",
              {
                style:
                  "flex-shrink: 0; width: 60px; height: 40px; border-radius: 4px; overflow: hidden; background: var(--anzhiyu-secondbg);"
              },
              [
                h(ElImage, {
                  src: row.cover_url || articleStore.defaultCover,
                  fit: "cover",
                  lazy: true,
                  style: "width: 100%; height: 100%;"
                })
              ]
            ),
            h(
              "div",
              {
                style:
                  "flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px;"
              },
              [
                h(
                  "a",
                  {
                    href: `/posts/${row.id}`,
                    target: "_blank",
                    style:
                      "font-size: 14px; font-weight: 600; color: var(--anzhiyu-fontcolor); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                  },
                  row.title
                ),
                h(
                  "div",
                  {
                    style:
                      "display: flex; flex-wrap: wrap; gap: 6px; align-items: center;"
                  },
                  [
                    ...(row.post_categories?.slice(0, 1).map(cat =>
                      h(
                        "span",
                        {
                          style:
                            "display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; background: var(--anzhiyu-main-op-light); border-radius: 4px; font-size: 11px; color: var(--anzhiyu-main); font-weight: 500;"
                        },
                        cat.name
                      )
                    ) || []),
                    ...(row.post_tags?.slice(0, 2).map(tag =>
                      h(
                        "span",
                        {
                          style:
                            "font-size: 11px; color: var(--anzhiyu-secondtext);"
                        },
                        `#${tag.name}`
                      )
                    ) || [])
                  ]
                )
              ]
            )
          ]
        );
      }
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        const statusInfo = getStatusInfo(
          row.status,
          row.review_status,
          row.is_takedown
        );
        const tagType = getStatusTagType(
          row.status,
          row.review_status,
          row.is_takedown
        );

        if (row.is_takedown && row.takedown_reason) {
          return h(
            ElTooltip,
            {
              content: `下架原因：${row.takedown_reason}`,
              placement: "top",
              showAfter: 300
            },
            {
              default: () =>
                h(
                  ElTag,
                  { type: tagType, size: "small", effect: "light" },
                  () => statusInfo?.label
                )
            }
          );
        }

        // 定时发布状态显示计划发布时间
        if (row.status === "SCHEDULED" && row.scheduled_at) {
          return h(
            ElTooltip,
            {
              content: `计划发布时间：${formatToChina(row.scheduled_at)}`,
              placement: "top",
              showAfter: 300
            },
            {
              default: () =>
                h(
                  ElTag,
                  { type: tagType, size: "small", effect: "light" },
                  () => statusInfo?.label
                )
            }
          );
        }

        return h(
          ElTag,
          { type: tagType, size: "small", effect: "light" },
          () => statusInfo?.label
        );
      }
    },
    {
      label: "统计",
      prop: "view_count",
      width: 100,
      align: "center",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "div",
          { style: "display: flex; flex-direction: column; gap: 4px;" },
          [
            h(
              "span",
              {
                style:
                  "display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--anzhiyu-secondtext);"
              },
              [
                h(IconifyIconOnline, {
                  icon: "ep:view",
                  width: 14,
                  height: 14
                }),
                row.view_count
              ]
            ),
            h(
              "span",
              {
                style:
                  "display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--anzhiyu-secondtext);"
              },
              [
                h(IconifyIconOnline, {
                  icon: "ep:document",
                  width: 14,
                  height: 14
                }),
                `${row.word_count}字`
              ]
            )
          ]
        );
      }
    },
    {
      label: "时间",
      prop: "created_at",
      width: 140,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "div",
          { style: "display: flex; flex-direction: column; gap: 2px;" },
          [
            h(
              "span",
              {
                style:
                  "display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--anzhiyu-secondtext);"
              },
              [formatToChina(row.created_at, "YYYY-MM-DD HH:mm")]
            ),
            h(
              "span",
              {
                style:
                  "display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--anzhiyu-secondtext); opacity: 0.7;"
              },
              [formatToChina(row.updated_at, "YYYY-MM-DD HH:mm")]
            )
          ]
        );
      }
    },
    {
      label: "操作",
      fixed: "right",
      width: 320,
      align: "center",
      headerAlign: "left",
      slot: "operation",
      showOverflowTooltip: false
    }
  ];

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true,
    pageSizes: [10, 20, 50, 100]
  });

  const loadingConfig = reactive<LoadingConfig>({
    text: "正在加载文章列表...",
    viewBox: "-10, -10, 50, 50",
    spinner: `
      <path class="path" d="
        M 30 15
        L 28 17
        M 25.61 25.61
        A 15 15, 0, 0, 1, 15 30
        A 15 15, 0, 1, 1, 27.99 7.5
        L 15 15
      " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
    `
  });

  function resetForm(formEl) {
    if (!formEl) return;
    formEl.resetFields();
    form.query = "";
    form.status = "";
    form.review_status = "";
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    const { currentPage, pageSize } = pagination;
    try {
      const params: GetArticleListParams & { review_status?: string } = {
        page: currentPage,
        pageSize: pageSize,
        query: form.query,
        status: form.status
      };
      if (form.review_status) {
        params.review_status = form.review_status;
      }
      // 普通用户只能查看自己的文章
      if (!isAdmin.value && userStore.id) {
        params.author_id = userStore.id;
      }
      const { data } = await getArticleList(params);
      dataList.value = data.list;
      pagination.total = data.total;
    } catch {
      message("获取文章列表失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  function handleNew() {
    router.push({ name: "PostEdit", params: { id: "new" } });
  }

  function handleEdit(row: Article) {
    router.push({ name: "PostEdit", params: { id: row.id } });
  }

  async function handleDelete(row: Article) {
    try {
      await deleteArticle(row.id);
      message("删除成功", { type: "success" });
      if (dataList.value.length === 1 && pagination.currentPage > 1) {
        pagination.currentPage--;
      }
      onSearch();
    } catch (error) {
      message(`删除失败: ${error.message}`, { type: "error" });
    }
  }

  // 快速通过审核
  async function handleQuickApprove(article: Article) {
    try {
      await approveArticle(article.id, { review_comment: "审核通过" });
      message(`《${article.title}》已通过审核`, { type: "success" });
      onSearch();
    } catch {
      message("审核操作失败", { type: "error" });
    }
  }

  // 打开拒绝对话框
  function handleReject(article: Article) {
    rejectingArticle.value = article;
    rejectReason.value = "";
    showRejectDialog.value = true;
  }

  // 确认拒绝
  async function confirmReject() {
    if (!rejectReason.value.trim()) {
      message("请填写拒绝原因", { type: "warning" });
      return;
    }
    if (!rejectingArticle.value) return;

    try {
      await rejectArticle(rejectingArticle.value.id, {
        review_comment: rejectReason.value
      });
      message("文章审核已拒绝", { type: "success" });
      showRejectDialog.value = false;
      onSearch();
    } catch {
      message("审核操作失败", { type: "error" });
    }
  }

  // 打开下架对话框
  function handleTakedown(article: Article) {
    takedowningArticle.value = article;
    takedownReason.value = "";
    showTakedownDialog.value = true;
  }

  // 确认下架
  async function confirmTakedown() {
    if (!takedownReason.value.trim()) {
      message("请填写下架原因", { type: "warning" });
      return;
    }
    if (!takedowningArticle.value) return;

    try {
      await takedownArticle(takedowningArticle.value.id, {
        takedown_reason: takedownReason.value
      });
      message(`《${takedowningArticle.value.title}》已下架`, {
        type: "success"
      });
      showTakedownDialog.value = false;
      onSearch();
    } catch {
      message("下架操作失败", { type: "error" });
    }
  }

  // 恢复已下架的文章
  async function handleRestore(article: Article) {
    try {
      await ElMessageBox.confirm(
        `确定要恢复文章《${article.title}》吗？恢复后前台将正常显示。`,
        "恢复文章",
        {
          confirmButtonText: "确定恢复",
          cancelButtonText: "取消",
          type: "info"
        }
      );
      await restoreArticle(article.id);
      message(`《${article.title}》已恢复上架`, { type: "success" });
      onSearch();
    } catch (error) {
      if (error !== "cancel") {
        message("恢复操作失败", { type: "error" });
      }
    }
  }

  // 判断文章是否已下架
  const isTakedown = (article: Article) => article.is_takedown === true;

  // 判断文章是否待审核
  const isPendingReview = (article: Article) =>
    article.review_status === ReviewStatus.PENDING;

  // 跳转到用户管理页面
  function handleAuthorClick(article: Article) {
    if (!article.owner_id) return;
    const name =
      article.owner_nickname ||
      article.owner_name ||
      `用户 ${article.owner_id}`;
    router.push({ name: "UserManagement", query: { keyword: name } });
  }

  function handleSelectionChange(val: Article[]) {
    selectedIds.value = val.map(item => item.id);
  }

  function onSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function onCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  // 导入导出功能
  function handleOpenImportExport() {
    showImportExportDialog.value = true;
  }

  function handleImportExportSuccess() {
    onSearch();
    selectedIds.value = [];
  }

  // 批量删除功能
  const batchDeleting = ref(false);

  async function handleBatchDelete() {
    if (selectedIds.value.length === 0) {
      message("请先选择要删除的文章", { type: "warning" });
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedIds.value.length} 篇文章吗？此操作不可恢复。`,
        "批量删除确认",
        {
          confirmButtonText: "确定删除",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      batchDeleting.value = true;
      const { data } = await batchDeleteArticles(selectedIds.value);

      if (data.failed_count > 0) {
        message(
          `删除完成：成功 ${data.success_count} 篇，失败 ${data.failed_count} 篇`,
          { type: "warning" }
        );
      } else {
        message(`成功删除 ${data.success_count} 篇文章`, { type: "success" });
      }

      // 清空选择并刷新列表
      selectedIds.value = [];
      onSearch();
    } catch (error) {
      if (error !== "cancel") {
        message("批量删除失败", { type: "error" });
      }
    } finally {
      batchDeleting.value = false;
    }
  }

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    loadingConfig,
    selectedIds,
    isAdmin,
    statusOptions,
    reviewStatusOptions,
    showImportExportDialog,
    showRejectDialog,
    rejectingArticle,
    rejectReason,
    showTakedownDialog,
    takedowningArticle,
    takedownReason,
    batchDeleting,
    onSizeChange,
    onCurrentChange,
    onSearch,
    resetForm,
    handleNew,
    handleEdit,
    handleDelete,
    handleQuickApprove,
    handleReject,
    confirmReject,
    handleTakedown,
    confirmTakedown,
    handleRestore,
    isTakedown,
    isPendingReview,
    handleSelectionChange,
    handleOpenImportExport,
    handleImportExportSuccess,
    handleBatchDelete
  };
}
