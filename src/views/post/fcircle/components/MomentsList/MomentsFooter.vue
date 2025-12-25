<!--
 * @Description: 朋友圈页脚
 * @Author: 安知鱼
 * @Date: 2025-10-08
-->
<script setup lang="ts">
import { ref } from "vue";
import type { MomentsStatistics } from "@/views/post/fcircle/types";

const props = defineProps<{
  statistics: MomentsStatistics;
  sortType: string;
}>();

const emit = defineEmits(["changeSort"]);

const sort = ref(props.sortType);

const changeSort = (val: string) => {
  sort.value = val;
  emit("changeSort", sort.value);
};
</script>

<template>
  <div class="moments-footer">
    <div class="footer-content">
      <div class="footer-info">
        <div class="info-item">
          <span class="label">订阅</span>
          <span class="value">{{ props.statistics.total_links }}</span>
        </div>
        <div class="info-item">
          <span class="label">活跃</span>
          <span class="value">{{ props.statistics.active_links }}</span>
        </div>
        <div class="info-item">
          <span class="label">日志</span>
          <span class="value">{{ props.statistics.total_moments }}</span>
        </div>
      </div>

      <div class="footer-setting">
        <span class="update-time">
          更新于：{{ props.statistics.last_updated_time }}
        </span>
      </div>

      <div class="footer-sort">
        <el-switch
          v-model="sort"
          inactive-color="var(--anzhiyu-main)"
          active-value="published_at"
          inactive-value="fetched_at"
          inline-prompt
          active-text="发布时间"
          inactive-text="抓取时间"
          size="large"
          @change="changeSort"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.moments-footer {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  margin-top: 0.5rem;
  margin-right: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 2;
  color: var(--anzhiyu-secondtext);
  text-align: right;

  .footer-content {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: 100%;
    margin-top: 0.5rem;
    margin-right: 8px;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--anzhiyu-secondtext);
    text-align: right;

    .footer-info {
      display: flex;
      gap: 0.5rem;

      .info-item {
        display: flex;
        align-items: center;

        .label {
          margin-right: 0.25rem;
        }

        .value {
          font-weight: 600;
          color: var(--anzhiyu-fontcolor);
        }
      }
    }

    .footer-setting {
      display: flex;
      align-items: center;
      margin-top: 0.25rem;

      .update-time {
        font-size: 12px;
      }
    }

    .footer-sort {
      margin-top: 0.5rem;
    }
  }
}
</style>
