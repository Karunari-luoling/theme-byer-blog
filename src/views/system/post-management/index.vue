<script setup lang="ts">
import { ref } from "vue";
import { usePostManagement } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AnDialog from "@/components/AnDialog/index.vue";
import ImportExportDialog from "./components/ImportExportDialog.vue";

import Delete from "@iconify-icons/ep/delete";
import DeleteFilled from "@iconify-icons/ep/delete-filled";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Search from "@iconify-icons/ri/search-line";
import Upload from "@iconify-icons/ep/upload";
import Download from "@iconify-icons/ep/download";
import Check from "@iconify-icons/ep/check";
import Close from "@iconify-icons/ep/close";

defineOptions({
  name: "PostManagement"
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
} = usePostManagement();

function onFullscreen() {
  tableRef.value?.setAdaptive();
}
</script>

<template>
  <div class="main">
    <!-- 普通用户提示 -->
    <div v-if="!isAdmin" class="author-hint">
      <IconifyIconOnline icon="ep:info-filled" width="16" height="16" />
      <span
        >您正在查看<strong>我的文章</strong>列表，只能管理自己创建的文章</span
      >
    </div>

    <!-- 搜索表单 -->
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-full pl-8 pt-[12px] overflow-auto"
    >
      <el-form-item label="关键词：" prop="query">
        <el-input
          v-model="form.query"
          placeholder="搜索文章标题、内容..."
          clearable
          class="!w-[200px]"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="form.status"
          placeholder="文章状态"
          clearable
          class="!w-[140px]"
        >
          <el-option
            v-for="item in statusOptions.filter(s => s.value)"
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
      <el-form-item v-if="isAdmin" label="审核状态：" prop="review_status">
        <el-select
          v-model="form.review_status"
          placeholder="审核状态"
          clearable
          class="!w-[140px]"
        >
          <el-option
            v-for="item in reviewStatusOptions.filter(s => s.value)"
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
      title="文章管理"
      :columns="columns"
      :tableRef="tableRef?.getTableRef()"
      class="table-bar"
      @refresh="onSearch"
      @fullscreen="onFullscreen"
    >
      <template #buttons>
        <el-button
          v-ripple
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleNew"
        >
          新增文章
        </el-button>
        <el-button
          v-if="isAdmin"
          v-ripple
          :icon="useRenderIcon(Upload)"
          @click="handleOpenImportExport"
        >
          导入
        </el-button>
        <el-button
          v-if="isAdmin && selectedIds.length > 0"
          v-ripple
          :icon="useRenderIcon(Download)"
          @click="handleOpenImportExport"
        >
          导出 ({{ selectedIds.length }})
        </el-button>
        <el-button
          v-if="isAdmin && selectedIds.length > 0"
          v-ripple
          type="danger"
          :icon="useRenderIcon(DeleteFilled)"
          :loading="batchDeleting"
          @click="handleBatchDelete"
        >
          删除 ({{ selectedIds.length }})
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
              <!-- 审核操作（仅待审核时显示） -->
              <template v-if="isAdmin && isPendingReview(row)">
                <el-button
                  v-ripple
                  type="success"
                  size="small"
                  :icon="useRenderIcon(Check)"
                  @click="handleQuickApprove(row)"
                >
                  通过
                </el-button>
                <el-button
                  v-ripple
                  type="danger"
                  size="small"
                  :icon="useRenderIcon(Close)"
                  @click="handleReject(row)"
                >
                  拒绝
                </el-button>
              </template>

              <!-- 下架/恢复操作 -->
              <template v-if="isAdmin && row.owner_id != 1">
                <el-button
                  v-if="!isTakedown(row)"
                  v-ripple
                  type="warning"
                  size="small"
                  @click="handleTakedown(row)"
                >
                  下架
                </el-button>
                <el-button
                  v-else
                  v-ripple
                  type="success"
                  size="small"
                  @click="handleRestore(row)"
                >
                  恢复
                </el-button>
              </template>

              <!-- 编辑按钮 -->
              <el-button
                v-ripple
                type="primary"
                size="small"
                :icon="useRenderIcon(EditPen)"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>

              <!-- 删除按钮 -->
              <el-popconfirm
                :title="`确定要删除文章《${row.title}》吗？`"
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

    <!-- 导入导出对话框 -->
    <ImportExportDialog
      v-model="showImportExportDialog"
      :selectedIds="selectedIds"
      @success="handleImportExportSuccess"
    />

    <!-- 拒绝审核对话框 -->
    <el-dialog
      v-model="showRejectDialog"
      title="拒绝审核"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="reject-dialog-content">
        <p class="reject-tip">
          您正在拒绝文章《<strong>{{ rejectingArticle?.title }}</strong
          >》的审核申请
        </p>
        <el-input
          v-model="rejectReason"
          type="textarea"
          :rows="4"
          placeholder="请填写拒绝原因（必填），该原因将展示给作者"
          maxlength="500"
          show-word-limit
        />
      </div>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <!-- 下架文章对话框 -->
    <AnDialog
      v-model="showTakedownDialog"
      title="下架文章"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="takedown-dialog-content">
        <p class="takedown-tip">
          您正在下架文章《<strong>{{ takedowningArticle?.title }}</strong
          >》，下架后该文章将不在前台显示，但后台仍可查看和管理。
        </p>
        <el-input
          v-model="takedownReason"
          type="textarea"
          :rows="4"
          placeholder="请填写下架原因（必填），该原因可在后台查看"
          maxlength="500"
          show-word-limit
        />
      </div>
      <template #footer>
        <el-button @click="showTakedownDialog = false">取消</el-button>
        <el-button type="warning" @click="confirmTakedown">确认下架</el-button>
      </template>
    </AnDialog>
  </div>
</template>

<style lang="scss" scoped>
.main {
  margin: 20px !important;
}

// 普通用户提示
.author-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  background: var(--anzhiyu-main-op-light);
  border: 1px solid var(--anzhiyu-main-op);
  border-radius: 8px;
  color: var(--anzhiyu-fontcolor);
  font-size: 13px;

  :deep(.iconify) {
    color: var(--anzhiyu-main);
    flex-shrink: 0;
  }

  strong {
    color: var(--anzhiyu-main);
    font-weight: 600;
  }
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

// 拒绝对话框样式
.reject-dialog-content {
  .reject-tip {
    margin-bottom: 16px;
    padding: 12px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;
    color: var(--anzhiyu-secondtext);
    font-size: 14px;
    line-height: 1.6;

    strong {
      color: var(--anzhiyu-fontcolor);
      font-weight: 600;
    }
  }

  :deep(.el-textarea__inner) {
    border-radius: 8px;
    min-height: 100px;
  }
}

// 下架对话框样式
.takedown-dialog-content {
  .takedown-tip {
    margin-bottom: 16px;
    padding: 12px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;
    color: var(--anzhiyu-secondtext);
    font-size: 14px;
    line-height: 1.6;

    strong {
      color: var(--anzhiyu-fontcolor);
      font-weight: 600;
    }
  }

  :deep(.el-textarea__inner) {
    border-radius: 8px;
    min-height: 100px;
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
}
</style>
