<template>
  <div class="product-management-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h3 class="title">商品管理</h3>
            <p class="subtitle">管理虚拟商品、卡密库存，支持多规格设置</p>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              添加商品
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-left">
          <el-select
            v-model="filterForm.status"
            style="width: 150px"
            placeholder="状态筛选"
            clearable
            @change="handleFilter"
          >
            <el-option label="草稿" :value="1" />
            <el-option label="已上架" :value="2" />
            <el-option label="已下架" :value="3" />
          </el-select>
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索商品标题"
            style="width: 200px"
            clearable
            @clear="handleFilter"
            @keyup.enter="handleFilter"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="filter-info">
          共 <span class="count">{{ total }}</span> 个商品
        </div>
      </div>

      <!-- 商品列表 -->
      <el-table
        v-loading="loading"
        :data="productList"
        stripe
        class="product-table"
        height="28rem"
      >
        <el-table-column label="商品" min-width="280">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image
                v-if="row.cover_url"
                :src="row.cover_url"
                class="product-cover"
                fit="cover"
              >
                <template #error>
                  <div class="product-cover-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-else class="product-cover-placeholder">
                <el-icon><ShoppingBag /></el-icon>
              </div>
              <div class="product-info">
                <div class="product-title">{{ row.title }}</div>
                <div class="product-desc">
                  {{ row.description || "暂无描述" }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="150">
          <template #default="{ row }">
            <div class="price-cell">
              <span
                v-if="
                  !row.max_price ||
                  row.min_price === row.max_price ||
                  row.variant_count <= 1
                "
                class="price"
              >
                ¥{{ ((row.min_price || 0) / 100).toFixed(2) }}
              </span>
              <span v-else class="price">
                ¥{{ ((row.min_price || 0) / 100).toFixed(2) }} - ¥{{
                  ((row.max_price || 0) / 100).toFixed(2)
                }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="规格/销量" width="120" align="center">
          <template #default="{ row }">
            <div class="stats-cell">
              <span class="stat">{{ row.variant_count }} 规格</span>
              <span class="stat sale">{{ row.total_sales }} 销量</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="首页显示"
          width="100"
          align="center"
          class-name="hide-on-mobile"
        >
          <template #default="{ row }">
            <el-tooltip
              content="控制商品是否在首页文章列表中展示"
              placement="top"
            >
              <el-switch
                :model-value="row.show_on_homepage !== false"
                size="small"
                @change="handleToggleHomepage(row, $event as boolean)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          label="商品链接"
          min-width="200"
          class-name="hide-on-mobile"
        >
          <template #default="{ row }">
            <div class="url-cell">
              <el-link
                type="primary"
                :href="getProductUrl(row.id)"
                target="_blank"
                :underline="false"
              >
                <el-icon class="url-icon"><Link /></el-icon>
                {{ getProductUrl(row.id) }}
              </el-link>
              <el-button
                type="primary"
                link
                size="small"
                @click="copyProductUrl(row.id)"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="created_at"
          label="创建时间"
          width="180"
          class-name="hide-on-mobile"
        >
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="success" link @click="handleManageStock(row)">
              库存
            </el-button>
            <el-button type="warning" link @click="handleToggleStatus(row)">
              {{ row.status === 2 ? "下架" : "上架" }}
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <product-edit-dialog
      v-model="editDialogVisible"
      :product="currentProduct"
      :mode="editMode"
      @refresh="fetchProducts"
    />

    <!-- 库存管理对话框 -->
    <stock-manage-dialog
      v-model="stockDialogVisible"
      :product="currentProduct"
      @refresh="fetchProducts"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Search,
  Picture,
  ShoppingBag,
  Link,
  CopyDocument
} from "@element-plus/icons-vue";
import ProductEditDialog from "./components/ProductEditDialog.vue";
import StockManageDialog from "./components/StockManageDialog.vue";
import {
  listProductsAdminApi,
  deleteProductApi,
  updateProductApi,
  type ProductListItem,
  ProductStatus
} from "@/api/product";

defineOptions({
  name: "ProductManagement"
});

// 列表数据
const productList = ref<ProductListItem[]>([]);
const total = ref(0);
const loading = ref(false);

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20
});

// 筛选
const filterForm = reactive({
  status: undefined as number | undefined,
  keyword: ""
});

// 编辑对话框
const editDialogVisible = ref(false);
const currentProduct = ref<ProductListItem | null>(null);
const editMode = ref<"create" | "edit">("create");

// 库存管理对话框
const stockDialogVisible = ref(false);

