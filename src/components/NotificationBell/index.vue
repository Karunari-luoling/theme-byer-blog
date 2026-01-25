<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  getUnreadCountApi,
  listNotificationsApi,
  markAsReadApi,
  markAllAsReadApi,
  type Notification
} from "@/api/notification";

const router = useRouter();

const unreadCount = ref(0);
const notifications = ref<Notification[]>([]);
const loading = ref(false);
const popoverVisible = ref(false);

let pollInterval: ReturnType<typeof setInterval> | null = null;

// 获取未读数量
const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCountApi();
    if (res.code === 200 && res.data) {
      unreadCount.value = res.data.count;
    }
  } catch (error) {
    // 静默失败
  }
};

// 获取通知列表
const fetchNotifications = async () => {
  loading.value = true;
  try {
    const res = await listNotificationsApi({
      page: 1,
      page_size: 10,
      unread_only: false
    });
    if (res.code === 200 && res.data) {
      notifications.value = res.data.list || [];
    }
  } catch (error) {
    console.error("获取通知失败:", error);
  } finally {
    loading.value = false;
  }
};

// 打开弹窗时加载通知
const handlePopoverShow = () => {
  popoverVisible.value = true;
  fetchNotifications();
};

// 标记为已读
const handleMarkAsRead = async (notification: Notification) => {
  if (notification.is_read) {
    if (notification.link) {
      router.push(notification.link);
    }
    return;
  }

  try {
    await markAsReadApi(notification.id);
    notification.is_read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);

    if (notification.link) {
      router.push(notification.link);
    }
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

// 全部标记为已读
const handleMarkAllAsRead = async () => {
  try {
    await markAllAsReadApi();
    notifications.value.forEach(n => (n.is_read = true));
    unreadCount.value = 0;
    ElMessage.success("已全部标记为已读");
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

// 查看全部
const handleViewAll = () => {
  popoverVisible.value = false;
  router.push("/notifications");
};

// 格式化时间
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString("zh-CN");
};

// 获取通知图标
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "PURCHASE":
      return "ShoppingCart";
    case "MEMBERSHIP":
      return "Medal";
    case "SUPPORT":
      return "ChatDotRound";
    case "COMMENT":
      return "Comment";
    default:
      return "Bell";
  }
};

onMounted(() => {
  fetchUnreadCount();
  // 每30秒轮询一次
  pollInterval = setInterval(fetchUnreadCount, 30000);
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

<template>
  <el-popover
    :visible="popoverVisible"
    placement="bottom-end"
    :width="360"
    trigger="click"
    popper-class="notification-popover"
    @show="handlePopoverShow"
    @hide="popoverVisible = false"
  >
    <template #reference>
      <div class="notification-bell" @click="popoverVisible = !popoverVisible">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
          <el-icon size="22"><Bell /></el-icon>
        </el-badge>
      </div>
    </template>

    <div class="notification-panel">
      <div class="panel-header">
        <span class="title">通知</span>
        <el-button
          v-if="unreadCount > 0"
          type="primary"
          link
          size="small"
          @click="handleMarkAllAsRead"
        >
          全部已读
        </el-button>
      </div>

      <div v-loading="loading" class="panel-body">
        <div v-if="notifications.length === 0" class="empty-state">
          <el-empty description="暂无通知" :image-size="60" />
        </div>

        <div v-else class="notification-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.is_read }"
            @click="handleMarkAsRead(notification)"
          >
            <div class="item-icon">
              <el-icon>
                <component :is="getNotificationIcon(notification.type)" />
              </el-icon>
            </div>
            <div class="item-content">
              <div class="item-title">{{ notification.title }}</div>
              <div class="item-desc">{{ notification.content }}</div>
              <div class="item-time">
                {{ formatTime(notification.created_at) }}
              </div>
            </div>
            <div v-if="!notification.is_read" class="unread-dot" />
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <el-button type="primary" link @click="handleViewAll">
          查看全部通知
        </el-button>
      </div>
    </div>
  </el-popover>
</template>

<script lang="ts">
import {
  Bell,
  ShoppingCart,
  Medal,
  ChatDotRound,
  Comment
} from "@element-plus/icons-vue";

export default {
  components: { Bell, ShoppingCart, Medal, ChatDotRound, Comment }
};
</script>

<style lang="scss" scoped>
.notification-bell {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;

  &:hover {
    background: var(--anzhiyu-main);
  }

  .el-icon {
    color: var(--anzhiyu-fontcolor);
  }
}
</style>

<style lang="scss">
.notification-popover {
  padding: 0 !important;

  .notification-panel {
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--anzhiyu-border-color);

      .title {
        font-size: 16px;
        font-weight: 600;
        color: var(--anzhiyu-fontcolor);
      }
    }

    .panel-body {
      max-height: 400px;
      overflow-y: auto;

      .empty-state {
        padding: 20px;
      }

      .notification-list {
        .notification-item {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;

          &:hover {
            background: var(--anzhiyu-main);
          }

          &.unread {
            background: var(--anzhiyu-theme-op);
          }

          .item-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--anzhiyu-theme-op);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            .el-icon {
              color: var(--anzhiyu-theme);
            }
          }

          .item-content {
            flex: 1;
            min-width: 0;

            .item-title {
              font-weight: 600;
              color: var(--anzhiyu-fontcolor);
              margin-bottom: 4px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .item-desc {
              font-size: 13px;
              color: var(--anzhiyu-secondtext);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .item-time {
              font-size: 12px;
              color: var(--anzhiyu-secondtext);
              margin-top: 4px;
            }
          }

          .unread-dot {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--anzhiyu-theme);
          }
        }
      }
    }

    .panel-footer {
      padding: 12px;
      text-align: center;
      border-top: 1px solid var(--anzhiyu-border-color);
    }
  }
}
</style>
