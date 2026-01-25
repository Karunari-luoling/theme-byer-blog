<!--
 * @Description: AI播客缓存Tab组件
 * @Author: 安知鱼
 * @Date: 2025-12-27
-->
<script setup lang="ts">
import { computed } from "vue";
import type { ArticleForm } from "@/api/post/type";
import { Setting, Refresh } from "@element-plus/icons-vue";
import type { CacheStatus } from "@/api/ai-podcast";

const props = defineProps<{
  form: ArticleForm;
  articleId?: string | null;
  cacheStatus: CacheStatus | null;
  isCheckingCache: boolean;
  isPreCaching: boolean;
  isPolling: boolean;
}>();

const emit = defineEmits<{
  (e: "update:enable-ai-podcast", value: boolean): void;
  (e: "fetchCacheStatus"): void;
  (e: "preCache"): void;
}>();

// 计算是否有有效的articleId
const hasValidArticleId = computed(
  () => props.articleId && props.articleId !== "new"
);

// 处理 AI 播客启用开关变更
const handleAIPodcastEnableChange = (value: boolean) => {
  emit("update:enable-ai-podcast", value);
};

// 格式化字节数
const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

// 格式化时间
const formatTime = (timestamp: number): string => {
  if (!timestamp || timestamp === 0) return "未知";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};
</script>

