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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStoreHook } from "@/store/modules/user";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { ElMessage, ElMessageBox } from "element-plus";
import { formatRelativeTime } from "@/utils/format";
import { uploadUserAvatar } from "@/api/user-center";
import UserProfileDialog from "@/components/UserProfileDialog/index.vue";
import ChangePasswordDialog from "@/components/ChangePasswordDialog/index.vue";
import UserNotificationSettings from "@/components/UserNotificationSettings/index.vue";
import OAuthBindingCard from "@/components/OAuthBindingCard/index.vue";
import WechatQRCodeBindDialog from "@/components/WechatQRCodeBindDialog/index.vue";
import AnDialog from "@/components/AnDialog/index.vue";

defineOptions({
  name: "UserCenter"
});

const router = useRouter();
const userStore = useUserStoreHook();
const siteConfigStore = useSiteConfigStore();

const isLoading = ref(false);
const showEditDialog = ref(false);
const showChangePasswordDialog = ref(false);
const showNotificationDialog = ref(false);
const showOAuthBindingDialog = ref(false);
const showWechatBindDialog = ref(false);

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
