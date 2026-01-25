<script setup lang="ts">
import type { UnreadCounts } from "../hooks/useNotifications";

export interface Category {
  key: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  type: "notification" | "ticket";
}

defineProps<{
  categories: Category[];
  activeCategory: string;
  unreadCounts: UnreadCounts;
}>();

const emit = defineEmits<{
  change: [key: string];
}>();
</script>

<template>
  <div class="category-card">
    <div
      v-for="cat in categories"
      :key="cat.key"
      class="category-item"
      :class="{ active: activeCategory === cat.key }"
      @click="emit('change', cat.key)"
    >
      <div
        class="category-icon"
        :style="{ backgroundColor: cat.bgColor, color: cat.color }"
      >
        <svg
          v-if="cat.icon === 'message'"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
          />
          <circle cx="12" cy="10" r="1.5" />
          <circle cx="8" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
        </svg>
        <svg
          v-else-if="cat.icon === 'comments'"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"
          />
        </svg>
        <svg
          v-else-if="cat.icon === 'shopping-cart'"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
          />
        </svg>
        <svg
          v-else-if="cat.icon === 'crown'"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
          />
        </svg>
        <svg
          v-else-if="cat.icon === 'headset'"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"
          />
        </svg>
        <svg
          v-else-if="cat.icon === 'bell'"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
          />
        </svg>
      </div>
      <span class="category-label">{{ cat.label }}</span>
      <span
        v-if="unreadCounts[cat.key as keyof UnreadCounts] > 0"
        class="category-badge"
      >
        {{
          unreadCounts[cat.key as keyof UnreadCounts] > 99
            ? "99+"
            : unreadCounts[cat.key as keyof UnreadCounts]
        }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.category-card {
  width: 240px;
  flex-shrink: 0;
  padding: 12px;
  background: var(--anzhiyu-card-bg, #fff);
  border-radius: 12px;
  border: var(--style-border);
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;

  &:hover:not(.active) {
    background: var(--anzhiyu-theme-op, rgba(73, 177, 245, 0.1));

    .category-label {
      color: var(--anzhiyu-theme, #49b1f5);
    }
  }

  &.active {
    background: var(--anzhiyu-theme, #49b1f5);
    border-radius: 8px;

    .category-label {
      color: var(--anzhiyu-white, #fff);
      font-weight: 600;
    }

    .category-icon {
      background: rgba(255, 255, 255, 0.2) !important;
      color: var(--anzhiyu-white, #fff) !important;
    }
  }
}

.category-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
  }
}

.category-label {
  flex: 1;
  font-size: 14px;
  color: var(--anzhiyu-fontcolor, #333);
  transition: color 0.2s;
}

.category-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #ff4757;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media screen and (width <= 900px) {
  .category-card {
    width: 100%;
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    gap: 6px;
    padding: 8px 10px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    align-items: stretch;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .category-item {
    flex-direction: column;
    flex-shrink: 0;
    gap: 4px;
    padding: 10px 14px;
    min-width: 72px;
    white-space: nowrap;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
  }

  .category-icon {
    width: 36px;
    height: 36px;

    svg {
      width: 18px;
      height: 18px;
    }
  }

  .category-label {
    font-size: 12px;
    text-align: center;
  }

  .category-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 16px;
    height: 16px;
    font-size: 10px;
  }
}

@media screen and (width <= 480px) {
  .category-card {
    padding: 6px 8px;
    gap: 4px;
  }

  .category-item {
    padding: 8px 10px;
    min-width: 64px;
  }

  .category-icon {
    width: 32px;
    height: 32px;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  .category-label {
    font-size: 11px;
  }

  .category-badge {
    top: 2px;
    right: 2px;
    min-width: 14px;
    height: 14px;
    font-size: 9px;
  }
}
</style>
