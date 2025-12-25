/*
 * @Description: 文章、标签、分类模块的所有类型定义
 * @Author: 安知鱼
 * @Date: 2025-07-23 11:07:00
 * @LastEditTime: 2025-08-28 14:24:53
 * @LastEditors: 安知鱼
 */

// ===================================
//         通用 & 基础类型
// ===================================

export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

// ===================================
//          文章标签 (PostTag)
// ===================================

export interface PostTag {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  count: number;
}

export interface PostTagForm {
  name?: string;
}

export type PostTagResponse = PostTag;
export type TagListResponse = PostTagResponse[];

// ===================================
//          文章分类 (PostCategory)
// ===================================

export interface PostCategory {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  count: number;
  is_series: boolean;
}

export interface PostCategoryForm {
  name?: string;
  description?: string;
  is_series?: boolean;
}

export type PostCategoryResponse = PostCategory;
export type CategoryListResponse = PostCategoryResponse[];

/**
 * @description 用于上一篇、下一篇、相关文章等链接跳转的基础文章信息
 */
export interface ArticleLink {
  id: string;
  title: string;
  cover_url: string;
  abbrlink: string;
  created_at: string;
}

// ===================================
//          文章 (Article)
// ===================================

/**
 * @description 文章对象完整结构
 */
export interface Article {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  content_md?: string;
  content_html?: string;
  cover_url: string;
  status: ArticleStatus;
  view_count: number;
  word_count: number;
  reading_time: number;
  ip_location?: string;
  post_tags: PostTag[];
  post_categories: PostCategory[];
  show_on_home: boolean;
  home_sort: number;
  pin_sort: number;
  top_img_url: string;
  summaries: string[];
  primary_color?: string;
  is_primary_color_manual: boolean;
  abbrlink?: string;
  copyright?: boolean;
  copyright_author?: string;
  copyright_author_href?: string;
  copyright_url?: string;
  keywords?: string;
  comment_count: number;
  prev_article: ArticleLink | null;
  next_article: ArticleLink | null;
  related_articles: ArticleLink[];
  // 审核状态（多人共创功能）
  review_status?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  // 预览模式标识（未发布文章的预览）
  is_preview?: boolean;
  // 下架状态（PRO版管理员功能）
  is_takedown?: boolean;
  takedown_reason?: string;
  takedown_at?: string;
  takedown_by?: number;
  // 发布者信息（多人共创功能）
  owner_id?: number;
  owner_name?: string; // 已废弃，使用 owner_nickname
  owner_nickname?: string; // 发布者昵称（用户个人中心的 nickname）
  owner_avatar?: string; // 发布者头像
  owner_email?: string; // 发布者邮箱
  // 全文隐藏配置（从后端返回）
  full_text_hidden_config?: {
    enabled: boolean;
    button_text?: string;
    modal_top_description?: string;
    qr_code_url?: string;
    input_placeholder?: string;
    initial_visible_height?: number;
    is_content_truncated?: boolean;
  };
  // 访问原因（如管理员权限、已购买等）
  access_reason?: string;
}

/**
 * @description 获取文章列表的查询参数
 */
export interface GetArticleListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: ArticleStatus | "";
  category?: string;
  tag?: string;
  year?: number;
  month?: number;
  /** 作者ID（多人共创功能：普通用户只能查看自己的文章） */
  author_id?: string;
}

/**

 * @description 创建/更新文章时发送的表单数据类型
 */
export interface ArticleForm {
  title?: string;
  content_md?: string;
  content_html?: string;
  cover_url?: string;
  status?: ArticleStatus;
  post_tag_ids?: string[];
  post_category_ids?: string[];
  ip_location?: string;
  show_on_home?: boolean;
  home_sort?: number;
  pin_sort?: number;
  top_img_url?: string;
  summaries?: string[];
  primary_color?: string;
  is_primary_color_manual?: boolean;
  abbrlink?: string;
  copyright?: boolean;
  copyright_author?: string;
  copyright_author_href?: string;
  copyright_url?: string;
  custom_published_at?: string;
  custom_updated_at?: string;
  keywords?: string;
}

export type ArticleResponse = Article;
export interface ArticleListResponse {
  list: Article[];
  total: number;
}

// ===================================
//         文章归档 (Post Archives)
// ===================================
/**
 * @description 单个归档项
 */
export interface ArchiveItem {
  year: number;
  month: number;
  count: number;
}

/**
 * @description 归档列表的响应体数据
 */
export interface ArchiveSummaryResponse {
  list: ArchiveItem[];
}

// 上传图片成功的响应体
export interface SuccessResponseUploadImage {
  code: number;
  message: string;
  data: {
    url: string;
  };
}

// ===================================
//         AI摘要 (AI Summary)
// ===================================

/**
 * @description AI摘要生成请求参数
 */
export interface AISummaryRequest {
  complete_html: string;
}

/**
 * @description AI摘要生成响应数据
 */
export interface AISummaryData {
  summary: string;
}

export type AISummaryResponse = BaseResponse<AISummaryData>;

// ===================================
//    全文隐藏 (Full Text Hidden)
// ===================================

/**
 * @description 全文隐藏配置
 */
export interface FullTextHiddenConfig {
  id?: number;
  article_id?: number;
  enabled: boolean;
  password?: string;
  modal_top_description?: string;
  button_text?: string;
  qr_code_url?: string;
  input_placeholder?: string;
  initial_visible_height?: number;
  preview_char_count?: number;
  max_attempts?: number;
  access_count?: number;
  failed_attempts?: number;
  status?: number;
  expires_at?: string;
  last_accessed_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * @description 全文隐藏公开配置（不包含密码等敏感信息）
 */
export interface FullTextHiddenPublicConfig {
  enabled: boolean;
  config?: {
    button_text?: string;
    modal_top_description?: string;
    qr_code_url?: string;
    input_placeholder?: string;
    initial_visible_height?: number;
  };
}

/**
 * @description 创建或更新全文隐藏配置的表单数据
 */
export interface FullTextHiddenForm {
  enabled: boolean;
  password?: string;
  modal_top_description?: string;
  button_text?: string;
  qr_code_url?: string;
  input_placeholder?: string;
  initial_visible_height?: number;
  preview_char_count?: number;
  max_attempts?: number;
}

// ===================================
//         文章导入导出功能（PRO版）
// ===================================

/**
 * @description 导入文章选项（PRO版扩展）
 */
export interface ImportArticleOptions {
  create_categories?: boolean; // 是否自动创建不存在的分类
  create_tags?: boolean; // 是否自动创建不存在的标签
  skip_existing?: boolean; // 是否跳过已存在的文章
  default_status?: string; // 默认文章状态
  import_paid_content?: boolean; // 是否导入付费内容
  import_password_content?: boolean; // 是否导入密码保护内容
  import_full_text_hidden?: boolean; // 是否导入全文隐藏
}

/**
 * @description 导入文章结果
 */
export interface ImportArticleResult {
  total_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  created_ids: string[];
  error_messages: string[];
}
