<!--
 * @Description: OAuth第三方账号绑定管理组件
 * @Author: 安知鱼
 * @Date: 2025-10-16
 * @LastEditTime: 2025-11-16 22:14:12
 * @LastEditors: 安知鱼
-->
<template>
  <div class="oauth-binding-card" :class="{ embedded }">
    <div v-if="!embedded" class="card-header">
      <h3 class="card-title">第三方账号绑定</h3>
      <p class="card-desc">绑定第三方账号后，可以使用第三方账号快速登录</p>
    </div>

    <div class="binding-list">
      <div
        v-for="provider in availableProviders"
        :key="provider.key"
        class="binding-item"
        :class="{ bound: isProviderBound(provider.key) }"
      >
        <div class="provider-info">
          <div class="provider-icon" :style="{ background: provider.color }">
            <IconifyIconOffline :icon="provider.icon" />
          </div>
          <div class="provider-details">
            <h4 class="provider-name">{{ provider.name }}</h4>
            <p v-if="isProviderBound(provider.key)" class="binding-status">
              已绑定
              <span v-if="getBindingInfo(provider.key)?.user_info?.nickname">
                ({{ getBindingInfo(provider.key).user_info.nickname }})
              </span>
            </p>
            <p v-else class="binding-status unbind">未绑定</p>
          </div>
        </div>

        <div class="provider-actions">
          <el-button
            v-if="!isProviderBound(provider.key)"
            type="primary"
            size="small"
            :loading="bindingLoading === provider.key"
            @click="handleBind(provider.key)"
          >
            绑定
          </el-button>
          <el-button
            v-else
            type="danger"
            size="small"
            plain
            :loading="unbindingLoading === provider.key"
            @click="handleUnbind(provider.key)"
          >
            解绑
          </el-button>
        </div>
      </div>

      <div v-if="availableProviders.length === 0" class="empty-state">
        <IconifyIconOffline icon="ri:link-m" />
        <p>暂无可用的第三方登录方式</p>
      </div>
    </div>

    <!-- 解绑确认弹窗 -->
    <AnDialog
      v-model="unbindDialogVisible"
      title="确认解绑"
      width="400px"
      :show-footer="true"
      confirm-text="确定"
      cancel-text="取消"
      :confirm-loading="unbindConfirmLoading"
      @confirm="confirmUnbind"
    >
      <div class="unbind-dialog-content">
        <IconifyIconOffline icon="ri:error-warning-line" class="warning-icon" />
        <p>解绑后将无法使用该第三方账号登录，确定要解绑吗？</p>
      </div>
    </AnDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import {
  getUserBindings,
  getBindAuthorizeUrl,
  bindOAuthAccount,
  unbindOAuthAccount,
  type OAuthBindingInfo
} from "@/api/oauth";
import { message } from "@/utils/message";
import AnDialog from "@/components/AnDialog/index.vue";

defineOptions({
  name: "OAuthBindingCard"
});

interface Props {
  // 嵌入模式：在弹窗中使用时不显示外层卡片样式
  embedded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  embedded: false
});

const emit = defineEmits<{
  (e: "bind-wechat"): void;
}>();

const siteConfigStore = useSiteConfigStore();
const bindings = ref<OAuthBindingInfo[]>([]);
const loading = ref(false);
const bindingLoading = ref<string | null>(null);
const unbindingLoading = ref<string | null>(null);

// 解绑弹窗相关
const unbindDialogVisible = ref(false);
const unbindConfirmLoading = ref(false);
const pendingUnbindProvider = ref<string | null>(null);

// 可用的OAuth提供商配置
interface ProviderConfig {
  key: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  loginType?: string;
}

// 登录方式显示配置
const loginMethodConfig: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  qq: {
    label: "QQ",
    color: "#12b7f5",
    icon: "ri:qq-fill"
  },
  wechat: {
    label: "微信",
    color: "#07c160",
    icon: "ri:wechat-fill"
  },
  alipay: {
    label: "支付宝",
    color: "#1677ff",
    icon: "ri:alipay-fill"
  },
  weibo: {
    label: "微博",
    color: "#e6162d",
    icon: "ri:weibo-fill"
  },
  baidu: {
    label: "百度",
    color: "#2932e1",
    icon: "ri:baidu-fill"
  },
  douyin: {
    label: "抖音",
    color: "#000000",
    icon: "ri:tiktok-fill"
  },
  github: {
    label: "GitHub",
    color: "#24292e",
    icon: "ri:github-fill"
  },
  gitee: {
    label: "Gitee",
    color: "#c71d23",
    icon: "ri:git-repository-fill"
  }
};

