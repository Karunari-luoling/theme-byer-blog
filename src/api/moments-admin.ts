/*
 * @Description: 朋友圈管理 API
 * @Author: 安知鱼
 * @Date: 2025-10-08
 */
import { http } from "@/utils/http";

// 基础响应类型
export interface BaseResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// 抓取状态响应
export interface FetchStatusData {
  is_fetching: boolean;
  status: string;
}

/**
 * 手动触发 RSS 抓取
 */
export const triggerMomentsFetch = () => {
  return http.request<BaseResponse>("post", "/api/pro/admin/moments/fetch");
};

/**
 * 获取抓取状态
 */
export const getMomentsFetchStatus = () => {
  return http.request<BaseResponse<FetchStatusData>>(
    "get",
    "/api/pro/admin/moments/fetch-status"
  );
};

/**
 * 清理朋友圈缓存
 */
export const clearMomentsCache = () => {
  return http.request<BaseResponse>(
    "post",
    "/api/pro/admin/moments/clear-cache"
  );
};
