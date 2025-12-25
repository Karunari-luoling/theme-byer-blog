<!--
 * @Description: 订单管理页面
 * @Author: 安知鱼
-->
<script setup lang="ts">
import { ref } from "vue";
import { useOrderManagement } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import OrderDetailDialog from "./components/OrderDetailDialog.vue";

import Delete from "@iconify-icons/ep/delete";
import Refresh from "@iconify-icons/ep/refresh";
import Search from "@iconify-icons/ri/search-line";
import View from "@iconify-icons/ep/view";

defineOptions({
  name: "OrdersManagement"
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
  providerOptions,
  orderTypeOptions,
  showDetailDialog,
  currentOrder,
  onSizeChange,
  onCurrentChange,
  onSearch,
  resetForm,
  handleViewDetail,
  handleCloseDetail,
  handleDelete,
  handleBatchDelete,
  handleSelectionChange
} = useOrderManagement();

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
      <el-form-item label="订单号：" prop="order_no">
        <el-input
          v-model="form.order_no"
          placeholder="系统订单号或支付交易号"
          clearable
          class="!w-[200px]"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="用户邮箱：" prop="user_email">
        <el-input
          v-model="form.user_email"
          placeholder="请输入用户邮箱"
          clearable
          class="!w-[180px]"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="支付状态：" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择"
          clearable
          class="!w-[120px]"
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
      <el-form-item label="支付方式：" prop="payment_provider">
        <el-select
          v-model="form.payment_provider"
          placeholder="请选择"
          clearable
          class="!w-[120px]"
        >
          <el-option
            v-for="item in providerOptions.filter(s => s.value)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单类型：" prop="order_type">
        <el-select
          v-model="form.order_type"
          placeholder="请选择"
          clearable
          class="!w-[120px]"
        >
          <el-option
            v-for="item in orderTypeOptions.filter(s => s.value)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间：" prop="dateRange">
        <el-date-picker
          v-model="form.dateRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="!w-[220px]"
        />
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
      :title="`订单管理`"
      :columns="columns"
      :tableRef="tableRef?.getTableRef()"
      class="table-bar"
      @refresh="onSearch"
      @fullscreen="onFullscreen"
    >
      <template #buttons>
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
                :icon="useRenderIcon(View)"
                @click="handleViewDetail(row)"
              >
                详情
              </el-button>
              <el-popconfirm
                :title="`确定要删除订单 ${row.order_no} 吗？`"
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

    <!-- 订单详情弹窗 -->
    <OrderDetailDialog
      v-model="showDetailDialog"
      :order="currentOrder"
      @close="handleCloseDetail"
      @delete="handleDelete"
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

// 状态选项样式
.status-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
}

// 操作按钮
.operation-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