// 获取商品列表
const fetchProducts = async () => {
  try {
    loading.value = true;
    const res = await listProductsAdminApi({
      page: pagination.page,
      page_size: pagination.pageSize,
      status: filterForm.status as ProductStatus,
      keyword: filterForm.keyword
    });

    if (res.code === 200 && res.data) {
      productList.value = res.data.list || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error("获取商品列表失败:", error);
    ElMessage.error("获取商品列表失败");
  } finally {
    loading.value = false;
  }
};

// 创建商品
const handleCreate = () => {
  currentProduct.value = null;
  editMode.value = "create";
  editDialogVisible.value = true;
};

// 编辑商品
const handleEdit = (product: ProductListItem) => {
  currentProduct.value = product;
  editMode.value = "edit";
  editDialogVisible.value = true;
};

// 管理库存
const handleManageStock = (product: ProductListItem) => {
  currentProduct.value = product;
  stockDialogVisible.value = true;
};

// 切换状态
const handleToggleStatus = async (product: ProductListItem) => {
  const newStatus =
    product.status === 2 ? ProductStatus.Offline : ProductStatus.Published;
  const actionText = newStatus === 2 ? "上架" : "下架";

  try {
    await ElMessageBox.confirm(
      `确定要${actionText}「${product.title}」吗？`,
      `${actionText}确认`,
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await updateProductApi(product.id, { status: newStatus });
    ElMessage.success(`${actionText}成功`);
    fetchProducts();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error(`${actionText}失败:`, error);
      ElMessage.error(`${actionText}失败`);
    }
  }
};

// 切换首页显示状态
const handleToggleHomepage = async (
  product: ProductListItem,
  showOnHomepage: boolean
) => {
  try {
    await updateProductApi(product.id, { show_on_homepage: showOnHomepage });
    ElMessage.success(showOnHomepage ? "已设为首页显示" : "已从首页隐藏");
    // 更新本地数据，避免重新请求
    product.show_on_homepage = showOnHomepage;
  } catch (error) {
    console.error("更新首页显示状态失败:", error);
    ElMessage.error("更新失败");
    fetchProducts(); // 出错时重新获取数据
  }
};

// 删除商品
const handleDelete = async (product: ProductListItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除「${product.title}」吗？删除后无法恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await deleteProductApi(product.id);
    ElMessage.success("删除成功");
    fetchProducts();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 筛选
const handleFilter = () => {
  pagination.page = 1;
  fetchProducts();
};

// 分页
const handleSizeChange = () => {
  pagination.page = 1;
  fetchProducts();
};

const handlePageChange = () => {
  fetchProducts();
};

// 状态类型
const getStatusType = (status: number) => {
  switch (status) {
    case 1:
      return "info";
    case 2:
      return "success";
    case 3:
      return "warning";
    default:
      return "info";
  }
};

// 状态文本
const getStatusText = (status: number) => {
  switch (status) {
    case 1:
      return "草稿";
    case 2:
      return "已上架";
    case 3:
      return "已下架";
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

// 获取商品链接
const getProductUrl = (productId: string) => {
  return `${window.location.origin}/products/${productId}`;
};

// 复制商品链接
const copyProductUrl = async (productId: string) => {
  const url = getProductUrl(productId);
  try {
    await navigator.clipboard.writeText(url);
    ElMessage.success("链接已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败，请手动复制");
  }
};

onMounted(() => {
  fetchProducts();
});
</script>

<style lang="scss" scoped>
.product-management-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-left {
      .title {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
        color: var(--anzhiyu-fontcolor);
      }

      .subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--anzhiyu-secondtext);
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .filter-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .filter-left {
      display: flex;
      gap: 12px;
    }

    .filter-info {
      font-size: 14px;
      color: var(--anzhiyu-secondtext);

      .count {
        font-weight: 600;
        color: var(--anzhiyu-theme);
      }
    }
  }

  .product-table {
    .product-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .product-cover {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        flex-shrink: 0;
      }

      .product-cover-placeholder {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        background: var(--anzhiyu-card-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .el-icon {
          font-size: 24px;
          color: var(--anzhiyu-secondtext);
        }
      }

      .product-info {
        overflow: hidden;

        .product-title {
          font-weight: 600;
          color: var(--anzhiyu-fontcolor);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .product-desc {
          font-size: 12px;
          color: var(--anzhiyu-secondtext);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .price-cell {
      .price {
        font-size: 14px;
        font-weight: 600;
        color: #f56c6c;
      }
    }

    .stats-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .stat {
        font-size: 12px;
        color: var(--anzhiyu-secondtext);

        &.sale {
          color: var(--anzhiyu-theme);
        }
      }
    }

    .url-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-link {
        font-size: 12px;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .url-icon {
        margin-right: 4px;
        font-size: 12px;
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}

// 移动端适配
@media screen and (width <= 768px) {
  .product-management-container {
    margin: 10px;

    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .header-right {
        width: 100%;

        .el-button {
          flex: 1;
        }
      }
    }

    :deep(.hide-on-mobile) {
      display: none !important;
    }

    .filter-bar {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .filter-left {
        width: 100%;
        flex-direction: column;

        .el-select,
        .el-input {
          width: 100% !important;
        }
      }
    }

    .pagination-wrapper {
      :deep(.el-pagination) {
        flex-wrap: wrap;
        justify-content: center;

        .el-pagination__sizes,
        .el-pagination__jump {
          margin-top: 8px;
        }
      }
    }
  }
}
</style>
