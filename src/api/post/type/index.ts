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

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";

// ===================================
//      文章扩展配置 (Article Extra Config)
// ===================================

/**
 * @description 文章扩展配置，用于存储各种可选功能配置
 */
export interface ArticleExtraConfig {
  enable_ai_podcast?: boolean; // AI播客开关，默认 false
  // 未来可扩展更多配置...
}

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
  sort_order: number;
}

export interface PostCategoryForm {
  name?: string;
  description?: string;
  is_series?: boolean;
  sort_order?: number;
}

export type PostCategoryResponse = PostCategory;
export type CategoryListResponse = PostCategoryResponse[];

// ===================================
//          文档系列 (DocSeries)
// ===================================

export interface DocSeries {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  cover_url: string;
  sort: number;
  doc_count: number;
}

export interface DocSeriesForm {
  name?: string;
  description?: string;
  cover_url?: string;
  sort?: number;
}

export type DocSeriesResponse = DocSeries;

export interface DocSeriesListResponse {
  list: DocSeries[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * @description 文档系列中的文章项
 */
export interface DocArticleItem {
  id: string;
  title: string;
  abbrlink: string;
  doc_sort: number;
  created_at: string;
}

/**
 * @description 带文章列表的文档系列
 */
export interface DocSeriesWithArticles extends DocSeries {
  articles: DocArticleItem[];
}

/**
 * @description 用于上一篇、下一篇、相关文章等链接跳转的基础文章信息
 */
export interface ArticleLink {
  id: string;
  title: string;
  cover_url: string;
  abbrlink: string;
  created_at: string;
  // 文档模式相关字段
  is_doc?: boolean;
  doc_series_id?: string;
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
  is_reprint?: boolean;
  copyright_author?: string;
  copyright_author_href?: string;
  copyright_url?: string;
  keywords?: string;
  comment_count: number;
  prev_article: ArticleLink | null;
  next_article: ArticleLink | null;
  related_articles: ArticleLink[];
  // 定时发布相关字段
  scheduled_at?: string; // ISO 8601 格式的定时发布时间
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
  // 扩展配置
  extra_config?: ArticleExtraConfig;
  // 文档模式相关字段
  is_doc?: boolean;
  doc_series_id?: string;
  doc_sort?: number;
  doc_series?: DocSeries;
  // 版权区域按钮显示控制
  show_reward_button?: boolean;
  show_share_button?: boolean;
  show_subscribe_button?: boolean;
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
  is_reprint?: boolean;
  copyright_author?: string;
  copyright_author_href?: string;
  copyright_url?: string;
  custom_published_at?: string;
  custom_updated_at?: string;
  keywords?: string;
  extra_config?: ArticleExtraConfig;
  // 定时发布相关字段
  scheduled_at?: string; // ISO 8601 格式的定时发布时间，设置后状态自动变为 SCHEDULED
  // 文档模式相关字段
  is_doc?: boolean;
  doc_series_id?: string;
  doc_sort?: number;
  // 版权区域按钮显示控制
  show_reward_button?: boolean;
  show_share_button?: boolean;
  show_subscribe_button?: boolean;
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

// ===================================
//      混合内容流 (Feed)
// ===================================

/**
 * @description 混合内容项（文章或商品）
 */
export interface FeedItem {
  id: string;
  item_type: "article" | "product";
  title: string;
  cover_url: string;
  created_at: string;
  // 文章特有字段
  pin_sort?: number;
  comment_count?: number;
  post_tags?: PostTag[];
  post_categories?: PostCategory[];
  is_doc?: boolean;
  doc_series_id?: string;
  primary_color?: string; // 文章主色调，用于分类标签背景色
  // 商品特有字段
  min_price?: number;
  max_price?: number;
  total_sales?: number;
}

/**
 * @description 混合内容流响应
 */
export interface FeedListResponse {
  list: FeedItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * @description 获取混合内容流的查询参数
 */
export interface GetFeedListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  year?: number;
  month?: number;
}

// ===================================
//         文章批量删除功能
// ===================================

/**
 * @description 批量删除文章结果
 */
export interface BatchDeleteResult {
  success_count: number;
  failed_count: number;
  failed_ids: string[];
}

// ===================================
//         文章统计 (Article Statistics)
// ===================================

/**
 * @description 分类统计项
 */
export interface CategoryStatItem {
  name: string;
  count: number;
}

/**
 * @description 标签统计项
 */
export interface TagStatItem {
  name: string;
  count: number;
}

/**
 * @description 热门文章项
 */
export interface TopViewedPostItem {
  id: string;
  title: string;
  views: number;
  cover_url: string;
}

/**
 * @description 发布趋势项
 */
export interface PublishTrendItem {
  month: string;
  count: number;
}

/**
 * @description 文章统计数据
 */
export interface ArticleStatistics {
  total_posts: number;
  total_words: number;
  avg_words: number;
  total_views: number;
  category_stats: CategoryStatItem[];
  tag_stats: TagStatItem[];
  top_viewed_posts: TopViewedPostItem[];
  publish_trend: PublishTrendItem[];
}
