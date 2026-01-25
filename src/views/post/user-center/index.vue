<!--
 * @Description: 用户中心页面
 * @Author: 安知鱼
 * @Date: 2025-10-03 18:26:16
 * @LastEditTime: 2025-12-08 11:00:58
 * @LastEditors: 安知鱼
-->
<template>
  <div class="user-center-container">
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner" />
      <p>加载中...</p>
    </div>

    <div v-else-if="!isLoggedIn" class="not-logged-in">
      <div class="empty-state">
        <i class="anzhiyufont anzhiyu-icon-user" />
        <h2>请先登录</h2>
        <p>登录后即可访问用户中心</p>
        <el-button type="primary" size="large" @click="goToHome">
          返回首页
        </el-button>
      </div>
    </div>

    <div v-else class="user-center-content">
      <!-- 用户信息卡片 -->
      <div class="user-profile-card">
        <div class="profile-header">
          <div class="avatar-section">
            <div class="avatar-wrapper" @click="handleAvatarClick">
              <img :src="userAvatar" :alt="userStore.nickname" class="avatar" />
              <div class="avatar-overlay">
                <IconifyIconOffline icon="ri:camera-fill" />
              </div>
            </div>
          </div>
          <div class="user-info">
            <h1 class="user-nickname">
              {{ userStore.nickname || userStore.username }}
            </h1>
            <div class="user-meta">
              <span class="user-uid">
                <i class="anzhiyufont anzhiyu-icon-id-card" />
                UID: {{ userStore.id || userStore.username }}
              </span>
              <span class="user-join-time">
                <i class="anzhiyufont anzhiyu-icon-calendar" />
                加入于 {{ joinTimeText }}
              </span>
            </div>
            <p class="user-email">
              <i class="anzhiyufont anzhiyu-icon-envelope" />
              {{ userStore.email }}
            </p>
            <div class="user-badges">
              <span v-for="role in userStore.roles" :key="role" class="badge">
                {{ role === "1" ? "管理员" : "普通用户" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 会员状态卡片：只在系统设置了会员套餐时显示 -->
      <div v-if="showMembershipSection" class="membership-status-card">
        <div v-if="membershipLoading" class="membership-loading">
          <el-skeleton :rows="2" animated />
        </div>
        <template v-else>
          <!-- 已开通会员 -->
          <div
            v-if="membershipInfo?.is_member && !membershipInfo?.is_expired"
            class="membership-active"
          >
            <div class="membership-icon active">
              <IconifyIconOffline icon="ri:vip-crown-2-fill" />
            </div>
            <div class="membership-content">
              <div class="membership-header">
                <h3 class="membership-title">
                  <span class="vip-badge">VIP</span>
                  {{ membershipInfo.plan_name || "会员" }}
                </h3>
                <span class="membership-status active">已开通</span>
              </div>
              <div class="membership-details">
                <div class="detail-item">
                  <span class="label">到期时间</span>
                  <span class="value">{{
                    formatDate(membershipInfo.expire_time || "")
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">剩余天数</span>
                  <span class="value highlight"
                    >{{ membershipDaysLeft }} 天</span
                  >
                </div>
              </div>
              <p class="membership-tip">
                <IconifyIconOffline icon="ri:information-line" />
                会员期内可免费访问全站付费内容
              </p>
            </div>
          </div>

          <!-- 未开通会员 -->
          <div v-else class="membership-inactive">
            <div class="membership-icon inactive">
              <IconifyIconOffline icon="ri:vip-crown-line" />
            </div>
            <div class="membership-content">
              <div class="membership-header">
                <h3 class="membership-title">成为会员</h3>
                <span class="membership-status inactive">未开通</span>
              </div>
              <p class="membership-desc">
                开通会员可免费访问全站付费文章和付费商品资源，享受专属会员权益。
              </p>
              <el-button
                type="primary"
                size="default"
                class="membership-btn"
                @click="handleOpenMembershipDialog"
              >
                <IconifyIconOffline icon="ri:vip-crown-2-fill" />
                立即开通
              </el-button>
            </div>
          </div>
        </template>
      </div>

      <!-- 操作卡片 -->
      <div class="action-cards">
        <!-- 写文章：管理员始终可见，普通用户需要多人共创功能开启 -->
        <div
          v-if="showPostManagement"
          class="action-card"
          @click="goToPostManagement"
        >
          <div class="action-icon">
            <IconifyIconOffline icon="ri:article-fill" />
          </div>
          <div class="action-content">
            <h3>写文章</h3>
            <p>创建和管理文章</p>
          </div>
          <i class="anzhiyufont anzhiyu-icon-chevron-right action-arrow" />
        </div>

        <div class="action-card" @click="showEditDialog = true">
          <div class="action-icon">
            <IconifyIconOffline icon="ri:edit-fill" />
          </div>
          <div class="action-content">
            <h3>编辑资料</h3>
            <p>修改个人信息</p>
          </div>
          <i class="anzhiyufont anzhiyu-icon-chevron-right action-arrow" />
        </div>

        <div class="action-card" @click="showChangePasswordDialog = true">
          <div class="action-icon">
            <IconifyIconOffline icon="ri:lock-2-fill" />
          </div>
          <div class="action-content">
            <h3>修改密码</h3>
            <p>更改登录密码</p>
          </div>
          <i class="anzhiyufont anzhiyu-icon-chevron-right action-arrow" />
        </div>

        <div class="action-card" @click="showNotificationDialog = true">
          <div class="action-icon">
            <IconifyIconOffline icon="ri:notification-3-fill" />
          </div>
          <div class="action-content">
            <h3>通知设置</h3>
            <p>管理通知偏好</p>
          </div>
          <i class="anzhiyufont anzhiyu-icon-chevron-right action-arrow" />
        </div>

        <div class="action-card" @click="showMyTicketsDialog = true">
          <div class="action-icon">
            <IconifyIconOffline icon="ri:customer-service-2-fill" />
          </div>
          <div class="action-content">
            <h3>我的工单</h3>
            <p>查看售后咨询记录</p>
          </div>
          <i class="anzhiyufont anzhiyu-icon-chevron-right action-arrow" />
        </div>

        <div class="action-card" @click="showOAuthBindingDialog = true">
          <div class="action-icon">
            <IconifyIconOffline icon="ri:dvd-fill" />
          </div>
          <div class="action-content">
            <h3>第三方账号</h3>
            <p>绑定/解绑第三方账号</p>
          </div>
          <i class="anzhiyufont anzhiyu-icon-chevron-right action-arrow" />
        </div>

        <div class="action-card danger" @click="handleLogout">
          <div class="action-icon">
            <IconifyIconOffline icon="ri:contract-right-line" />
          </div>
          <div class="action-content">
            <h3>退出登录</h3>
            <p>安全退出当前账号</p>
          </div>
          <i class="anzhiyufont anzhiyu-icon-chevron-right action-arrow" />
        </div>
      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <UserProfileDialog
      v-model="showEditDialog"
      :user-info="{
        nickname: userStore.nickname || userStore.username,
        email: userStore.email,
        website: ''
      }"
      @success="handleProfileUpdateSuccess"
    />

    <!-- 修改密码弹窗 -->
    <ChangePasswordDialog v-model="showChangePasswordDialog" />

    <!-- 通知设置弹窗 -->
    <UserNotificationSettings v-model="showNotificationDialog" />

    <!-- 第三方账号绑定弹窗 -->
    <AnDialog
      v-model="showOAuthBindingDialog"
      title="第三方账号绑定"
      width="800px"
      :close-on-click-modal="false"
      :hide-footer="true"
    >
      <OAuthBindingCard embedded @bind-wechat="handleBindWechat" />
    </AnDialog>

    <!-- 微信二维码绑定弹窗 -->
    <WechatQRCodeBindDialog
      v-model="showWechatBindDialog"
      @success="handleWechatBindSuccess"
    />

    <!-- 会员套餐选择弹窗 -->
    <AnDialog
      v-model="showMembershipSelectDialog"
      title="选择会员套餐"
      width="500px"
      :close-on-click-modal="true"
      :hide-footer="true"
    >
      <div class="membership-plans-list">
        <div
          v-for="plan in membershipStore.activePlans"
          :key="plan.id"
          class="plan-item"
          @click="handleSelectPlan(plan)"
        >
          <div class="plan-info">
            <h4 class="plan-name">{{ plan.name }}</h4>
            <p v-if="plan.description" class="plan-desc">
              {{ plan.description }}
            </p>
          </div>
          <div class="plan-price">
            <span v-if="plan.original_price" class="original-price">
              ¥{{ formatPrice(plan.original_price) }}
            </span>
            <span class="current-price">¥{{ formatPrice(plan.price) }}</span>
            <span class="duration">/ {{ plan.duration_days }}天</span>
          </div>
          <IconifyIconOffline icon="ri:arrow-right-s-line" class="plan-arrow" />
        </div>
      </div>
    </AnDialog>

    <!-- 会员支付弹窗 -->
    <MembershipPaymentDialog
      v-if="selectedPlan"
      v-model="showMembershipPaymentDialog"
      :plan="selectedPlan"
      :available-providers="availableProviders"
      @success="handleMembershipSuccess"
    />

    <!-- 我的工单弹窗 -->
    <AnDialog
      v-model="showMyTicketsDialog"
      title="我的工单"
      width="600px"
      :close-on-click-modal="true"
      :hide-footer="true"
    >
      <div class="my-tickets-container">
        <div v-if="myTicketsLoading" class="tickets-loading">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="myTickets.length === 0" class="tickets-empty">
          <el-empty description="暂无工单记录" />
        </div>
        <div v-else class="tickets-list">
          <div
            v-for="ticket in myTickets"
            :key="ticket.id"
            class="ticket-item"
            @click="handleOpenTicketChat(ticket)"
          >
            <div class="ticket-main">
              <div class="ticket-subject">{{ ticket.subject }}</div>
              <div class="ticket-meta">
                <span class="ticket-no">{{ ticket.ticket_no }}</span>
                <span class="ticket-time">{{
                  formatDate(ticket.created_at)
                }}</span>
              </div>
            </div>
            <el-tag :type="getTicketStatusType(ticket.status)" size="small">
              {{ getTicketStatusText(ticket.status) }}
            </el-tag>
          </div>
        </div>
      </div>
    </AnDialog>

    <!-- 售后聊天弹窗 -->
    <SupportChatDialog
      v-model="showSupportChatDialog"
      :order-no="currentSupportOrderNo"
      :user-email="currentSupportEmail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useUserStoreHook } from "@/store/modules/user";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useMembershipStore } from "@/store/modules/membership";
import { ElMessage, ElMessageBox } from "element-plus";
import { formatRelativeTime } from "@/utils/format";
import { uploadUserAvatar } from "@/api/user-center";
import {
  getMyMembershipApi,
  type UserMembership,
  type MembershipPlan
} from "@/api/membership";
import { getPaymentStatus } from "@/api/payment";
import UserProfileDialog from "@/components/UserProfileDialog/index.vue";
import ChangePasswordDialog from "@/components/ChangePasswordDialog/index.vue";
import UserNotificationSettings from "@/components/UserNotificationSettings/index.vue";
import OAuthBindingCard from "@/components/OAuthBindingCard/index.vue";
import WechatQRCodeBindDialog from "@/components/WechatQRCodeBindDialog/index.vue";
import MembershipPaymentDialog from "@/components/MembershipPaymentDialog/index.vue";
import SupportChatDialog from "@/components/SupportChatDialog/index.vue";
import AnDialog from "@/components/AnDialog/index.vue";
import IconifyIconOffline from "@/components/ReIcon/src/iconifyIconOffline";
import { listMyTicketsApi, type Ticket } from "@/api/support";

defineOptions({
  name: "UserCenter"
});

const router = useRouter();
const userStore = useUserStoreHook();
const siteConfigStore = useSiteConfigStore();
const membershipStore = useMembershipStore();

const isLoading = ref(false);
const showEditDialog = ref(false);
const showChangePasswordDialog = ref(false);
const showNotificationDialog = ref(false);
const showOAuthBindingDialog = ref(false);
const showWechatBindDialog = ref(false);

// 会员开通弹窗
const showMembershipSelectDialog = ref(false);
const showMembershipPaymentDialog = ref(false);
const selectedPlan = ref<MembershipPlan | null>(null);
const availableProviders = ref<string[]>([]);

// 我的工单
const showMyTicketsDialog = ref(false);
const showSupportChatDialog = ref(false);
const myTickets = ref<Ticket[]>([]);
const myTicketsLoading = ref(false);
const currentSupportOrderNo = ref("");
const currentSupportEmail = ref("");

// 会员状态
const membershipLoading = ref(false);
const membershipInfo = ref<UserMembership | null>(null);

// 计算剩余天数
const membershipDaysLeft = computed(() => {
  if (!membershipInfo.value?.expire_time) return 0;
  const expireDate = new Date(membershipInfo.value.expire_time);
  const now = new Date();
  const diffTime = expireDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// 检查用户是否已登录
const isLoggedIn = computed(() => {
  return !!userStore.username && userStore.roles.length > 0;
});

// 检查是否为管理员
const isAdmin = computed(() => {
  return userStore.roles.includes("1");
});

// 是否显示文章管理入口：管理员始终可见，普通用户需要多人共创功能开启
const showPostManagement = computed(() => {
  if (!isLoggedIn.value) return false;
  // 管理员始终可见
  if (isAdmin.value) return true;
  // 普通用户需要多人共创功能开启
  return siteConfigStore.enableMultiAuthor;
});

// 是否显示会员板块：只有在系统设置了会员套餐（至少1个）时才显示
const showMembershipSection = computed(() => {
  return membershipStore.hasActivePlans;
});

// 用户头像
const userAvatar = computed(() => {
  return (
    userStore.avatar ||
    `https://cravatar.cn/avatar/${userStore.email}?s=200&d=mp`
  );
});

// 加入时间文本
const joinTimeText = computed(() => {
  if (!userStore.createdAt) return "未知";
  return formatRelativeTime(userStore.createdAt);
});

// 返回首页
const goToHome = () => {
  router.push("/");
};

// 跳转到文章管理（当前窗口打开，权限由路由守卫检查）
const goToPostManagement = () => {
  router.push("/admin/post-management");
};

// 资料更新成功
const handleProfileUpdateSuccess = async () => {
  try {
    // 重新获取用户信息以更新页面显示
    await userStore.fetchUserInfo();
  } catch (error) {
    console.error("刷新用户信息失败:", error);
  }
};

// 点击头像，上传自定义头像
const handleAvatarClick = () => {
  ElMessageBox.confirm(
    "您可以上传自定义头像，或使用 Cravatar 头像服务。",
    "修改头像",
    {
      confirmButtonText: "上传头像",
      cancelButtonText: "使用 Cravatar",
      distinguishCancelAndClose: true,
      type: "info"
    }
  )
    .then(() => {
      // 用户选择上传头像
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp";
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        // 验证文件大小（5MB）
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          ElMessage.error("头像文件大小不能超过 5MB");
          return;
        }

        // 验证文件类型
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp"
        ];
        if (!allowedTypes.includes(file.type)) {
          ElMessage.error("只支持 JPG、PNG、GIF、WebP 格式的图片");
          return;
        }

        try {
          const loadingMsg = ElMessage({
            message: "正在上传头像...",
            type: "info",
            duration: 0
          });

          const response = await uploadUserAvatar(file);

          loadingMsg.close();

          if (response.code === 200) {
            ElMessage.success("头像上传成功");
            // 刷新用户信息
            await userStore.fetchUserInfo();
          } else {
            ElMessage.error(response.message || "头像上传失败");
          }
        } catch (error: any) {
          console.error("头像上传失败:", error);
          ElMessage.error(error?.message || "头像上传失败，请稍后再试");
        }
      };
      input.click();
    })
    .catch((action: string) => {
      // 用户选择使用 Cravatar 或关闭对话框
      if (action === "cancel") {
        window.open("https://cravatar.com", "_blank");
      }
    });
};

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm("确定要退出登录吗？", "退出确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    userStore.logOut();
  } catch {
    // 用户取消
  }
};

// 处理微信绑定
const handleBindWechat = () => {
  showWechatBindDialog.value = true;
};

// 微信绑定成功
const handleWechatBindSuccess = () => {
  // 刷新绑定列表，由OAuthBindingCard组件自动处理
  showOAuthBindingDialog.value = false;
};

// 获取会员状态
const fetchMembershipStatus = async () => {
  if (!isLoggedIn.value) return;

  try {
    membershipLoading.value = true;
    const res = await getMyMembershipApi();
    if (res.code === 200 && res.data) {
      membershipInfo.value = res.data;
    }
  } catch (error) {
    console.error("获取会员状态失败:", error);
  } finally {
    membershipLoading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

// 格式化价格（分转元）
const formatPrice = (cents: number) => {
  return (cents / 100).toFixed(2);
};

// 获取支付方式
const fetchPaymentStatus = async () => {
  try {
    const res = await getPaymentStatus();
    if (res.code === 200 && res.data?.available_providers) {
      availableProviders.value = res.data.available_providers;
    }
  } catch (error) {
    console.error("获取支付状态失败:", error);
  }
};

// 打开会员开通弹窗
const handleOpenMembershipDialog = () => {
  if (membershipStore.activePlans.length === 0) {
    ElMessage.warning("暂无可用的会员套餐");
    return;
  }
  showMembershipSelectDialog.value = true;
};

// 选择套餐并进入支付
const handleSelectPlan = (plan: MembershipPlan) => {
  if (availableProviders.value.length === 0) {
    ElMessage.warning("暂无可用的支付方式，请联系管理员");
    return;
  }
  selectedPlan.value = plan;
  showMembershipSelectDialog.value = false;
  showMembershipPaymentDialog.value = true;
};

// 会员开通成功
const handleMembershipSuccess = async () => {
  showMembershipPaymentDialog.value = false;
  // 刷新会员状态
  await fetchMembershipStatus();
};

// 获取我的工单列表
const fetchMyTickets = async () => {
  if (!isLoggedIn.value) return;

  try {
    myTicketsLoading.value = true;
    const res = await listMyTicketsApi({ page: 1, page_size: 50 });
    if (res.code === 200 && res.data?.list) {
      myTickets.value = res.data.list;
    }
  } catch (error) {
    console.error("获取我的工单失败:", error);
  } finally {
    myTicketsLoading.value = false;
  }
};

// 打开工单聊天
const handleOpenTicketChat = (ticket: Ticket) => {
  currentSupportOrderNo.value = ticket.trade_no;
  currentSupportEmail.value = ticket.user_email || userStore.email;
  showMyTicketsDialog.value = false;
  showSupportChatDialog.value = true;
};

// 获取工单状态文本
const getTicketStatusText = (status: string) => {
  switch (status) {
    case "OPEN":
      return "待处理";
    case "REPLIED":
      return "已回复";
    case "CLOSED":
      return "已关闭";
    default:
      return status;
  }
};

// 获取工单状态类型
const getTicketStatusType = (status: string) => {
  switch (status) {
    case "OPEN":
      return "warning";
    case "REPLIED":
      return "success";
    case "CLOSED":
      return "info";
    default:
      return "info";
  }
};

// 监听工单对话框打开
watch(showMyTicketsDialog, val => {
  if (val) {
    fetchMyTickets();
  }
});

onMounted(async () => {
  if (!isLoggedIn.value) {
    setTimeout(() => {
      router.push("/");
    }, 1500);
  } else {
    // 确保站点配置已加载，以便正确判断是否显示"写文章"选项
    if (!siteConfigStore.isLoaded) {
      await siteConfigStore.fetchSiteConfig();
    }
    // 获取可用的会员套餐列表（用于判断是否显示会员板块）
    await membershipStore.fetchActivePlans();
    // 获取支付方式
    fetchPaymentStatus();
    // 获取会员状态
    fetchMembershipStatus();
  }
});
</script>

<style scoped lang="scss">
.user-center-container {
  max-width: 1200px;
  min-height: calc(100vh - 200px);
  padding: 2rem 1rem;
  margin: 0 auto;
}

.loading-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  min-height: 60vh;

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--anzhiyu-card-border);
    border-top-color: var(--anzhiyu-main);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    font-size: 0.95rem;
    color: var(--anzhiyu-secondtext);
  }
}