<template>
  <div class="ai-podcast-cache-section">
    <!-- AI播客启用开关 -->
    <div class="podcast-enable-section">
      <el-form-item label="启用 AI 播客">
        <div class="enable-switch-wrapper">
          <el-switch
            :model-value="form.extra_config?.enable_ai_podcast ?? false"
            @update:model-value="handleAIPodcastEnableChange"
          />
          <div class="form-item-tip">
            开启后，该文章详情页会显示 AI 播客按钮（需全局 AI 播客功能已开启）
          </div>
        </div>
      </el-form-item>
    </div>

    <el-divider />

    <el-alert
      v-if="!hasValidArticleId"
      title="提示"
      type="info"
      :closable="false"
      show-icon
    >
      <template #default>
        <p>请先保存文章后再进行AI播客缓存操作</p>
      </template>
    </el-alert>

    <div v-else class="cache-content">
      <div class="cache-header">
        <h3>AI播客缓存状态</h3>
        <div class="header-actions">
          <el-tag v-if="isPolling" type="info" effect="plain">
            <el-icon class="is-loading" style="margin-right: 4px">
              <Refresh />
            </el-icon>
            正在更新...
          </el-tag>
          <el-button
            :disabled="isCheckingCache"
            @click="emit('fetchCacheStatus')"
          >
            <el-icon :class="{ 'is-loading': isCheckingCache }">
              <Refresh />
            </el-icon>
            刷新状态
          </el-button>
        </div>
      </div>

      <div v-if="isCheckingCache && !cacheStatus" class="loading-status">
        <el-skeleton :rows="5" animated />
      </div>

      <div
        v-else-if="
          cacheStatus && (cacheStatus.has_cache || cacheStatus.is_generating)
        "
        class="cache-status"
      >
        <el-descriptions :column="2" border>
          <el-descriptions-item label="缓存状态">
            <div class="status-tags">
              <el-tag
                v-if="cacheStatus.is_generating"
                type="info"
                size="large"
                effect="dark"
                class="generating-tag"
              >
                <el-icon class="is-loading">
                  <Refresh />
                </el-icon>
                <span>正在生成中</span>
              </el-tag>
              <el-tag
                v-else
                :type="cacheStatus.is_complete ? 'success' : 'warning'"
                size="large"
              >
                {{ cacheStatus.is_complete ? "完整" : "不完整" }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="cacheStatus.has_cache" label="缓存进度">
            <div class="progress-wrapper">
              <el-progress
                :percentage="Math.round(cacheStatus.progress)"
                :status="cacheStatus.is_complete ? 'success' : undefined"
                :stroke-width="8"
              />
              <span class="progress-text">
                {{ Math.round(cacheStatus.progress) }}%
              </span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="cacheStatus.has_cache && cacheStatus.total_rounds > 0"
            label="总轮次"
          >
            <span class="value-text">
              {{ cacheStatus.total_rounds || 0 }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="cacheStatus.has_cache && cacheStatus.total_rounds > 0"
            label="已缓存轮次"
          >
            <span class="value-text">
              {{ cacheStatus.cached_rounds || 0 }} /
              {{ cacheStatus.total_rounds || 0 }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="cacheStatus.has_cache && cacheStatus.total_bytes > 0"
            label="总大小"
          >
            <span class="value-text">
              {{ formatBytes(cacheStatus.total_bytes) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="cacheStatus.has_cache && cacheStatus.cached_bytes > 0"
            label="已缓存大小"
          >
            <span class="value-text">
              {{ formatBytes(cacheStatus.cached_bytes) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="cacheStatus.created_at"
            label="创建时间"
            :span="2"
          >
            <span class="value-text">
              {{ formatTime(cacheStatus.created_at) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="
              cacheStatus.missing_rounds &&
              cacheStatus.missing_rounds.length > 0
            "
            label="缺失轮次"
            :span="2"
          >
            <div class="missing-rounds">
              <el-tag
                v-for="round in cacheStatus.missing_rounds"
                :key="round"
                type="danger"
                effect="plain"
                size="small"
              >
                第{{ round }}轮
              </el-tag>
              <span
                v-if="cacheStatus.missing_rounds.length === 0"
                class="no-missing"
              >
                无缺失
              </span>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div
        v-else-if="cacheStatus && cacheStatus.is_generating"
        class="generating-status"
      >
        <el-alert title="正在生成中" type="info" :closable="false" show-icon>
          <template #default>
            <p>后台正在生成AI播客缓存，请稍候...</p>
            <p class="hint-text">
              生成完成后会自动更新状态，您可以继续编辑文章
            </p>
          </template>
        </el-alert>
      </div>

      <div v-else class="no-cache">
        <el-empty description="暂无缓存数据">
          <template #image>
            <el-icon :size="80" color="#c0c4cc">
              <Setting />
            </el-icon>
          </template>
          <template #description>
            <p>该文章尚未生成AI播客缓存</p>
            <p class="empty-hint">
              点击下方按钮开始生成缓存，生成完成后用户访问时将直接使用缓存，提升加载速度
            </p>
          </template>
        </el-empty>
      </div>

      <div class="cache-actions">
        <el-button
          type="primary"
          size="large"
          :disabled="
            cacheStatus?.is_complete ||
            isPreCaching ||
            cacheStatus?.is_generating
          "
          @click="emit('preCache')"
        >
          <el-icon
            :class="{ 'is-loading': isPreCaching }"
            style="margin-right: 4px"
          >
            <Setting />
          </el-icon>
          {{
            cacheStatus?.is_complete
              ? "缓存已完成"
              : cacheStatus?.is_generating
                ? "正在生成中..."
                : isPreCaching
                  ? "正在启动..."
                  : cacheStatus?.has_cache
                    ? "继续生成缓存"
                    : "生成缓存"
          }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ai-podcast-cache-section {
  padding: 0 8px;
}

.podcast-enable-section {
  .enable-switch-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-item-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.cache-content {
  .cache-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .loading-status {
    padding: 20px;
  }

  .cache-status {
    margin-bottom: 24px;

    .status-tags {
      display: flex;
      gap: 8px;

      .generating-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
    }

    .progress-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;

      .el-progress {
        flex: 1;
      }

      .progress-text {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    .value-text {
      font-weight: 500;
    }

    .missing-rounds {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .no-missing {
        color: var(--el-color-success);
        font-size: 13px;
      }
    }
  }

  .generating-status {
    margin-bottom: 24px;

    .hint-text {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .no-cache {
    margin-bottom: 24px;
    padding: 40px 0;

    .empty-hint {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      max-width: 300px;
      margin: 8px auto 0;
      line-height: 1.5;
    }
  }

  .cache-actions {
    display: flex;
    justify-content: center;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
