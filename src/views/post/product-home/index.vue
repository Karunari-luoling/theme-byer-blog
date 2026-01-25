<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  onMounted,
  onActivated,
  onUnmounted,
  watch
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { Search } from "@element-plus/icons-vue";
import ProductCard from "./components/ProductCard/index.vue";
import ProductCardSkeleton from "./components/ProductCardSkeleton/index.vue";
import Sidebar from "../components/Sidebar/index.vue";
import Pagination from "../post-home/components/Pagination/index.vue";
import { listProductsApi, type ProductListItem } from "@/api/product";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { resetThemeToDefault } from "@/utils/themeManager";

defineOptions({
  name: "ProductHome"
});

const route = useRoute();
const router = useRouter();
const siteConfigStore = useSiteConfigStore();

const products = ref<ProductListItem[]>([]);
const isLoading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
});

const keyword = ref("");

// 是否显示分页
const showPagination = computed(() => pagination.total > pagination.pageSize);

// 是否启用一图流
const isOneImageEnabled = computed(() => {
  const pageConfig =
    siteConfigStore.siteConfig?.page?.one_image?.config ||
    siteConfigStore.siteConfig?.page?.oneImageConfig;
  return pageConfig?.products?.enable || false;
});

const fetchData = async () => {
  isLoading.value = true;
  try {
    const res = await listProductsApi({
      page: pagination.page,
      page_size: pagination.pageSize,
      keyword: keyword.value
    });

    if (res.code === 200 && res.data) {
      products.value = res.data.list || [];
      pagination.total = res.data.total;
    }
  } catch (error) {
    console.error("获取商品列表失败:", error);
  } finally {
    isLoading.value = false;
  }
};

// 跳转商品详情
const goToProduct = (product: ProductListItem) => {
  router.push(`/products/${product.id}`);
};

// 分页变化（让路由 watcher 处理数据获取，避免双重调用）
const handlePageChange = (page: number) => {
  pagination.page = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

// 用于避免重复加载的路径记录
let lastLoadedPath = "";

// 监听路由变化，只在路由真正变化时重新加载
watch(
  () => route.fullPath,
  newPath => {
    // 如果路由没有变化，不重新加载（避免 keep-alive 激活时重复加载）
    if (lastLoadedPath === newPath) {
      return;
    }
    lastLoadedPath = newPath;

    // 更新分页和搜索关键词
    pagination.page = route.params.id ? Number(route.params.id) : 1;
    if (route.query.keyword) {
      keyword.value = route.query.keyword as string;
    }
    fetchData();
  },
  { immediate: true }
);

// keep-alive 激活时不重新获取数据
onActivated(() => {
  // 数据已存在，无需重新加载
});

onMounted(() => {
  resetThemeToDefault();
});

onUnmounted(() => {
  // 清理路由记录，确保下次进入时重新加载
  lastLoadedPath = "";
});
</script>

<template>
  <div class="product-home">
    <div class="product-home-container">
      <!-- 页面标题 -->
      <h1 v-if="!isOneImageEnabled" class="page-title">
        <i class="anzhiyufont anzhiyu-icon-shopping-bag" />
        商品中心
      </h1>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <div class="search-input-wrapper">
          <el-input
            v-model="keyword"
            placeholder="搜索商品..."
            :prefix-icon="Search"
            clearable
            size="large"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-button type="primary" size="large" @click="handleSearch">
            搜索
          </el-button>
        </div>
        <div class="product-count">
          共 <span class="count-num">{{ pagination.total }}</span> 件商品
        </div>
      </div>

      <div class="main-content layout">
        <div class="product-content">
          <!-- 商品列表 -->
          <div class="product-list-container">
            <!-- 加载骨架屏 -->
            <div v-if="isLoading" class="product-grid">
              <ProductCardSkeleton v-for="i in 6" :key="i" />
            </div>

            <!-- 商品列表 -->
            <div v-else-if="products.length > 0" class="product-grid">
              <ProductCard
                v-for="product in products"
                :key="product.id"
                :product="product"
                @click="goToProduct(product)"
              />
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <el-empty description="暂无商品">
                <template #image>
                  <i class="anzhiyufont anzhiyu-icon-shopping-bag empty-icon" />
                </template>
              </el-empty>
            </div>
          </div>

          <!-- 分页 -->
          <Pagination
            v-if="showPagination"
            :total="pagination.total"
            :page-size="pagination.pageSize"
            :page="pagination.page"
            @current-change="handlePageChange"
          />
        </div>

        <!-- 侧边栏 -->
        <Sidebar />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.product-home {
  min-height: 100vh;

  .product-home-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .page-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 0.4rem 0 1.5rem;
    font-size: 2em;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
    text-align: center;
    animation: slide-in 0.6s 0.2s backwards;

    .anzhiyufont {
      font-size: 0.9em;
      color: var(--anzhiyu-main);
    }
  }

  .search-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    animation: slide-in 0.6s 0.3s backwards;

    .search-input-wrapper {
      display: flex;
      gap: 0.75rem;
      width: 100%;
      max-width: 500px;

      :deep(.el-input) {
        flex: 1;

        .el-input__wrapper {
          border-radius: 12px;
          background: var(--anzhiyu-card-bg);
          box-shadow: var(--anzhiyu-shadow-border);
          border: var(--style-border-always);

          &:hover,
          &:focus-within {
            border-color: var(--anzhiyu-main);
          }
        }
      }

      :deep(.el-button) {
        border-radius: 12px;
        padding: 0 1.5rem;
      }
    }

    .product-count {
      font-size: 0.95rem;
      color: var(--anzhiyu-secondtext);

      .count-num {
        color: var(--anzhiyu-main);
        font-weight: 600;
      }
    }
  }

  .main-content {
    display: flex;
    gap: 20px;
  }

  .product-content {
    flex: 1;
    min-width: 0;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
    animation: slide-in 0.6s 0.4s backwards;
  }

  .empty-state {
    padding: 4rem 0;
    text-align: center;
    animation: slide-in 0.6s 0.4s backwards;

    .empty-icon {
      font-size: 4rem;
      color: var(--anzhiyu-secondtext);
      opacity: 0.5;
    }

    :deep(.el-empty__description) {
      color: var(--anzhiyu-secondtext);
    }
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media screen and (width <= 992px) {
  .product-home {
    .main-content {
      flex-direction: column;
    }

    :deep(.aside-content) {
      display: none;
    }
  }
}

@media screen and (width <= 768px) {
  .product-home {
    .page-title {
      font-size: 1.6em;
      margin: 0.3rem 0 1rem;
    }

    .search-bar {
      .search-input-wrapper {
        flex-direction: column;
        max-width: 100%;

        :deep(.el-button) {
          width: 100%;
        }
      }
    }

    .product-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
  }
}

@media screen and (width <= 480px) {
  .product-home {
    .product-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
