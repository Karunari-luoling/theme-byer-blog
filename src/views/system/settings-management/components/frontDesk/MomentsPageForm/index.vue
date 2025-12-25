<template>
  <el-form label-position="top" class="moments-settings-form">
    <el-divider content-position="left">
      <h3>朋友圈配置</h3>
    </el-divider>

    <!-- 功能开关 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><Setting /></el-icon>
        功能开关
      </h4>
      <div class="config-grid">
        <el-form-item label="启用朋友圈">
          <el-switch
            v-model="model.enable"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-item-help">是否启用朋友圈功能。</div>
        </el-form-item>
      </div>
    </div>

    <!-- 基本配置区域 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><Edit /></el-icon>
        基本配置
      </h4>
      <div class="config-grid">
        <el-form-item label="页面标题">
          <el-input
            v-model="model.title"
            placeholder="请输入朋友圈页面标题"
            clearable
          />
          <div class="form-item-help">朋友圈页面显示的主标题，如：朋友圈。</div>
        </el-form-item>

        <el-form-item label="页面副标题">
          <el-input
            v-model="model.subTitle"
            placeholder="请输入朋友圈页面副标题"
            clearable
          />
          <div class="form-item-help">
            朋友圈页面显示的副标题，如：发现友链的精彩内容。
          </div>
        </el-form-item>

        <el-form-item label="提示文字">
          <el-input
            v-model="model.tips"
            placeholder="请输入提示文字"
            clearable
          />
          <div class="form-item-help">
            朋友圈页面的引导提示文字，如：聚合友链最新动态。
          </div>
        </el-form-item>

        <el-form-item label="顶部背景图">
          <el-input
            v-model="model.topBackground"
            placeholder="请输入顶部背景图片链接"
            clearable
          >
            <template #prepend>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <div class="form-item-help">朋友圈页面顶部横幅的背景图片。</div>
        </el-form-item>
      </div>
    </div>

    <!-- 按钮配置区域 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><Link /></el-icon>
        按钮配置
      </h4>
      <div class="config-grid">
        <el-form-item label="按钮文字">
          <el-input
            v-model="model.buttonText"
            placeholder="请输入按钮文字"
            clearable
          />
          <div class="form-item-help">
            朋友圈页面按钮显示的文字，如：友情链接。
          </div>
        </el-form-item>

        <el-form-item label="按钮链接">
          <el-input
            v-model="model.buttonLink"
            placeholder="请输入按钮跳转链接"
            clearable
          >
            <template #prepend>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <div class="form-item-help">
            点击按钮后跳转的链接地址，如：/link。
          </div>
        </el-form-item>
      </div>
    </div>

    <!-- 抓取配置区域 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><Clock /></el-icon>
        抓取配置
      </h4>
      <div class="config-grid">
        <el-form-item label="抓取频率（小时）">
          <el-input-number
            v-model="model.fetchInterval"
            :min="model.minFetchInterval"
            :max="168"
            :step="1"
            controls-position="right"
          />
          <div class="form-item-help">
            RSS 抓取频率，最低 {{ model.minFetchInterval }}
            小时，建议：24小时。
          </div>
        </el-form-item>

        <el-form-item label="每个友链最大保存条数">
          <el-input-number
            v-model="model.maxItems"
            :min="5"
            :max="100"
            :step="5"
            controls-position="right"
          />
          <div class="form-item-help">
            每个友链最多保存的文章条数，建议：5。
          </div>
        </el-form-item>

        <el-form-item label="RSS 超时时间（秒）">
          <el-input-number
            v-model="model.rssTimeout"
            :min="10"
            :max="120"
            :step="5"
            controls-position="right"
          />
          <div class="form-item-help">抓取 RSS 的超时时间，建议：30秒。</div>
        </el-form-item>
      </div>
    </div>

    <!-- 显示配置区域 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><View /></el-icon>
        显示配置
      </h4>
      <div class="config-grid">
        <el-form-item label="前台每页显示数量">
          <el-input-number
            v-model="model.displayLimit"
            :min="10"
            :max="200"
            :step="10"
            controls-position="right"
          />
          <div class="form-item-help">
            朋友圈前台列表每页显示的条目数量，建议：30。
          </div>
        </el-form-item>

        <el-form-item label="缓存时长（分钟）">
          <el-input-number
            v-model="model.cacheDuration"
            :min="5"
            :max="1440"
            :step="5"
            controls-position="right"
          />
          <div class="form-item-help">朋友圈列表的缓存时长，建议：30分钟。</div>
        </el-form-item>
      </div>
    </div>

    <!-- 操作区域 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><RefreshRight /></el-icon>
        手动操作
      </h4>
      <div class="config-grid">
        <el-form-item label="手动抓取 RSS">
          <el-button
            type="primary"
            :loading="fetchLoading"
            :disabled="fetchLoading"
            @click="handleManualFetch"
          >
            <el-icon v-if="!fetchLoading"><RefreshRight /></el-icon>
            {{ fetchLoading ? "抓取中..." : "立即抓取" }}
          </el-button>
          <div class="form-item-help">
            立即触发一次 RSS 抓取任务，系统会在后台自动从所有友链抓取最新文章。
          </div>
        </el-form-item>

        <el-form-item label="清理缓存">
          <el-button type="warning" @click="handleClearCache">
            <el-icon><Delete /></el-icon>
            清理缓存
          </el-button>
          <div class="form-item-help">
            清理朋友圈列表缓存，下次访问时会重新从数据库加载数据。
          </div>
        </el-form-item>
      </div>
    </div>

    <!-- 通知配置 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><Bell /></el-icon>
        通知配置
      </h4>
      <MomentsNotifySettings
        :model-value="model"
        @update:model-value="handleNotifySettingsUpdate"
      />
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  Edit,
  Link,
  Setting,
  Clock,
  View,
  RefreshRight,
  Bell,
  Delete
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  triggerMomentsFetch,
  getMomentsFetchStatus,
  clearMomentsCache
} from "@/api/moments-admin";
import MomentsNotifySettings from "./MomentsNotifySettings.vue";

