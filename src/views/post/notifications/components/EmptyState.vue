<script setup lang="ts">
defineProps<{
  text?: string;
}>();
</script>

<template>
  <div class="empty-state">
    <div class="empty-illustration">
      <svg viewBox="0 0 200 160" fill="none">
        <!-- 箱子 -->
        <rect
          x="60"
          y="50"
          width="80"
          height="60"
          rx="4"
          fill="#f0f0f0"
          stroke="#e0e0e0"
          stroke-width="2"
        />
        <rect x="60" y="50" width="80" height="15" rx="2" fill="#e8e8e8" />
        <path d="M90 57 L100 65 L110 57" stroke="#ccc" stroke-width="2" />
        <!-- 小人 -->
        <circle cx="45" cy="85" r="12" fill="#ffd4a3" />
        <path d="M30 130 Q35 100 45 100 Q55 100 60 130" fill="#5dade2" />
        <circle cx="42" cy="83" r="2" fill="#333" />
        <circle cx="48" cy="83" r="2" fill="#333" />
        <path d="M43 90 Q45 92 47 90" stroke="#333" stroke-width="1.5" />
      </svg>
    </div>
    <p class="empty-text">{{ text || "暂无消息" }}</p>
  </div>
</template>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 32px;
}

.empty-illustration {
  width: 160px;
  height: 120px;
  margin-bottom: 16px;

  svg {
    width: 100%;
    height: 100%;
  }
}

.empty-text {
  font-size: 14px;
  color: var(--anzhiyu-secondtext, #999);
  margin: 0;
  padding: 12px 0;
  border-top: var(--style-border);
  width: 100%;
  max-width: 240px;
  text-align: center;
}

// ==================== 移动端适配 ====================
@media screen and (width <= 600px) {
  .empty-state {
    min-height: 220px;
    padding: 24px 16px;
  }

  .empty-illustration {
    width: 140px;
    height: 100px;
    margin-bottom: 12px;
  }

  .empty-text {
    font-size: 13px;
    padding: 10px 0;
    max-width: 200px;
  }
}

@media screen and (width <= 480px) {
  .empty-state {
    min-height: 180px;
    padding: 20px 12px;
  }

  .empty-illustration {
    width: 120px;
    height: 85px;
    margin-bottom: 10px;
  }

  .empty-text {
    font-size: 12px;
  }
}
</style>
