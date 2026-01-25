<template>
  <div class="support-management-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h3 class="title">售后工单</h3>
            <p class="subtitle">管理用户售后咨询工单</p>
          </div>
          <div class="header-stats">
            <div class="stat-item pending">
              <span class="stat-value">{{ stats.pending }}</span>
              <span class="stat-label">待处理</span>
            </div>
            <div class="stat-item processing">
              <span class="stat-value">{{ stats.processing }}</span>
              <span class="stat-label">处理中</span>
            </div>
            <div class="stat-item closed">
              <span class="stat-value">{{ stats.closed }}</span>
              <span class="stat-label">已关闭</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-left">
          <el-select
            v-model="filterForm.status"
            style="width: 120px"
            placeholder="状态"
            clearable
            @change="handleFilter"
          >
            <el-option label="待处理" value="OPEN" />
            <el-option label="已回复" value="REPLIED" />
            <el-option label="已关闭" value="CLOSED" />
          </el-select>
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索工单号/订单号"
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
          共 <span class="count">{{ total }}</span> 个工单
        </div>
      </div>

      <!-- 工单列表 -->
      <el-table
        v-loading="loading"
        :data="ticketList"
        stripe
        height="500px"
        @row-click="handleViewTicket"
      >
        <el-table-column prop="ticket_no" label="工单号" width="160">
          <template #default="{ row }">
            <span class="ticket-no">{{ row.ticket_no }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="主题" min-width="200">
          <template #default="{ row }">
            <div class="subject-cell">
              {{ row.subject }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="trade_no" label="关联订单" width="180">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.trade_no }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user_email" label="用户邮箱" width="180" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="handleViewTicket(row)">
              查看
            </el-button>
            <el-button
              v-if="row.status !== 'CLOSED'"
              type="warning"
              link
              @click.stop="handleCloseTicket(row)"
            >
              关闭
            </el-button>
            <el-button type="danger" link @click.stop="handleDeleteTicket(row)">
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

    <!-- 工单详情对话框 -->
    <el-drawer
      v-model="detailDrawerVisible"
      :title="
        currentTicket ? `工单详情 - ${currentTicket.ticket_no}` : '工单详情'
      "
      size="600px"
      direction="rtl"
    >
      <div v-if="currentTicket" class="ticket-detail">
        <div class="ticket-info">
          <div class="info-row">
            <span class="label">工单号：</span>
            <span class="value">{{ currentTicket.ticket_no }}</span>
          </div>
          <div class="info-row">
            <span class="label">关联订单：</span>
            <span class="value">{{ currentTicket.trade_no }}</span>
          </div>
          <div class="info-row">
            <span class="label">用户邮箱：</span>
            <span class="value">{{
              currentTicket.user_email || "未提供"
            }}</span>
          </div>
          <div class="info-row">
            <span class="label">状态：</span>
            <el-tag :type="getStatusType(currentTicket.status)" size="small">
              {{ getStatusText(currentTicket.status) }}
            </el-tag>
          </div>
          <div class="info-row">
            <span class="label">主题：</span>
            <span class="value">{{ currentTicket.subject }}</span>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="messages-container">
          <h4>对话记录</h4>
          <div class="messages-list">
            <div
              v-for="msg in currentTicket.messages"
              :key="msg.id"
              class="message-item"
              :class="{ 'is-admin': msg.sender_type === 'ADMIN' }"
            >
              <div class="message-header">
                <span class="sender">{{
                  msg.sender_type === "ADMIN" ? "客服" : "用户"
                }}</span>
                <span class="time">{{ formatDate(msg.created_at) }}</span>
              </div>
              <div class="message-content">{{ msg.content }}</div>
            </div>
          </div>
        </div>

        <!-- 回复表单 -->
        <div v-if="currentTicket.status !== 'CLOSED'" class="reply-form">
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="3"
            placeholder="输入回复内容..."
          />
          <el-button
            type="primary"
            :loading="replying"
            style="margin-top: 12px"
            @click="handleReply"
          >
            发送回复
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import {
  listTicketsAdminApi,
  getTicketAdminApi,
  replyTicketAdminApi,
  closeTicketApi,
  deleteTicketApi,
  getTicketStatsApi,
  type Ticket,
  type TicketDetail
} from "@/api/support";

defineOptions({
  name: "SupportManagement"
});

// 列表数据
const ticketList = ref<Ticket[]>([]);
const total = ref(0);
const loading = ref(false);

// 统计数据
const stats = reactive({
  pending: 0,
  processing: 0,
  closed: 0
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20
});

// 筛选
const filterForm = reactive({
  status: undefined as string | undefined,
  keyword: ""
});

// 详情抽屉
const detailDrawerVisible = ref(false);
const currentTicket = ref<TicketDetail | null>(null);
const replyContent = ref("");
const replying = ref(false);

// 获取工单列表
const fetchTickets = async () => {
  try {
    loading.value = true;
    const res = await listTicketsAdminApi({
      page: pagination.page,
      page_size: pagination.pageSize,
      status: filterForm.status,
      keyword: filterForm.keyword
    });

    if (res.code === 200 && res.data) {
      ticketList.value = res.data.list || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error("获取工单列表失败:", error);
    ElMessage.error("获取工单列表失败");
  } finally {
    loading.value = false;
  }
};

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await getTicketStatsApi();
    if (res.code === 200 && res.data) {
      stats.pending = res.data.pending;
      stats.processing = res.data.processing;
      stats.closed = res.data.closed;
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
  }
};

// 查看工单
const handleViewTicket = async (ticket: Ticket) => {
  try {
    const res = await getTicketAdminApi(ticket.id);
    if (res.code === 200 && res.data) {
      currentTicket.value = res.data;
      detailDrawerVisible.value = true;
    }
  } catch (error) {
    ElMessage.error("获取工单详情失败");
  }
};

// 回复工单
const handleReply = async () => {
  if (!replyContent.value.trim() || !currentTicket.value) {
    ElMessage.warning("请输入回复内容");
    return;
  }

  try {
    replying.value = true;
    await replyTicketAdminApi(currentTicket.value.id, {
      content: replyContent.value
    });
    ElMessage.success("回复成功");
    replyContent.value = "";

    // 刷新工单详情
    const res = await getTicketAdminApi(currentTicket.value.id);
    if (res.code === 200 && res.data) {
      currentTicket.value = res.data;
    }
  } catch (error) {
    ElMessage.error("回复失败");
  } finally {
    replying.value = false;
  }
};

// 关闭工单
const handleCloseTicket = async (ticket: Ticket) => {
  try {
    await ElMessageBox.confirm("确定要关闭这个工单吗？", "关闭确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    await closeTicketApi(ticket.id);
    ElMessage.success("工单已关闭");
    fetchTickets();
    fetchStats();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("关闭失败");
    }
  }
};

// 删除工单
const handleDeleteTicket = async (ticket: Ticket) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个工单吗？删除后无法恢复。",
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await deleteTicketApi(ticket.id);
    ElMessage.success("删除成功");
    fetchTickets();
    fetchStats();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

// 筛选
const handleFilter = () => {
  pagination.page = 1;
  fetchTickets();
};

// 分页
const handleSizeChange = () => {
  pagination.page = 1;
  fetchTickets();
};

const handlePageChange = () => {
  fetchTickets();
};

// 状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case "OPEN":
      return "warning";
    case "REPLIED":
      return "success";
    case "CLOSED":
      return "info";
    default:
      return "info";
  }
};

