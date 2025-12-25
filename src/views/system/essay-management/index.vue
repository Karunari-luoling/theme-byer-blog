<script setup lang="ts">
import { ref } from "vue";
import { useEssayManagement } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EssayEditDialog from "./components/EssayEditDialog.vue";
import ImportExportDialog from "./components/ImportExportDialog.vue";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Search from "@iconify-icons/ri/search-line";
import Upload from "@iconify-icons/ep/upload";
import Download from "@iconify-icons/ep/download";
import View from "@iconify-icons/ep/view";

defineOptions({
  name: "EssayManagement"
});

const formRef = ref();
const tableRef = ref();

const {
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
} = useEssayManagement();

function onFullscreen() {
  tableRef.value?.setAdaptive();
}
</script>

<template>
  <div class="main">
    <!-- 搜索表单 -->
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-full pl-8 pt-[12px] overflow-auto"
    >
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="form.status"
          placeholder="状态筛选"
          clearable
          class="!w-[150px]"
        >
          <el-option
            v-for="item in statusOptions.filter(s => s.value !== undefined)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <span class="status-option">
              <span
                class="status-dot"
                :style="{ backgroundColor: item.color }"
              />
              <span>{{ item.label }}</span>
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item class="search-buttons">
        <el-button
          v-ripple
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button
          v-ripple
          :icon="useRenderIcon(Refresh)"
          @click="resetForm(formRef)"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 表格区域 -->
    <PureTableBar
      title="说说管理"
      :columns="columns"
      :tableRef="tableRef?.getTableRef()"
      class="table-bar"
      @refresh="onSearch"
      @fullscreen="onFullscreen"
    >
      <template #title>
        <div class="table-title">
          <span class="title-text">说说管理</span>
          <span class="title-desc">
            管理即刻动态，支持文本、图片、音乐等多种形式
          </span>
        </div>
      </template>

      <template #buttons>
        <el-button
          v-ripple
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleNew"
        >
          发布说说
        </el-button>
        <el-button
          v-ripple
          :icon="useRenderIcon(View)"
          @click="handleViewEssayPage"
        >
          查看页面
        </el-button>
        <el-button
          v-ripple
          :icon="useRenderIcon(Upload)"
          @click="handleOpenImportExport"
        >
          导入
        </el-button>
        <el-button
          v-if="selectedIds.length > 0"
          v-ripple
          :icon="useRenderIcon(Download)"
          @click="handleOpenImportExport"
        >
          导出 ({{ selectedIds.length }})
        </el-button>
        <el-button
          v-if="selectedIds.length > 0"
          v-ripple
          type="danger"
          :icon="useRenderIcon(Delete)"
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </template>

      <template v-slot="{ dynamicColumns }">
        <pure-table
          ref="tableRef"
          adaptive
          :adaptiveConfig="{ offsetBottom: 108 }"
          align-whole="center"
          row-key="id"
          table-layout="auto"
          :loading-config="loadingConfig"
          :loading="loading"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @selection-change="handleSelectionChange"
          @page-size-change="onSizeChange"
          @page-current-change="onCurrentChange"
        >
          <template #operation="{ row }">
            <div class="operation-btns">
              <el-button
                v-ripple
                type="primary"
                size="small"
                :icon="useRenderIcon(EditPen)"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                v-ripple
                type="success"
                size="small"
                :icon="useRenderIcon(View)"
                @click="handleView(row)"
              >
                查看
              </el-button>
              <el-popconfirm
                title="确定要删除这条说说吗？"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button
                    v-ripple
                    type="danger"
                    size="small"
                    :icon="useRenderIcon(Delete)"
                  >
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 编辑对话框 -->
    <EssayEditDialog
      v-model:visible="editDialogVisible"
      :essay-data="currentEssay"
      @success="handleEditSuccess"
    />

    <!-- 查看对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="说说详情"
      width="800px"
      append-to-body
    >
      <div v-if="currentEssay" class="essay-detail">
        <div class="detail-row">
          <span class="label">序号：</span>
          <span class="value">{{
            currentEssay.sort_order && currentEssay.sort_order !== 0
              ? currentEssay.sort_order
              : "-"
          }}</span>
        </div>
        <div v-if="currentEssay.address" class="detail-row">
          <span class="label">地址：</span>
          <span class="value">{{ currentEssay.address }}</span>
        </div>
        <div v-if="currentEssay.from" class="detail-row">
          <span class="label">发布者：</span>
          <span class="value">{{ currentEssay.from }}</span>
        </div>
        <div v-if="currentEssay.link" class="detail-row">
          <span class="label">链接：</span>
          <span class="value">
            <a :href="currentEssay.link" target="_blank">{{
              currentEssay.link
            }}</a>
          </span>
        </div>
        <div class="detail-row">
          <span class="label">状态：</span>
          <el-tag :type="getStatusTagType(currentEssay.status)">
            {{ getStatusText(currentEssay.status) }}
          </el-tag>
        </div>
        <div class="detail-section">
          <div class="label">内容：</div>
          <div class="content-box">{{ currentEssay.content }}</div>
        </div>
        <div
          v-if="currentEssay.image && currentEssay.image.length > 0"
          class="detail-section"
        >
          <div class="label">图片：</div>
          <div class="image-grid">
            <el-image
              v-for="(img, index) in currentEssay.image"
              :key="index"
              :src="img"
              fit="cover"
              :preview-src-list="currentEssay.image"
              :initial-index="index"
              class="image-item"
            />
          </div>
        </div>
        <div
          v-if="currentEssay.aplayer && currentEssay.aplayer.id"
          class="detail-section"
        >
          <div class="label">音乐：</div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="平台">
              网易云音乐
            </el-descriptions-item>
            <el-descriptions-item label="歌曲 ID">
              {{ currentEssay.aplayer.id }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="detail-row">
          <span class="label">创建时间：</span>
          <span class="value">{{ formatDate(currentEssay.created_at) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">更新时间：</span>
          <span class="value">{{ formatDate(currentEssay.updated_at) }}</span>
        </div>
      </div>
    </el-dialog>

    <!-- 导入导出对话框 -->
    <ImportExportDialog
      v-model="showImportExportDialog"
      :selected-ids="selectedIds"
      @success="handleImportExportSuccess"
    />
  </div>
</template>

<style lang="scss" scoped>
.main {
  margin: 24px;
}

// 搜索表单
.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 16px;
  border: var(--style-border);
  border-radius: 12px;

  :deep(.search-buttons) {
    margin-left: auto;
    margin-right: 16px;
  }
}

// 表格公共样式已移至 @/style/table-bar.scss

// 说说详情样式
.essay-detail {
  .detail-row {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    line-height: 1.6;

    .label {
      flex-shrink: 0;
      width: 100px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .value {
      flex: 1;
      color: var(--anzhiyu-fontcolor);
      word-break: break-all;

      a {
        color: var(--anzhiyu-theme);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .detail-section {
    margin-bottom: 20px;

    .label {
      margin-bottom: 12px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .content-box {
      padding: 16px;
      line-height: 1.8;
      color: var(--anzhiyu-fontcolor);
      word-break: break-word;
      white-space: pre-wrap;
      background-color: var(--anzhiyu-secondbg);
      border-radius: 8px;
    }

    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;

      .image-item {
        width: 100%;
        height: 150px;
        cursor: pointer;
        border: 1px solid var(--el-border-color-light);
        border-radius: 8px;
      }
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .main {
    margin: 10px;
  }

  .search-form {
    padding: 12px !important;
  }

  .table-title {
    .title-text {
      font-size: 14px;
    }

    .title-desc {
      display: none;
    }
  }

  .operation-btns {
    flex-direction: column;
    gap: 4px;

    .el-button {
      width: 100%;
    }
  }

  .essay-detail {
    .detail-row {
      flex-direction: column;
      align-items: flex-start;

      .label {
        width: 100%;
        margin-bottom: 4px;
      }
    }

    .detail-section {
      .image-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));

        .image-item {
          height: 100px;
        }
      }
    }
  }
}
</style>
