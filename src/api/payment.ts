import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { ArticleStatus } from "@/api/post/type";

// 支付宝配置接口
export interface AlipayConfig {
  app_id: string;
  app_private_key: string;
  alipay_public_key: string;
}

// 微信支付配置接口
export interface WechatConfig {
  app_id: string;
  mch_id: string;
  mch_serial_no: string;
  api_v3_key: string;
  private_key_data: string;
}

// 易支付配置接口
export interface EpayConfig {
  mch_id: string;
  key: string;
  gateway: string;
  return_url?: string;
}

// 虎皮椒配置接口
export interface HupijiaoConfig {
  app_id: string;
  app_secret: string;
  gateway?: string;
  return_url?: string;
}

// 支付状态接口
export interface PaymentStatus {
  alipay_enabled: boolean;
  wechat_enabled: boolean;
  available_providers: string[];
}

// 支付配置详情接口
export interface PaymentConfigDetails {
  alipay: {
    enabled: boolean;
    configured: boolean;
    app_id: string;
    notify_url: string;
    app_private_key: string;
    alipay_public_key: string;
    has_private_key: boolean;
    has_public_key: boolean;
    description: string;
    created_at: string;
    updated_at: string;
  };
  wechat: {
    enabled: boolean;
    configured: boolean;
    app_id: string;
    mch_id: string;
    mch_serial_no: string;
    notify_url: string;
    api_v3_key: string;
    private_key_data: string;
    has_api_v3_key: boolean;
    has_private_key: boolean;
    description: string;
    created_at: string;
    updated_at: string;
  };
  epay: {
    enabled: boolean;
    configured: boolean;
    mch_id: string;
    key: string;
    gateway: string;
    notify_url: string;
    return_url: string;
    has_key: boolean;
    description: string;
    created_at: string;
    updated_at: string;
  };
  hupijiao: {
    enabled: boolean;
    configured: boolean;
    app_id: string;
    app_secret: string;
    gateway: string;
    notify_url: string;
    return_url: string;
    has_app_secret: boolean;
    description: string;
    created_at: string;
    updated_at: string;
  };
  available_providers: string[];
  provider_names: {
    [key: string]: string;
  };
}

// API响应包装接口
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

// 获取支付配置状态
export const getPaymentStatus = () => {
  return http.get<ApiResponse<PaymentStatus>, any>(
    baseUrlApi("pro/payment/status")
  );
};

// 获取支付配置详情
export const getPaymentConfigDetails = () => {
  return http.get<ApiResponse<PaymentConfigDetails>, any>(
    baseUrlApi("pro/payment/config/details")
  );
};

// 设置支付宝配置
export const setAlipayConfig = (config: AlipayConfig) => {
  return http.post(baseUrlApi("pro/payment/config/alipay"), config);
};

// 设置微信支付配置
export const setWechatConfig = (config: WechatConfig) => {
  return http.post(baseUrlApi("pro/payment/config/wechat"), config);
};

// 设置易支付配置
export const setEpayConfig = (config: EpayConfig) => {
  return http.post(baseUrlApi("pro/payment/config/epay"), config);
};

// 设置虎皮椒配置
export const setHupijiaoConfig = (config: HupijiaoConfig) => {
  return http.post(baseUrlApi("pro/payment/config/hupijiao"), config);
};

// 启用/禁用支付方式
export const toggleProvider = (
  provider: string,
  data: { enabled: boolean }
) => {
  return http.post(baseUrlApi(`pro/payment/config/${provider}/toggle`), data);
};

// 测试支付配置
export const testConfig = (provider: string) => {
  return http.post(baseUrlApi(`pro/payment/config/${provider}/test`));
};

// ===================================
//          付费文章相关接口
// ===================================

// 支付订单接口（前端只传支付宝或微信，后端自动选择通道）
export interface CreateOrderRequest {
  article_id: string;
  payment_provider: "ALIPAY" | "WECHAT";
  user_email?: string;
}

export interface CreateOrderResponse {
  order_no: string;
  amount: number;
  expire_time: string;
  payment_result: {
    payment_url?: string;
    qr_code?: string;
  };
}

export interface OrderStatusResponse {
  order_no: string;
  payment_status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  amount: number;
  pay_time?: string;
  expire_time: string;
  trade_no?: string;
  access_token?: string;
  share_id?: string; // 分享ID，用于验证订单是否属于当前分享
  article_id?: string; // 文章ID，用于验证订单是否属于当前文章
}

// 文章内容接口
export interface ArticleContentResponse {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  content_md?: string;
  content_html: string;
  content_markdown?: string; // 别名字段，用于兼容
  cover_url: string;
  status: ArticleStatus;
  view_count: number;
  word_count: number;
  abbrlink?: string;
  description?: string;
  summary?: string;
  owner_id: number;
  post_categories: any[];
  post_tags: any[];
  primary_color: string;
  summaries: any[];
  prev_article: any;
  next_article: any;
  related_articles: any[];
  has_paid_content: boolean;
  has_purchased: boolean;
  price: number;
  // 添加缺失的字段以兼容Article类型
  reading_time: number;
  home_sort: number;
  pin_sort: number;
  top_img_url: string;
  is_primary_color_manual: boolean;
  // 访问原因（如管理员权限、已购买等）
  access_reason?: string;
}

export interface ArticlePaymentInfoResponse {
  has_paid_content: boolean;
  has_purchased: boolean;
  price: number;
}

