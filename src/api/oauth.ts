/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-10-15 14:36:03
 * @LastEditTime: 2025-10-15 15:10:35
 * @LastEditors: 安知鱼
 */
import { http } from "@/utils/http";

/**
 * 标准API响应包装
 */
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/**
 * 授权URL数据
 */
export interface AuthorizeUrlData {
  authorize_url: string;
  state: string;
}

/**
 * OAuth回调数据
 */
export interface OAuthCallbackData {
  token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    provider: string;
    open_id: string;
    nickname: string;
    avatar: string;
    email: string;
  };
  is_new_user: boolean;
  need_binding: boolean;
}

/**
 * 彩虹聚合登录URL数据
 */
export interface RainbowAuthorizeData {
  url: string; // 彩虹聚合返回的登录跳转地址
  type: string; // 登录方式 (qq, wechat等)
  qrcode?: string; // 扫码地址（微信和支付宝返回）
}

/**
 * 获取OAuth授权URL
 * @param provider 提供商名称 (qq, logto, oidc, rainbow)
 * @param redirectUrl 登录成功后的重定向地址
 * @param loginType 彩虹聚合登录方式 (仅当provider为rainbow时需要)
 */
export const getAuthorizeUrl = (
  provider: string,
  redirectUrl: string,
  loginType?: string
) => {
  return http.request<ApiResponse<AuthorizeUrlData | RainbowAuthorizeData>>(
    "post",
    `/api/pro/oauth/${provider}/authorize`,
    {
      data: {
        redirect_url: redirectUrl,
        ...(loginType && { login_type: loginType })
      }
    }
  );
};

/**
 * 处理OAuth回调
 * @param provider 提供商名称
 * @param code 授权码
 * @param state 状态码（彩虹聚合登录不需要）
 * @param type 登录方式（仅彩虹聚合登录需要）
 */
export const handleOAuthCallback = (
  provider: string,
  code: string,
  state: string,
  type?: string
) => {
  return http.request<ApiResponse<OAuthCallbackData>>(
    "get",
    `/api/pro/oauth/${provider}/callback`,
    {
      params: {
        code,
        ...(state && { state }),
        ...(type && { type })
      }
    }
  );
};

/**
 * OAuth绑定信息
 */
export interface OAuthBindingInfo {
  id: number;
  provider: string;
  user_info: {
    nickname?: string;
    avatar?: string;
    email?: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * 获取当前用户的OAuth绑定列表
 */
export const getUserBindings = () => {
  return http.request<ApiResponse<OAuthBindingInfo[]>>(
    "get",
    "/api/pro/oauth/bindings"
  );
};

/**
 * 获取用于绑定的授权URL
 * @param provider 提供商名称 (qq, logto, oidc, rainbow)
 * @param redirectUrl 绑定成功后的重定向地址
 * @param loginType 彩虹聚合登录方式 (仅当provider为rainbow时需要)
 */
export const getBindAuthorizeUrl = (
  provider: string,
  redirectUrl: string,
  loginType?: string
) => {
  return http.request<ApiResponse<AuthorizeUrlData | RainbowAuthorizeData>>(
    "post",
    `/api/pro/oauth/${provider}/bind-authorize`,
    {
      data: {
        redirect_url: redirectUrl,
        ...(loginType && { login_type: loginType })
      }
    }
  );
};

/**
 * 绑定OAuth账号
 * @param provider 提供商名称
 * @param code 授权码
 * @param state 状态码（彩虹聚合登录不需要）
 * @param type 登录方式（仅彩虹聚合登录需要）
 */
export const bindOAuthAccount = (
  provider: string,
  code: string,
  state: string,
  type?: string
) => {
  return http.request<ApiResponse<null>>(
    "post",
    `/api/pro/oauth/${provider}/bind`,
    {
      params: {
        code,
        ...(state && { state }),
        ...(type && { type })
      }
    }
  );
};

/**
 * 解绑OAuth账号
 * @param provider 提供商名称
 */
export const unbindOAuthAccount = (provider: string) => {
  return http.request<ApiResponse<null>>(
    "delete",
    `/api/pro/oauth/${provider}/unbind`
  );
};

/**
 * 微信二维码数据
 */
export interface WechatQRCodeData {
  scene_id: string;
  qrcode_url: string;
  expire_at: number;
}

/**
 * 微信二维码状态
 */
export interface WechatQRCodeStatus {
  scene_id: string;
  scene_type: string;
  status: string; // pending, scanned, confirmed, expired
  open_id?: string;
  user_info?: {
    nickname?: string;
    avatar?: string;
  };
  expire_at: number;
}

/**
 * 生成微信登录二维码
 */
export const createWechatLoginQRCode = () => {
  return http.request<ApiResponse<WechatQRCodeData>>(
    "post",
    "/api/pro/wechat/qrcode/login"
  );
};

/**
 * 生成微信绑定二维码
 */
export const createWechatBindQRCode = () => {
  return http.request<ApiResponse<WechatQRCodeData>>(
    "post",
    "/api/pro/wechat/qrcode/bind"
  );
};

/**
 * 查询微信二维码状态
 * @param sceneId 场景ID
 */
export const getWechatQRCodeStatus = (sceneId: string) => {
  return http.request<ApiResponse<WechatQRCodeStatus>>(
    "get",
    `/api/pro/wechat/qrcode/${sceneId}/status`
  );
};