interface MomentsSettings {
  enable: boolean;
  title: string;
  subTitle: string;
  tips: string;
  buttonText: string;
  buttonLink: string;
  topBackground: string;
  fetchInterval: number;
  maxItems: number;
  displayLimit: number;
  cacheDuration: number;
  rssTimeout: number;
  minFetchInterval: number;

  // 通知配置
  notifyAdmin: boolean;
  scMailNotify: boolean;
  pushooChannel: string;
  pushooURL: string;
  webhookRequestBody: string | object;
  webhookHeaders: string;
  mailSubjectAdmin: string;
  mailTemplateAdmin: string;
}

const model = defineModel<MomentsSettings>({ required: true });

// 抓取加载状态
const fetchLoading = ref(false);
// 抓取状态轮询定时器
let fetchStatusTimer: NodeJS.Timeout | null = null;

// 处理通知设置更新
const handleNotifySettingsUpdate = (updatedValue: MomentsSettings) => {
  // 直接赋值以触发 defineModel 的响应式更新
  model.value = updatedValue;
};

// 查询抓取状态
const checkFetchStatus = async () => {
  try {
    const response = await getMomentsFetchStatus();
    if (response.code === 200 && response.data) {
      const wasFetching = fetchLoading.value;
      fetchLoading.value = response.data.is_fetching;

      // 如果从抓取中变为空闲，提示完成
      if (wasFetching && !response.data.is_fetching) {
        ElMessage.success("RSS 抓取已完成");
      }
    }
  } catch (error) {
    console.error("查询抓取状态失败:", error);
  }
};

// 手动抓取 RSS
const handleManualFetch = async () => {
  try {
    const response = await triggerMomentsFetch();
    if (response.code === 200) {
      fetchLoading.value = true;
      ElMessage.success(response.message || "RSS 抓取任务已触发，正在后台执行");

      // 开始轮询状态
      startStatusPolling();
    } else {
      ElMessage.error(response.message || "触发 RSS 抓取失败");
    }
  } catch (error: any) {
    console.error("触发 RSS 抓取失败:", error);
    ElMessage.error(error?.message || "触发 RSS 抓取失败，请稍后重试");
  }
};

// 清理缓存
const handleClearCache = async () => {
  try {
    const response = await clearMomentsCache();
    if (response.code === 200) {
      ElMessage.success(response.message || "朋友圈缓存已清理");
    } else {
      ElMessage.error(response.message || "清理缓存失败");
    }
  } catch (error: any) {
    console.error("清理缓存失败:", error);
    ElMessage.error(error?.message || "清理缓存失败，请稍后重试");
  }
};

// 启动状态轮询
const startStatusPolling = () => {
  // 清除旧的定时器
  if (fetchStatusTimer) {
    clearInterval(fetchStatusTimer);
  }

  // 每 3 秒查询一次状态
  fetchStatusTimer = setInterval(() => {
    checkFetchStatus();
  }, 3000);
};

// 停止状态轮询
const stopStatusPolling = () => {
  if (fetchStatusTimer) {
    clearInterval(fetchStatusTimer);
    fetchStatusTimer = null;
  }
};

// 组件挂载时检查状态
onMounted(() => {
  checkFetchStatus();
});

// 组件卸载时清除定时器
onUnmounted(() => {
  stopStatusPolling();
});

// 监听 fetchLoading 变化，空闲时停止轮询
watch(fetchLoading, newValue => {
  if (!newValue) {
    stopStatusPolling();
  }
});
</script>

<style scoped lang="scss">
.moments-settings-form {
  max-width: 800px;
}

.el-divider {
  margin: 0 0 28px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }
}

.config-section {
  margin-bottom: 40px;

  .section-title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 20px;
    font-size: 16px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);

    .el-icon {
      color: var(--anzhiyu-theme);
    }
  }

  .config-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;

    .el-form-item {
      margin-bottom: 0;

      .form-item-help {
        width: 100%;
        margin-top: 4px;
        font-size: 12px;
        line-height: 1.4;
        color: var(--anzhiyu-secondtext);
      }
    }
  }
}

@media (width >= 768px) {
  .config-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

// 移动端适配
@media (width <= 768px) {
  .moments-settings-form {
    padding: 0;
  }

  .el-divider {
    margin: 0 0 20px;

    h3 {
      font-size: 16px;
    }
  }

  .config-section {
    margin-bottom: 28px;

    .section-title {
      gap: 6px;
      margin-bottom: 16px;
      font-size: 15px;

      .el-icon {
        font-size: 18px;
      }
    }

    .config-grid {
      gap: 16px;

      .el-form-item {
        :deep(.el-form-item__label) {
          padding-bottom: 6px;
          font-size: 14px;
          line-height: 1.5;
        }

        :deep(.el-input__inner) {
          font-size: 14px;
        }

        :deep(.el-input-number) {
          width: 100%;

          .el-input__inner {
            text-align: left;
          }
        }

        :deep(.el-switch) {
          height: 22px;
        }

        :deep(.el-switch__label) {
          font-size: 13px;
        }

        .form-item-help {
          margin-top: 6px;
          font-size: 11px;
          line-height: 1.4;
        }
      }
    }
  }

  // 输入框前置元素
  :deep(.el-input-group__prepend) {
    padding: 0 10px;

    .el-icon {
      font-size: 14px;
    }
  }
}
</style>
