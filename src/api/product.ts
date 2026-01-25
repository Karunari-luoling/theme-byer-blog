/*
 * @Description: 商品管理 API
 * @Author: 安知鱼
 * @Date: 2025-01-04
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { BaseResponse } from "./post/type";

// ==================== 类型定义 ====================

/**
 * 商品状态枚举
 */
export enum ProductStatus {
  Draft = 1, // 草稿
  Published = 2, // 已上架
  Offline = 3 // 已下架
}

/**
 * 发货方式枚举
 */
export enum DeliveryMethod {
  Fixed = "FIXED_REPLY", // 固定内容发货
  Stock = "STOCK_ITEM" // 卡密库存发货
}

/**
 * 卡密状态枚举
 */
export enum StockStatus {
  Available = 1, // 未发出
  Used = 2, // 已发出
  Invalid = 3 // 已作废
}

/**
 * 商品型号数据类型
 */
export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  cover_url?: string;
  delivery_method: DeliveryMethod;
  fixed_reply_content?: string;
  stock_count?: number;
  sold_count: number;
  status: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 商品数据类型
 */
export interface Product {
  id: string;
  title: string;
  description?: string;
  description_html?: string;
  cover_url?: string;
  status: ProductStatus;
  exclude_from_membership: boolean;
  show_on_homepage: boolean;
  sort_order: number;
  total_sales?: number;
  total_revenue?: number;
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}

/**
 * 商品列表项
 */
export interface ProductListItem {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  status: ProductStatus;
  min_price: number;
  total_sales: number;
  total_revenue?: number;
  variant_count: number;
  exclude_from_membership?: boolean;
  show_on_homepage?: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * 卡密数据类型
 */
export interface StockItem {
  id: string;
  variant_id: string;
  content: string;
  status: StockStatus;
  order_id?: number;
  used_at?: string;
  created_at: string;
}

/**
 * 创建商品请求
 */
export interface CreateProductRequest {
  title: string;
  description?: string;
  cover_url?: string;
  status?: ProductStatus;
  exclude_from_membership?: boolean;
  show_on_homepage?: boolean;
  sort_order?: number;
  variants?: CreateVariantRequest[];
}

/**
 * 创建型号请求
 */
export interface CreateVariantRequest {
  id?: string;
  name: string;
  price: number;
  delivery_method: DeliveryMethod;
  fixed_reply_content?: string;
  sort_order?: number;
}

/**
 * 更新商品请求
 */
export interface UpdateProductRequest {
  title?: string;
  description?: string;
  cover_url?: string;
  status?: ProductStatus;
  exclude_from_membership?: boolean;
  show_on_homepage?: boolean;
  sort_order?: number;
  variants?: UpdateVariantRequest[];
}

/**
 * 更新型号请求
 */
export interface UpdateVariantRequest {
  id?: string; // 公开ID，存在则更新，不存在则新增
  name?: string;
  price?: number;
  delivery_method?: DeliveryMethod;
  fixed_reply_content?: string;
  sort_order?: number;
}

/**
 * 商品列表请求
 */
export interface ListProductsRequest {
  page: number;
  page_size: number;
  status?: ProductStatus;
  keyword?: string;
}

/**
 * 商品列表响应
 */
export interface ListProductsResponse {
  list: ProductListItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 卡密列表请求
 */
export interface ListStockRequest {
  page: number;
  page_size: number;
  status?: StockStatus;
}

/**
 * 卡密列表响应
 */
export interface ListStockResponse {
  list: StockItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 导入卡密请求
 */
export interface ImportStockRequest {
  items?: string[];
  item_text?: string; // 文本输入，每行一个
}

/**
 * 导入卡密响应
 */
export interface ImportStockResponse {
  imported_count: number;
  failed_count: number;
  errors?: string[];
}

// ==================== 管理端 API (需要管理员权限) ====================

/**
 * 创建商品
 */
export const createProductApi = (
  data: CreateProductRequest
): Promise<BaseResponse<Product>> => {
  return http.request<BaseResponse<Product>>(
    "post",
    baseUrlApi("pro/admin/products"),
    { data }
  );
};

/**
 * 更新商品
 */
export const updateProductApi = (
  id: string,
  data: UpdateProductRequest
): Promise<BaseResponse<Product>> => {
  return http.request<BaseResponse<Product>>(
    "put",
    baseUrlApi(`pro/admin/products/${id}`),
    { data }
  );
};

/**
 * 删除商品
 */
export const deleteProductApi = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`pro/admin/products/${id}`)
  );
};

