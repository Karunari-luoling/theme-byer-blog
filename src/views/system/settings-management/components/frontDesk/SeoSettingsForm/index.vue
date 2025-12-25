<template>
  <div class="seo-settings-form">
    <el-divider content-position="left">
      <span class="divider-title">SEO 搜索引擎提交配置</span>
    </el-divider>

    <el-alert type="info" :closable="false" style="margin-bottom: 20px">
      <template #title> 配置提示 </template>
      <div>
        <p>配置后，可通过API接口手动提交文章URL到搜索引擎，加快收录速度。</p>
        <ul>
          <li>
            百度：在
            <a href="https://ziyuan.baidu.com/" target="_blank"
              >百度搜索资源平台</a
            >
            获取推送接口和token
          </li>
          <li>
            Bing：在
            <a href="https://www.bing.com/webmasters/" target="_blank"
              >Bing Webmaster Tools</a
            >
            获取API密钥
          </li>
          <li>
            Google：需要完成以下步骤：
            <ol style="margin: 4px 0; padding-left: 20px">
              <li>
                在
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  >Google Search Console</a
                >
                验证网站所有权
              </li>
              <li>
                在
                <a href="https://console.cloud.google.com/" target="_blank"
                  >Google Cloud Console</a
                >
                创建项目并启用 Indexing API
              </li>
              <li>创建服务账号并下载JSON凭证</li>
              <li>在 Search Console 中授权服务账号访问网站资源</li>
            </ol>
          </li>
        </ul>
      </div>
    </el-alert>

    <!-- 通用配置 -->
    <el-form-item label="自动提交">
      <div>
        <el-switch
          v-model="localValue.autoSubmit"
          active-text="启用"
          inactive-text="禁用"
        />
        <div class="form-item-tip">
          发布文章时是否自动提交到已启用的搜索引擎
        </div>
      </div>
    </el-form-item>

    <!-- 百度配置 -->
    <el-divider content-position="left">
      <span class="sub-divider-title">百度搜索</span>
    </el-divider>

    <el-form-item label="启用百度提交">
      <el-switch
        v-model="localValue.baidu.enable"
        active-text="启用"
        inactive-text="禁用"
      />
    </el-form-item>

    <el-form-item label="百度站点域名">
      <el-input
        v-model="localValue.baidu.site"
        placeholder="https://example.com"
        clearable
      />
      <div class="form-item-tip">在百度站长平台验证的站点域名</div>
    </el-form-item>

    <el-form-item label="百度推送Token">
      <el-input
        v-model="localValue.baidu.token"
        placeholder="从百度站长平台获取"
        clearable
      />
      <div class="form-item-tip">在「资源提交 > 普通收录 > API提交」中获取</div>
    </el-form-item>

    <el-form-item>
      <div>
        <el-button
          type="primary"
          :loading="testingBaidu"
          :disabled="
            !localValue.baidu.enable ||
            !localValue.baidu.site ||
            !localValue.baidu.token
          "
          @click="testConnection('baidu')"
        >
          {{ testingBaidu ? "测试中..." : "测试百度连接" }}
        </el-button>
        <div class="form-item-tip">点击测试按钮验证配置是否正确</div>
      </div>
    </el-form-item>

    <!-- Bing 配置 -->
    <el-divider content-position="left">
      <span class="sub-divider-title">Bing 搜索</span>
    </el-divider>

    <el-form-item label="启用Bing提交">
      <el-switch
        v-model="localValue.bing.enable"
        active-text="启用"
        inactive-text="禁用"
      />
    </el-form-item>

    <el-form-item label="Bing API密钥">
      <el-input
        v-model="localValue.bing.apiKey"
        placeholder="从Bing Webmaster获取"
        clearable
      />
      <div class="form-item-tip">在「设置 > API 访问」中生成</div>
    </el-form-item>

    <el-form-item label="Bing站点URL">
      <el-input
        v-model="localValue.bing.siteURL"
        placeholder="https://example.com"
        clearable
      />
      <div class="form-item-tip">在Bing Webmaster验证的站点URL</div>
    </el-form-item>

    <el-form-item>
      <div>
        <el-button
          type="primary"
          :loading="testingBing"
          :disabled="
            !localValue.bing.enable ||
            !localValue.bing.apiKey ||
            !localValue.bing.siteURL
          "
          @click="testConnection('bing')"
        >
          {{ testingBing ? "测试中..." : "测试Bing连接" }}
        </el-button>
        <div class="form-item-tip">点击测试按钮验证配置是否正确</div>
      </div>
    </el-form-item>

    <!-- Google 配置 -->
    <el-divider content-position="left">
      <span class="sub-divider-title">Google 搜索</span>
    </el-divider>

    <el-form-item label="启用Google提交">
      <el-switch
        v-model="localValue.google.enable"
        active-text="启用"
        inactive-text="禁用"
      />
    </el-form-item>

    <el-form-item label="Google服务账号凭证">
      <el-input
        v-model="localValue.google.credential"
        type="textarea"
        :rows="4"
        placeholder='{"type":"service_account",...}'
        clearable
      />
      <div class="form-item-tip">
        服务账号凭证JSON（需配置Google Indexing API）<br />
        <span style="color: #f56c6c"
          >⚠️ 重要：服务账号邮箱需要在 Google Search Console
          中被授权为网站所有者</span
        >
      </div>
    </el-form-item>

    <el-form-item>
      <div>
        <el-button
          type="primary"
          :loading="testingGoogle"
          :disabled="!localValue.google.enable || !localValue.google.credential"
          @click="testConnection('google')"
        >
          {{ testingGoogle ? "测试中..." : "测试Google连接" }}
        </el-button>
        <div class="form-item-tip">
          点击测试按钮验证配置是否正确（需要正确的服务账号凭证）
        </div>
      </div>
    </el-form-item>

    <!-- 重试配置 -->
    <el-divider content-position="left">
      <span class="sub-divider-title">重试配置</span>
    </el-divider>

    <el-form-item label="重试次数">
      <el-input-number
        v-model.number="retryTimesNumber"
        :min="1"
        :max="10"
        controls-position="right"
        @change="handleRetryTimesChange"
      />
      <div class="form-item-tip">提交失败时的重试次数（默认3次）</div>
    </el-form-item>

    <el-form-item label="重试间隔（秒）">
      <el-input-number
        v-model.number="retryIntervalNumber"
        :min="1"
        :max="60"
        controls-position="right"
        @change="handleRetryIntervalChange"
      />
      <div class="form-item-tip">每次重试之间的间隔时间（默认5秒）</div>
    </el-form-item>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { testSEOConnection } from "@/api/seo";

