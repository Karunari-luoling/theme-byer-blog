<template>
  <div class="membership-management-container">
    <el-row :gutter="20">
      <!-- 左侧：会员套餐管理 -->
      <el-col :xs="24" :sm="24" :md="14" :lg="12">
        <el-card shadow="never" class="plans-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <h3 class="title">会员套餐</h3>
                <p class="subtitle">管理网站会员套餐，拖拽调整显示顺序</p>
              </div>
              <el-button type="primary" size="small" @click="handleCreatePlan">
                <el-icon><Plus /></el-icon>
                创建套餐
              </el-button>
            </div>
          </template>

          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>

          <div
            v-else-if="plans.length > 0"
            ref="plansContainerRef"
            v-loading="sorting"
            element-loading-text="排序保存中..."
            class="plans-grid"
          >
            <div
              v-for="plan in plans"
              :key="plan.id"
              class="plan-item"
              :class="{ 'plan-disabled': plan.status !== 1 }"
            >
              <div v-if="plans.length > 1" class="drag-handle" title="拖拽排序">
                <el-icon><Rank /></el-icon>
              </div>
              <div class="plan-content">
                <div class="plan-header">
                  <div class="plan-name">{{ plan.name }}</div>
                  <el-tag
                    :type="plan.status === 1 ? 'success' : 'info'"
                    size="small"
                  >
                    {{ plan.status === 1 ? "启用" : "停用" }}
                  </el-tag>
                </div>
                <div class="plan-price">
                  <span v-if="plan.original_price" class="original-price"
                    >¥{{ (plan.original_price / 100).toFixed(2) }}</span
                  >
                  <span class="price"
                    >¥{{ (plan.price / 100).toFixed(2) }}</span
                  >
                  <span class="duration">/ {{ plan.duration_days }} 天</span>
                </div>
                <div v-if="plan.description" class="plan-desc">
                  {{ plan.description }}
                </div>
                <div class="plan-actions">
                  <el-button size="small" @click="handleEditPlan(plan)">
                    编辑
                  </el-button>
                  <el-button
                    size="small"
                    :type="plan.status === 1 ? 'warning' : 'success'"
                    @click="handleTogglePlan(plan)"
                  >
                    {{ plan.status === 1 ? "停用" : "启用" }}
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="handleDeletePlan(plan)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-plan">
            <el-empty description="暂无会员套餐" :image-size="100">
              <el-button type="primary" @click="handleCreatePlan">
                创建套餐
              </el-button>
            </el-empty>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：会员用户列表 -->
      <el-col :xs="24" :sm="24" :md="10" :lg="12">
        <el-card shadow="never" class="members-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <h3 class="title">会员用户</h3>
                <p class="subtitle">查看已订阅会员的用户列表</p>
              </div>
              <el-select
                v-model="filterStatus"
                style="width: 120px"
                placeholder="状态"
                @change="handleFilter"
              >
                <el-option label="全部" value="" />
                <el-option label="有效" value="active" />
                <el-option label="已过期" value="expired" />
              </el-select>
            </div>
          </template>

          <el-table
            v-loading="membersLoading"
            :data="membersList"
            stripe
            height="400px"
          >
            <el-table-column prop="user_id" label="用户ID" width="100" />
            <el-table-column prop="plan_name" label="套餐" width="120" />
            <el-table-column label="开始时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.start_time) }}
              </template>
            </el-table-column>
            <el-table-column label="到期时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.expire_time) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="is_expired"
              label="状态"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <el-tag
                  :type="row.is_expired ? 'info' : 'success'"
                  size="small"
                >
                  {{ row.is_expired ? "已过期" : "有效" }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="membersTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, prev, pager, next"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑套餐对话框 -->
    <AnDialog
      v-model="editDialogVisible"
      :title="editMode === 'create' ? '创建会员套餐' : '编辑会员套餐'"
      width="600px"
      :close-on-click-modal="false"
      show-footer
      :confirm-loading="submitting"
      @confirm="handleSubmitPlan"
      @closed="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="form.name" placeholder="如：年度会员" />
        </el-form-item>
        <el-form-item label="套餐描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="简短描述套餐内容"
          />
        </el-form-item>
        <el-form-item label="价格（分）" prop="price">
          <div class="input-with-preview">
            <el-input-number
              v-model="form.price"
              :min="0"
              :precision="0"
              style="width: 200px"
            />
            <span class="price-preview"
              >≈ ¥{{ (form.price / 100).toFixed(2) }}</span
            >
          </div>
        </el-form-item>
        <el-form-item label="原价（分）">
          <div class="input-with-preview">
            <el-input-number
              v-model="form.original_price"
              :min="0"
              :precision="0"
              style="width: 200px"
              placeholder="可选，用于显示划线价"
            />
            <span v-if="form.original_price" class="original-price-preview"
              >≈ ¥{{ (form.original_price / 100).toFixed(2) }}</span
            >
          </div>
        </el-form-item>
        <el-form-item label="有效期（天）" prop="duration_days">
          <div class="input-with-preview">
            <el-input-number
              v-model="form.duration_days"
              :min="1"
              :max="3650"
              style="width: 200px"
            />
            <span class="duration-preview">
              约 {{ Math.round(form.duration_days / 30) }} 个月
            </span>
          </div>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="2"
          />
        </el-form-item>
      </el-form>
    </AnDialog>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Rank } from "@element-plus/icons-vue";
