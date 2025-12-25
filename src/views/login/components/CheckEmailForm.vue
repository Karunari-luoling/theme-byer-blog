<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-18 14:09:22
 * @LastEditTime: 2025-11-30 10:53:28
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref, computed } from "vue";
import type { ElInput } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import MailFill from "@iconify-icons/ri/mail-fill";
import QqFill from "@iconify-icons/ri/qq-fill";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { IconifyIconOffline, IconifyIconOnline } from "@/components/ReIcon";

defineProps({
  loading: Boolean,
  email: String,
  enableRegistration: { type: Boolean, default: true }
});
const emit = defineEmits([
  "submit",
  "goToRegister",
  "update:email",
  "oauthLogin"
]);

const emailInputRef = ref<InstanceType<typeof ElInput>>();
const iconMap = {
  mail: useRenderIcon(MailFill),
  qq: useRenderIcon(QqFill)
};

// 从站点配置中获取OAuth配置
const siteConfigStore = useSiteConfigStore();
const oauthConfig = computed(() => siteConfigStore.siteConfig.oauth || {});

// 彩虹聚合登录的登录方式配置
const rainbowLoginMethods = computed(() => {
  if (!oauthConfig.value.rainbow?.enable) return [];
  const methods = oauthConfig.value.rainbow.login_methods || "";
  return methods
    .split(",")
    .map(m => m.trim())
    .filter(m => m);
});

// 登录方式显示配置
const loginMethodConfig: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  qq: { label: "QQ登录", color: "#12B7F5", icon: "ri:qq-fill" },
  wechat: { label: "微信登录", color: "#07C160", icon: "ri:wechat-fill" },
  alipay: { label: "支付宝登录", color: "#1677FF", icon: "ri:alipay-fill" },
  weibo: { label: "微博登录", color: "#E6162D", icon: "ri:weibo-fill" },
  baidu: { label: "百度登录", color: "#2932E1", icon: "ri:baidu-fill" },
  douyin: { label: "抖音登录", color: "#000000", icon: "ri:tiktok-fill" },
  github: { label: "GitHub登录", color: "#24292E", icon: "ri:github-fill" },
  gitee: {
    label: "Gitee登录",
    color: "#C71D23",
    icon: "ri:git-repository-fill"
  },
  dingtalk: { label: "钉钉登录", color: "#0089FF", icon: "ri:chat-3-fill" },
  huawei: { label: "华为登录", color: "#FF0000", icon: "ri:smartphone-fill" },
  xiaomi: { label: "小米登录", color: "#FF6700", icon: "ri:smartphone-fill" },
  google: { label: "Google登录", color: "#4285F4", icon: "ri:google-fill" },
  microsoft: {
    label: "Microsoft登录",
    color: "#00A4EF",
    icon: "ri:microsoft-fill"
  },
  facebook: {
    label: "Facebook登录",
    color: "#1877F2",
    icon: "ri:facebook-fill"
  },
  twitter: { label: "Twitter登录", color: "#1DA1F2", icon: "mdi:twitter" }
};

// 处理OAuth登录
const handleOAuthLogin = (provider: string, loginType?: string) => {
  emit("oauthLogin", provider, loginType);
};