/**
 * 获取商品详情（管理端）
 */
export const getProductAdminApi = (
  id: string
): Promise<BaseResponse<Product>> => {
  return http.request<BaseResponse<Product>>(
    "get",
    baseUrlApi(`pro/admin/products/${id}`)
  );
};

/**
 * 获取商品列表（管理端）
 */
export const listProductsAdminApi = (
  params: ListProductsRequest
): Promise<BaseResponse<ListProductsResponse>> => {
  return http.request<BaseResponse<ListProductsResponse>>(
    "get",
    baseUrlApi("pro/admin/products"),
    { params }
  );
};

/**
 * 删除型号
 */
export const deleteVariantApi = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`pro/admin/variants/${id}`)
  );
};

/**
 * 导入卡密
 */
export const importStockApi = (
  variantId: string,
  data: ImportStockRequest
): Promise<BaseResponse<ImportStockResponse>> => {
  return http.request<BaseResponse<ImportStockResponse>>(
    "post",
    baseUrlApi(`pro/admin/variants/${variantId}/stock/import`),
    { data }
  );
};

/**
 * 获取卡密列表
 */
export const listStockApi = (
  variantId: string,
  params: ListStockRequest
): Promise<BaseResponse<ListStockResponse>> => {
  return http.request<BaseResponse<ListStockResponse>>(
    "get",
    baseUrlApi(`pro/admin/variants/${variantId}/stock`),
    { params }
  );
};

/**
 * 作废卡密
 */
export const invalidateStockApi = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "post",
    baseUrlApi(`pro/admin/stock/${id}/invalidate`)
  );
};

// ==================== 前台公开 API ====================

/**
 * 获取商品列表（前台）
 */
export const listProductsApi = (params?: {
  page?: number;
  page_size?: number;
  keyword?: string;
}): Promise<BaseResponse<ListProductsResponse>> => {
  return http.request<BaseResponse<ListProductsResponse>>(
    "get",
    baseUrlApi("pro/products"),
    { params }
  );
};

/**
 * 获取商品详情（前台）
 */
export const getProductApi = (id: string): Promise<BaseResponse<Product>> => {
  return http.request<BaseResponse<Product>>(
    "get",
    baseUrlApi(`pro/products/${id}`)
  );
};

// ==================== 商品支付 API ====================

/**
 * 创建商品订单请求
 */
export interface CreateProductOrderRequest {
  variant_id: string;
  payment_provider: "ALIPAY" | "WECHAT" | "EPAY" | "HUPIJIAO";
  user_email?: string;
}

/**
 * 创建商品订单响应
 */
export interface CreateProductOrderResponse {
  order_no: string;
  amount: number;
  expire_time: string;
  payment_result: {
    payment_url?: string;
    qr_code?: string;
    code_url?: string;
  };
}

/**
 * 创建商品支付订单
 */
export const createProductOrderApi = (
  data: CreateProductOrderRequest
): Promise<BaseResponse<CreateProductOrderResponse>> => {
  return http.request<BaseResponse<CreateProductOrderResponse>>(
    "post",
    baseUrlApi("pro/payment/product/order"),
    { data }
  );
};

/**
 * 订单找回请求
 */
export interface RecoverOrderRequest {
  trade_no: string;
  email: string;
}

/**
 * 订单找回响应
 */
export interface RecoverOrderResponse {
  order_no: string;
  trade_no: string;
  product_title: string;
  variant_name: string;
  amount: number; // 金额（分）
  payment_status: string;
  delivery_content?: string;
  paid_at?: string;
  created_at: string;
}

/**
 * 通过第三方订单号找回订单
 */
export const recoverProductOrderApi = (
  data: RecoverOrderRequest
): Promise<BaseResponse<RecoverOrderResponse>> => {
  return http.request<BaseResponse<RecoverOrderResponse>>(
    "post",
    baseUrlApi("pro/payment/product/recover"),
    { data }
  );
};