import Sortable from "sortablejs";
import AnDialog from "@/components/AnDialog";
import {
  listPlansApi,
  createPlanApi,
  updatePlanApi,
  deletePlanApi,
  listMembersApi,
  type MembershipPlan,
  type UserMembership
} from "@/api/membership";

defineOptions({
  name: "MembershipManagement"
});

// 套餐相关
const loading = ref(false);
const plans = ref<MembershipPlan[]>([]);
const currentPlan = ref<MembershipPlan | null>(null);
const editDialogVisible = ref(false);
const editMode = ref<"create" | "edit">("create");
const submitting = ref(false);
const formRef = ref();
const plansContainerRef = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;

const form = reactive({
  name: "",
  description: "",
  price: 0, // 价格（分）
  original_price: null as number | null, // 原价（分）
  duration_days: 365,
  status: 1 // 1=上架, 2=下架
});

// 排序中状态
const sorting = ref(false);

const rules = {
  name: [{ required: true, message: "请输入套餐名称", trigger: "blur" }],
  price: [{ required: true, message: "请设置价格", trigger: "blur" }],
  duration_days: [{ required: true, message: "请设置有效期", trigger: "blur" }]
};

// 会员列表相关
const membersLoading = ref(false);
const membersList = ref<UserMembership[]>([]);
const membersTotal = ref(0);
const filterStatus = ref("");

const pagination = reactive({
  page: 1,
  pageSize: 10
});

// 获取套餐列表
const fetchPlans = async () => {
  try {
    loading.value = true;
    const res = await listPlansApi();
    if (res.code === 200 && res.data?.list) {
      // 按 sort_order 排序
      plans.value = res.data.list.sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      );
    } else {
      plans.value = [];
    }
  } catch (error) {
    console.error("获取套餐失败:", error);
  } finally {
    loading.value = false;
  }
};

