/**
 * @Description: 用户通知设置相关API
 * @Author: 安知鱼
 * @Date: 2025-10-12
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

export interface UserNotificationSettings {
  allowCommentReplyNotification: boolean;
}

/**
 * 获取用户通知设置
 */
export const getUserNotificationSettings = () => {
  return http.request<UserNotificationSettings>(
    "get",
    baseUrlApi("/user/notification-settings")
  );
};

/**
 * 更新用户通知设置
 */
export const updateUserNotificationSettings = (
  data: UserNotificationSettings
) => {
  return http.request("put", baseUrlApi("/user/notification-settings"), {
    data
  });
};