.not-logged-in {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;

  .empty-state {
    padding: 3rem;
    text-align: center;
    background: var(--anzhiyu-card-bg);
    border-radius: 20px;
    box-shadow: 0 8px 24px rgb(0 0 0 / 8%);

    i {
      margin-bottom: 1.5rem;
      font-size: 4rem;
      color: var(--anzhiyu-main);
    }

    h2 {
      margin-bottom: 0.5rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--anzhiyu-fontcolor);
    }

    p {
      margin-bottom: 2rem;
      color: var(--anzhiyu-secondtext);
    }
  }
}

.user-center-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.user-profile-card {
  padding: 2.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 20px;
  transition: all 0.3s;
}

.profile-header {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.avatar-section {
  position: relative;

  .avatar-wrapper {
    position: relative;
    width: 120px;
    height: 120px;
    padding: 4px;
    overflow: hidden;
    cursor: pointer;
    background: var(--anzhiyu-background);
    border-radius: 50%;
    box-shadow: 0 8px 24px rgb(0 0 0 / 15%);
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 12px 32px rgb(0 0 0 / 20%);
      transform: scale(1.05);

      .avatar-overlay {
        opacity: 1;
      }
    }

    .avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: rgb(0 0 0 / 50%);
      opacity: 0;
      transition: opacity 0.3s;

      i,
      :deep(svg) {
        width: 2rem;
        height: 2rem;
        font-size: 2rem;
        color: white;
      }
    }
  }
}

