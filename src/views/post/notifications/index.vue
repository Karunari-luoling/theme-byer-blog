<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { resetThemeToDefault } from "@/utils/themeManager";
import {
  CategorySidebar,
  EmptyState,
  NotificationList,
  NotificationDetail,
  TicketList,
  ChatPanel,
  type Category
} from "./components";
import { useNotifications, useTickets, useEmoji, useMarkdown } from "./hooks";

defineOptions({
  name: "NotificationsPage"
});

// ==================== Hooks ====================
const {
  notifications,
  loading: notificationLoading,
  selectedNotification,
  unreadCounts,
  fetchNotifications,
  selectNotification,
  markAllAsRead,
  clearSelection: clearNotificationSelection,
  goToLink,
  getFilteredNotifications
} = useNotifications();

const {
  tickets,
  loading: ticketLoading,
  selectedTicket,
  detailLoading: ticketDetailLoading,
  fetchTickets,
  selectTicket,
  sendMessage,
  clearSelection: clearTicketSelection,
  getPendingCount,
  getStatusText,
  getStatusClass
} = useTickets();

const { emojiData, fetchEmojis, parseEmojis } = useEmoji();
const { simpleMarkdownParse } = useMarkdown();

// ==================== 分类数据 ====================
const categories: Category[] = [
  {
    key: "unread",
    label: "未读消息",
    icon: "message",
    color: "#49b1f5",
    bgColor: "#e8f7ff",
    type: "notification"
  },
  {
    key: "COMMENT",
    label: "文章评论",
    icon: "comments",
    color: "#49b1f5",
    bgColor: "#e8f7ff",
    type: "notification"
  },
  {
    key: "PURCHASE",
    label: "购买通知",
    icon: "shopping-cart",
    color: "#67c23a",
    bgColor: "#e8f8e8",
    type: "notification"
  },
  {
    key: "MEMBERSHIP",
    label: "会员服务",
    icon: "crown",
    color: "#e6a23c",
    bgColor: "#fef6e8",
    type: "notification"
  },
  {
    key: "SUPPORT",
    label: "工单消息",
    icon: "headset",
    color: "#49b1f5",
    bgColor: "#e8f7ff",
    type: "ticket"
  },
  {
    key: "SYSTEM",
    label: "系统通知",
    icon: "bell",
    color: "#409eff",
    bgColor: "#ecf5ff",
    type: "notification"
  }
];

// ==================== 状态 ====================
import { ref } from "vue";
const activeCategory = ref("unread");

// ==================== 计算属性 ====================
const currentCategory = computed(() => {
  return categories.find(c => c.key === activeCategory.value) || categories[0];
});

const isTicketCategory = computed(() => {
  return currentCategory.value?.type === "ticket";
});

const listData = computed(() => {
  if (isTicketCategory.value) {
    return tickets.value;
  }
  return getFilteredNotifications(activeCategory.value);
});

const hasSelection = computed(() => {
  return isTicketCategory.value
    ? selectedTicket.value !== null
    : selectedNotification.value !== null;
});

const isLoading = computed(() => {
  return notificationLoading.value || ticketLoading.value;
});

// 合并未读数量（加入工单数量）
const mergedUnreadCounts = computed(() => {
  return {
    ...unreadCounts,
    SUPPORT: getPendingCount()
  };
});

// ==================== 方法 ====================
const handleCategoryChange = (key: string) => {
  activeCategory.value = key;
  clearNotificationSelection();
  clearTicketSelection();

  if (key === "SUPPORT") {
    fetchTickets();
  }
};

const handleBackFromDetail = () => {
  clearNotificationSelection();
};

const handleBackFromChat = () => {
  clearTicketSelection();
};

const handleSendMessage = async (content: string) => {
  await sendMessage();
};

// 渲染消息内容
const renderMessageContent = (content: string): string => {
  let html = simpleMarkdownParse(content);
  html = parseEmojis(html);
  return html;
};

// ==================== 监听工单数量变化更新未读 ====================
watch(tickets, () => {
  unreadCounts.SUPPORT = getPendingCount();
});

// ==================== 生命周期 ====================
onMounted(() => {
  resetThemeToDefault();
  fetchNotifications();
  fetchEmojis();
});
</script>

