/*
 * @Description: 说说管理 API
 * @Author: 安知鱼
 * @Date: 2025-10-04
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

// 说说数据接口类型
export interface APlayerConfig {
  id: string; // 歌曲ID
}

export interface EssayData {
  id: number;
  content: string;
  address?: string;
  from?: string;
  link?: string;
  image?: string[];
  aplayer?: APlayerConfig;
  status: number; // 1=发布, 2=草稿, 3=隐藏
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEssayData {
  content: string;
  address?: string;
  from?: string;
  link?: string;
  image?: string[];
  aplayer?: APlayerConfig;
  status?: number;
  sort_order?: number;
  custom_published_at?: string; // 自定义发布时间
}

export interface UpdateEssayData {
  content?: string;
  address?: string;
  from?: string;
  link?: string;
  image?: string[];
  aplayer?: APlayerConfig;
  status?: number;
  sort_order?: number;
  custom_published_at?: string; // 自定义发布时间
}

export interface EssayListParams {
  page: number;
  page_size: number;
  status?: number;
}

export interface EssayListResponse {
  list: EssayData[];
  total: number;
  page: number;
  page_size: number;
}

// 获取说说列表（管理后台）
export function getAdminEssayList(params: EssayListParams) {
  return http.get(baseUrlApi("pro/admin/essays"), params);
}

// 获取单个说说详情
export function getEssayDetail(id: number) {
  return http.get(baseUrlApi(`pro/admin/essays/${id}`));
}

// 创建说说
export function createEssay(data: CreateEssayData) {
  return http.post(baseUrlApi("pro/admin/essays"), data);
}

// 更新说说
export function updateEssay(id: number, data: UpdateEssayData) {
  return http.request("put", baseUrlApi(`pro/admin/essays/${id}`), {
    data
  });
}

// 删除说说
export function deleteEssay(id: number) {
  return http.request("delete", baseUrlApi(`pro/admin/essays/${id}`));
}

// 批量删除说说
export function deleteEssays(ids: number[]) {
  return http.post(baseUrlApi("pro/admin/essays/batch-delete"), {
    ids
  });
}

// 前台获取已发布的说说列表
export function getPublicEssayList(params: {
  page?: number;
  page_size?: number;
}) {
  return http.get(baseUrlApi("pro/essays"), params);
}

// 导入选项接口
export interface ImportEssayOptions {
  skip_existing: boolean;
  default_status: number;
}

// 导入结果接口
export interface ImportEssayResult {
  total_count: number;
  success_count: number;
  skipped_count: number;
  failed_count: number;
  errors: string[];
  created_ids: number[];
}

// 导出说说
export function exportEssays(essayIds: number[]): Promise<Blob> {
  return http.request("post", baseUrlApi("pro/admin/essays/export"), {
    data: { essay_ids: essayIds },
    responseType: "blob"
  });
}

// 导入说说
export function importEssays(file: File, options: ImportEssayOptions) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("skip_existing", String(options.skip_existing));
  formData.append("default_status", String(options.default_status));

  return http.request<{ data: ImportEssayResult }>(
    "post",
    baseUrlApi("pro/admin/essays/import"),
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}
