<template>
  <div class="header-right">
    <el-tooltip
      v-if="navConfig?.travelling === true && isHomePage && !isMobile"
      content="随机前往一个开往项目网站"
      placement="top"
      :show-arrow="false"
      :offset="8"
    >
      <a
        class="nav-button"
        href="https://www.travellings.cn/go.html"
        aria-label="开往-随机前往一个开往项目网站"
        @click.prevent="handleTravelClick"
      >
        <i class="anzhiyufont anzhiyu-icon-train" />
      </a>
    </el-tooltip>
    <!-- 通知图标 -->
    <el-tooltip
      v-if="isLoggedIn && !isMobile"
      content="通知"
      placement="top"
      :show-arrow="false"
      :offset="8"
    >
      <a
        class="nav-button notification-button"
        @click="handleViewAllNotifications"
      >
        <IconifyIconOffline
          icon="ri:notification-2-fill"
          class="w-[1.25rem] h-[1.25rem]"
        />
        <span v-if="unreadNotificationCount > 0" class="notification-dot" />
      </a>
    </el-tooltip>
    <!-- 用户中心/登录注册 -->
    <div
      v-if="!isLoggedIn"
      class="user-dropdown-wrapper"
      @mouseenter="showUserDropdown = true"
      @mouseleave="showUserDropdown = false"
    >
      <div class="!ml-0 nav-button">
        <IconifyIconOffline icon="ri:user-fill" class="w-[1.4rem] h-[1.4rem]" />
      </div>
      <!-- 桥接区域，填补按钮和下拉菜单之间的空隙 -->
      <div v-if="showUserDropdown" class="dropdown-bridge" />
      <Transition name="dropdown-fade">
        <div v-show="showUserDropdown" class="user-dropdown-menu">
          <div
            class="dropdown-item"
            @click="handleDropdownItemClick('check-email')"
          >
            <i class="anzhiyufont anzhiyu-icon-sign-in-alt" />
            <span>登录</span>
          </div>
          <div
            v-if="enableRegistration"
            class="dropdown-item"
            @click="handleDropdownItemClick('register-form')"
          >
            <i class="anzhiyufont anzhiyu-icon-user-plus" />
            <span>注册</span>
          </div>
        </div>
      </Transition>
    </div>
    <el-popover
      v-else-if="isLoggedIn"
      :visible="notificationPopoverVisible"
      placement="bottom-end"
      :width="320"
      trigger="click"
      popper-class="user-popover"
      :popper-options="{
        strategy: 'fixed',
        modifiers: [{ name: 'offset', options: { offset: [0, 8] } }]
      }"
      :teleported="true"
      @hide="notificationPopoverVisible = false"
    >
      <template #reference>
        <a
          class="nav-button user-center-button"
          title="用户中心"
          @click.stop="notificationPopoverVisible = !notificationPopoverVisible"
        >
          <IconifyIconOffline
            icon="ri:user-fill"
            class="w-[1.4rem] h-[1.4rem]"
          />
        </a>
      </template>

      <div class="user-panel">
        <!-- 用户信息头部 -->
        <div class="panel-header">
          <img :src="userAvatar" class="user-avatar" alt="头像" />
          <div class="user-info">
            <div class="user-name">
              {{ userStore.nickname || userStore.username }}
            </div>
            <div class="user-desc">{{ userStore.email }}</div>
          </div>
        </div>

        <!-- 功能网格 -->
        <div class="panel-grid">
          <div class="grid-item" @click="handleGoToUserCenter">
            <div class="grid-icon" style="background: #e8f4ff; color: #409eff">
              <IconifyIconOffline icon="ri:user-3-line" />
            </div>
            <span>用户中心</span>
          </div>
          <div class="grid-item" @click="handleViewAllNotifications">
            <div class="grid-icon" style="background: #fff8e8; color: #e6a23c">
              <IconifyIconOffline icon="ri:notification-2-line" />
            </div>
            <span>全部通知</span>
          </div>
          <div
            v-if="isAdmin"
            class="grid-item"
            @click="handleGoToPostManagement"
          >
            <div class="grid-icon" style="background: #e8fff0; color: #67c23a">
              <IconifyIconOffline icon="ri:article-line" />
            </div>
            <span>发布文章</span>
          </div>
          <div v-if="isAdmin" class="grid-item" @click="handleGoToAdmin">
            <div class="grid-icon" style="background: #f0e8ff; color: #9c27b0">
              <IconifyIconOffline icon="ri:settings-3-line" />
            </div>
            <span>后台管理</span>
          </div>
        </div>
      </div>
    </el-popover>
    <el-tooltip
      v-if="!isMobile"
      content="随机前往一个文章"
      placement="top"
      :show-arrow="false"
      :offset="8"
    >
      <div
        class="nav-button"
        @click.prevent="articleStore.navigateToRandomArticle()"
      >
        <i class="anzhiyufont anzhiyu-icon-dice" />
      </div>
    </el-tooltip>
    <el-tooltip content="搜索" placement="top" :show-arrow="false" :offset="8">
      <a
        class="nav-button"
        href="/search"
        aria-label="搜索"
        @click.prevent="handleSearchClick"
      >
        <i class="anzhiyufont anzhiyu-icon-magnifying-glass" />
      </a>
    </el-tooltip>

    <input
      id="center-console"
      type="checkbox"
      :checked="isConsoleOpen"
      @change="appStore.toggleConsole()"
    />
    <label class="widget" for="center-console" title="中控台">
      <i class="left" />
      <i class="widget center" />
      <i class="widget right" />
    </label>

    <Console />

    <div
      class="nav-button nav-totop"
      :class="{ 'is-visible': showToTopButton, long: isFooterVisible }"
      @click="scrollToTop"
    >
      <div class="totopbtn">
        <i class="anzhiyufont anzhiyu-icon-arrow-up" />
        <span class="percent">{{ toTopText }}</span>
      </div>
    </div>

    <!-- 移动端 AI 助手按钮 -->
    <div
      v-if="isMobile && aiAssistantEnabled"
      class="nav-button mobile-ai-button"
      title="AI 助手"
      @click="handleOpenAIAssistant"
    >
      <IconifyIconOnline icon="ri:robot-2-fill" class="w-[1.2rem] h-[1.2rem]" />
    </div>

    <div id="toggle-menu" @click="toggleMobileMenu">
      <div class="site-page">
        <i class="anzhiyufont anzhiyu-icon-bars" />
      </div>
    </div>

    <!-- 登录弹窗 -->
    <LoginDialog
      v-model="showLoginDialog"
      :initial-step="loginDialogInitialStep"
      :hide-theme-switch="true"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  nextTick,
  onMounted,
  onUnmounted,
  watch,
  type PropType
} from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useSnackbar } from "@/composables/useSnackbar";
import { useArticleStore } from "@/store/modules/articleStore";
import { useAppStore } from "@/store/modules/app";
import { useUserStoreHook } from "@/store/modules/user";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import Console from "./console.vue";
import LoginDialog from "@/components/LoginDialog/index.vue";
import { ElMessage } from "element-plus";
import {
  getUnreadCountApi,
  listNotificationsApi,
  markAsReadApi,
  markAllAsReadApi,
  type Notification
} from "@/api/notification";
import {
  Bell,
  ShoppingCart,
  Medal,
  ChatDotRound,
  Comment
} from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@/components/ReIcon";

