<script setup lang="ts">
import { computed } from "vue";
import type { ProductListItem } from "@/api/product";

interface Props {
  product: ProductListItem;
}

const props = defineProps<Props>();

const formatPrice = (cents: number) => {
  return (cents / 100).toFixed(2);
};

const priceDisplay = computed(() => {
  return `¥${formatPrice(props.product.min_price)}`;
});
</script>

<template>
  <div class="product-card" @click="$emit('click', product)">
    <div class="card-cover">
      <img
        v-if="product.cover_url"
        :src="product.cover_url"
        :alt="product.title"
        class="cover-img"
      />
      <div v-else class="cover-placeholder">
        <el-icon size="48"><ShoppingBag /></el-icon>
      </div>
    </div>
    <div class="card-content">
      <h3 class="product-title">{{ product.title }}</h3>
      <p v-if="product.description" class="product-desc">
        {{ product.description }}
      </p>
      <div class="card-footer">
        <div class="price-info">
          <span class="price">{{ priceDisplay }}</span>
        </div>
        <div class="stats-info">
          <span class="stat">{{ product.variant_count }}规格</span>
          <span class="stat">{{ product.total_sales }}销量</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ShoppingBag } from "@element-plus/icons-vue";
export default {
  components: { ShoppingBag }
};
</script>

<style lang="scss" scoped>
.product-card {
  background: var(--anzhiyu-card-bg);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: var(--style-border-always);
  box-shadow: var(--anzhiyu-shadow-border);

  &:hover {
    transform: translateY(-4px);
    border-color: var(--anzhiyu-main);
    box-shadow: var(--anzhiyu-shadow-main);

    .cover-img {
      transform: scale(1.08);
    }

    .product-title {
      color: var(--anzhiyu-main);
    }
  }

  .card-cover {
    position: relative;
    width: 100%;
    padding-top: 56.25%;
    overflow: hidden;

    .cover-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .cover-placeholder {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(
        135deg,
        var(--anzhiyu-theme-op) 0%,
        var(--anzhiyu-main-op-deep) 100%
      );
      color: var(--anzhiyu-main);
    }
  }

  .card-content {
    padding: 1rem;

    .product-title {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 0.3s ease;
    }

    .product-desc {
      margin: 0 0 0.75rem;
      font-size: 0.85rem;
      color: var(--anzhiyu-secondtext);
      line-height: 1.5;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      /* stylelint-disable-next-line property-no-vendor-prefix */
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 2.55rem;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .price-info {
        .price {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--anzhiyu-main);
        }
      }

      .stats-info {
        display: flex;
        gap: 0.75rem;

        .stat {
          font-size: 0.75rem;
          color: var(--anzhiyu-secondtext);
          padding: 0.2rem 0.5rem;
          background: var(--anzhiyu-secondbg);
          border-radius: 4px;
        }
      }
    }
  }
}

@media screen and (width <= 768px) {
  .product-card {
    .card-content {
      padding: 0.75rem;

      .product-title {
        font-size: 0.9rem;
      }

      .product-desc {
        font-size: 0.8rem;
        -webkit-line-clamp: 1;
        min-height: auto;
        margin-bottom: 0.5rem;
      }

      .card-footer {
        .price-info .price {
          font-size: 1rem;
        }

        .stats-info {
          gap: 0.5rem;

          .stat {
            font-size: 0.7rem;
            padding: 0.15rem 0.35rem;
          }
        }
      }
    }
  }
}
</style>
