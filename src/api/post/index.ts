/*
 * @Description: 文章管理模块 API 统一出口 (文章、标签、分类)
 * @Author: 安知鱼
 * @Date: 2025-07-25 18:05:00
 * @LastEditTime: 2025-09-11 19:59:52
 * @LastEditors: 安知鱼
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type {
  // 通用
  BaseResponse,
  // 文章
  ArticleListResponse,
  ArticleResponse,
  GetArticleListParams,
  ArticleForm,
  Article,
  // 标签
  TagListResponse,
  PostTagResponse,
  PostTagForm,
  // 分类
  CategoryListResponse,
  PostCategoryResponse,
  PostCategoryForm,
  ArchiveSummaryResponse,
  SuccessResponseUploadImage,
  // AI摘要
  AISummaryRequest,
  AISummaryResponse,
  // 全文隐藏
  FullTextHiddenConfig,
  FullTextHiddenForm,
  // 导入导出
  ImportArticleOptions,
  ImportArticleResult
} from "./type";

// ===================================
//          文章 (Article)
// ===================================

/** @description 获取文章列表 */
export const getArticleList = (
  params: GetArticleListParams
): Promise<BaseResponse<ArticleListResponse>> => {
  return http.request<BaseResponse<ArticleListResponse>>(
    "get",
    baseUrlApi("articles"),
    { params }
  );
};

/** @description 获取单篇文章（用于编辑，包含完整付费内容）
 *  - 管理员可以获取所有文章
 *  - 普通用户只能获取自己创建的文章
 */
export const getArticle = (
  id: string
): Promise<BaseResponse<ArticleResponse>> => {
  return http.request<BaseResponse<ArticleResponse>>(
    "get",
    baseUrlApi(`pro/articles/${id}`)
  );
};

/** @description 创建新文章 */
export const createArticle = (
  data: ArticleForm
): Promise<BaseResponse<ArticleResponse>> => {
  return http.request<BaseResponse<ArticleResponse>>(
    "post",
    baseUrlApi("pro/articles"),
    { data }
  );
};

/** @description 更新文章 */
export const updateArticle = (
  id: string,
  data: ArticleForm
): Promise<BaseResponse<ArticleResponse>> => {
  return http.request<BaseResponse<ArticleResponse>>(
    "put",
    baseUrlApi(`pro/articles/${id}`),
    { data }
  );
};

/** @description 删除文章 (软删除) */
export const deleteArticle = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`articles/${id}`)
  );
};

// ===================================
//          文章标签 (PostTag)
// ===================================

/** @description 获取标签列表 */
export const getTagList = (
  sort: "count" | "name" = "count"
): Promise<BaseResponse<TagListResponse>> => {
  return http.request<BaseResponse<TagListResponse>>(
    "get",
    baseUrlApi("post-tags"),
    {
      params: {
        sort: sort
      }
    }
  );
};

/** @description 创建新标签 */
export const createTag = (
  data: PostTagForm
): Promise<BaseResponse<PostTagResponse>> => {
  return http.request<BaseResponse<PostTagResponse>>(
    "post",
    baseUrlApi("pro/post-tags"),
    { data }
  );
};

/** @description 更新标签 */
export const updateTag = (
  id: string,
  data: PostTagForm
): Promise<BaseResponse<PostTagResponse>> => {
  return http.request<BaseResponse<PostTagResponse>>(
    "put",
    baseUrlApi(`post-tags/${id}`),
    { data }
  );
};

/** @description 删除标签 */
export const deleteTag = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`post-tags/${id}`)
  );
};

// ===================================
//          文章分类 (PostCategory)
// ===================================
/** @description 获取分类列表 */
export const getCategoryList = (): Promise<
  BaseResponse<CategoryListResponse>
> => {
  return http.request<BaseResponse<CategoryListResponse>>(
    "get",
    baseUrlApi("post-categories")
  );
};

/** @description 创建新分类 */
export const createCategory = (
  data: PostCategoryForm
): Promise<BaseResponse<PostCategoryResponse>> => {
  return http.request<BaseResponse<PostCategoryResponse>>(
    "post",
    baseUrlApi("pro/post-categories"),
    { data }
  );
};

/** @description 更新分类 */
export const updateCategory = (
  id: string,
  data: PostCategoryForm
): Promise<BaseResponse<PostCategoryResponse>> => {
  return http.request<BaseResponse<PostCategoryResponse>>(
    "put",
    baseUrlApi(`post-categories/${id}`),
    { data }
  );
};

/** @description 删除分类 */
export const deleteCategory = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`post-categories/${id}`)
  );
};

/** @description [公开]获取首页推荐文章 */
export const getHomeArticles = (): Promise<BaseResponse<Article[]>> => {
  return http.request<BaseResponse<Article[]>>(
    "get",
    baseUrlApi("public/articles/home")
  );
};

/** @description [公开]获取一篇随机文章 */
export const getRandomArticle = (): Promise<BaseResponse<ArticleResponse>> => {
  return http.request<BaseResponse<ArticleResponse>>(
    "get",
    baseUrlApi("public/articles/random")
  );
};

/** @description [公开]获取文章列表 */
export const getPublicArticles = (
  params: GetArticleListParams
): Promise<BaseResponse<ArticleListResponse>> => {
  return http.request<BaseResponse<ArticleListResponse>>(
    "get",
    baseUrlApi("public/articles"),
    { params }
  );
};

