/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-12-08 10:25:39
 * @LastEditTime: 2025-12-08 10:26:37
 * @LastEditors: 安知鱼
 */
/**
 * @Description: 文章审核 API
 * @Author: 安知鱼
 * @Date: 2025-12-08
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { BaseResponse } from "@/api/post/type";

// 审核状态常量
export const ReviewStatus = {
  NONE: "NONE",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
} as const;

export type ReviewStatusType = (typeof ReviewStatus)[keyof typeof ReviewStatus];

// 待审核文章项
export interface PendingArticleItem {
  id: string;
  title: string;
  owner_id: number;
  owner_name?: string;
  status: string;
  review_status: ReviewStatusType;
  created_at: string;
  updated_at: string;
  cover_url: string;
}

// 审核列表响应
export interface ReviewListResponse {
  list: PendingArticleItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 审核操作响应
export interface ReviewActionResponse {
  id: string;
  title: string;
  review_status: ReviewStatusType;
  review_comment: string;
  reviewed_at: string;
}

// 审核列表查询参数
export interface ReviewListParams {
  page?: number;
  pageSize?: number;
  review_status?: ReviewStatusType;
}

// 批准/拒绝请求参数
export interface ReviewActionParams {
  review_comment?: string;
}

/**
 * 获取待审核文章列表
 */
export function getReviewList(
  params: ReviewListParams = {}
): Promise<BaseResponse<ReviewListResponse>> {
  return http.request<BaseResponse<ReviewListResponse>>(
    "get",
    baseUrlApi("pro/admin/articles/review"),
    {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        review_status: params.review_status || ReviewStatus.PENDING
      }
    }
  );
}

/**
 * 批准文章
 */
export function approveArticle(
  articleId: string,
  params: ReviewActionParams = {}
): Promise<BaseResponse<ReviewActionResponse>> {
  return http.request<BaseResponse<ReviewActionResponse>>(
    "post",
    baseUrlApi(`pro/admin/articles/review/${articleId}/approve`),
    { data: params }
  );
}

/**
 * 拒绝文章
 */
export function rejectArticle(
  articleId: string,
  params: ReviewActionParams
): Promise<BaseResponse<ReviewActionResponse>> {
  return http.request<BaseResponse<ReviewActionResponse>>(
    "post",
    baseUrlApi(`pro/admin/articles/review/${articleId}/reject`),
    { data: params }
  );
}

// ===================================
//          文章下架（PRO版管理员功能）
// ===================================

// 下架文章请求参数
export interface TakedownArticleParams {
  takedown_reason: string;
}

// 下架文章响应
export interface TakedownArticleResponse {
  id: string;
  title: string;
  is_takedown: boolean;
  takedown_reason: string;
  takedown_at: string;
}

// 恢复文章响应
export interface RestoreArticleResponse {
  id: string;
  title: string;
  is_takedown: boolean;
}

/**
 * 下架文章（管理员将用户文章下架，前台不再显示）
 */
export function takedownArticle(
  articleId: string,
  params: TakedownArticleParams
): Promise<BaseResponse<TakedownArticleResponse>> {
  return http.request<BaseResponse<TakedownArticleResponse>>(
    "post",
    baseUrlApi(`pro/admin/articles/takedown/${articleId}`),
    { data: params }
  );
}

/**
 * 恢复已下架的文章
 */
export function restoreArticle(
  articleId: string
): Promise<BaseResponse<RestoreArticleResponse>> {
  return http.request<BaseResponse<RestoreArticleResponse>>(
    "post",
    baseUrlApi(`pro/admin/articles/takedown/${articleId}/restore`)
  );
}
