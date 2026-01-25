<!--
 * @Description: 文档系列管理页面
 * @Author: 安知鱼
 * @Date: 2025-12-30
-->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit, Delete, Refresh } from "@element-plus/icons-vue";
import {
  getDocSeriesList,
  createDocSeries,
  updateDocSeries,
  deleteDocSeries
} from "@/api/post";
import type { DocSeries, DocSeriesForm } from "@/api/post/type";
import DocSeriesDialog from "./components/DocSeriesDialog.vue";

defineOptions({ name: "DocSeriesManagement" });

// 列表数据
const tableData = ref<DocSeries[]>([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

// 编辑对话框
const dialogVisible = ref(false);
const dialogTitle = ref("新增文档系列");
const currentSeries = ref<DocSeries | null>(null);
const isSubmitting = ref(false);

// 加载列表
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getDocSeriesList({
      page: currentPage.value,
      pageSize: pageSize.value
    });
    tableData.value = res.data.list || [];
    total.value = res.data.total || 0;
  } catch (error) {
    console.error("加载文档系列失败:", error);
    ElMessage.error("加载文档系列失败");
  } finally {
    loading.value = false;
  }
};

// 打开新增对话框
const handleAdd = () => {
  currentSeries.value = null;
  dialogTitle.value = "新增文档系列";
  dialogVisible.value = true;
};

// 打开编辑对话框
const handleEdit = (row: DocSeries) => {
  currentSeries.value = row;
  dialogTitle.value = "编辑文档系列";
  dialogVisible.value = true;
};

// 删除文档系列
const handleDelete = async (row: DocSeries) => {
  if (row.doc_count > 0) {
    ElMessage.warning(
      `该系列下还有 ${row.doc_count} 篇文档，请先移除文档后再删除系列`
    );
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除文档系列「${row.name}」吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    await deleteDocSeries(row.id);
    ElMessage.success("删除成功");
    loadData();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败: " + (error.message || "未知错误"));
    }
  }
};

// 保存文档系列
const handleSave = async (form: DocSeriesForm) => {
  isSubmitting.value = true;
  try {
    if (currentSeries.value) {
      // 编辑
      await updateDocSeries(currentSeries.value.id, form);
      ElMessage.success("更新成功");
    } else {
      // 新增
      await createDocSeries(form);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
    loadData();
  } catch (error: any) {
    console.error("保存失败:", error);
    ElMessage.error("保存失败: " + (error.message || "未知错误"));
  } finally {
    isSubmitting.value = false;
  }
};

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="doc-series-management">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <h3 class="page-title">文档系列管理</h3>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新增系列
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        :style="{ width: '100%' }"
        row-key="id"
      >
        <el-table-column
          prop="cover_url"
          label="封面"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-image
              v-if="row.cover_url"
              :src="row.cover_url"
              :preview-src-list="[row.cover_url]"
              fit="cover"
              class="cover-img"
              preview-teleported
            />
            <span v-else class="no-cover">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="系列名称" min-width="150">
          <template #default="{ row }">
            <div class="series-name">
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <span class="text-secondary">{{ row.description || "-" }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="doc_count"
          label="文档数量"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ row.doc_count }} 篇</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="sort" label="排序" width="80" align="center" />

        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            <span class="text-secondary">
              {{ new Date(row.created_at).toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="Edit"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <DocSeriesDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :series="currentSeries"
      :is-submitting="isSubmitting"
      @save="handleSave"
    />
  </div>
</template>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left {
  .page-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.series-name {
  font-weight: 500;
}

.cover-img {
  width: 48px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
}

.no-cover {
  color: var(--el-text-color-secondary);
}

.text-secondary {
  color: var(--el-text-color-secondary);
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