// 状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "OPEN":
      return "待处理";
    case "REPLIED":
      return "已回复";
    case "CLOSED":
      return "已关闭";
    default:
      return "未知";
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

onMounted(() => {
  fetchTickets();
  fetchStats();
});
</script>

<style lang="scss" scoped>
.support-management-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-left {
      .title {
        margin: 0 0 4px;
        font-size: 20px;
        font-weight: 600;
      }

      .subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--anzhiyu-secondtext);
      }
    }

    .header-stats {
      display: flex;
      gap: 24px;

      .stat-item {
        text-align: center;

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
        }

        .stat-label {
          font-size: 12px;
          color: var(--anzhiyu-secondtext);
        }

        &.pending .stat-value {
          color: #e6a23c;
        }

        &.processing .stat-value {
          color: #409eff;
        }

        &.closed .stat-value {
          color: #909399;
        }
      }
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

  .ticket-no {
    font-family: monospace;
    color: var(--anzhiyu-theme);
  }

  .subject-cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}

.ticket-detail {
  .ticket-info {
    padding: 16px;
    background: var(--anzhiyu-card-bg);
    border-radius: 8px;
    margin-bottom: 20px;

    .info-row {
      display: flex;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        width: 80px;
        color: var(--anzhiyu-secondtext);
        flex-shrink: 0;
      }

      .value {
        flex: 1;
      }
    }
  }

  .messages-container {
    h4 {
      margin: 0 0 16px;
      font-size: 16px;
    }

    .messages-list {
      max-height: 400px;
      overflow-y: auto;

      .message-item {
        padding: 12px 16px;
        margin-bottom: 12px;
        border-radius: 8px;
        background: #f5f7fa;

        &.is-admin {
          background: #e6f7ff;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;

          .sender {
            font-weight: 600;
          }

          .time {
            color: var(--anzhiyu-secondtext);
          }
        }

        .message-content {
          line-height: 1.6;
          white-space: pre-wrap;
        }
      }
    }
  }

  .reply-form {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--anzhiyu-border-color);
  }
}
</style>
