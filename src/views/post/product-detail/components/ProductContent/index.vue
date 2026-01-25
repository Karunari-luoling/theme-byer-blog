<script setup lang="ts">
import type { Product } from "@/api/product";

interface Props {
  product: Product;
}

defineProps<Props>();
</script>

<template>
  <div class="product-content">
    <h3 class="section-title">商品详情</h3>
    <div
      v-if="product.description_html"
      class="content-body post-content"
      v-html="product.description_html"
    />
    <div v-else-if="product.description" class="content-body">
      <p>{{ product.description }}</p>
    </div>
    <div v-else class="empty-content">
      <el-empty description="暂无详细介绍" :image-size="80" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.product-content {
  .section-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 20px 0;
    padding-bottom: 12px;
    border-bottom: var(--style-border);
    color: var(--anzhiyu-fontcolor);
  }

  .content-body {
    font-size: 15px;
    line-height: 1.6;
    color: var(--anzhiyu-secondtext);

    :deep(img) {
      max-width: 100%;
      border-radius: 8px;
    }

    :deep(a) {
      color: var(--anzhiyu-theme);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .empty-content {
    padding: 40px 0;
  }
}
</style>
