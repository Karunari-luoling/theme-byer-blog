<template>
  <AnDialog
    v-model="dialogVisible"
    title="库存管理"
    width="900px"
    :close-on-click-modal="false"
    content-class="stock-dialog-content"
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <div v-if="productDetail" class="stock-manage-container">
      <div class="product-info">
        <h4>{{ productDetail.title }}</h4>
        <p>选择规格查看和管理卡密库存</p>
      </div>

      <!-- 规格选择 -->
      <el-tabs v-model="activeVariantId" @tab-change="handleVariantChange">
        <el-tab-pane
          v-for="variant in productDetail.variants"
          :key="variant.id"
          :label="variant.name"
          :name="variant.id"
        >
          <div class="variant-actions">
            <el-button type="primary" @click="handleImportStock">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-button @click="fetchStock">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>

          <div class="table-container">
            <el-table v-loading="loading" :data="stockList" stripe>
              <el-table-column prop="content" label="卡密内容" min-width="300">
                <template #default="{ row }">
                  <div class="stock-content">
                    <span class="content-text">{{
                      maskContent(row.content)
                    }}</span>
                    <el-button
                      type="primary"
                      size="small"
                      link
                      @click="handleCopyContent(row.content)"
                    >
                      复制
                    </el-button>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                prop="status"
                label="状态"
                width="100"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag :type="getStockStatusType(row.status)" size="small">
                    {{ getStockStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="used_at" label="使用时间" width="180">
                <template #default="{ row }">
                  {{ row.used_at ? formatDate(row.used_at) : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button
                    v-if="row.status === 1"
                    type="danger"
                    size="small"
                    link
                    @click="handleInvalidate(row)"
                  >
                    作废
                  </el-button>
                  <span v-else class="disabled-action">-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="total"
              :page-sizes="[20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div v-else class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </AnDialog>

  <!-- 导入卡密对话框 -->
  <AnDialog
    v-model="importDialogVisible"
    :confirm-loading="importing"
    show-footer
    confirm-text="导入"
    cancel-text="取消"
    title="批量导入卡密"
    width="600px"
    @confirm="handleConfirmImport"
  >
    <el-form :model="importForm" label-width="100px">
      <el-form-item label="卡密内容">
        <el-input
          v-model="importForm.itemText"
          type="textarea"
          :rows="10"
          placeholder="每行一个卡密内容，例如：&#10;ABC123456&#10;DEF789012&#10;GHI345678"
        />
      </el-form-item>
      <el-form-item>
        <div class="import-tip">
          <el-icon><InfoFilled /></el-icon>
          支持批量导入，每行一个卡密，导入后状态为「未发出」
        </div>
      </el-form-item>
    </el-form>
  </AnDialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Upload, Refresh, InfoFilled } from "@element-plus/icons-vue";
import AnDialog from "@/components/AnDialog/index.vue";
import {
  getProductAdminApi,
  listStockApi,
  importStockApi,
  invalidateStockApi,
  type Product,
  type StockItem
} from "@/api/product";

interface Props {
  modelValue: boolean;
  productId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  refresh: [];
}>();

const dialogVisible = ref(false);
const loading = ref(false);
const productDetail = ref<Product | null>(null);
const activeVariantId = ref("");
const stockList = ref<StockItem[]>([]);
const total = ref(0);

const pagination = reactive({
  page: 1,
  pageSize: 20
});

// 导入对话框
const importDialogVisible = ref(false);
const importing = ref(false);
const importForm = reactive({
  itemText: ""
});

// 同步外部 modelValue
watch(
  () => props.modelValue,
  newValue => {
    dialogVisible.value = newValue;
    if (newValue) {
      handleOpen();
    }
  }
);

watch(dialogVisible, newValue => {
  emit("update:modelValue", newValue);
});
// 打开时加载商品详情
const handleOpen = async () => {
  if (!props.productId) return;

  try {
    loading.value = true;
    const res = await getProductAdminApi(props.productId);
    if (res.code === 200 && res.data) {
      productDetail.value = res.data;
      if (res.data.variants.length > 0) {
        activeVariantId.value = res.data.variants[0].id;
        fetchStock();
      }
    }
  } catch (error) {
    console.error("加载商品详情失败:", error);
    ElMessage.error("加载商品详情失败");
  } finally {
    loading.value = false;
  }
};

const handleOpened = () => {
  // 弹窗打开后的回调
};

const handleClosed = () => {
  // 弹窗关闭后的清理
  productDetail.value = null;
  stockList.value = [];
  activeVariantId.value = "";
  pagination.page = 1;
};

const handleClose = () => {
  dialogVisible.value = false;
};

// 切换规格
const handleVariantChange = () => {
  pagination.page = 1;
  fetchStock();
};

// 获取库存列表
const fetchStock = async () => {
  if (!activeVariantId.value) return;

  try {
    loading.value = true;
    const res = await listStockApi(activeVariantId.value, {
      page: pagination.page,
      page_size: pagination.pageSize
    });

    if (res.code === 200 && res.data) {
      stockList.value = res.data.list || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error("获取库存列表失败:", error);
    ElMessage.error("获取库存列表失败");
  } finally {
    loading.value = false;
  }
};

// 打开导入对话框
const handleImportStock = () => {
  importForm.itemText = "";
  importDialogVisible.value = true;
};

// 确认导入
const handleConfirmImport = async () => {
  if (!importForm.itemText.trim()) {
    ElMessage.warning("请输入卡密内容");
    return;
  }

  try {
    importing.value = true;
    const res = await importStockApi(activeVariantId.value, {
      item_text: importForm.itemText
    });

    if (res.code === 200 && res.data) {
      ElMessage.success(
        `导入成功 ${res.data.imported_count} 条，失败 ${res.data.failed_count} 条`
      );
      importDialogVisible.value = false;
      fetchStock();
      emit("refresh");
    }
  } catch (error) {
    console.error("导入失败:", error);
    ElMessage.error("导入失败");
  } finally {
    importing.value = false;
  }
};

// 作废卡密
const handleInvalidate = async (stock: StockItem) => {
  try {
    await ElMessageBox.confirm(
      "确定要作废这条卡密吗？作废后无法恢复。",
      "作废确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await invalidateStockApi(stock.id);
    ElMessage.success("作废成功");
    fetchStock();
    emit("refresh");
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("作废失败:", error);
      ElMessage.error("作废失败");
    }
  }
};

// 复制内容
const handleCopyContent = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
};

// 遮罩内容
const maskContent = (content: string) => {
  if (content.length <= 8) {
    return (
      content.substring(0, 2) + "***" + content.substring(content.length - 2)
    );
  }
  return (
    content.substring(0, 4) + "****" + content.substring(content.length - 4)
  );
};

// 分页
const handleSizeChange = () => {
  pagination.page = 1;
  fetchStock();
};

const handlePageChange = () => {
  fetchStock();
};

// 状态类型
const getStockStatusType = (status: number) => {
  switch (status) {
    case 1:
      return "success";
    case 2:
      return "info";
    case 3:
      return "danger";
    default:
      return "info";
  }
};

// 状态文本
const getStockStatusText = (status: number) => {
  switch (status) {
    case 1:
      return "未发出";
    case 2:
      return "已发出";
    case 3:
      return "已作废";
    default:
      return "未知";
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};
</script>

<style lang="scss" scoped>
:deep(.stock-dialog-content) {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

.stock-manage-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  .product-info {
    flex-shrink: 0;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: var(--style-border);

    h4 {
      margin: 0 0 8px;
      font-size: 18px;
      color: var(--anzhiyu-fontcolor);
    }

    p {
      margin: 0;
      font-size: 14px;
      color: var(--anzhiyu-secondtext);
    }
  }

  :deep(.el-tabs) {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;

    .el-tabs__header {
      flex-shrink: 0;
      margin: 0 0 16px;
      order: 1;
    }

    .el-tabs__content {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      order: 2;

      .el-tab-pane {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }
    }
  }

  .variant-actions {
    flex-shrink: 0;
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .table-container {
    height: 300px;
    overflow-y: auto;
    margin-bottom: 16px;

    // 美化滚动条
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--el-fill-color-lighter);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-color-info-light-5);
      border-radius: 3px;

      &:hover {
        background: var(--el-color-info-light-3);
      }
    }
  }

  .stock-content {
    display: flex;
    align-items: center;
    gap: 8px;

    .content-text {
      font-family: monospace;
    }
  }

  .disabled-action {
    color: var(--anzhiyu-secondtext);
  }

  .pagination-wrapper {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }
}

.loading-container {
  padding: 20px;
}

.import-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--anzhiyu-secondtext);
}
</style>