defineOptions({
  name: "HeaderRight"
});

const props = defineProps({
  navConfig: {
    type: Object as PropType<any>,
    required: false
  },
  isTransparent: {
    type: Boolean,
    default: true
  },
  scrollPercent: {
    type: Number,
    default: 0
  },
  isFooterVisible: {
    type: Boolean,
    default: false
  }
});

const route = useRoute();
const router = useRouter();
const articleStore = useArticleStore();
const appStore = useAppStore();
const userStore = useUserStoreHook();
const siteConfigStore = useSiteConfigStore();
const { isConsoleOpen } = storeToRefs(appStore);
const { enableRegistration } = storeToRefs(siteConfigStore);
const { showSnackbar } = useSnackbar();

// 登录弹窗控制
const showLoginDialog = ref(false);
const loginDialogInitialStep = ref<"check-email" | "register-form">(
  "check-email"
);

// 用户下拉菜单控制
const showUserDropdown = ref(false);

// 通知相关
const unreadNotificationCount = ref(0);
const notifications = ref<Notification[]>([]);
const notificationLoading = ref(false);
const notificationPopoverVisible = ref(false);
const notificationPopoverRef = ref<HTMLElement | null>(null);
let notificationPollInterval: ReturnType<typeof setInterval> | null = null;

// 点击外部关闭通知面板
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  // 检查是否点击了 popover 内部或触发按钮
  const popoverEl = document.querySelector(".notification-popover");
  const triggerEl = document.querySelector(".user-center-button");

  if (popoverEl && popoverEl.contains(target)) return;
  if (triggerEl && triggerEl.contains(target)) return;

  notificationPopoverVisible.value = false;
};

