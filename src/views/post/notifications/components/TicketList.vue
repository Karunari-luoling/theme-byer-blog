<script setup lang="ts">
import type { Ticket } from "@/api/support";
import { formatTime } from "../utils";

defineProps<{
  tickets: Ticket[];
  selectedId?: string;
  getStatusText: (status: string) => string;
  getStatusClass: (status: string) => string;
}>();

const emit = defineEmits<{
  select: [ticket: Ticket];
}>();
</script>

<template>
  <div class="ticket-list">
    <div
      v-for="item in tickets"
      :key="item.id"
      class="ticket-item"
      :class="{ active: selectedId === item.id }"
      @click="emit('select', item)"
    >
      <div class="ticket-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"
          />
        </svg>
      </div>
      <div class="ticket-content">
        <div class="ticket-title">{{ item.subject }}</div>
        <div class="ticket-meta">
          <span class="ticket-time">{{ formatTime(item.created_at) }}</span>
          <span class="ticket-status" :class="getStatusClass(item.status)">
            {{ getStatusText(item.status) }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="tickets.length > 0" class="list-end">没有更多内容了</div>
  </div>
</template>

<style lang="scss" scoped>
.ticket-list {
  display: flex;
  flex-direction: column;
}

.ticket-item {
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
}

.ticket-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  background: #e8f7ff;
  color: #49b1f5;

  svg {
    width: 20px;
    height: 20px;
  }
}

.ticket-content {
  flex: 1;
  min-width: 0;
}

.ticket-title {
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

.ticket-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--anzhiyu-secondtext, #999);
}

.ticket-status {
  padding: 1px 6px;
  font-size: 11px;
  border-radius: 4px;

  &.status-open {
    background: #fff3e0;
    color: #f57c00;
  }

  &.status-replied {
    background: #e8f5e9;
    color: #43a047;
  }

  &.status-closed {
    background: var(--anzhiyu-main, #f5f5f5);
    color: var(--anzhiyu-secondtext, #999);
  }
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
  .ticket-item {
    gap: 10px;
    padding: 10px 8px;
  }

  .ticket-icon {
    width: 36px;
    height: 36px;

    svg {
      width: 18px;
      height: 18px;
    }
  }

  .ticket-title {
    font-size: 13px;
    margin-bottom: 3px;
  }

  .ticket-meta {
    gap: 8px;
    font-size: 11px;
  }

  .ticket-status {
    font-size: 10px;
  }

  .list-end {
    padding: 12px 0;
    font-size: 12px;
    margin-top: 6px;
  }
}

@media screen and (width <= 480px) {
  .ticket-item {
    gap: 8px;
    padding: 10px 6px;
    border-radius: 6px;
  }

  .ticket-icon {
    width: 32px;
    height: 32px;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  .ticket-title {
    font-size: 13px;
  }

  .ticket-meta {
    flex-wrap: wrap;
    gap: 6px;
    font-size: 11px;
  }
}
</style>
