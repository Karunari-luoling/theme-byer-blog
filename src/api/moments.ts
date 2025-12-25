/*
 * @Description: 朋友圈 API
 * @Author: 安知鱼
 * @Date: 2025-10-08
 */
import { http } from "@/utils/http";

// 基础响应类型
export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 朋友圈项
export interface Moment {
  id: number;
  link_id: number;
  link_name: string;
  link_logo: string;
  link_url: string;
  post_title: string;
  post_url: string;
  post_summary: string;
  published_at: string;
  created_at: string;
}

// 朋友圈统计信息
export interface MomentsStatistics {
  total_links: number;
  active_links: number;
  total_moments: number;
  last_updated_time: string;
}

// 朋友圈列表数据
export interface MomentsListData {
  list: Moment[];
  total: number;
  page: number;
  page_size: number;
  statistics: MomentsStatistics;
}

// 友链文章列表数据
export interface LinkMomentsData {
  list: Moment[];
  total: number;
  page: number;
  page_size: number;
}

// 友链随机文章数据（钓鱼功能）
export interface RandomPostData {
  author: string;
  avatar: string;
  created: string;
  link: string;
  title: string;
  updated: string;
}

/**
 * 获取朋友圈列表
 * @param page 页码
 * @param pageSize 每页数量
 * @param sortType 排序类型: published_at | created_at
 */
export const getMomentsList = (
  page: number = 1,
  pageSize: number = 50,
  sortType: string = "published_at"
) => {
  return http.request<BaseResponse<MomentsListData>>(
    "get",
    "/api/pro/moments",
    {
      params: { page, page_size: pageSize, sort_type: sortType }
    }
  );
};

/**
 * 获取指定友链的文章列表
 * @param linkId 友链ID
 * @param page 页码
 * @param pageSize 每页数量
 */
export const getLinkMoments = (
  linkId: number,
  page: number = 1,
  pageSize: number = 20
) => {
  return http.request<BaseResponse<LinkMomentsData>>(
    "get",
    `/api/pro/moments/link/${linkId}`,
    {
      params: { page, page_size: pageSize }
    }
  );
};

/**
 * 获取友链随机文章（钓鱼）
 */
export const getRandomPost = () => {
  return http.request<BaseResponse<RandomPostData>>(
    "get",
    "/api/pro/moments/randompost"
  );
};