interface SeoSettings {
  autoSubmit: boolean;
  baidu: {
    enable: boolean;
    site: string;
    token: string;
  };
  bing: {
    enable: boolean;
    apiKey: string;
    siteURL: string;
  };
  google: {
    enable: boolean;
    credential: string;
  };
  retryTimes: string;
  retryInterval: string;
}

const props = defineProps<{
  modelValue: SeoSettings;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: SeoSettings): void;
}>();

const testingBaidu = ref(false);
const testingBing = ref(false);
const testingGoogle = ref(false);

const localValue = ref<SeoSettings>({
  autoSubmit: props.modelValue.autoSubmit ?? false,
  baidu: {
    enable: props.modelValue.baidu?.enable ?? false,
    site: props.modelValue.baidu?.site ?? "",
    token: props.modelValue.baidu?.token ?? ""
  },
  bing: {
    enable: props.modelValue.bing?.enable ?? false,
    apiKey: props.modelValue.bing?.apiKey ?? "",
    siteURL: props.modelValue.bing?.siteURL ?? ""
  },
  google: {
    enable: props.modelValue.google?.enable ?? false,
    credential: props.modelValue.google?.credential ?? ""
  },
  retryTimes: props.modelValue.retryTimes ?? "3",
  retryInterval: props.modelValue.retryInterval ?? "5"
});