/** @description [公开]获取单篇文章 */
export const getPublicArticle = (
  id: string,
  params?: {
    full_text_token?: string;
  }
): Promise<BaseResponse<ArticleResponse>> => {
  return http.request<BaseResponse<ArticleResponse>>(
    "get",
    baseUrlApi(`pro/articles/${id}/content`),
    { params }
  );
};

/** @description [公开]获取文章归档摘要 */
export const getArticleArchives = (): Promise<
  BaseResponse<ArchiveSummaryResponse>
> => {
  return http.request<BaseResponse<ArchiveSummaryResponse>>(
    "get",
    baseUrlApi("public/articles/archives")
  );
};

// @description 上传文章封面图
export function uploadArticleImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return http.request<SuccessResponseUploadImage>(
    "post",
    baseUrlApi("pro/articles/upload"),
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

/** @description 获取图片主色调 */
export const getPrimaryColor = (
  imageUrl: string
): Promise<BaseResponse<{ primary_color: string }>> => {
  return http.request<BaseResponse<{ primary_color: string }>>(
    "post",
    baseUrlApi("articles/primary-color"),
    {
      data: { image_url: imageUrl }
    }
  );
};

// ===================================
//          AI摘要 (AI Summary)
// ===================================

/** @description 生成AI摘要 */
export const generateAISummary = (
  data: AISummaryRequest
): Promise<AISummaryResponse> => {
  return http.request<AISummaryResponse>(
    "post",
    baseUrlApi("pro/article/ai-summary"),
    { data }
  );
};

// ===================================
//      全文隐藏 (Full Text Hidden)
// ===================================

/** @description 获取文章的全文隐藏配置（管理员或文章所有者） */
export const getFullTextHiddenConfig = (
  articleId: string
): Promise<BaseResponse<FullTextHiddenConfig | null>> => {
  return http.request<BaseResponse<FullTextHiddenConfig | null>>(
    "get",
    baseUrlApi(`pro/articles/${articleId}/full-text-hidden`)
  );
};

/** @description 创建或更新文章的全文隐藏配置（管理员或文章所有者） */
export const saveFullTextHiddenConfig = (
  articleId: string,
  data: FullTextHiddenForm
): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "post",
    baseUrlApi(`pro/articles/${articleId}/full-text-hidden`),
    { data }
  );
};

/** @description 删除文章的全文隐藏配置（管理员或文章所有者） */
export const deleteFullTextHiddenConfig = (
  articleId: string
): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`pro/articles/${articleId}/full-text-hidden`)
  );
};

/** @description 获取文章的全文隐藏公开配置（不包含密码等敏感信息） */
export const getFullTextHiddenPublicConfig = (
  articleId: string
): Promise<
  BaseResponse<{ enabled: boolean; config?: Record<string, any> }>
> => {
  return http.request<
    BaseResponse<{ enabled: boolean; config?: Record<string, any> }>
  >("get", baseUrlApi(`pro/articles/${articleId}/full-text-hidden-config`));
};

/** @description 验证全文隐藏的密码 */
export const verifyFullTextHiddenPassword = (
  articleId: string,
  password: string
): Promise<
  BaseResponse<{ success: boolean; message: string; token?: string }>
> => {
  return http.request<
    BaseResponse<{ success: boolean; message: string; token?: string }>
  >("post", baseUrlApi(`pro/articles/${articleId}/full-text-verify`), {
    data: { password }
  });
};

// ===================================
//          文章导入导出功能（PRO版）
// ===================================

/**
 * @description 导出文章为 ZIP 文件（PRO版，包含付费内容等扩展功能）
 * @param articleIds 要导出的文章ID列表
 * @returns Blob 对象（ZIP 文件）
 */
export const exportArticles = (articleIds: string[]): Promise<Blob> => {
  return http.request("post", baseUrlApi("pro/articles/export"), {
    data: { article_ids: articleIds },
    responseType: "blob"
  });
};

/**
 * @description 导入文章（PRO版，支持导入付费内容等扩展功能）
 * @param file 导入的文件（JSON 或 ZIP）
 * @param options 导入选项
 * @returns 导入结果
 */
export const importArticles = (
  file: File,
  options?: ImportArticleOptions
): Promise<BaseResponse<ImportArticleResult>> => {
  const formData = new FormData();
  formData.append("file", file);

  if (options) {
    if (options.create_categories !== undefined) {
      formData.append("create_categories", String(options.create_categories));
    }
    if (options.create_tags !== undefined) {
      formData.append("create_tags", String(options.create_tags));
    }
    if (options.skip_existing !== undefined) {
      formData.append("skip_existing", String(options.skip_existing));
    }
    if (options.default_status) {
      formData.append("default_status", options.default_status);
    }
    if (options.import_paid_content !== undefined) {
      formData.append(
        "import_paid_content",
        String(options.import_paid_content)
      );
    }
    if (options.import_password_content !== undefined) {
      formData.append(
        "import_password_content",
        String(options.import_password_content)
      );
    }
    if (options.import_full_text_hidden !== undefined) {
      formData.append(
        "import_full_text_hidden",
        String(options.import_full_text_hidden)
      );
    }
  }

  return http.request<BaseResponse<ImportArticleResult>>(
    "post",
    baseUrlApi("pro/articles/import"),
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      },
      timeout: 300000 // 5分钟超时（导入可能需要较长时间）
    }
  );
};