// 获取OAuth配置
const oauthConfig = computed(() => siteConfigStore.siteConfig.oauth || {});

// 可用的提供商列表
const availableProviders = computed<ProviderConfig[]>(() => {
  const providers: ProviderConfig[] = [];

  // QQ登录
  if (oauthConfig.value.qq?.enable) {
    providers.push({
      key: "qq",
      name: "QQ",
      icon: "ri:qq-fill",
      color: "#12b7f5",
      enabled: true
    });
  }

  // 微信登录 - 使用二维码绑定
  if (oauthConfig.value.wechat?.enable) {
    providers.push({
      key: "wechat",
      name: "微信",
      icon: "ri:wechat-fill",
      color: "#07c160",
      enabled: true
    });
  }

  // Logto
  if (oauthConfig.value.logto?.enable) {
    providers.push({
      key: "logto",
      name: oauthConfig.value.logto.display_name || "SSO登录",
      icon: "ri:shield-user-fill",
      color: "#7c3aed",
      enabled: true
    });
  }

  // OIDC
  if (oauthConfig.value.oidc?.enable) {
    providers.push({
      key: "oidc",
      name: oauthConfig.value.oidc.display_name || "企业登录",
      icon: "ri:building-fill",
      color: "#f59e0b",
      enabled: true
    });
  }

  // 彩虹聚合登录 - 为每种登录方式创建一个单独的提供商项
  if (oauthConfig.value.rainbow?.enable) {
    const methods = oauthConfig.value.rainbow.login_methods || "";
    const methodList = methods
      .split(",")
      .map(m => m.trim())
      .filter(m => m);

    for (const method of methodList) {
      const config = loginMethodConfig[method];
      if (config) {
        providers.push({
          key: `rainbow_${method}`,
          name: config.label,
          icon: config.icon,
          color: config.color,
          enabled: true,
          loginType: method // 保存彩虹聚合登录的type
        });
      }
    }
  }

  return providers;
});

// 检查提供商是否已绑定
const isProviderBound = (providerKey: string): boolean => {
  // 彩虹聚合登录的key格式为 "rainbow_qq"，需要特殊处理
  if (providerKey.startsWith("rainbow_")) {
    return bindings.value.some(b => b.provider === "rainbow");
  }
  return bindings.value.some(b => b.provider === providerKey);
};

// 获取绑定信息
const getBindingInfo = (providerKey: string): OAuthBindingInfo | undefined => {
  // 彩虹聚合登录的key格式为 "rainbow_qq"，需要特殊处理
  if (providerKey.startsWith("rainbow_")) {
    return bindings.value.find(b => b.provider === "rainbow");
  }
  return bindings.value.find(b => b.provider === providerKey);
};