// 获取会员列表
const fetchMembers = async () => {
  try {
    membersLoading.value = true;
    const res = await listMembersApi({
      page: pagination.page,
      page_size: pagination.pageSize,
      status: filterStatus.value as "active" | "expired" | undefined
    });
    if (res.code === 200 && res.data) {
      membersList.value = res.data.list || [];
      membersTotal.value = res.data.total || 0;
    }
  } catch (error) {
    console.error("获取会员列表失败:", error);
  } finally {
    membersLoading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  form.name = "";
  form.description = "";
  form.price = 9900;
  form.original_price = null;
  form.duration_days = 365;
  form.status = 1;
  currentPlan.value = null;
  formRef.value?.resetFields();
};

// 创建套餐
const handleCreatePlan = () => {
  editMode.value = "create";
  resetForm();
  editDialogVisible.value = true;
};

// 编辑套餐
const handleEditPlan = (plan: MembershipPlan) => {
  currentPlan.value = plan;
  editMode.value = "edit";
  form.name = plan.name;
  form.description = plan.description || "";
  form.price = plan.price;
  form.original_price = plan.original_price || null;
  form.duration_days = plan.duration_days;
  form.status = plan.status;
  editDialogVisible.value = true;
};

// 对话框关闭时重置表单
const handleDialogClose = () => {
  resetForm();
};

// 切换套餐状态
const handleTogglePlan = async (plan: MembershipPlan) => {
  const isEnabled = plan.status === 1;
  const action = isEnabled ? "停用" : "启用";

  try {
    await ElMessageBox.confirm(
      `确定要${action}「${plan.name}」吗？`,
      `${action}确认`,
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await updatePlanApi(plan.id, { status: isEnabled ? 2 : 1 });
    ElMessage.success(`${action}成功`);
    fetchPlans();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(`${action}失败`);
    }
  }
};

// 删除套餐
const handleDeletePlan = async (plan: MembershipPlan) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除「${plan.name}」吗？删除后已购买的会员不受影响。`,
      "删除确认",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    );

    await deletePlanApi(plan.id);
    ElMessage.success("删除成功");
    fetchPlans();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

// 提交套餐
const handleSubmitPlan = async () => {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  try {
    submitting.value = true;
    const data: any = {
      name: form.name,
      description: form.description,
      price: form.price,
      duration_days: form.duration_days,
      status: form.status
    };

    // 只有设置了原价才传递
    if (form.original_price && form.original_price > 0) {
      data.original_price = form.original_price;
    }

    if (editMode.value === "create") {
      // 新建时设置 sort_order 为最大值 + 1
      const maxSortOrder = plans.value.reduce(
        (max, p) => Math.max(max, p.sort_order || 0),
        0
      );
      await createPlanApi({ ...data, sort_order: maxSortOrder + 1 });
      ElMessage.success("创建成功");
    } else if (currentPlan.value) {
      await updatePlanApi(currentPlan.value.id, data);
      ElMessage.success("保存成功");
    }

    editDialogVisible.value = false;
    fetchPlans();
  } catch (error) {
    ElMessage.error("保存失败");
  } finally {
    submitting.value = false;
  }
};

// 筛选
const handleFilter = () => {
  pagination.page = 1;
  fetchMembers();
};

// 分页
const handleSizeChange = () => {
  pagination.page = 1;
  fetchMembers();
};

const handlePageChange = () => {
  fetchMembers();
};

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-CN");
};

// 初始化拖拽排序
const initSortable = () => {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }

  if (plansContainerRef.value && plans.value.length > 1) {
    sortableInstance = Sortable.create(plansContainerRef.value, {
      animation: 200,
      handle: ".drag-handle",
      ghostClass: "plan-card-ghost",
      chosenClass: "plan-card-chosen",
      dragClass: "plan-card-drag",
      onEnd: async (evt: Sortable.SortableEvent) => {
        const { oldIndex, newIndex } = evt;
        if (
          oldIndex === undefined ||
          newIndex === undefined ||
          oldIndex === newIndex
        ) {
          return;
        }

        // 更新本地数据顺序
        const movedItem = plans.value.splice(oldIndex, 1)[0];
        plans.value.splice(newIndex, 0, movedItem);

        // 批量更新 sort_order
        sorting.value = true;
        try {
          const updatePromises = plans.value.map((plan, index) =>
            updatePlanApi(plan.id, { sort_order: index })
          );
          await Promise.all(updatePromises);
          ElMessage.success("排序已保存");
        } catch (error) {
          console.error("排序保存失败:", error);
          ElMessage.error("排序保存失败");
          // 重新获取数据恢复顺序
          fetchPlans();
        } finally {
          sorting.value = false;
        }
      }
    });
  }
};

// 监听套餐数量变化，重新初始化拖拽
watch(
  () => plans.value.length,
  () => {
    nextTick(() => {
      initSortable();
    });
  }
);

onMounted(() => {
  fetchPlans();
  fetchMembers();
});

onBeforeUnmount(() => {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
});
</script>

<style lang="scss" scoped>
.membership-management-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-left {
      .title {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 600;
      }

      .subtitle {
        margin: 0;
        font-size: 13px;
        color: var(--anzhiyu-secondtext);
      }
    }
  }

  .plans-card {
    .loading-container {
      padding: 20px 0;
    }

    .plans-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .plan-item {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: var(--anzhiyu-secondbg);
      border: 1px solid var(--anzhiyu-card-border);
      border-radius: 12px;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: var(--anzhiyu-shadow-border);
      }

      &.plan-disabled {
        opacity: 0.7;

        .plan-content {
          .plan-name {
            color: var(--anzhiyu-secondtext);
          }
        }
      }

      .drag-handle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        padding: 4px 0;
        color: var(--anzhiyu-lighttext);
        cursor: grab;
        border-radius: 4px;
        transition: all 0.2s;

        &:hover {
          color: var(--anzhiyu-main);
          background: var(--anzhiyu-card-bg);
        }

        &:active {
          cursor: grabbing;
        }
      }

      .plan-content {
        flex: 1;

        .plan-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;

          .plan-name {
            font-size: 16px;
            font-weight: 600;
          }
        }

        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 8px;

          .original-price {
            font-size: 14px;
            color: var(--anzhiyu-lighttext);
            text-decoration: line-through;
          }

          .price {
            font-size: 24px;
            font-weight: 700;
            color: #f56c6c;
          }

          .duration {
            font-size: 13px;
            color: var(--anzhiyu-secondtext);
          }
        }

        .plan-desc {
          margin-bottom: 12px;
          font-size: 13px;
          color: var(--anzhiyu-secondtext);
          line-height: 1.5;
        }

        .plan-actions {
          display: flex;
          gap: 8px;
        }
      }
    }

    // 拖拽排序样式
    .plan-card-ghost {
      opacity: 0.4;
    }

    .plan-card-chosen {
      box-shadow: var(--anzhiyu-shadow-main);
    }

    .plan-card-drag {
      background: var(--anzhiyu-card-bg) !important;
      box-shadow: var(--anzhiyu-shadow-border) !important;
    }

    .empty-plan {
      padding: 40px 0;
    }
  }

  .members-card {
    .pagination-wrapper {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }
  }

  .input-with-preview {
    display: flex;
    align-items: center;

    .price-preview,
    .duration-preview,
    .original-price-preview {
      margin-left: 12px;
      font-size: 14px;
      color: var(--anzhiyu-secondtext);
    }

    .price-preview {
      color: #f56c6c;
    }

    .original-price-preview {
      text-decoration: line-through;
      color: var(--anzhiyu-lighttext);
    }
  }
}

@media screen and (width <= 768px) {
  .membership-management-container {
    .el-col {
      margin-bottom: 16px;
    }

    .plans-card {
      .plan-item {
        flex-direction: column;
        gap: 8px;

        .drag-handle {
          width: 100%;
          padding: 8px 0;
          border-bottom: 1px solid var(--anzhiyu-card-border);
        }

        .plan-content {
          .plan-actions {
            flex-wrap: wrap;
          }
        }
      }
    }
  }
}
</style>
