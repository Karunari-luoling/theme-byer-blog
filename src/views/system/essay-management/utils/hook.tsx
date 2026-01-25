/*
 * @Description: 说说管理 Hook
 * @Author: 安知鱼
 */

import { formatToChina } from "@/utils/dayjs";
import { message } from "@/utils/message";
import {
  getAdminEssayList,
  deleteEssay,
  deleteEssays,
  type EssayData
} from "@/api/essay-management";
import { reactive, ref, onMounted, h } from "vue";
import type { PaginationProps, LoadingConfig } from "@pureadmin/table";
import { ElTag, ElTooltip } from "element-plus";
import { IconifyIconOnline } from "@/components/ReIcon";

export function useEssayManagement() {
  // 筛选表单
  const form = reactive({
    status: undefined as number | undefined
  });

  const dataList = ref<EssayData[]>([]);
  const loading = ref(true);
  const selectedIds = ref<number[]>([]);

  // 导入导出相关
  const showImportExportDialog = ref(false);

  // 编辑对话框相关
  const editDialogVisible = ref(false);
  const currentEssay = ref<EssayData | null>(null);

  // 查看对话框相关
  const viewDialogVisible = ref(false);

  // 状态选项
  const statusOptions = [
    { value: undefined, label: "全部状态" },
    {
      value: 1,
      label: "已发布",
      type: "success",
      color: "var(--anzhiyu-green)"
    },
    {
      value: 2,
      label: "草稿",
      type: "info",
      color: "var(--anzhiyu-secondtext)"
    },
    {
      value: 3,
      label: "隐藏",
      type: "warning",
      color: "var(--anzhiyu-orange)"
    }
  ];

  // 获取状态标签类型
  const getStatusTagType = (
    status: number
  ): "success" | "warning" | "danger" | "info" | "primary" => {
    const statusMap: Record<number, "success" | "info" | "warning"> = {
      1: "success",
      2: "info",
      3: "warning"
    };
    return statusMap[status] || "info";
  };

  // 获取状态文本
  const getStatusText = (status: number): string => {
    const statusMap: Record<number, string> = {
      1: "已发布",
      2: "草稿",
      3: "隐藏"
    };
    return statusMap[status] || "未知";
  };

  // 表格列配置
  const columns: TableColumnList = [
    {
      type: "selection",
      width: 55,
      align: "left",
      headerAlign: "left"
    },
    {
      label: "序号",
      prop: "sort_order",
      width: 80,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ index }) => {
        const { total, currentPage, pageSize } = pagination;
        return h(
          "span",
          {
            style: "font-size: 13px; color: var(--anzhiyu-secondtext);"
          },
          total - (currentPage - 1) * pageSize - index
        );
      }
    },
    {
      label: "内容",
      prop: "content",
      minWidth: 280,
      align: "left",
      headerAlign: "left",
      showOverflowTooltip: false,
      cellRenderer: ({ row }) => {
        const content = row.content || "-";
        const isLong = content.length > 100;

        if (isLong) {
          return h(
            ElTooltip,
            {
              content: content,
              placement: "top",
              showAfter: 300
            },
            {
              default: () =>
                h(
                  "div",
                  {
                    style:
                      "display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; color: var(--anzhiyu-fontcolor); word-break: break-word;"
                  },
                  content
                )
            }
          );
        }

        return h(
          "div",
          {
            style:
              "display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; color: var(--anzhiyu-fontcolor); word-break: break-word;"
          },
          content
        );
      }
    },
    {
      label: "媒体",
      prop: "media",
      width: 100,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        const tags = [];

        if (row.image && row.image.length > 0) {
          tags.push(
            h(
              ElTag,
              { type: "success", size: "small", effect: "light" },
              {
                default: () =>
                  h(
                    "span",
                    {
                      style:
                        "display: inline-flex; align-items: center; gap: 4px;"
                    },
                    [
                      h(IconifyIconOnline, {
                        icon: "ep:picture",
                        width: 14,
                        height: 14
                      }),
                      h("span", {}, row.image.length)
                    ]
                  )
              }
            )
          );
        }

        if (row.aplayer && row.aplayer.id) {
          tags.push(
            h(
              ElTag,
              { type: "warning", size: "small", effect: "light" },
              {
                default: () =>
                  h(
                    "span",
                    {
                      style:
                        "display: inline-flex; align-items: center; gap: 4px;"
                    },
                    [
                      h(IconifyIconOnline, {
                        icon: "ep:headset",
                        width: 14,
                        height: 14
                      }),
                      h("span", {}, "音乐")
                    ]
                  )
              }
            )
          );
        }

        if (tags.length === 0) {
          return h(
            "span",
            {
              style: "font-size: 12px; color: var(--anzhiyu-secondtext);"
            },
            "-"
          );
        }

        return h(
          "div",
          {
            style:
              "display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-start;"
          },
          tags
        );
      }
    },
    {
      label: "地址",
      prop: "address",
      width: 120,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "span",
          {
            style:
              "font-size: 13px; color: var(--anzhiyu-fontcolor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
          },
          row.address || "-"
        );
      }
    },
    {
      label: "发布者",
      prop: "from",
      width: 100,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "span",
          {
            style:
              "font-size: 13px; color: var(--anzhiyu-fontcolor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
          },
          row.from || "-"
        );
      }
    },
    {
      label: "状态",
      prop: "status",
      width: 90,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          ElTag,
          {
            type: getStatusTagType(row.status),
            size: "small",
            effect: "light"
          },
          () => getStatusText(row.status)
        );
      }
    },
    {
      label: "创建时间",
      prop: "created_at",
      width: 160,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "span",
          {
            style: "font-size: 12px; color: var(--anzhiyu-secondtext);"
          },
          formatToChina(row.created_at)
        );
      }
    },
    {
      label: "操作",
      fixed: "right",
      width: 240,
      align: "center",
      headerAlign: "left",
      slot: "operation",
      showOverflowTooltip: false
    }
  ];

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true,
    pageSizes: [10, 20, 50, 100]
  });

  const loadingConfig = reactive<LoadingConfig>({
    text: "正在加载说说列表...",
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
    form.status = undefined;
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    const { currentPage, pageSize } = pagination;
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        status: form.status
      };
      const response: any = await getAdminEssayList(params);
      if (response.code === 200 && response.data) {
        dataList.value = response.data.list || [];
        pagination.total = response.data.total || 0;
      } else {
        message(response.message || "获取说说列表失败", { type: "error" });
      }
    } catch {
      message("获取说说列表失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  // 新增说说
  function handleNew() {
    currentEssay.value = null;
    editDialogVisible.value = true;
  }

  // 编辑说说
  function handleEdit(row: EssayData) {
    currentEssay.value = row;
    editDialogVisible.value = true;
  }

  // 查看说说
  function handleView(row: EssayData) {
    currentEssay.value = row;
    viewDialogVisible.value = true;
  }

  // 删除说说
  async function handleDelete(row: EssayData) {
    try {
      const response: any = await deleteEssay(row.id);
      if (response.code === 200) {
        message("删除成功", { type: "success" });
        if (dataList.value.length === 1 && pagination.currentPage > 1) {
          pagination.currentPage--;
        }
        onSearch();
      } else {
        message(response.message || "删除失败", { type: "error" });
      }
    } catch (error) {
      message(`删除失败: ${error.message}`, { type: "error" });
    }
  }

  // 批量删除
  async function handleBatchDelete() {
    if (selectedIds.value.length === 0) {
      message("请至少选择一条说说", { type: "warning" });
      return;
    }

    try {
      const response: any = await deleteEssays(selectedIds.value);
      if (response.code === 200) {
        const deletedCount =
          response.data?.deleted_count || selectedIds.value.length;
        message(`成功删除 ${deletedCount} 条说说`, { type: "success" });
        selectedIds.value = [];
        onSearch();
      } else {
        message(response.message || "批量删除失败", { type: "error" });
      }
    } catch {
      message("批量删除失败", { type: "error" });
    }
  }

  // 编辑成功回调
  function handleEditSuccess() {
    editDialogVisible.value = false;
    onSearch();
  }

  // 选择变化
  function handleSelectionChange(val: EssayData[]) {
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

  // 查看说说页面
  function handleViewEssayPage() {
    window.open("/essay", "_blank");
  }

  // 格式化日期
  function formatDate(date: string) {
    return formatToChina(date);
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
    statusOptions,
    showImportExportDialog,
    editDialogVisible,
    viewDialogVisible,
    currentEssay,
    onSizeChange,
    onCurrentChange,
    onSearch,
    resetForm,
    handleNew,
    handleEdit,
    handleView,
    handleDelete,
    handleBatchDelete,
    handleEditSuccess,
    handleSelectionChange,
    handleOpenImportExport,
    handleImportExportSuccess,
    handleViewEssayPage,
    formatDate,
    getStatusTagType,
    getStatusText
  };
}
