/*
 * @Description: 打赏管理 API
 * @Author: 安知鱼
 * @Date: 2025-10-28
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { BaseResponse } from "./post/type";

/**
 * 打赏记录数据类型
 */
export interface DonationItem {
  id: number;
  name: string;
  amount: number;
  suffix: string;
  status: number; // 1=显示, 2=隐藏
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * 创建打赏记录请求
 */
export interface CreateDonationRequest {
  name: string;
  amount: number;
  suffix?: string;
  status?: number;
  sort_order?: number;
  custom_published_at?: string; // 自定义发布时间
}

/**
 * 更新打赏记录请求
 */
export interface UpdateDonationRequest {
  name?: string;
  amount?: number;
  suffix?: string;
  status?: number;
  sort_order?: number;
  custom_published_at?: string;
}

/**
 * 打赏列表请求
 */
export interface ListDonationsRequest {
  page: number;
  page_size: number;
  status?: number;
}

/**
 * 打赏列表响应
 */
export interface ListDonationsResponse {
  list: DonationItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 获取打赏总金额响应
 */
export interface TotalAmountResponse {
  total_amount: number;
}

// ==================== 管理端 API (需要管理员权限) ====================

/**
 * 创建打赏记录
 */
export const createDonationApi = (
  data: CreateDonationRequest
): Promise<BaseResponse<DonationItem>> => {
  return http.request<BaseResponse<DonationItem>>(
    "post",
    baseUrlApi("pro/admin/donations"),
    { data }
  );
};

/**
 * 更新打赏记录
 */
export const updateDonationApi = (
  id: number,
  data: UpdateDonationRequest
): Promise<BaseResponse<DonationItem>> => {
  return http.request<BaseResponse<DonationItem>>(
    "put",
    baseUrlApi(`pro/admin/donations/${id}`),
    { data }
  );
};

/**
 * 删除打赏记录
 */
export const deleteDonationApi = (id: number): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`pro/admin/donations/${id}`)
  );
};

/**
 * 获取单个打赏记录
 */
export const getDonationApi = (
  id: number
): Promise<BaseResponse<DonationItem>> => {
  return http.request<BaseResponse<DonationItem>>(
    "get",
    baseUrlApi(`pro/admin/donations/${id}`)
  );
};

/**
 * 获取打赏列表（管理端）
 */
export const listDonationsApi = (
  params: ListDonationsRequest
): Promise<BaseResponse<ListDonationsResponse>> => {
  return http.request<BaseResponse<ListDonationsResponse>>(
    "get",
    baseUrlApi("pro/admin/donations"),
    { params }
  );
};

// ==================== 前台公开 API ====================

/**
 * 获取已发布的打赏列表（前台展示）
 */
export const listPublishedDonationsApi = (params?: {
  page?: number;
  page_size?: number;
}): Promise<BaseResponse<ListDonationsResponse>> => {
  return http.request<BaseResponse<ListDonationsResponse>>(
    "get",
    baseUrlApi("pro/donations"),
    { params }
  );
};

/**
 * 获取打赏总金额
 */
export const getTotalAmountApi = (): Promise<
  BaseResponse<TotalAmountResponse>
> => {
  return http.request<BaseResponse<TotalAmountResponse>>(
    "get",
    baseUrlApi("pro/donations/total")
  );
};

// ==================== 导入导出 API ====================

/**
 * 导入选项
 */
export interface ImportDonationOptions {
  skip_existing: boolean; // 跳过已存在的记录
  default_status: number; // 默认状态 (0=保持原状态, 1=显示, 2=隐藏)
}

/**
 * 导入结果
 */
export interface ImportDonationResult {
  total_count: number;
  success_count: number;
  skipped_count: number;
  failed_count: number;
  errors?: string[];
}

/**
 * 导出打赏记录
 */
export const exportDonationsApi = (ids?: number[]): Promise<Blob> => {
  const params = ids && ids.length > 0 ? { ids: ids.join(",") } : {};
  return http.request<Blob>("get", baseUrlApi("pro/admin/donations/export"), {
    params,
    responseType: "blob"
  });
};

/**
 * 导入打赏记录
 */
export const importDonationsApi = (
  file: File,
  options: ImportDonationOptions
): Promise<BaseResponse<ImportDonationResult>> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("skip_existing", String(options.skip_existing));
  formData.append("default_status", String(options.default_status));

  return http.request<BaseResponse<ImportDonationResult>>(
    "post",
    baseUrlApi("pro/admin/donations/import"),
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
};
