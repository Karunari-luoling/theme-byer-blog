/*
 * @Description: SEO 搜索引擎提交 API
 * @Author: 安知鱼
 * @Date: 2025-10-22
 */
import { http } from "@/utils/http";

/**
 * 标准API响应包装
 */
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/**
 * 提交详情
 */
export interface SubmitDetails {
  success_count?: number;
  failed_count?: number;
  failed_urls?: string[];
  raw_response?: string;
}

/**
 * 提交响应
 */
export interface SubmitResponse {
  engine: string;
  success: boolean;
  message: string;
  details?: SubmitDetails;
}

/**
 * URL提交请求
 */
export interface SubmitRequest {
  urls: string[];
}

/**
 * 测试搜索引擎连接
 * @param engine 搜索引擎名称 (baidu/bing/google)
 */
export const testSEOConnection = (engine: string) => {
  return http.request<ApiResponse<SubmitResponse>>(
    "post",
    `/api/pro/admin/seo/test/${engine}`
  );
};

/**
 * 提交URL到百度
 * @param urls URL列表
 */
export const submitToBaidu = (urls: string[]) => {
  return http.request<ApiResponse<SubmitResponse>>(
    "post",
    "/api/pro/admin/seo/submit/baidu",
    {
      data: { urls }
    }
  );
};

/**
 * 提交URL到Bing
 * @param urls URL列表
 */
export const submitToBing = (urls: string[]) => {
  return http.request<ApiResponse<SubmitResponse>>(
    "post",
    "/api/pro/admin/seo/submit/bing",
    {
      data: { urls }
    }
  );
};

/**
 * 提交URL到Google
 * @param urls URL列表
 */
export const submitToGoogle = (urls: string[]) => {
  return http.request<ApiResponse<SubmitResponse>>(
    "post",
    "/api/pro/admin/seo/submit/google",
    {
      data: { urls }
    }
  );
};

/**
 * 批量提交URL到所有启用的搜索引擎
 * @param urls URL列表
 */
export interface BatchSubmitResponse {
  total: number;
  results: SubmitResponse[];
}

export const batchSubmit = (urls: string[]) => {
  return http.request<ApiResponse<BatchSubmitResponse>>(
    "post",
    "/api/pro/admin/seo/submit/batch",
    {
      data: { urls }
    }
  );
};