<template>
  <div class="notifications-page">
    <div class="notifications-container">
      <!-- 左侧分类导航 -->
      <CategorySidebar
        :categories="categories"
        :active-category="activeCategory"
        :unread-counts="mergedUnreadCounts"
        @change="handleCategoryChange"
      />

      <!-- 右侧内容区 -->
      <div class="content-card">
        <!-- 顶部工具栏 - 只在有未读消息且为通知类型时显示 -->
        <div
          v-if="!isTicketCategory && !hasSelection && unreadCounts.unread > 0"
          class="content-toolbar"
        >
          <button class="mark-all-btn" @click="markAllAsRead">
            全部标为已读
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading && !hasSelection" class="loading-wrapper">
          <div class="loading-spinner" />
        </div>

        <!-- 空状态 -->
        <EmptyState
          v-else-if="listData.length === 0 && !hasSelection"
          text="暂无消息"
        />

        <!-- 通知列表 -->
        <NotificationList
          v-else-if="!isTicketCategory && !selectedNotification"
          :notifications="listData as any[]"
          :current-category="currentCategory"
          :selected-id="selectedNotification?.id"
          @select="selectNotification"
        />

        <!-- 工单列表 -->
        <TicketList
          v-else-if="isTicketCategory && !selectedTicket"
          :tickets="listData as any[]"
          :selected-id="selectedTicket?.id"
          :get-status-text="getStatusText"
          :get-status-class="getStatusClass"
          @select="selectTicket"
        />

        <!-- 通知详情 -->
        <NotificationDetail
          v-else-if="selectedNotification"
          :notification="selectedNotification"
          :rendered-content="renderMessageContent(selectedNotification.content)"
          @back="handleBackFromDetail"
          @go-to-link="goToLink"
        />

        <!-- 工单聊天面板 -->
        <ChatPanel
          v-else-if="selectedTicket"
          :ticket="selectedTicket"
          :loading="ticketDetailLoading"
          :rendered-content="renderMessageContent"
          :get-status-text="getStatusText"
          :get-status-class="getStatusClass"
          :emoji-data="emojiData"
          @back="handleBackFromChat"
          @send="handleSendMessage"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notifications-page {
  min-height: 100vh;
  padding: 24px 16px;
  background: var(--anzhiyu-background);
}

.notifications-container {
  display: flex;
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
}

// ==================== 右侧内容卡片 ====================
.content-card {
  flex: 1;
  min-width: 0;
  min-height: 400px;
  padding: 16px;
  background: var(--anzhiyu-card-bg, #fff);
  border-radius: 12px;
  border: var(--style-border);
  display: flex;
  flex-direction: column;

  // 让空状态和加载状态居中
  :deep(.empty-state),
  .loading-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}

.content-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.mark-all-btn {
  padding: 6px 12px;
  font-size: 13px;
  color: var(--anzhiyu-secondtext, #666);
  background: var(--anzhiyu-main, #f5f5f5);
  border: var(--style-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--anzhiyu-theme, #49b1f5);
    border-color: var(--anzhiyu-theme, #49b1f5);
    background: var(--anzhiyu-card-bg, #fff);
  }
}

// 加载状态
.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 250px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--anzhiyu-main, #f0f0f0);
  border-top-color: var(--anzhiyu-theme, #49b1f5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ==================== 响应式设计 ====================
@media screen and (width <= 900px) {
  .notifications-container {
    flex-direction: column;
    gap: 12px;
  }

  .content-card {
    min-height: 350px;
  }
}

@media screen and (width <= 600px) {
  .notifications-page {
    padding: 12px 8px;
  }

  .content-card {
    padding: 12px;
    border-radius: 10px;
    min-height: 320px;
  }

  .content-toolbar {
    margin-bottom: 10px;
  }

  .mark-all-btn {
    padding: 8px 14px;
    font-size: 12px;
    border-radius: 8px;
  }
}

@media screen and (width <= 480px) {
  .notifications-page {
    padding: 8px 6px;
  }

  .content-card {
    padding: 10px;
    border-radius: 8px;
    min-height: 280px;
  }

  .loading-wrapper {
    min-height: 200px;
  }

  .loading-spinner {
    width: 28px;
    height: 28px;
    border-width: 2px;
  }
}
</style>