// 创建支付订单
export const createPaymentOrder = (data: CreateOrderRequest) => {
  return http.post<ApiResponse<CreateOrderResponse>, any>(
    baseUrlApi("pro/payment/order"),
    data
  );
};

// 查询订单状态
export const getOrderStatus = (orderNo: string) => {
  return http.get<ApiResponse<OrderStatusResponse>, any>(
    baseUrlApi(`pro/payment/order/${orderNo}`)
  );
};

// 强制查询订单状态（绕过缓存，用于调试）
export const forceQueryOrderStatus = (orderNo: string) => {
  return http.get<
    ApiResponse<
      OrderStatusResponse & { query_result?: string; force_query?: boolean }
    >,
    any
  >(baseUrlApi(`pro/payment/order/${orderNo}/force`));
};

// 根据第三方支付订单号查询订单状态
export const getOrderStatusByTradeNo = (tradeNo: string) => {
  return http.get<ApiResponse<OrderStatusResponse>, any>(
    baseUrlApi(`pro/payment/trade/${tradeNo}`)
  );
};

// 查询订单接口（用于查询订单弹窗）
export interface QueryOrderRequest {
  trade_no: string;
  email?: string;
}

export interface QueryOrderResponse extends OrderStatusResponse {
  article_id: string;
  article_title?: string;
}

// 根据第三方支付订单号查询订单详细信息（包含文章信息）
export const queryOrderByTradeNo = (data: QueryOrderRequest) => {
  return http.post<ApiResponse<QueryOrderResponse>, any>(
    baseUrlApi("pro/payment/query-order"),
    data
  );
};

// 获取文章内容
export const getArticleContent = (
  articleId: string,
  params?: {
    access_token?: string;
    user_email?: string;
  }
) => {
  // 修复：直接传递params对象，避免双重嵌套
  return http.get<ApiResponse<ArticleContentResponse>, any>(
    baseUrlApi(`pro/articles/${articleId}/content`),
    params
  );
};

// 获取文章付费信息
export const getArticlePaymentInfo = (articleId: string) => {
  return http.get<ApiResponse<ArticlePaymentInfoResponse>, any>(
    baseUrlApi(`pro/articles/${articleId}/payment-info`)
  );
};

// ===================================
//          分享付费相关接口
// ===================================

// 创建分享支付订单请求接口（前端只传支付宝或微信，后端自动选择通道）
export interface CreateShareOrderRequest {
  share_id: string;
  amount: number;
  payment_provider: "ALIPAY" | "WECHAT";
  user_email?: string;
}

// 创建分享支付订单响应接口（与文章订单响应相同）
export type CreateShareOrderResponse = CreateOrderResponse;

// 创建分享支付订单
export const createSharePaymentOrder = (data: CreateShareOrderRequest) => {
  return http.post<ApiResponse<CreateShareOrderResponse>, any>(
    baseUrlApi("pro/payment/share/order"),
    data
  );
};

// ===================================
//          密码保护内容相关接口
// ===================================

// 密码验证请求接口
export interface PasswordVerifyRequest {
  content_id: string;
  password: string;
}

// 密码验证响应接口
export interface PasswordVerifyResponse {
  success: boolean;
  content?: string;
  message?: string;
}

// 验证密码保护内容密码
export const verifyPasswordContent = (
  articleId: string,
  data: PasswordVerifyRequest
) => {
  return http.post<ApiResponse<PasswordVerifyResponse>, any>(
    baseUrlApi(`pro/articles/${articleId}/password-verify`),
    data
  );
};

// ===================================
//          管理员订单管理接口
// ===================================

// 订单管理查询参数
export interface OrderListParams {
  page?: number;
  page_size?: number;
  status?: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "EXPIRED";
  payment_provider?: "ALIPAY" | "WECHAT";
  user_email?: string;
  order_no?: string; // 系统订单号
  trade_no?: string; // 第三方交易号（支付宝/微信/易支付/虎皮椒）
  user_id?: number;
  start_date?: string;
  end_date?: string;
  sort_by?: "created_at" | "pay_time" | "amount" | "order_no";
  sort_order?: "asc" | "desc";
}

// 管理员订单信息
export interface AdminOrderInfo {
  id: number;
  order_no: string;
  article_id?: string; // 文章公共ID（文章购买）
  share_id?: string; // 分享公共ID（分享购买）
  user_id: string; // 用户公共ID（如果有）
  user_email: string;
  amount: number; // 金额（元）
  currency: string;
  payment_provider: string;
  payment_status: string;
  trade_no: string;
  pay_time: string;
  expire_time: string;
  client_ip: string;
  user_agent: string;
  created_at: string;
  updated_at: string;
}

// 管理员订单列表查询响应
export interface OrderListResponse {
  orders: AdminOrderInfo[];
  total: number;
  page: number;
  size: number;
}

// 获取订单列表（GET方式）
export const getOrderListForAdmin = (params: OrderListParams) => {
  return http.get<ApiResponse<OrderListResponse>, any>(
    baseUrlApi("pro/admin/orders"),
    params
  );
};

// 获取订单列表（POST方式）
export const getOrderListForAdminPost = (data: OrderListParams) => {
  return http.post<ApiResponse<OrderListResponse>, any>(
    baseUrlApi("pro/admin/orders/list"),
    data
  );
};

// 删除订单（软删除）
export const deleteOrder = (orderId: number) => {
  return http.request<ApiResponse<null>>(
    "delete",
    baseUrlApi(`pro/admin/orders/${orderId}`)
  );
};
