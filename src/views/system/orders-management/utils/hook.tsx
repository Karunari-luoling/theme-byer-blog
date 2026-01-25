/*
 * @Description: 订单管理 Hook
 * @Author: 安知鱼
 */

import { formatToChina } from "@/utils/dayjs";
import { message } from "@/utils/message";
import {
  getOrderListForAdmin,
  deleteOrder,
  type OrderListParams,
  type AdminOrderInfo
} from "@/api/payment";
import { reactive, ref, onMounted, h } from "vue";
import type { PaginationProps, LoadingConfig } from "@pureadmin/table";
import { ElTag, ElMessageBox, ElTooltip } from "element-plus";

// 扩展搜索参数类型
interface ExtendedSearchParams extends OrderListParams {
  order_type?: "ARTICLE" | "SHARE" | "PRODUCT" | "MEMBERSHIP" | "";
  dateRange?: string[];
}

// 状态标签类型
type TagType = "success" | "warning" | "info" | "danger" | "primary";

export function useOrderManagement() {
  const form = reactive<ExtendedSearchParams>({
    order_no: "",
    user_email: "",
    status: undefined,
    payment_provider: undefined,
    order_type: "",
    dateRange: undefined,
    sort_by: "created_at",
    sort_order: "desc"
  });

  const dataList = ref<AdminOrderInfo[]>([]);
  const loading = ref(true);
  const selectedIds = ref<number[]>([]);

  // 订单详情弹窗
  const showDetailDialog = ref(false);
  const currentOrder = ref<AdminOrderInfo | null>(null);

  // 状态选项
  const statusOptions = [
    { value: "", label: "全部状态" },
    { value: "PENDING", label: "待支付", type: "warning", color: "#E6A23C" },
    { value: "SUCCESS", label: "支付成功", type: "success", color: "#67C23A" },
    { value: "FAILED", label: "支付失败", type: "danger", color: "#F56C6C" },
    { value: "CANCELLED", label: "已取消", type: "info", color: "#909399" },
    { value: "EXPIRED", label: "已过期", type: "danger", color: "#F56C6C" }
  ];

  // 支付方式选项
  const providerOptions = [
    { value: "", label: "全部方式" },
    { value: "ALIPAY", label: "支付宝", type: "success" },
    { value: "WECHAT", label: "微信支付", type: "primary" }
  ];

  // 订单类型选项
  const orderTypeOptions = [
    { value: "", label: "全部类型" },
    { value: "ARTICLE", label: "文章购买", type: "success" },
    { value: "SHARE", label: "分享购买", type: "primary" },
    { value: "PRODUCT", label: "商品购买", type: "warning" },
    { value: "MEMBERSHIP", label: "会员订阅", type: "danger" }
  ];

  // 获取状态标签类型
  const getStatusTagType = (status: string): TagType => {
    const statusMap: Record<string, TagType> = {
      PENDING: "warning",
      SUCCESS: "success",
      FAILED: "danger",
      CANCELLED: "info",
      EXPIRED: "danger"
    };
    return statusMap[status] || "info";
  };

  // 获取状态文本
  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      PENDING: "待支付",
      SUCCESS: "支付成功",
      FAILED: "支付失败",
      CANCELLED: "已取消",
      EXPIRED: "已过期"
    };
    return statusMap[status] || status;
  };

  // 获取支付方式标签类型
  const getProviderTagType = (provider: string): TagType => {
    return provider === "ALIPAY" ? "success" : "primary";
  };

  // 获取支付方式文本
  const getProviderText = (provider: string): string => {
    const providerMap: Record<string, string> = {
      ALIPAY: "支付宝",
      WECHAT: "微信支付",
      EPAY: "易支付",
      HUPIJIAO: "虎皮椒V3"
    };
    return providerMap[provider] || provider;
  };

  // 获取订单类型标签类型
  const getOrderTypeTagType = (order: AdminOrderInfo): TagType => {
    const typeMap: Record<string, TagType> = {
      ARTICLE: "success",
      SHARE: "primary",
      PRODUCT: "warning",
      MEMBERSHIP: "danger"
    };
    return typeMap[order.order_type] || "info";
  };

  // 获取订单类型文本
  const getOrderTypeText = (order: AdminOrderInfo): string => {
    const typeMap: Record<string, string> = {
      ARTICLE: "文章购买",
      SHARE: "分享购买",
      PRODUCT: "商品购买",
      MEMBERSHIP: "会员订阅"
    };
    return typeMap[order.order_type] || "未知类型";
  };

  // 格式化金额
  const formatAmount = (amount: number): string => {
    return Number(amount).toFixed(2);
  };

  // 判断订单号类型
  const detectOrderNoType = (orderNo: string): "system" | "trade" => {
    if (!orderNo || !orderNo.trim()) return "system";
    const trimmed = orderNo.trim();
    return trimmed.startsWith("ORDER") ? "system" : "trade";
  };

  // 表格列配置
  const columns: TableColumnList = [
    {
      type: "selection",
      width: 55,
      align: "center",
      headerAlign: "left"
    },
    {
      label: "订单号",
      prop: "order_no",
      minWidth: 200,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "div",
          { style: "display: flex; flex-direction: column; gap: 2px;" },
          [
            h(
              ElTooltip,
              { content: "点击复制", placement: "top", showAfter: 300 },
              {
                default: () =>
                  h(
                    "span",
                    {
                      style:
                        "font-size: 13px; font-weight: 600; color: var(--anzhiyu-fontcolor); cursor: pointer;",
                      onClick: () => {
                        navigator.clipboard.writeText(row.order_no);
                        message("订单号已复制", { type: "success" });
                      }
                    },
                    row.order_no
                  )
              }
            ),
            row.trade_no
              ? h(
                  ElTooltip,
                  {
                    content: `交易号: ${row.trade_no}`,
                    placement: "top",
                    showAfter: 300
                  },
                  {
                    default: () =>
                      h(
                        "span",
                        {
                          style:
                            "font-size: 11px; color: var(--anzhiyu-secondtext); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; display: block;"
                        },
                        row.trade_no
                      )
                  }
                )
              : null
          ]
        );
      }
    },
    {
      label: "用户信息",
      prop: "user_email",
      minWidth: 180,
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
                  "font-size: 13px; color: var(--anzhiyu-fontcolor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
              },
              row.user_email || "匿名用户"
            ),
            row.user_id
              ? h(
                  "span",
                  {
                    style: "font-size: 11px; color: var(--anzhiyu-secondtext);"
                  },
                  `ID: ${row.user_id}`
                )
              : null
          ]
        );
      }
    },
    {
      label: "订单类型",
      prop: "order_type",
      width: 100,
      align: "center",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          ElTag,
          { type: getOrderTypeTagType(row), size: "small", effect: "light" },
          () => getOrderTypeText(row)
        );
      }
    },
    {
      label: "支付状态",
      prop: "payment_status",
      width: 100,
      align: "center",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          ElTag,
          {
            type: getStatusTagType(row.payment_status),
            size: "small",
            effect: "light"
          },
          () => getStatusText(row.payment_status)
        );
      }
    },
    {
      label: "支付方式",
      prop: "payment_provider",
      width: 100,
      align: "center",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          ElTag,
          {
            type: getProviderTagType(row.payment_provider),
            size: "small",
            effect: "light"
          },
          () => getProviderText(row.payment_provider)
        );
      }
    },
    {
      label: "订单金额",
      prop: "amount",
      width: 100,
      align: "center",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "span",
          {
            style: "font-weight: 600; color: var(--anzhiyu-red);"
          },
          `￥${formatAmount(row.amount)}`
        );
      }
    },
    {
      label: "时间",
      prop: "created_at",
      minWidth: 170,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        // 检查支付时间是否有效（不是零值时间）
        const isValidPayTime =
          row.pay_time &&
          row.payment_status === "SUCCESS" &&
          !row.pay_time.startsWith("0001-") &&
          !row.pay_time.startsWith("1970-01-01");

        return h(
          "div",
          { style: "display: flex; flex-direction: column; gap: 2px;" },
          [
            h(
              "span",
              {
                style:
                  "display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--anzhiyu-secondtext);"
              },
              ["创建: ", formatToChina(row.created_at, "YYYY-MM-DD HH:mm")]
            ),
            isValidPayTime
              ? h(
                  "span",
                  {
                    style:
                      "display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--anzhiyu-green);"
                  },
                  ["支付: ", formatToChina(row.pay_time, "YYYY-MM-DD HH:mm")]
                )
              : h(
                  "span",
                  {
                    style:
                      "font-size: 12px; color: var(--anzhiyu-secondtext); opacity: 0.6;"
                  },
                  "未支付"
                )
          ]
        );
      }
    },
    {
      label: "操作",
      fixed: "right",
      width: 160,
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
    text: "正在加载订单列表...",
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

  function resetForm(formEl: any) {
    if (!formEl) return;
    formEl.resetFields();
    Object.assign(form, {
      order_no: "",
      user_email: "",
      status: undefined,
      payment_provider: undefined,
      order_type: "",
      dateRange: undefined,
      sort_by: "created_at",
      sort_order: "desc"
    });
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    const { currentPage, pageSize } = pagination;

    try {
      const params: OrderListParams = {
        page: currentPage,
        page_size: pageSize,
        user_email: form.user_email || undefined,
        status: form.status,
        payment_provider: form.payment_provider,
        sort_by: form.sort_by,
        sort_order: form.sort_order
      };

      // 智能识别订单号类型
      if (form.order_no) {
        const orderNoType = detectOrderNoType(form.order_no);
        if (orderNoType === "system") {
          params.order_no = form.order_no;
        } else {
          params.trade_no = form.order_no;
        }
      }

      // 处理时间范围
      if (form.dateRange && form.dateRange.length === 2) {
        params.start_date = form.dateRange[0] + "T00:00:00Z";
        params.end_date = form.dateRange[1] + "T23:59:59Z";
      }

      const response = await getOrderListForAdmin(params);

      if (response.code === 200) {
        let orders = response.data.orders;

        // 客户端过滤订单类型
        if (form.order_type) {
          orders = orders.filter(order => order.order_type === form.order_type);
        }

        dataList.value = orders;
        pagination.total = response.data.total;
      } else {
        message(response.message || "获取订单列表失败", { type: "error" });
      }
    } catch (error) {
      console.error("获取订单列表失败:", error);
      message("获取订单列表失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  // 查看详情
  function handleViewDetail(row: AdminOrderInfo) {
    currentOrder.value = row;
    showDetailDialog.value = true;
  }

  // 关闭详情
  function handleCloseDetail() {
    showDetailDialog.value = false;
    currentOrder.value = null;
  }

  // 删除订单
  async function handleDelete(row: AdminOrderInfo) {
    try {
      await ElMessageBox.confirm(
        `确定要删除订单 ${row.order_no} 吗？删除后将无法恢复。`,
        "删除订单",
        {
          confirmButtonText: "确定删除",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      loading.value = true;
      const response = await deleteOrder(row.id);

      if (response.code === 200) {
        message("订单删除成功", { type: "success" });
        await onSearch();
      } else {
        message(response.message || "订单删除失败", { type: "error" });
      }
    } catch (error) {
      if (error !== "cancel") {
        console.error("删除订单失败:", error);
        message("订单删除失败", { type: "error" });
      }
    } finally {
      loading.value = false;
    }
  }

  // 批量删除
  async function handleBatchDelete() {
    if (selectedIds.value.length === 0) {
      message("请选择要删除的订单", { type: "warning" });
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedIds.value.length} 个订单吗？删除后将无法恢复。`,
        "批量删除",
        {
          confirmButtonText: "确定删除",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      loading.value = true;
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds.value) {
        try {
          const response = await deleteOrder(id);
          if (response.code === 200) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        message(`成功删除 ${successCount} 个订单`, { type: "success" });
      }
      if (failCount > 0) {
        message(`${failCount} 个订单删除失败`, { type: "error" });
      }

      selectedIds.value = [];
      await onSearch();
    } catch (error) {
      if (error !== "cancel") {
        message("批量删除失败", { type: "error" });
      }
    } finally {
      loading.value = false;
    }
  }

  function handleSelectionChange(val: AdminOrderInfo[]) {
    selectedIds.value = val.map(item => item.id);
  }

  function onSizeChange(val: number) {
    pagination.pageSize = val;
    pagination.currentPage = 1;
    onSearch();
  }

  function onCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
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
    providerOptions,
    orderTypeOptions,
    showDetailDialog,
    currentOrder,
    getStatusTagType,
    getStatusText,
    getProviderTagType,
    getProviderText,
    getOrderTypeTagType,
    getOrderTypeText,
    formatAmount,
    onSizeChange,
    onCurrentChange,
    onSearch,
    resetForm,
    handleViewDetail,
    handleCloseDetail,
    handleDelete,
    handleBatchDelete,
    handleSelectionChange
  };
}
