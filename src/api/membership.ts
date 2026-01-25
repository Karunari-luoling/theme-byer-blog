/*
 * @Description: 会员管理 API
 * @Author: 安知鱼
 * @Date: 2025-01-04
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { BaseResponse } from "./post/type";

// ==================== 类型定义 ====================

/**
 * 会员套餐数据类型
 */
export interface MembershipPlan {
  id: string; // 公开ID（字符串格式）
  name: string;
  description?: string;
  price: number; // 价格（分）
  original_price?: number; // 原价（分）
  duration_days: number;
  status: number; // 1=上架, 2=下架
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * 用户会员信息
 */
export interface UserMembership {
  id: number;
  user_id: number;
  plan_id: number;
  plan_name?: string;
  is_member: boolean;
  start_time: string;
  expire_time: string;
  is_expired: boolean;
  created_at: string;
}

/**
 * 创建会员套餐请求
 */
export interface CreatePlanRequest {
  name: string;
  description?: string;
  price: number; // 价格（分）
  original_price?: number; // 原价（分）
  duration_days: number;
  status?: number; // 1=上架, 2=下架
  sort_order?: number;
}

/**
 * 更新会员套餐请求
 */
export interface UpdatePlanRequest {
  name?: string;
  description?: string;
  price?: number; // 价格（分）
  original_price?: number; // 原价（分）
  duration_days?: number;
  status?: number; // 1=上架, 2=下架
  sort_order?: number;
}

/**
 * 会员列表请求
 */
export interface ListMembersRequest {
  page: number;
  page_size: number;
  status?: "active" | "expired";
}

/**
 * 会员列表响应
 */
export interface ListMembersResponse {
  list: UserMembership[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 检查会员访问权限响应
 */
export interface CheckAccessResponse {
  has_access: boolean;
  reason: string;
}

// ==================== 管理端 API (需要管理员权限) ====================

/**
 * 创建会员套餐
 */
export const createPlanApi = (
  data: CreatePlanRequest
): Promise<BaseResponse<MembershipPlan>> => {
  return http.request<BaseResponse<MembershipPlan>>(
    "post",
    baseUrlApi("pro/admin/membership/plans"),
    { data }
  );
};

/**
 * 更新会员套餐
 */
export const updatePlanApi = (
  id: string,
  data: UpdatePlanRequest
): Promise<BaseResponse<MembershipPlan>> => {
  return http.request<BaseResponse<MembershipPlan>>(
    "put",
    baseUrlApi(`pro/admin/membership/plans/${id}`),
    { data }
  );
};

/**
 * 删除会员套餐
 */
export const deletePlanApi = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`pro/admin/membership/plans/${id}`)
  );
};

/**
 * 获取会员套餐详情
 */
export const getPlanApi = (
  id: string
): Promise<BaseResponse<MembershipPlan>> => {
  return http.request<BaseResponse<MembershipPlan>>(
    "get",
    baseUrlApi(`pro/admin/membership/plans/${id}`)
  );
};

/**
 * 获取会员套餐列表
 */
export const listPlansApi = (): Promise<
  BaseResponse<{ list: MembershipPlan[] }>
> => {
  return http.request<BaseResponse<{ list: MembershipPlan[] }>>(
    "get",
    baseUrlApi("pro/admin/membership/plans")
  );
};

/**
 * 获取会员用户列表
 */
export const listMembersApi = (
  params: ListMembersRequest
): Promise<BaseResponse<ListMembersResponse>> => {
  return http.request<BaseResponse<ListMembersResponse>>(
    "get",
    baseUrlApi("pro/admin/membership/members"),
    { params }
  );
};

// ==================== 前台公开 API ====================

/**
 * 获取当前可用的会员套餐列表（公开接口）
 */
export const getActivePlansApi = (): Promise<
  BaseResponse<{ list: MembershipPlan[] }>
> => {
  return http.request<BaseResponse<{ list: MembershipPlan[] }>>(
    "get",
    baseUrlApi("pro/membership/plans")
  );
};

/**
 * 获取我的会员信息
 */
export const getMyMembershipApi = (): Promise<BaseResponse<UserMembership>> => {
  return http.request<BaseResponse<UserMembership>>(
    "get",
    baseUrlApi("pro/membership/my")
  );
};

/**
 * 检查会员访问权限
 */
export const checkMembershipAccessApi = (params: {
  content_type: "article" | "product";
  content_id: string;
}): Promise<BaseResponse<CheckAccessResponse>> => {
  return http.request<BaseResponse<CheckAccessResponse>>(
    "get",
    baseUrlApi("pro/membership/access/check"),
    { params }
  );
};

// ==================== 会员支付 API ====================

/**
 * 创建会员订单请求
 */
export interface CreateMembershipOrderRequest {
  plan_id: string; // 套餐公开ID
  payment_provider: "ALIPAY" | "WECHAT" | "EPAY" | "HUPIJIAO";
  user_email?: string;
}

/**
 * 创建会员订单响应
 */
export interface CreateMembershipOrderResponse {
  order_no: string;
  amount: number;
  expire_time: string;
  plan_name: string;
  plan_days: number;
  payment_result: {
    payment_url?: string;
    qr_code?: string;
    code_url?: string;
  };
}

/**
 * 创建会员支付订单
 */
export const createMembershipOrderApi = (
  data: CreateMembershipOrderRequest
): Promise<BaseResponse<CreateMembershipOrderResponse>> => {
  return http.request<BaseResponse<CreateMembershipOrderResponse>>(
    "post",
    baseUrlApi("pro/payment/membership/order"),
    { data }
  );
};
