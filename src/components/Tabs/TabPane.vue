<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-11-21 13:39:19
 * @LastEditTime: 2025-11-21 13:45:15
 * @LastEditors: 安知鱼
-->
<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-11-21 13:39:19
 * @LastEditTime: 2025-11-21 13:44:28
 * @LastEditors: 安知鱼
-->
<template>
  <div v-show="active" class="tab-pane">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  active: boolean;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