// 将字符串转换为数字用于 el-input-number
const retryTimesNumber = computed({
  get: () => parseInt(localValue.value.retryTimes) || 3,
  set: (val: number) => {
    localValue.value.retryTimes = String(val);
  }
});

const retryIntervalNumber = computed({
  get: () => parseInt(localValue.value.retryInterval) || 5,
  set: (val: number) => {
    localValue.value.retryInterval = String(val);
  }
});

const handleRetryTimesChange = (val: number | undefined) => {
  if (val !== undefined) {
    localValue.value.retryTimes = String(val);
  }
};

const handleRetryIntervalChange = (val: number | undefined) => {
  if (val !== undefined) {
    localValue.value.retryInterval = String(val);
  }
};

// 是否正在同步（防止循环更新）
const isSyncing = ref(false);

// 监听 props 变化
watch(
  () => props.modelValue,
  newValue => {
    if (isSyncing.value) return; // 防止循环更新

    isSyncing.value = true;
    localValue.value = {
      autoSubmit: newValue.autoSubmit ?? false,
      baidu: {
        enable: newValue.baidu?.enable ?? false,
        site: newValue.baidu?.site ?? "",
        token: newValue.baidu?.token ?? ""
      },
      bing: {
        enable: newValue.bing?.enable ?? false,
        apiKey: newValue.bing?.apiKey ?? "",
        siteURL: newValue.bing?.siteURL ?? ""
      },
      google: {
        enable: newValue.google?.enable ?? false,
        credential: newValue.google?.credential ?? ""
      },
      retryTimes: newValue.retryTimes ?? "3",
      retryInterval: newValue.retryInterval ?? "5"
    };
    setTimeout(() => {
      isSyncing.value = false;
    }, 0);
  },
  { deep: true }
);

// 监听本地值变化，向上传递
watch(
  localValue,
  newValue => {
    if (isSyncing.value) return; // 防止循环更新
    emit("update:modelValue", newValue);
  },
  { deep: true }
);

// 测试连接功能
const testConnection = async (engine: "baidu" | "bing" | "google") => {
  // 根据引擎设置loading状态
  const loadingRef =
    engine === "baidu"
      ? testingBaidu
      : engine === "bing"
        ? testingBing
        : testingGoogle;
  loadingRef.value = true;

  try {
    const result = await testSEOConnection(engine);

    if (result.code === 200) {
      const data = result.data;
      if (data.success) {
        ElMessage.success({
          message: `${getEngineName(engine)}连接测试成功！\n${data.message}`,
          duration: 3000
        });
      } else {
        ElMessage.warning({
          message: `${getEngineName(engine)}配置错误：\n${data.message}`,
          duration: 5000
        });
      }
    } else {
      ElMessage.error({
        message: `测试失败：${result.message || "未知错误"}`,
        duration: 3000
      });
    }
  } catch (error) {
    ElMessage.error({
      message: `测试连接时发生错误：${error}`,
      duration: 3000
    });
  } finally {
    loadingRef.value = false;
  }
};

const getEngineName = (engine: string) => {
  const names: Record<string, string> = {
    baidu: "百度",
    bing: "Bing",
    google: "Google"
  };
  return names[engine] || engine;
};
</script>

<style scoped lang="scss">
.seo-settings-form {
  .divider-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .sub-divider-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--anzhiyu-fontcolor);
  }

  .form-item-tip {
    font-size: 12px;
    color: var(--anzhiyu-secondtext);
    margin-top: 4px;
    line-height: 1.5;
  }

  :deep(.el-alert) {
    p {
      margin: 8px 0;
    }

    ul {
      margin: 8px 0;
      padding-left: 20px;

      li {
        margin: 4px 0;
      }
    }

    a {
      color: var(--anzhiyu-theme);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