// 监听 popover 显示状态，添加/移除点击外部监听
watch(notificationPopoverVisible, visible => {
  if (visible) {
    // 延迟添加监听器，避免立即触发
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
  } else {
    document.removeEventListener("click", handleClickOutside);
  }
});

// 判断是否在首页
const isHomePage = computed(() => route.path === "/");

// 移动端判断
const isMobile = ref(false);
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 检查用户是否已登录
const isLoggedIn = computed(() => {
  return !!userStore.username && userStore.roles.length > 0;
});

// 用户头像
const userAvatar = computed(() => {
  return (
    userStore.avatar ||
    `https://cravatar.cn/avatar/${userStore.email}?s=200&d=mp`
  );
});

// 检查是否为管理员
const isAdmin = computed(() => userStore.roles.includes("1"));

let travellingsTimer: ReturnType<typeof setTimeout> | null = null;
const handleTravelClick = () => {
  if (travellingsTimer) {
    clearTimeout(travellingsTimer);
  }
  const cancelAction = () => {
    if (travellingsTimer) {
      clearTimeout(travellingsTimer);
      showSnackbar("跳转已取消");
    }
  };
  showSnackbar(
    "即将跳转到「开往」项目的成员博客，不保证跳转网站的安全性和可用性",
    cancelAction,
    5000,
    "取消"
  );
  travellingsTimer = setTimeout(() => {
    window.open("https://www.travellings.cn/go.html", "_blank");
  }, 5000);
};

const showToTopButton = computed(() => !props.isTransparent);
const toTopText = computed(() => {
  if (props.isFooterVisible) {
    return "返回顶部";
  }
  return `${props.scrollPercent}`;
});
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

const handleSearchClick = () => {
  // 触发自定义事件来打开搜索框
  window.dispatchEvent(new CustomEvent("frontend-open-search"));
};

// AI 助手是否启用
const aiAssistantEnabled = computed(() => {
  const config = siteConfigStore.getSiteConfig;
  const configEnabled = config?.ai_assistant?.enable;
  return configEnabled === "true" || configEnabled === true;
});

// 打开 AI 助手
const handleOpenAIAssistant = () => {
  window.dispatchEvent(new CustomEvent("frontend-open-ai-assistant"));
};

// 打开登录弹窗
const openLoginDialog = (
  step: "check-email" | "register-form" = "check-email"
) => {
  loginDialogInitialStep.value = step;
  showLoginDialog.value = true;
};

// 处理下拉菜单项点击
const handleDropdownItemClick = (step: "check-email" | "register-form") => {
  showUserDropdown.value = false;
  openLoginDialog(step);
};

// 登录成功后的处理
const handleLoginSuccess = async () => {
  showLoginDialog.value = false;
  // 不再刷新整个页面，用户状态已经在 LoginDialog 中更新
  // 只需要等待一小段时间让状态传播，然后 UI 会自动响应
  await nextTick();
};

// 跳转到用户中心
const goToUserCenter = () => {
  router.push("/user-center");
};

// 获取未读通知数量
const fetchUnreadNotificationCount = async () => {
  if (!isLoggedIn.value) {
    // 如果未登录，确保停止轮询
    if (notificationPollInterval) {
      clearInterval(notificationPollInterval);
      notificationPollInterval = null;
    }
    return;
  }
  try {
    const res = await getUnreadCountApi();
    if (res.code === 200 && res.data) {
      unreadNotificationCount.value = res.data.count;
    }
  } catch (error: any) {
    // 如果是 401 错误，说明未授权，停止轮询
    if (error?.response?.status === 401 || error?.code === 401) {
      if (notificationPollInterval) {
        clearInterval(notificationPollInterval);
        notificationPollInterval = null;
      }
      unreadNotificationCount.value = 0;
    }
    // 其他错误静默失败
  }
};

