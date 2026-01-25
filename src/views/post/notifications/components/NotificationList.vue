<script setup lang="ts">
import type { Notification } from "@/api/notification";
import type { Category } from "./CategorySidebar.vue";
import { formatTime, getNotificationTypeText } from "../utils";

defineProps<{
  notifications: Notification[];
  currentCategory: Category;
  selectedId?: string;
}>();

const emit = defineEmits<{
  select: [notification: Notification];
}>();
</script>

<template>
  <div class="notification-list">
    <div
      v-for="item in notifications"
      :key="item.id"
      class="notification-item"
      :class="{ unread: !item.is_read, active: selectedId === item.id }"
      @click="emit('select', item)"
    >
      <div
        class="notification-icon"
        :style="{
          backgroundColor: currentCategory.bgColor,
          color: currentCategory.color
        }"
      >
        <span v-if="!item.is_read" class="new-badge">NEW</span>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
          />
        </svg>
      </div>
      <div class="notification-content">
        <div class="notification-title">{{ item.title }}</div>
        <div class="notification-meta">
          <span class="notification-time">{{
            formatTime(item.created_at)
          }}</span>
          <span class="notification-type">{{
            getNotificationTypeText(item.type)
          }}</span>
        </div>
      </div>
    </div>
    <div v-if="notifications.length > 0" class="list-end">没有更多内容了</div>
  </div>
</template>

<style lang="scss" scoped>
.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: var(--anzhiyu-main, #f8f9fa);
  }

  &.active {
    background: var(--anzhiyu-theme-op, rgba(73, 177, 245, 0.1));
  }

  &.unread {
    .notification-title {
      font-weight: 600;
    }
  }
}

.notification-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;

  svg {
    width: 20px;
    height: 20px;
  }
}

.new-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  padding: 1px 5px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #ff6b9d, #ff4757);
  border-radius: 6px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  color: var(--anzhiyu-fontcolor, #333);
  margin-bottom: 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--anzhiyu-secondtext, #999);
}

.notification-type {
  padding: 1px 6px;
  background: var(--anzhiyu-main, #f5f5f5);
  border-radius: 4px;
}

.list-end {
  padding: 16px 0;
  text-align: center;
  font-size: 13px;
  color: var(--anzhiyu-secondtext, #ccc);
  border-top: var(--style-border);
  margin-top: 8px;
}

// ==================== 移动端适配 ====================
@media screen and (width <= 600px) {
  .notification-item {
    gap: 10px;
    padding: 10px 8px;
  }

  .notification-icon {
    width: 36px;
    height: 36px;

    svg {
      width: 18px;
      height: 18px;
    }
  }

  .new-badge {
    top: -3px;
    right: -3px;
    padding: 1px 4px;
    font-size: 8px;
  }

  .notification-title {
    font-size: 13px;
    margin-bottom: 3px;
  }

  .notification-meta {
    gap: 8px;
    font-size: 11px;
  }

  .notification-type {
    padding: 1px 5px;
    font-size: 10px;
  }

  .list-end {
    padding: 12px 0;
    font-size: 12px;
    margin-top: 6px;
  }
}

@media screen and (width <= 480px) {
  .notification-item {
    gap: 8px;
    padding: 10px 6px;
    border-radius: 6px;
  }

  .notification-icon {
    width: 32px;
    height: 32px;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  .notification-title {
    font-size: 13px;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .notification-meta {
    flex-wrap: wrap;
    gap: 6px;
    font-size: 11px;
  }
}
</style>
