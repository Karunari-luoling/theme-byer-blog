<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { handleOAuthCallback } from "@/api/oauth";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter } from "@/router/utils";
import { message } from "@/utils/message";
import { Loading, CircleClose, SuccessFilled } from "@element-plus/icons-vue";

defineOptions({ name: "OAuthCallback" });

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const errorMsg = ref("");
let isBindingFlow = false; // 声明在外层作用域

onMounted(async () => {
  try {
    // 从URL获取授权码和state
    const code = route.query.code as string;
    const state = route.query.state as string;
    const type = route.query.type as string; // 彩虹聚合登录会返回type参数

    // 尝试获取绑定流程的参数
    const bindState = sessionStorage.getItem("oauth_bind_state");
    const bindProvider = sessionStorage.getItem("oauth_bind_provider");
    const bindLoginType = sessionStorage.getItem("oauth_bind_login_type");

    // 尝试获取登录流程的参数
    const loginState = sessionStorage.getItem("oauth_state");
    const loginProvider = sessionStorage.getItem("oauth_provider");

    let provider: string;
    let isRainbowLogin = false;

    console.log("[OAuth Debug] 回调参数:", {
      routeName: route.name,
      code: code?.substring(0, 10) + "...",
      state: state?.substring(0, 10) + "...",
      type,
      loginProvider,
      bindProvider
    });

    // 判断是否为彩虹聚合登录（通过路由名称或type参数）
    if (
      route.name === "RainbowCallback" ||
      (type && loginProvider === "rainbow")
    ) {
      provider = "rainbow";
      isRainbowLogin = true;
      isBindingFlow = bindProvider === "rainbow";

      console.log(
        "[OAuth Debug] 识别为彩虹聚合登录, isBindingFlow:",
        isBindingFlow
      );

      // 彩虹聚合登录只需要code，不需要state验证
      if (!code) {
        throw new Error("缺少必要的参数");
      }
    } else {
      // 其他OAuth登录需要code和state
      if (!code || !state) {
        throw new Error("缺少必要的参数");
      }

      // 判断是绑定流程还是登录流程
      if (bindState === state && bindProvider) {
        // 绑定流程
        provider = bindProvider;
        isBindingFlow = true;
      } else if (loginState === state && loginProvider) {
        // 登录流程
        provider = loginProvider;
        isBindingFlow = false;
      } else {
        // 都不匹配，尝试从路由名称和参数推断
        if (route.name === "QQCallback") {
          provider = "qq";
          // 如果有绑定相关参数，优先判断为绑定流程
          if (bindProvider === "qq") {
            isBindingFlow = true;
          }
        } else if (route.name === "OpenIDCallback") {
          // Logto和OIDC使用 /callback/openid/:connector
          const connector = route.params.connector as string;
          if (connector === "0") {
            provider = "logto";
          } else if (connector === "2") {
            provider = "oidc";
          } else {
            throw new Error(`未知的OpenID连接器: ${connector}`);
          }
          // 检查是否为绑定流程
          if (bindProvider === provider) {
            isBindingFlow = true;
          }
        } else {
          throw new Error("无法识别OAuth流程类型");
        }
      }

      // 验证state（如果有保存的state）
      const expectedState = isBindingFlow ? bindState : loginState;
      if (expectedState && state !== expectedState) {
        throw new Error("状态验证失败，可能存在安全风险");
      }
    }

    if (isBindingFlow) {
      // 绑定流程：调用绑定API
      const { bindOAuthAccount } = await import("@/api/oauth");
      // 彩虹聚合登录使用空字符串作为state，但需要传递type参数
      const stateParam = isRainbowLogin ? "" : state;
      // 绑定流程中的type可能来自URL参数或sessionStorage
      const typeParam = isRainbowLogin ? type || bindLoginType : undefined;
      const res = await bindOAuthAccount(provider, code, stateParam, typeParam);

      if (res.code === 200) {
        message("绑定成功", { type: "success" });
        // 跳转回用户中心
        await router.replace("/user-center");
      } else {
        throw new Error(res.message || "绑定失败");
      }
    } else {
      // 登录流程：调用登录回调API
      // 彩虹聚合登录使用空字符串作为state，但需要传递type参数
      const stateParam = isRainbowLogin ? "" : state;
      const typeParam = isRainbowLogin ? type : undefined;

      console.log("[OAuth Debug] 调用登录回调API:", {
        provider,
        hasCode: !!code,
        hasState: !!stateParam,
        type: typeParam,
        isRainbowLogin
      });

      const res = await handleOAuthCallback(
        provider,
        code,
        stateParam,
        typeParam
      );

      if (res.code === 200 && res.data) {
        // 如果需要绑定账号
        if (res.data.need_binding) {
          message("该账号未绑定，请先绑定或注册账号", { type: "warning" });
          // TODO: 跳转到账号绑定页面
          await router.push("/login");
          return;
        }

        // 保存token和用户信息到store（使用与正常登录相同的方式）
        const userStore = useUserStoreHook();
        const { setToken } = await import("@/utils/auth");

        if (res.data.token && res.data.refresh_token) {
          // 先保存基础token信息（不包含完整userInfo）
          const basicLoginData = {
            accessToken: res.data.token,
            refreshToken: res.data.refresh_token,
            expires:
              res.data.expires_at || Date.now() + 7 * 24 * 60 * 60 * 1000,
            userInfo: null as any,
            roles: []
          };

          setToken(basicLoginData);

          // 获取完整的用户信息并更新store
          try {
            const userInfo = await userStore.fetchUserInfo();

            // 构造完整的登录数据并再次保存（包含userInfo）
            const completeLoginData = {
              accessToken: res.data.token,
              refreshToken: res.data.refresh_token,
              expires:
                res.data.expires_at || Date.now() + 7 * 24 * 60 * 60 * 1000,
              userInfo: userInfo,
              roles: userInfo?.userGroupID ? [String(userInfo.userGroupID)] : []
            };

            // 再次保存完整的登录数据，确保userInfo和roles都被正确保存
            setToken(completeLoginData);

            message(res.data.is_new_user ? "注册并登录成功！" : "登录成功！", {
              type: "success"
            });
          } catch (err) {
            console.error("获取用户信息失败:", err);
            throw new Error("获取用户信息失败");
          }

          // 根据登录来源决定后续操作
          const loginSource = sessionStorage.getItem("oauth_source");
          const returnUrl = sessionStorage.getItem("oauth_return_url");

          if (loginSource === "dialog" && returnUrl) {
            // 弹窗登录：跳转回原页面（可能需要初始化路由）
            // 如果是管理员，需要初始化路由
            const isAdmin = userStore.roles.includes("1");
            if (isAdmin) {
              await initRouter();
            }

            // 跳转回原来的页面
            window.location.href = returnUrl;
          } else {
            // 页面登录：等待路由初始化并根据角色跳转
            await initRouter();

            // 根据用户角色决定跳转位置
            const isAdmin = userStore.roles.includes("1");

            if (isAdmin) {
              await router.replace("/admin/dashboard");
            } else {
              await router.replace("/");
            }
          }
        } else {
          throw new Error("未收到登录令牌");
        }
      } else {
        throw new Error(res.message || "登录失败");
      }
    }
  } catch (error: any) {
    console.error("OAuth回调处理失败:", error);
    errorMsg.value = error.message || "登录失败，请重试";
    message(errorMsg.value, { type: "error" });

    // 3秒后跳转回登录页
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  } finally {
    // 清理sessionStorage - 根据流程类型清理对应的键
    if (isBindingFlow) {
      sessionStorage.removeItem("oauth_bind_state");
      sessionStorage.removeItem("oauth_bind_provider");
      sessionStorage.removeItem("oauth_bind_login_type");
    } else {
      sessionStorage.removeItem("oauth_state");
      sessionStorage.removeItem("oauth_provider");
      sessionStorage.removeItem("oauth_login_type");
      sessionStorage.removeItem("oauth_source");
      sessionStorage.removeItem("oauth_return_url");
    }
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex items-center justify-center w-full min-h-screen">
    <div
      class="w-full max-w-sm p-8 space-y-6 bg-[--anzhiyu-card-bg] border border-[var(--anzhiyu-border-color)] rounded-xl shadow-sm mx-4"
    >
      <div class="text-center">
        <div v-if="loading" class="space-y-4">
          <el-icon class="text-6xl text-blue-500 loading-icon" :size="60">
            <Loading />
          </el-icon>
          <h2 class="text-xl font-semibold text-[--anzhiyu-fontcolor]">
            正在处理登录...
          </h2>
          <p class="text-sm text-gray-500">请稍候,我们正在完成您的登录</p>
        </div>

        <div v-else-if="errorMsg" class="space-y-4">
          <el-icon class="text-6xl text-red-500" :size="60">
            <CircleClose />
          </el-icon>
          <h2 class="text-xl font-semibold text-[--anzhiyu-fontcolor]">
            登录失败
          </h2>
          <p class="text-sm text-red-500">{{ errorMsg }}</p>
          <p class="text-xs text-gray-400">将在3秒后自动跳转到登录页面...</p>
        </div>

        <div v-else class="space-y-4">
          <el-icon class="text-6xl text-green-500" :size="60">
            <SuccessFilled />
          </el-icon>
          <h2 class="text-xl font-semibold text-[--anzhiyu-fontcolor]">
            登录成功
          </h2>
          <p class="text-sm text-gray-500">正在跳转...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 添加旋转动画 */
.loading-icon {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