// 获取通知列表
const fetchNotifications = async () => {
  notificationLoading.value = true;
  try {
    const res = await listNotificationsApi({
      page: 1,
      page_size: 10,
      unread_only: false
    });
    if (res.code === 200 && res.data) {
      notifications.value = res.data.list || [];
    }
  } catch (error) {
    console.error("获取通知失败:", error);
  } finally {
    notificationLoading.value = false;
  }
};

// 打开通知弹窗时加载通知
const handleNotificationPopoverShow = () => {
  notificationPopoverVisible.value = true;
  fetchNotifications();
};

// 标记为已读
const handleMarkAsRead = async (notification: Notification) => {
  if (notification.is_read) {
    if (notification.link) {
      router.push(notification.link);
    }
    return;
  }

  try {
    await markAsReadApi(notification.id);
    notification.is_read = true;
    unreadNotificationCount.value = Math.max(
      0,
      unreadNotificationCount.value - 1
    );

    if (notification.link) {
      router.push(notification.link);
    }
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

// 全部标记为已读
const handleMarkAllAsRead = async () => {
  try {
    await markAllAsReadApi();
    notifications.value.forEach(n => (n.is_read = true));
    unreadNotificationCount.value = 0;
    ElMessage.success("已全部标记为已读");
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

// 查看全部通知
const handleViewAllNotifications = () => {
  notificationPopoverVisible.value = false;
  window.open("/notifications", "_blank");
};

// 进入用户中心
const handleGoToUserCenter = () => {
  notificationPopoverVisible.value = false;
  window.open("/user-center", "_blank");
};

// 进入后台
const handleGoToAdmin = () => {
  notificationPopoverVisible.value = false;
  window.open("/admin/dashboard", "_blank");
};

// 发布文章
const handleGoToPostManagement = () => {
  notificationPopoverVisible.value = false;
  window.open("/admin/post-management", "_blank");
};

// 格式化通知时间
const formatNotificationTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString("zh-CN");
};

// 获取通知图标
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "PURCHASE":
      return ShoppingCart;
    case "MEMBERSHIP":
      return Medal;
    case "SUPPORT":
      return ChatDotRound;
    case "COMMENT":
      return Comment;
    default:
      return Bell;
  }
};

// 移动端菜单控制
const toggleMobileMenu = () => {
  // 触发自定义事件来切换移动端菜单
  window.dispatchEvent(new CustomEvent("toggle-mobile-menu"));
};

// 检查URL参数，激活成功后自动打开登录弹窗
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("openLogin") === "1") {
    // 移除URL参数，避免刷新时重复打开
    urlParams.delete("openLogin");
    const newUrl =
      window.location.pathname +
      (urlParams.toString() ? "?" + urlParams.toString() : "");
    window.history.replaceState({}, "", newUrl);

    // 打开登录弹窗
    nextTick(() => {
      openLoginDialog("check-email");
    });
  }

  // 初始化移动端判断
  checkMobile();
  window.addEventListener("resize", checkMobile);

  // 初始化通知功能
  if (isLoggedIn.value) {
    fetchUnreadNotificationCount();
    // 每30秒轮询一次
    notificationPollInterval = setInterval(fetchUnreadNotificationCount, 30000);
  }
});

// 监听登录状态变化，启动或停止通知轮询
watch(isLoggedIn, newVal => {
  if (newVal) {
    fetchUnreadNotificationCount();
    if (!notificationPollInterval) {
      notificationPollInterval = setInterval(
        fetchUnreadNotificationCount,
        30000
      );
    }
  } else {
    if (notificationPollInterval) {
      clearInterval(notificationPollInterval);
      notificationPollInterval = null;
    }
    unreadNotificationCount.value = 0;
    notifications.value = [];
  }
});

