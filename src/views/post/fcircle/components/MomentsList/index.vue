<!--
 * @Description: 朋友圈文章列表
 * @Author: 安知鱼
 * @Date: 2025-10-08
-->
<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import MomentsItem from "./MomentsItem.vue";
import MomentsFooter from "./MomentsFooter.vue";
import RandomPost from "../RandomPost/index.vue";
import type { Moment, MomentsStatistics } from "@/views/post/fcircle/types";
import { getMomentsList } from "@/api/moments";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

const siteConfigStore = useSiteConfigStore();

// 从配置中获取分页大小，如果没有配置则默认为 24
const defaultPageSize = computed(() => {
  const displayLimit = siteConfigStore.getSiteConfig?.moments?.display_limit;
  return displayLimit && displayLimit > 0 ? displayLimit : 24;
});

// 状态管理
const state = reactive({
  moments: [] as Moment[],
  loading: false,
  loadingMore: false, // 加载更多的loading状态
  currentPage: 1,
  pageSize: defaultPageSize.value,
  total: 0,
  sortType: "published_at", // 排序类型: published_at | created_at
  statistics: {
    total_links: 0,
    active_links: 0,
    total_moments: 0,
    last_updated_time: ""
  } as MomentsStatistics
});

// 计算是否已加载完所有数据
const isEnded = computed(() => {
  return state.moments.length >= state.total && state.total > 0;
});

// 计算当前显示的文章数量
const currentMomentNum = computed(() => {
  return state.currentPage * state.pageSize;
});

// 获取朋友圈列表
const fetchMomentsList = async (page = 1) => {
  // 区分首次加载和加载更多
  if (page === 1) {
    state.loading = true;
  } else {
    state.loadingMore = true;
  }

  try {
    const response = await getMomentsList(page, state.pageSize, state.sortType);

    if (response.code === 200 && response.data) {
      if (page === 1) {
        state.moments = response.data.list || [];
      } else {
        state.moments.push(...(response.data.list || []));
      }

      state.total = response.data.total || 0;
      state.statistics = response.data.statistics || {
        total_links: 0,
        active_links: 0,
        total_moments: 0,
        last_updated_time: ""
      };
      state.currentPage = page;
    } else {
      ElMessage.error(response.message || "获取朋友圈数据失败");
    }
  } catch (error) {
    ElMessage.error("获取朋友圈数据失败");
    console.error(error);
  } finally {
    state.loading = false;
    state.loadingMore = false;
  }
};

// 加载更多
const loadMore = () => {
  if (!isEnded.value && !state.loading && !state.loadingMore) {
    fetchMomentsList(state.currentPage + 1);
  }
};

// 切换排序方式
const changeSort = (sortType: string) => {
  state.sortType = sortType;
  state.currentPage = 1;
  fetchMomentsList(1);
};

// 组件挂载时获取数据
onMounted(() => {
  fetchMomentsList(1);
});
</script>

<template>
  <div class="moments-list">
    <!-- 友链随机文章（钓鱼） -->
    <RandomPost />

    <div class="title-section">
      <div class="title-left">
        <h2>🐟 朋友圈</h2>
      </div>
    </div>

    <div class="moments-grid">
      <template v-if="!state.loading && state.moments.length > 0">
        <MomentsItem
          :moments="state.moments.slice(0, currentMomentNum)"
          :sort-type="state.sortType"
        />

        <div class="moments-more-container">
          <div
            v-if="!isEnded && !state.loadingMore"
            class="moments-more-btn"
            @click="loadMore"
          >
            <i class="anzhiyufont anzhiyu-icon-angle-double-down" />
          </div>
          <div v-else-if="state.loadingMore" class="moments-more-btn loading">
            <el-icon class="is-loading">
              <i class="anzhiyufont anzhiyu-icon-loading" />
            </el-icon>
          </div>
          <div v-else class="moments-empty">------- 没有更多了喔 -------</div>
        </div>

        <MomentsFooter
          :statistics="state.statistics"
          :sort-type="state.sortType"
          @change-sort="changeSort"
        />
      </template>

      <div v-else-if="state.loading" class="loading-container">
        <el-icon class="is-loading">
          <i class="anzhiyufont anzhiyu-icon-loading" />
        </el-icon>
        <p>加载中...</p>
      </div>

      <div v-else class="empty-data">
        <el-empty :image-size="200" description="暂无朋友圈内容" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.moments-list {
  .title-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.5rem;

    .title-left {
      display: flex;
      align-items: center;

      h2 {
        padding-top: 0;
        margin: 0.6rem 0;
      }
    }
  }

  .moments-grid {
    display: flex;
    flex-flow: row wrap;
    margin: 0 -8px;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 4rem 0;
    color: var(--anzhiyu-secondtext);

    .el-icon {
      margin-bottom: 1rem;
      font-size: 2rem;
    }
  }

  .empty-data {
    width: 100%;
    margin: 2rem auto;
  }

  .moments-more-container {
    width: 100%;

    .moments-more-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 40%;
      max-width: 810px;
      height: 30px;
      margin: auto;
      margin-top: 1rem;
      font-weight: bolder;
      color: var(--anzhiyu-fontcolor);
      text-align: center;
      cursor: pointer;
      background: var(--anzhiyu-card-bg);
      border: var(--style-border);
      border-radius: 12px;
      box-shadow: var(--anzhiyu-shadow-border);
      transition: 0.3s;

      &:hover {
        width: 60%;
        color: var(--anzhiyu-white);
        background: var(--anzhiyu-main);
        border: var(--style-border-hover);
        box-shadow: var(--anzhiyu-shadow-main);
      }

      &.loading {
        cursor: not-allowed;
        opacity: 0.6;

        &:hover {
          width: 40%;
          color: var(--anzhiyu-fontcolor);
          background: var(--anzhiyu-card-bg);
          border: var(--style-border);
          box-shadow: var(--anzhiyu-shadow-border);
        }
      }
    }

    .moments-empty {
      display: flex;
      justify-content: center;
      width: 100%;
      margin-top: 10px;
      font-size: 14px;
      color: var(--anzhiyu-gray);
      opacity: 0.8;
    }
  }
}
</style>
