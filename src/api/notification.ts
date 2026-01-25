/*
 * @Description: 通知 API
 * @Author: 安知鱼
 * @Date: 2025-01-04
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { BaseResponse } from "./post/type";

// ==================== 类型定义 ====================

/**
 * 通知类型枚举
 */
export enum NotificationType {
  System = "SYSTEM", // 系统通知
  Purchase = "PURCHASE", // 购买通知
  Membership = "MEMBERSHIP", // 会员通知
  Support = "SUPPORT", // 工单通知
  Comment = "COMMENT" // 评论通知
}

/**
 * 通知数据类型
 */
export interface Notification {
  id: string;
  user_id: number;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

/**
 * 通知列表请求
 */
export interface ListNotificationsRequest {
  page: number;
  page_size: number;
  unread_only?: boolean;
}

/**
 * 通知列表响应
 */
export interface ListNotificationsResponse {
  list: Notification[];
  total: number;
  page: number;
  page_size: number;
  unread_count: number;
}

/**
 * 未读数量响应
 */
export interface UnreadCountResponse {
  count: number;
}

// ==================== API 方法 ====================

/**
 * 获取通知列表
 */
export const listNotificationsApi = (
  params: ListNotificationsRequest
): Promise<BaseResponse<ListNotificationsResponse>> => {
  return http.request<BaseResponse<ListNotificationsResponse>>(
    "get",
    baseUrlApi("pro/notifications"),
    { params }
  );
};

/**
 * 获取未读通知数量
 */
export const getUnreadCountApi = (): Promise<
  BaseResponse<UnreadCountResponse>
> => {
  return http.request<BaseResponse<UnreadCountResponse>>(
    "get",
    baseUrlApi("pro/notifications/unread-count")
  );
};

/**
 * 标记通知为已读
 */
export const markAsReadApi = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "post",
    baseUrlApi(`pro/notifications/${id}/read`)
  );
};

/**
 * 标记所有通知为已读
 */
export const markAllAsReadApi = (): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "post",
    baseUrlApi("pro/notifications/read-all")
  );
};

/**
 * 删除通知
 */
export const deleteNotificationApi = (
  id: string
): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`pro/notifications/${id}`)
  );
};