onUnmounted(() => {
  if (notificationPollInterval) {
    clearInterval(notificationPollInterval);
  }
  // 移除点击外部监听器
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("resize", checkMobile);
});
</script>

<style scoped lang="scss">
[data-theme="dark"]
  .header-right
  #center-console:checked
  + label:is(.widget, #center-console:checked + label.widget:hover)
  i {
  background: var(--anzhiyu-black) !important;
}

[data-theme="dark"] #center-console + label i {
  background: var(--anzhiyu-white) !important;
}

.header-right {
  --animation-on: cubic-bezier(0.6, 0.1, 0, 1);
  --animation-in: cubic-bezier(0.6, 0.2, 0.25, 1);
  --animation-ot: opacity 0.5s var(--animation-in) backwards,
    transform 1s var(--animation-in) backwards;
  --animation-otf: opacity 0.5s var(--animation-in) backwards,
    transform 1s var(--animation-in) backwards,
    filter 0.7s var(--animation-in) backwards;

  position: absolute;
  right: 0;
  z-index: 102;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  padding-right: 1.5rem;

  #center-console {
    display: none;
  }

  #center-console + label {
    --icon-size: 1.375rem;

    position: relative;
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--icon-size);
    height: var(--icon-size);
    margin-left: 1rem;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  #center-console + label:hover i.left {
    width: calc(var(--icon-size) / 2.5);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  #center-console + label:hover i.center {
    width: calc(var(--icon-size) / 2.5);
    filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";
    filter: alpha(opacity=50);
    opacity: 0.5;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  #center-console + label:hover i.right {
    width: calc(var(--icon-size) / 2.5);
    height: calc(var(--icon-size) / 1.15);
    transform: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  #center-console + label i {
    position: absolute;
    inset: 0;
    right: auto;
    width: calc(var(--icon-size) / 3);
    height: calc(var(--icon-size) / 3);
    margin: auto;
    background: var(--light-grey);
    border-radius: calc(var(--icon-size) * 0.15);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(calc(var(--icon-size) / 4));
  }

  #center-console + label i.left {
    width: 100%;
    transform: translateY(calc(var(--icon-size) / -4));
  }

  #center-console + label i.right {
    right: 0;
    left: auto;
    width: calc(var(--icon-size) / 2);
  }

  #center-console:checked + label {
    top: 0;
    right: 0;
    z-index: 99999;
  }

  #center-console:checked + label:hover::after {
    background: var(--anzhiyu-main) !important;
  }

  #center-console:checked + label::after {
    position: absolute;
    top: -6px;
    left: -6.3px;
    z-index: -1;
    display: block;
    width: 35px;
    height: 35px;
    content: "";
    background: var(--anzhiyu-fontcolor) !important;
    border-radius: 50px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  #center-console:checked
    + label:is(.widget, #center-console:checked + label.widget:hover)
    i {
    height: calc(var(--icon-size) / 4.5);
    background: var(--anzhiyu-white) !important;
  }

  #center-console:checked + label i.left {
    width: 100% !important;
    transform: rotate(-45deg) !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  #center-console:checked + label i.center {
    width: 0 !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  #center-console:checked + label i.right {
    width: 100% !important;
    transform: rotate(45deg) !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  #center-console + label i {
    background: var(--font-color);
  }

  .nav-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 35px;
    height: 35px;
    padding: 0;
    margin-left: 1rem;
    cursor: pointer;
    border-radius: 50px;
    transition: 0.3s;

    i {
      font-size: 1.2rem;
      font-weight: 700;
      transition: color 0.3s;
    }

    // 为 IconifyIconOffline 组件添加颜色过渡
    :deep(svg) {
      color: inherit;
      transition: color 0.3s;
    }

    &:not(.nav-totop):hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-lighttext);
    }

    &.notification-button {
      position: relative;

      .notification-dot {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 8px;
        height: 8px;
        background: #f56c6c;
        border-radius: 50%;
      }
    }

    &.user-center-button {
      :deep(.el-badge__content) {
        top: 2px;
        right: 2px;
      }

      :deep(.el-badge) {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  #toggle-menu {
    display: none;
    margin-left: 1rem;

    .site-page {
      i {
        font-size: 1.35rem;
      }
    }
  }

  .nav-totop {
    width: 0;
    margin-left: 0;
    transition: all 0.3s ease-in-out;
    transform: scale(0);
    transform-origin: right center;

    &.is-visible {
      width: 25px;
      margin-left: 1.5rem;
      opacity: 1;
      transform: scale(1);
    }

    &.is-visible.long {
      width: 80px;
      margin-left: 1rem;

      .totopbtn {
        width: 70px;
      }
    }

    .totopbtn {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 25px;
      height: 25px;
      color: var(--anzhiyu-card-bg);
      background: var(--anzhiyu-fontcolor);
      border-radius: 40px;
      transition: 0.3s;

      i,
      .percent {
        position: absolute;
        top: 50%;
        left: 50%;
        transition: all 0.3s;
        transform: translate(-50%, -50%);
      }

      i {
        opacity: 0;
      }

      .percent {
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        opacity: 1;
      }
    }

    &:not(.long):hover {
      .totopbtn {
        top: 0;
        right: 0;
        width: 35px;
        height: 35px;
        background: var(--anzhiyu-lighttext);

        i {
          color: var(--anzhiyu-card-bg);
          opacity: 1;
          transition: 0.3s;
        }
      }

      .totopbtn .percent {
        opacity: 0;
      }
    }

    &.long:hover {
      transform: scale(1);

      .totopbtn {
        background: var(--anzhiyu-lighttext);
      }

      .totopbtn i {
        opacity: 1;
      }

      .totopbtn .percent {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1.5);
      }
    }
  }
}

