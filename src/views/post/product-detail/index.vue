<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import Sidebar from "../components/Sidebar/index.vue";
import ProductContent from "./components/ProductContent/index.vue";
import ProductHeader from "./components/ProductHeader/index.vue";
import ProductVariants from "./components/ProductVariants/index.vue";
import MembershipCard from "@/components/MembershipCard/index.vue";
import {
  getProductApi,
  type Product,
  type ProductVariant
} from "@/api/product";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useMembershipStore } from "@/store/modules/membership";
import { resetThemeToDefault } from "@/utils/themeManager";

defineOptions({
  name: "ProductDetail"
});

const route = useRoute();
const siteConfigStore = useSiteConfigStore();
const membershipStore = useMembershipStore();

const product = ref<Product | null>(null);
const isLoading = ref(true);
const selectedVariant = ref<ProductVariant | null>(null);

// 检查波浪区域是否启用
const isWavesEnabled = computed(() => {
  return siteConfigStore.siteConfig?.post?.waves?.enable !== false;
});

// 检查侧边栏是否可见（可以根据实际需求调整）
const isSidebarVisible = computed(() => {
  return true; // 可以根据窗口宽度等条件判断
});

// 是否显示会员卡片：商品不排除会员购买 且 系统设置了会员套餐（至少1个）
const showMembershipCard = computed(() => {
  return (
    !product.value?.exclude_from_membership && membershipStore.hasActivePlans
  );
});

const productId = computed(() => route.params.id as string);

const fetchProduct = async () => {
  if (!productId.value) return;

  isLoading.value = true;
  try {
    const res = await getProductApi(productId.value);
    if (res.code === 200 && res.data) {
      product.value = res.data;
      // 默认选择第一个规格
      if (res.data.variants.length > 0) {
        selectedVariant.value = res.data.variants[0];
      }
    }
  } catch (error) {
    console.error("获取商品详情失败:", error);
  } finally {
    isLoading.value = false;
  }
};

// 选择规格
const handleSelectVariant = (variant: ProductVariant) => {
  selectedVariant.value = variant;
};

onMounted(async () => {
  resetThemeToDefault();
  // 获取可用的会员套餐列表（用于判断是否显示会员卡片）
  await membershipStore.fetchActivePlans();
  fetchProduct();
});
</script>

<template>
  <div class="product-detail">
    <!-- 加载状态占位符 -->
    <div v-if="isLoading" class="product-header-placeholder" />

    <!-- 商品详情 -->
    <template v-else-if="product">
      <!-- 商品头部 -->
      <ProductHeader :product="product" />

      <div
        class="product-main-layout"
        :class="{ 'no-waves-padding': !isWavesEnabled }"
      >
        <div class="product-grid">
          <!-- 左侧：商品详情和选择规格卡片 -->
          <div class="product-card-container">
            <div class="product-card">
              <ProductContent :product="product" />
              <div class="divider" />
              <ProductVariants
                :product="product"
                :selected-variant="selectedVariant"
                @select="handleSelectVariant"
              />
            </div>

            <!-- 会员购买卡片：仅当商品支持会员购买且系统设置了会员套餐时显示 -->
            <MembershipCard
              v-if="showMembershipCard"
              class="membership-section"
            />
          </div>

          <!-- 右侧：侧边栏 -->
          <div class="sidebar-section">
            <Sidebar />
          </div>
        </div>
      </div>
    </template>

    <!-- 404 状态 -->
    <div v-else class="not-found">
      <el-empty description="商品不存在或已下架">
        <el-button type="primary" @click="$router.push('/products')">
          返回商品列表
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.product-detail {
  min-height: 100vh;

  .product-header-placeholder {
    width: 100%;
    height: 30rem;
    min-height: 300px;

    [data-theme="dark"] & {
      background-color: #18171d;
    }
  }

  .not-found {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.product-main-layout {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  &.no-waves-padding {
    padding-top: 20px;
  }
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}

.product-card-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.membership-section {
  animation: slide-in 0.6s 0.2s backwards;
}

.product-card {
  background: var(--anzhiyu-card-bg);
  padding: 32px;
  border-radius: 16px;
  box-shadow: var(--anzhiyu-shadow-border);
  border: var(--style-border);
  display: flex;
  flex-direction: column;
  gap: 0;

  @media (width > 1200px) {
    flex-direction: row;
    align-items: flex-start;
    gap: 32px;
  }
}

.divider {
  height: 1px;
  background: var(--style-border);
  margin: 32px 0;
  border: none;

  @media (width > 1200px) {
    width: 1px;
    height: auto;
    margin: 0 32px;
    align-self: stretch;
  }
}

:deep(.product-content) {
  flex: 1;
  min-width: 0;
}

:deep(.product-variants) {
  flex-shrink: 0;
  width: 100%;

  @media (width > 1200px) {
    width: 400px;
  }
}

.sidebar-section {
  position: sticky;
  top: 20px;
}

@media (width <= 1400px) {
  .product-grid {
    grid-template-columns: 1fr;
  }

  .sidebar-section {
    display: none;
  }
}

@media (width <= 1200px) {
  .product-card {
    padding: 24px;
  }

  .divider {
    margin: 24px 0;
  }
}

@media (width <= 992px) {
  .content-section {
    gap: 20px;
  }
}

@media (width <= 768px) {
  .product-main-layout {
    padding: 20px 16px;
  }

  .product-grid {
    gap: 20px;
  }
}
</style>