defineExpose({ focus: () => emailInputRef.value?.focus() });
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-center text-[--anzhiyu-fontcolor]">
      登录你的账号
    </h2>
    <div class="mt-6">
      <el-form-item prop="email">
        <el-input
          ref="emailInputRef"
          :model-value="email"
          placeholder="电子邮箱"
          :prefix-icon="iconMap.mail"
          autocomplete="username"
          @update:model-value="emit('update:email', $event)"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          v-ripple
          class="w-full overflow-hidden"
          type="primary"
          :loading="loading"
          @click="emit('submit')"
          >下一步
        </el-button>
      </el-form-item>
      <div v-if="enableRegistration" class="mt-6 text-sm text-center">
        <span class="text-gray-600">还没有账号？</span>
        <a
          href="#"
          class="font-medium text-blue-600 hover:text-blue-500"
          @click.prevent="emit('goToRegister')"
          >立即注册</a
        >
      </div>

      <!-- 第三方登录分隔线 -->
      <div
        v-if="
          oauthConfig.qq?.enable ||
          oauthConfig.wechat?.enable ||
          oauthConfig.logto?.enable ||
          oauthConfig.oidc?.enable ||
          rainbowLoginMethods.length > 0
        "
        class="relative my-6"
      >
        <div class="absolute inset-0 flex items-center">
          <div class="w-full h-[1px] bg-[var(--anzhiyu-border-color)]" />
        </div>
        <div class="relative flex justify-center text-[12px]">
          <span
            class="px-3 bg-[--anzhiyu-card-bg] text-[var(--anzhiyu-fontcolor)] opacity-60"
            >或使用以下方式登录</span
          >
        </div>
      </div>

      <!-- 第三方登录按钮 -->
      <div class="space-y-2">
        <!-- 微信登录 -->
        <el-button
          v-if="oauthConfig.wechat?.enable"
          class="w-full !bg-[#07C160] !border-[#07C160] hover:!bg-[#06AD56] hover:!border-[#06AD56]"
          type="primary"
          @click="handleOAuthLogin('wechat')"
        >
          <svg class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.006-.27-.006-.405-.017zm-2.293 3.12c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.534 0 .968.44.968.982a.976.976 0 0 1-.968.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"
            />
          </svg>
          微信登录
        </el-button>

        <!-- QQ登录 -->
        <el-button
          v-if="oauthConfig.qq?.enable"
          class="w-full !bg-[#12B7F5] !border-[#12B7F5] hover:!bg-[#0FA6E3] hover:!border-[#0FA6E3]"
          type="primary"
          @click="handleOAuthLogin('qq')"
        >
          <component :is="iconMap.qq" class="w-6 h-6 mr-2" />
          QQ登录
        </el-button>

        <!-- Logto登录 -->
        <el-button
          v-if="oauthConfig.logto?.enable"
          class="w-full"
          @click="handleOAuthLogin('logto')"
        >
          <svg
            class="w-6 h-6 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
            />
          </svg>
          {{ oauthConfig.logto?.display_name || "SSO登录" }}
        </el-button>

        <!-- OIDC登录 -->
        <el-button
          v-if="oauthConfig.oidc?.enable"
          class="w-full !ml-0"
          @click="handleOAuthLogin('oidc')"
        >
          <svg
            class="w-6 h-6 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
          {{ oauthConfig.oidc?.display_name || "企业登录" }}
        </el-button>

        <!-- 彩虹聚合登录 -->
        <template v-if="rainbowLoginMethods.length > 0">
          <el-button
            v-for="method in rainbowLoginMethods"
            :key="method"
            class="w-full !ml-0"
            :style="{
              backgroundColor: loginMethodConfig[method]?.color || '#409EFF',
              borderColor: loginMethodConfig[method]?.color || '#409EFF',
              color: '#FFFFFF'
            }"
            @click="handleOAuthLogin('rainbow', method)"
          >
            <!-- 钉钉图标 SVG -->
            <svg
              v-if="method === 'dingtalk'"
              class="w-6 h-6 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
            <!-- 华为图标 SVG -->
            <svg
              v-else-if="method === 'huawei'"
              class="w-6 h-6 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
              />
            </svg>
            <!-- 其他登录方式使用 Iconify 图标（优先使用在线图标以确保显示） -->
            <IconifyIconOnline
              v-else-if="loginMethodConfig[method]?.icon"
              :icon="loginMethodConfig[method].icon"
              class="w-6 h-6 mr-2"
            />
            <!-- 默认图标 -->
            <svg
              v-else
              class="w-6 h-6 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
            {{ loginMethodConfig[method]?.label || method }}
          </el-button>
        </template>
      </div>
    </div>
  </div>
</template>