// 用户下拉菜单
.user-dropdown-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 1rem;
}

// 桥接区域，填补按钮和下拉菜单之间的空隙
.dropdown-bridge {
  position: absolute;
  top: 100%;
  left: 0;
  width: 140px;
  height: 8px;
  pointer-events: auto;
}

.user-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 9999;
  min-width: 140px;
  background: var(--anzhiyu-card-bg);
  backdrop-filter: saturate(180%) blur(20px);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);

  .dropdown-item {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 12px 18px;
    font-size: 14px;
    color: var(--anzhiyu-fontcolor);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    i {
      font-size: 16px;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    span {
      font-weight: 500;
    }

    &:hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);

      i {
        transform: scale(1.1);
      }
    }

    &:not(:last-child) {
      border-bottom: 1px solid var(--anzhiyu-card-border, rgb(0 0 0 / 5%));
    }

    &:first-child {
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
    }

    &:last-child {
      border-bottom-right-radius: 12px;
      border-bottom-left-radius: 12px;
    }
  }
}

// 下拉菜单动画
.dropdown-fade-enter-active {
  animation: dropdown-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-fade-leave-active {
  animation: dropdown-out 0.2s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes dropdown-in {
  0% {
    opacity: 0;
    transform: translateY(-12px) scale(0.9);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dropdown-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
}

@media (width <= 768px) {
  .header-right {
    padding: 0 1.2rem;
  }

  #center-console,
  #center-console + label {
    display: none;
  }

  .header-right #toggle-menu {
    display: block;
  }
}
</style>

<!-- 全局样式，用于 el-popover (teleport 到 body) -->
<style lang="scss">
.user-popover {
  padding: 0 !important;
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%) !important;
  border: 1px solid var(--anzhiyu-card-border) !important;

  .user-panel {
    .panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid var(--anzhiyu-card-border);

      .user-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        object-fit: cover;
      }

      .user-info {
        flex: 1;
        min-width: 0;

        .user-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--anzhiyu-fontcolor);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-desc {
          font-size: 12px;
          color: var(--anzhiyu-secondtext);
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .panel-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      padding: 12px;

      .grid-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 10px 4px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;

        .grid-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;

          svg {
            width: 20px;
            height: 20px;
          }
        }

        span {
          font-size: 11px;
          color: var(--anzhiyu-secondtext);
          font-weight: 500;
          white-space: nowrap;
        }

        &:hover {
          background: var(--anzhiyu-theme-op);

          .grid-icon {
            transform: scale(1.05);
          }

          span {
            color: var(--anzhiyu-fontcolor);
          }
        }

        &:active {
          transform: scale(0.97);
        }
      }
    }
  }
}
</style>