.user-info {
  flex: 1;

  .user-nickname {
    margin-bottom: 0.75rem;
    font-size: 2rem;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
  }

  .user-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;

    .user-uid,
    .user-join-time {
      display: flex;
      gap: 0.35rem;
      align-items: center;
      padding: 0.35rem 0.75rem;
      color: var(--anzhiyu-secondtext);
      background: var(--anzhiyu-background);
      border-radius: 12px;
      transition: all 0.3s;

      i {
        font-size: 0.95rem;
      }

      &:hover {
        color: var(--anzhiyu-fontcolor);
        background: var(--anzhiyu-post-blockquote-bg);
      }
    }
  }

  .user-email {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1rem;
    font-size: 0.95rem;
    color: var(--anzhiyu-secondtext);

    i {
      font-size: 1rem;
    }
  }

  .user-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    .badge {
      padding: 0.35rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--anzhiyu-white);
      background: linear-gradient(
        135deg,
        var(--anzhiyu-main),
        var(--anzhiyu-theme)
      );
      border-radius: 20px;
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    }
  }
}

// 会员状态卡片
.membership-status-card {
  padding: 2rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 20px;
  transition: all 0.3s;

  .membership-loading {
    padding: 1rem 0;
  }

  .membership-active,
  .membership-inactive {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .membership-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 16px;
    flex-shrink: 0;

    :deep(svg) {
      width: 32px;
      height: 32px;
    }

    &.active {
      background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
      box-shadow: 0 6px 16px rgba(253, 160, 133, 0.3);

      :deep(svg) {
        color: #fff;
      }
    }

    &.inactive {
      background: var(--anzhiyu-background);

      :deep(svg) {
        color: var(--anzhiyu-secondtext);
      }
    }
  }

  .membership-content {
    flex: 1;
    min-width: 0;
  }

  .membership-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .membership-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
    display: flex;
    align-items: center;
    gap: 8px;

    .vip-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
      border-radius: 6px;
    }
  }

  .membership-status {
    padding: 4px 12px;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 20px;

    &.active {
      color: #fff;
      background: linear-gradient(135deg, #67c23a, #85ce61);
    }

    &.inactive {
      color: var(--anzhiyu-secondtext);
      background: var(--anzhiyu-background);
    }
  }

  .membership-details {
    display: flex;
    gap: 24px;
    margin-bottom: 12px;
    flex-wrap: wrap;

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 0.85rem;
        color: var(--anzhiyu-secondtext);
      }

      .value {
        font-size: 1rem;
        font-weight: 600;
        color: var(--anzhiyu-fontcolor);

        &.highlight {
          color: var(--anzhiyu-theme);
        }
      }
    }
  }

  .membership-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 10px 14px;
    font-size: 0.85rem;
    color: var(--anzhiyu-secondtext);
    background: var(--anzhiyu-background);
    border-radius: 10px;

    :deep(svg) {
      width: 16px;
      height: 16px;
      color: var(--anzhiyu-theme);
      flex-shrink: 0;
    }
  }

  .membership-desc {
    margin: 0 0 16px;
    font-size: 0.95rem;
    color: var(--anzhiyu-secondtext);
    line-height: 1.6;
  }

  .membership-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
    border: none;
    color: #fff;
    font-weight: 600;

    &:hover {
      opacity: 0.9;
    }

    :deep(svg) {
      width: 18px;
      height: 18px;
    }
  }
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.action-card {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  padding: 2rem;
  cursor: pointer;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 16px;
  transition: all 0.3s;

  &:hover {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);

    .action-content p {
      color: var(--anzhiyu-white);
    }

    i {
      color: var(--anzhiyu-white);
    }
  }

  &.danger {
    &:hover {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);

      .action-icon,
      .action-content h3,
      .action-content p,
      .action-arrow {
        color: white;
      }
    }
  }

  .action-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    font-size: 1.75rem;
    color: var(--anzhiyu-fontcolor) !important;
    background: var(--anzhiyu-background);
    border-radius: 50%;
    transition: all 0.3s;

    :deep(svg) {
      width: 1.75rem;
      height: 1.75rem;
    }
  }

  .action-content {
    flex: 1;

    h3 {
      margin-bottom: 0.25rem;
      font-size: 1.1rem;
      font-weight: 600;
      transition: color 0.3s;
    }

    p {
      font-size: 0.9rem;
      color: var(--anzhiyu-secondtext);
      transition: color 0.3s;
    }
  }

  .action-arrow {
    font-size: 1.25rem;
    color: var(--anzhiyu-secondtext);
    transition: all 0.3s;
  }
}

