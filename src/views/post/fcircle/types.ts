/*
 * @Description: 朋友圈类型定义
 * @Author: 安知鱼
 * @Date: 2025-10-08 19:21:14
 * @LastEditTime: 2025-10-08
 * @LastEditors: 安知鱼
 */

// 朋友圈项（与后端 API 保持一致）
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
