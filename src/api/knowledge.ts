/**
 * 知识库问答 API
 */
import { http } from "@/utils/http";

// 问答请求
export interface AskRequest {
  question: string;
}

// 引用来源
export interface Reference {
  document_id: number;
  title: string;
  source_type: string;
  source_id?: number;
  source_url?: string;
  score: number;
}

// 问答响应
export interface AskResponse {
  answer: string;
  references: Reference[];
  has_context: boolean;
}

// 知识库统计
export interface KnowledgeStats {
  total_documents: number;
  indexed_documents: number;
  pending_documents: number;
  failed_documents: number;
  total_chunks: number;
  total_tokens: number;
}

// 知识库文档
export interface KnowledgeDocument {
  id: number;
  source_type: string;
  source_id?: number;
  source_url?: string;
  title: string;
  content_type: string;
  content_length: number;
  status: string;
  chunk_count: number;
  error_message?: string;
  indexed_at?: string;
  created_at: string;
  updated_at: string;
}

// 知识库配置
export interface KnowledgeConfig {
  enabled: boolean;
  embedding_provider: string;
  embedding_model: string;
  vector_store: string;
  vector_dimension: number;
}

// 通用响应类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 知识库问答（非流式）
 */
export function askKnowledge(data: AskRequest) {
  return http.request<ApiResponse<AskResponse>>(
    "post",
    "/api/pro/knowledge/ask",
    {
      data
    }
  );
}

/**
 * 知识库问答（流式）
 * 返回 EventSource URL
 */
export function getAskStreamUrl(question: string): string {
  // 使用相对路径，浏览器会自动处理 origin
  return `/api/pro/knowledge/ask/stream?question=${encodeURIComponent(question)}`;
}

// 搜索结果项
export interface SearchResultItem {
  title: string;
  summary: string;
  url?: string;
  source_id?: number;
  score: number;
}

// 搜索响应
export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  total: number;
}

/**
 * 知识库搜索（仅返回搜索结果，不生成 AI 回答）
 */
export function searchKnowledge(question: string, topK = 5) {
  return http.request<ApiResponse<SearchResponse>>(
    "get",
    `/api/pro/knowledge/search?question=${encodeURIComponent(question)}&top_k=${topK}`
  );
}

/**
 * 获取知识库统计
 */
export function getKnowledgeStats() {
  return http.request<ApiResponse<KnowledgeStats>>(
    "get",
    "/api/pro/admin/knowledge/stats"
  );
}

/**
 * 获取知识库配置
 */
export function getKnowledgeConfig() {
  return http.request<ApiResponse<KnowledgeConfig>>(
    "get",
    "/api/pro/admin/knowledge/config"
  );
}

/**
 * 获取文档列表
 */
export function getKnowledgeDocuments(params: {
  status?: string;
  page?: number;
  page_size?: number;
}) {
  return http.request<
    ApiResponse<{
      documents: KnowledgeDocument[];
      total: number;
      page: number;
      page_size: number;
    }>
  >("get", "/api/pro/admin/knowledge/documents", { params });
}

/**
 * 获取文档详情
 */
export function getKnowledgeDocument(id: number) {
  return http.request<ApiResponse<KnowledgeDocument>>(
    "get",
    `/api/pro/admin/knowledge/documents/${id}`
  );
}

/**
 * 索引文档
 */
export function indexKnowledgeDocument(data: {
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}) {
  return http.request<ApiResponse<KnowledgeDocument>>(
    "post",
    "/api/pro/admin/knowledge/documents",
    { data }
  );
}

/**
 * 删除文档
 */
export function deleteKnowledgeDocument(id: number) {
  return http.request<ApiResponse<null>>(
    "delete",
    `/api/pro/admin/knowledge/documents/${id}`
  );
}

/**
 * 重新索引文档
 */
export function reindexKnowledgeDocument(id: number) {
  return http.request<ApiResponse<KnowledgeDocument>>(
    "post",
    `/api/pro/admin/knowledge/documents/${id}/reindex`
  );
}

/**
 * 上传文档
 */
export function uploadKnowledgeDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return http.request<ApiResponse<KnowledgeDocument>>(
    "post",
    "/api/pro/admin/knowledge/upload",
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

/**
 * 获取支持的文件类型
 */
export function getSupportedFileTypes() {
  return http.request<ApiResponse<{ types: string[] }>>(
    "get",
    "/api/pro/admin/knowledge/supported-types"
  );
}

// 同步文章结果
export interface SyncArticlesResult {
  total_articles: number;
  new_documents: number;
  updated_documents: number;
  skipped_documents: number;
  failed_documents: number;
}

/**
 * 同步文章到知识库
 * @param force 是否强制重新索引
 */
export function syncKnowledgeArticles(force = false) {
  return http.request<ApiResponse<SyncArticlesResult>>(
    "post",
    "/api/pro/admin/knowledge/sync-articles",
    {
      data: { force }
    }
  );
}
