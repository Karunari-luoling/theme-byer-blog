<template>
  <div class="donation-management-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h3 class="title">打赏管理</h3>
            <p class="subtitle">管理打赏名单，支持显示/隐藏、排序等功能</p>
          </div>
          <div class="header-right">
            <el-button @click="handleImportExport">
              <el-icon><FolderOpened /></el-icon>
              导入导出
            </el-button>
            <el-button @click="handleViewAboutPage">
              <el-icon><View /></el-icon>
              查看关于页面
            </el-button>
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              添加打赏记录
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-select
          v-model="filterForm.status"
          style="width: 150px"
          placeholder="状态筛选"
          clearable
          @change="handleFilter"
        >
          <el-option label="显示" :value="1" />
          <el-option label="隐藏" :value="2" />
        </el-select>
        <div class="filter-info">
          共 <span class="count">{{ total }}</span> 条打赏记录
        </div>
      </div>

      <!-- 打赏列表 -->
      <el-table
        v-loading="loading"
        :data="donationList"
        stripe
        class="donation-table"
        height="28rem"
      >
        <el-table-column
          prop="id"
          label="ID"
          width="80"
          class-name="hide-on-mobile"
        />
        <el-table-column label="姓名" min-width="150">
          <template #default="{ row }">
            <div class="name-cell">
              {{ row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="150">
          <template #default="{ row }">
            <div class="amount-cell">
              <span class="amount">{{ row.amount }}</span>
              <span class="suffix">{{ row.suffix }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="sort_order"
          label="排序"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag v-if="row.sort_order" type="info" size="small">{{
              row.sort_order
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="created_at"
          label="打赏时间"
          width="180"
          class-name="hide-on-mobile"
        >
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? "显示" : "隐藏" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
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
    <donation-edit-dialog
      v-model="editDialogVisible"
      :donation="currentDonation"
      :mode="editMode"
      @refresh="fetchDonations"
    />

    <!-- 导入导出对话框 -->
    <import-export-dialog
      v-model="importExportDialogVisible"
      :selected-ids="[]"
      @success="fetchDonations"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { View, Plus, FolderOpened } from "@element-plus/icons-vue";
import DonationEditDialog from "./components/DonationEditDialog.vue";
import ImportExportDialog from "./components/ImportExportDialog.vue";
import {
  listDonationsApi,
  deleteDonationApi,
  type DonationItem
} from "@/api/donation";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

defineOptions({
  name: "DonationManagement"
});

const siteConfigStore = useSiteConfigStore();

// 列表数据
const donationList = ref<DonationItem[]>([]);
const total = ref(0);
const loading = ref(false);

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20
});

// 筛选
const filterForm = reactive({
  status: undefined as number | undefined
});

// 编辑对话框
const editDialogVisible = ref(false);
const currentDonation = ref<DonationItem | null>(null);
const editMode = ref<"create" | "edit">("create");

// 导入导出对话框
const importExportDialogVisible = ref(false);

// 获取打赏列表
const fetchDonations = async () => {
  try {
    loading.value = true;
    const res = await listDonationsApi({
      page: pagination.page,
      page_size: pagination.pageSize,
      status: filterForm.status
    });

    if (res.code === 200 && res.data) {
      donationList.value = res.data.list || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error("获取打赏列表失败:", error);
    ElMessage.error("获取打赏列表失败");
  } finally {
    loading.value = false;
  }
};

// 创建打赏
const handleCreate = () => {
  currentDonation.value = null;
  editMode.value = "create";
  editDialogVisible.value = true;
};

// 编辑打赏
const handleEdit = (donation: DonationItem) => {
  currentDonation.value = donation;
  editMode.value = "edit";
  editDialogVisible.value = true;
};

// 删除打赏
const handleDelete = async (donation: DonationItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${donation.name} 的打赏记录吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await deleteDonationApi(donation.id);
    ElMessage.success("删除成功");
    fetchDonations();
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
  fetchDonations();
};

// 分页
const handleSizeChange = () => {
  pagination.page = 1;
  fetchDonations();
};

const handlePageChange = () => {
  fetchDonations();
};

// 查看关于页面
const handleViewAboutPage = () => {
  const siteUrl = siteConfigStore.getSiteUrl;
  if (siteUrl) {
    window.open(`${siteUrl}/about`, "_blank");
  } else {
    ElMessage.warning("无法获取站点地址");
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

// 打开导入导出对话框
const handleImportExport = () => {
  importExportDialogVisible.value = true;
};

onMounted(() => {
  fetchDonations();
});
</script>

<style lang="scss" scoped>
.donation-management-container {
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

    .filter-info {
      font-size: 14px;
      color: var(--anzhiyu-secondtext);

      .count {
        font-weight: 600;
        color: var(--anzhiyu-theme);
      }
    }
  }

  .donation-table {
    .name-cell {
      font-weight: 500;
    }

    .amount-cell {
      display: flex;
      align-items: baseline;
      gap: 4px;

      .amount {
        font-size: 16px;
        font-weight: 600;
        color: var(--anzhiyu-theme);
      }

      .suffix {
        font-size: 12px;
        color: var(--anzhiyu-secondtext);
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
  .donation-management-container {
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

      .el-select {
        width: 100% !important;
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