// 加载绑定列表
const loadBindings = async () => {
  try {
    loading.value = true;
    const res = await getUserBindings();
    if (res.code === 200) {
      bindings.value = res.data || [];
    }
  } catch (err: any) {
    console.error("获取绑定列表失败:", err);
    message(err?.message || "获取绑定列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 处理绑定
const handleBind = async (providerKey: string) => {
  try {
    // 微信使用二维码绑定
    if (providerKey === "wechat") {
      emit("bind-wechat");
      return;
    }

    bindingLoading.value = providerKey;

    // 获取提供商配置
    const providerConfig = availableProviders.value.find(
      p => p.key === providerKey
    );
    if (!providerConfig) {
      message("找不到提供商配置", { type: "error" });
      return;
    }

    // 判断是否为彩虹聚合登录
    const isRainbow = providerKey.startsWith("rainbow_");
    const provider = isRainbow ? "rainbow" : providerKey;
    const loginType = providerConfig.loginType;

    // 获取授权URL - 使用统一的回调路径
    const redirectUrl = `${window.location.origin}/callback/${provider}`;
    const res = await getBindAuthorizeUrl(provider, redirectUrl, loginType);

    if (res.code === 200 && res.data) {
      // 保存state和provider到sessionStorage
      // 彩虹聚合登录返回的是url字段,其他OAuth返回的是authorize_url字段
      const authorizeUrl =
        (res.data as any).url || (res.data as any).authorize_url;

      if (!authorizeUrl) {
        message("获取授权URL失败", { type: "error" });
        return;
      }

      // 彩虹聚合登录不需要state验证
      if (!isRainbow && (res.data as any).state) {
        sessionStorage.setItem("oauth_bind_state", (res.data as any).state);
      }
      sessionStorage.setItem("oauth_bind_provider", provider);

      // 保存登录类型（彩虹聚合登录需要）
      if (loginType) {
        sessionStorage.setItem("oauth_bind_login_type", loginType);
      }

      // 跳转到授权页面
      window.location.href = authorizeUrl;
    } else {
      message(res.message || "获取授权URL失败", { type: "error" });
    }
  } catch (err: any) {
    message(err?.message || "绑定失败", { type: "error" });
  } finally {
    bindingLoading.value = null;
  }
};

// 处理解绑 - 打开确认弹窗
const handleUnbind = (providerKey: string) => {
  pendingUnbindProvider.value = providerKey;
  unbindDialogVisible.value = true;
};

// 确认解绑
const confirmUnbind = async () => {
  if (!pendingUnbindProvider.value) return;

  try {
    // 判断是否为彩虹聚合登录
    const provider = pendingUnbindProvider.value.startsWith("rainbow_")
      ? "rainbow"
      : pendingUnbindProvider.value;

    unbindConfirmLoading.value = true;
    unbindingLoading.value = pendingUnbindProvider.value;
    const res = await unbindOAuthAccount(provider);

    if (res.code === 200) {
      message("解绑成功", { type: "success" });
      unbindDialogVisible.value = false;
      await loadBindings();
    } else {
      message(res.message || "解绑失败", { type: "error" });
    }
  } catch (err: any) {
    message(err?.message || "解绑失败", { type: "error" });
  } finally {
    unbindConfirmLoading.value = false;
    unbindingLoading.value = null;
    pendingUnbindProvider.value = null;
  }
};

// 注意：绑定回调现在由 /callback/qq 路由统一处理，不再在这里处理

onMounted(async () => {
  await loadBindings();
});
</script>

<style scoped lang="scss">
.oauth-binding-card {
  padding: 2rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 20px;
  transition: all 0.3s;

  // 嵌入模式：在弹窗中使用时不显示外层卡片样式
  &.embedded {
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;
  }
}

.card-header {
  margin-bottom: 1.5rem;

  .card-title {
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .card-desc {
    font-size: 0.9rem;
    color: var(--anzhiyu-secondtext);
  }
}

.binding-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.binding-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  background: var(--anzhiyu-background);
  border: 2px solid transparent;
  border-radius: 16px;
  transition: all 0.3s;

  &:hover {
    border-color: var(--anzhiyu-main);
    box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
  }

  &.bound {
    background: linear-gradient(
      135deg,
      rgb(var(--anzhiyu-main-rgb) / 5%) 0%,
      rgb(var(--anzhiyu-theme-rgb) / 5%) 100%
    );
    border-color: var(--anzhiyu-main);
  }
}

.provider-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.provider-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  color: white;
  border-radius: 12px;

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

.provider-details {
  .provider-name {
    margin-bottom: 0.25rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .binding-status {
    font-size: 0.85rem;
    color: var(--anzhiyu-main);

    &.unbind {
      color: var(--anzhiyu-secondtext);
    }

    span {
      margin-left: 0.25rem;
      color: var(--anzhiyu-secondtext);
    }
  }
}

.provider-actions {
  :deep(.el-button) {
    min-width: 80px;
  }
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--anzhiyu-secondtext);

  :deep(svg) {
    width: 3rem;
    height: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    font-size: 0.95rem;
  }
}

// 解绑弹窗内容
.unbind-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  padding: 1rem 0;
  text-align: center;

  .warning-icon {
    width: 3rem;
    height: 3rem;
    color: #f59e0b;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    color: var(--anzhiyu-fontcolor);
  }
}

// 移动端适配
@media (width <= 768px) {
  .oauth-binding-card {
    padding: 1.5rem;
  }

  .binding-item {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .provider-actions {
    width: 100%;

    :deep(.el-button) {
      width: 100%;
    }
  }
}
</style>