.form-tip {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--anzhiyu-secondtext);
}

:deep(.user-edit-dialog) {
  .el-dialog__header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--anzhiyu-card-border);
  }

  .el-dialog__body {
    padding: 2rem;
  }

  .el-dialog__footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--anzhiyu-card-border);
  }
}

:deep(.oauth-binding-dialog) {
  .el-dialog__header {
    padding: 1.5rem;
    background: var(--anzhiyu-card-bg);
    border-bottom: 1px solid var(--anzhiyu-card-border);
  }

  .el-dialog__body {
    padding: 0;
    background: var(--anzhiyu-background);
  }

  .oauth-binding-card {
    border: none;
    border-radius: 0;
  }
}

// 会员套餐选择列表
.membership-plans-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .plan-item {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 16px 20px;
    cursor: pointer;
    background: var(--anzhiyu-background);
    border: 2px solid transparent;
    border-radius: 12px;
    transition: all 0.2s;

    &:hover {
      border-color: var(--anzhiyu-theme);
      background: var(--anzhiyu-card-bg);
    }

    .plan-info {
      flex: 1;
      min-width: 0;

      .plan-name {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 600;
        color: var(--anzhiyu-fontcolor);
      }

      .plan-desc {
        margin: 0;
        font-size: 13px;
        color: var(--anzhiyu-secondtext);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .plan-price {
      display: flex;
      align-items: baseline;
      gap: 4px;
      flex-shrink: 0;

      .original-price {
        font-size: 12px;
        color: var(--anzhiyu-secondtext);
        text-decoration: line-through;
      }

      .current-price {
        font-size: 20px;
        font-weight: 700;
        color: var(--anzhiyu-red);
      }

      .duration {
        font-size: 12px;
        color: var(--anzhiyu-secondtext);
      }
    }

    .plan-arrow {
      font-size: 20px;
      color: var(--anzhiyu-secondtext);
      flex-shrink: 0;
      transition: transform 0.2s;
    }

    &:hover .plan-arrow {
      transform: translateX(4px);
      color: var(--anzhiyu-theme);
    }
  }
}

// 我的工单列表
.my-tickets-container {
  .tickets-loading {
    padding: 20px 0;
  }

  .tickets-empty {
    padding: 40px 0;
  }

  .tickets-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
  }

  .ticket-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    cursor: pointer;
    background: var(--anzhiyu-background);
    border-radius: 12px;
    transition: all 0.2s;

    &:hover {
      background: var(--anzhiyu-card-bg);
      box-shadow: 0 2px 12px rgb(0 0 0 / 6%);
    }

    .ticket-main {
      flex: 1;
      min-width: 0;

      .ticket-subject {
        font-size: 15px;
        font-weight: 500;
        color: var(--anzhiyu-fontcolor);
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ticket-meta {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: var(--anzhiyu-secondtext);

        .ticket-no {
          font-family: monospace;
        }
      }
    }
  }
}

// 移动端适配
@media (width <= 768px) {
  .user-center-container {
    padding: 1rem;
  }

  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .avatar-section .avatar-wrapper {
    width: 100px;
    height: 100px;
  }

  .user-info .user-nickname {
    font-size: 1.5rem;
  }

  .action-cards {
    grid-template-columns: 1fr;
  }

  .user-profile-card {
    padding: 1.5rem;
  }

  .membership-status-card {
    padding: 1.5rem;

    .membership-active,
    .membership-inactive {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .membership-header {
      justify-content: center;
    }

    .membership-details {
      justify-content: center;
    }

    .membership-tip {
      justify-content: center;
      text-align: center;
    }
  }

  :deep(.oauth-binding-dialog) {
    width: 95% !important;
    max-width: 95% !important;

    .el-dialog__header {
      padding: 1rem 1.5rem;
    }

    .el-dialog__body {
      max-height: 70vh;
      overflow-y: auto;
    }
  }
}
</style>
