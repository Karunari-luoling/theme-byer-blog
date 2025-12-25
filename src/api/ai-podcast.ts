import { http } from "@/utils/http";
import type { BaseResponse } from "./post/type";

// 检查AI播客是否启用
export const checkAIPodcastEnabled = () => {
  return http.request<BaseResponse<{ enabled: boolean }>>(
    "get",
    "/api/pro/ai-podcast/enabled"
  );
};

// 流式播放请求参数
export interface StreamPodcastRequest {
  article_id: string;
  content_html: string;
}

// 获取流式播放 URL（用于直接在 audio 元素中使用）
export const getStreamUrl = (
  articleId: string,
  contentHtml: string
): string => {
  const params = new URLSearchParams({
    article_id: articleId,
    content: contentHtml
  });
  return `/api/pro/ai-podcast/stream?${params.toString()}`;
};

// 流式播放 POST 请求（用于大文章内容）
export const streamPodcast = async (
  data: StreamPodcastRequest,
  signal?: AbortSignal
): Promise<Response> => {
  return fetch("/api/pro/ai-podcast/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data),
    signal
  });
};

// 缓存状态
export interface CacheStatus {
  has_cache: boolean;
  is_complete: boolean;
  is_generating: boolean; // 是否正在生成中（后台任务）
  total_rounds: number;
  cached_rounds: number;
  total_bytes: number;
  cached_bytes: number;
  missing_rounds: number[];
  progress: number;
  created_at: number;
}

// 获取缓存状态
export const getCacheStatus = (data: StreamPodcastRequest) => {
  return http.request<BaseResponse<CacheStatus>>(
    "post",
    "/api/pro/ai-podcast/cache-status",
    { data }
  );
};

// 手动预缓存
export const preCachePodcast = (data: StreamPodcastRequest) => {
  return http.request<BaseResponse<{ message: string }>>(
    "post",
    "/api/pro/ai-podcast/pre-cache",
    { data }
  );
};
