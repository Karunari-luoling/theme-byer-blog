import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  listNotificationsApi,
  markAsReadApi,
  markAllAsReadApi,
  type Notification
} from "@/api/notification";
import { useUserStoreHook } from "@/store/modules/user";

export interface UnreadCounts {
  unread: number;
  COMMENT: number;
  PURCHASE: number;
  MEMBERSHIP: number;
  SUPPORT: number;
  SYSTEM: number;
}

export function useNotifications() {
  const router = useRouter();
  const userStore = useUserStoreHook();

  const notifications = ref<Notification[]>([]);
  const loading = ref(false);
  const selectedNotification = ref<Notification | null>(null);

  const unreadCounts = reactive<UnreadCounts>({
    unread: 0,
    COMMENT: 0,
    PURCHASE: 0,
    MEMBERSHIP: 0,
    SUPPORT: 0,
    SYSTEM: 0
  });

  // 检查登录状态
  const checkLogin = () => {
    if (!userStore.username || userStore.roles.length === 0) {
      router.push("/");
      ElMessage.warning("请先登录");
      return false;
    }
    return true;
  };

  // 获取通知列表
  const fetchNotifications = async () => {
    if (!checkLogin()) return;

    loading.value = true;
    try {
      const res = await listNotificationsApi({
        page: 1,
        page_size: 100,
        unread_only: false
      });
      if (res.code === 200 && res.data) {
        notifications.value = res.data.list || [];
        // 计算各分类未读数量
        unreadCounts.unread = res.data.unread_count;
        unreadCounts.COMMENT = notifications.value.filter(
          n => n.type === "COMMENT" && !n.is_read
        ).length;
        unreadCounts.PURCHASE = notifications.value.filter(
          n => n.type === "PURCHASE" && !n.is_read
        ).length;
        unreadCounts.MEMBERSHIP = notifications.value.filter(
          n => n.type === "MEMBERSHIP" && !n.is_read
        ).length;
        unreadCounts.SYSTEM = notifications.value.filter(
          n => n.type === "SYSTEM" && !n.is_read
        ).length;
      }
    } catch (error) {
      console.error("获取通知列表失败:", error);
    } finally {
      loading.value = false;
    }
  };

  // 选择通知并标记为已读
  const selectNotification = async (notification: Notification) => {
    selectedNotification.value = notification;

    if (!notification.is_read) {
      try {
        await markAsReadApi(notification.id);
        notification.is_read = true;
        unreadCounts.unread = Math.max(0, unreadCounts.unread - 1);
        const typeKey = notification.type as keyof UnreadCounts;
        if (typeKey in unreadCounts) {
          unreadCounts[typeKey] = Math.max(0, unreadCounts[typeKey] - 1);
        }
      } catch (error) {
        console.error("标记已读失败:", error);
      }
    }
  };

  // 全部标记为已读
  const markAllAsRead = async () => {
    try {
      await markAllAsReadApi();
      notifications.value.forEach(n => (n.is_read = true));
      unreadCounts.unread = 0;
      unreadCounts.COMMENT = 0;
      unreadCounts.PURCHASE = 0;
      unreadCounts.MEMBERSHIP = 0;
      unreadCounts.SYSTEM = 0;
      ElMessage.success("已全部标记为已读");
    } catch {
      ElMessage.error("操作失败");
    }
  };

  // 清除选中
  const clearSelection = () => {
    selectedNotification.value = null;
  };

  // 跳转链接
  const goToLink = () => {
    const link = selectedNotification.value?.link;
    if (link) {
      // 判断是否为外部链接（以 http:// 或 https:// 开头）或包含锚点
      if (
        link.startsWith("http://") ||
        link.startsWith("https://") ||
        link.includes("#")
      ) {
        // 外部链接或包含锚点的链接，使用 window.location 跳转
        window.location.href = link;
      } else {
        // 内部路由跳转
        router.push(link);
      }
    }
  };

  // 根据分类过滤通知
  const getFilteredNotifications = (categoryKey: string) => {
    if (categoryKey === "unread") {
      return notifications.value.filter(n => !n.is_read);
    }
    return notifications.value.filter(n => n.type === categoryKey);
  };

  return {
    notifications,
    loading,
    selectedNotification,
    unreadCounts,
    fetchNotifications,
    selectNotification,
    markAllAsRead,
    clearSelection,
    goToLink,
    getFilteredNotifications,
    checkLogin
  };
}
