/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-19 01:17:38
 * @LastEditTime: 2025-08-13 10:23:49
 * @LastEditors: 安知鱼
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { BaseResponse } from "./post/type";

// 即刻配置接口
export interface EssayConfig {
  title?: string;
  subtitle?: string;
  tips?: string;
  button_text?: string;
  button_link?: string;
  limit?: number;
  home_enable?: boolean;
  top_background?: string;
}

// 朋友圈配置接口
export interface MomentsConfig {
  enable?: boolean;
  title?: string;
  subtitle?: string;
  tips?: string;
  button_text?: string;
  button_link?: string;
  top_background?: string;
  fetch_interval?: number;
  max_items?: number;
  display_limit?: number;
  cache_duration?: number;
  rss_timeout?: number;
  enable_notify?: boolean;
  min_fetch_interval?: number;
}

// OAuth配置接口
export interface OAuthConfig {
  qq?: {
    enable?: boolean;
  };
  wechat?: {
    enable?: boolean;
  };
  logto?: {
    enable?: boolean;
    display_name?: string;
  };
  oidc?: {
    enable?: boolean;
    display_name?: string;
  };
  rainbow?: {
    enable?: boolean;
    api_url?: string;
    app_id?: string;
    login_methods?: string;
    callback_url?: string;
  };
}

// 天气时钟配置接口
export interface WeatherConfig {
  enable?: boolean;
  enable_page?: string;
  qweather_key?: string;
  qweather_api_host?: string;
  ip_api_key?: string;
  loading?: string;
  default_rectangle?: boolean;
  rectangle?: string;
}

// 作者信息配置接口
export interface AuthorConfig {
  enable?: boolean;
  description?: string;
  statusImg?: string;
  skills?: string[];
  social?: Record<string, { icon: string; link: string }>;
}

// 微信配置接口
export interface WechatConfig {
  enable?: boolean;
  face?: string;
  backFace?: string;
  blurBackground?: string;
}

// 标签配置接口
export interface TagsConfig {
  enable?: boolean;
  highlight?: string[];
}

// 网站信息配置接口
export interface SiteInfoConfig {
  totalPostCount?: number;
  runtimeEnable?: boolean;
  totalWordCount?: number;
}

// 自定义侧边栏配置接口
export interface CustomSidebarConfig {
  showInPost?: boolean;
}

// 目录配置接口
export interface TocConfig {
  collapseMode?: string | boolean;
}

// 文档侧边栏链接项接口
export interface DocSidebarLinkItem {
  title: string;
  link: string;
  icon: string;
  external: boolean;
}

// 文档模式侧边栏配置接口
export interface DocSidebarConfig {
  links?: DocSidebarLinkItem[];
}

// 系列文章配置接口
export interface SeriesConfig {
  postCount?: number;
}

// 侧边栏配置接口
export interface SidebarConfig {
  author?: AuthorConfig;
  wechat?: WechatConfig;
  weather?: WeatherConfig;
  tags?: TagsConfig;
  siteinfo?: SiteInfoConfig;
  custom?: CustomSidebarConfig;
  toc?: TocConfig;
  series?: SeriesConfig;
  doc?: DocSidebarConfig;
}

export type SiteConfig = {
  APP_NAME: string;
  APP_VERSION: string;
  ICP_NUMBER: string;
  USER_AVATAR: string;
  ABOUT_LINK: string;
  API_URL: string;
  SiteURL: string;
  ICON_URL: string;
  LOGO_HORIZONTAL_DAY: string;
  LOGO_HORIZONTAL_NIGHT: string;
  LOGO_URL: string;
  LOGO_URL_192x192: string;
  LOGO_URL_512x512: string;
  DEFAULT_THUMB_PARAM: string;
  DEFAULT_BIG_PARAM: string;
  KeySiteAnnouncement: string;
  // PRO 版嵌套配置（后端 unflatten 后的结构）
  essay?: EssayConfig;
  moments?: MomentsConfig;
  oauth?: OAuthConfig;
  sidebar?: SidebarConfig;
};

export type SiteConfigResult = {
  code: number;
  message: string;
  data: SiteConfig;
};

/** 获取站点配置 */
export const getSiteConfigApi = () => {
  return http.request<SiteConfigResult>(
    "get",
    baseUrlApi("public/site-config")
  );
};

/**
 * @description 发送测试邮件
 * @param to_email 接收测试邮件的目标邮箱地址
 */
export const sendTestEmail = (
  to_email: string
): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "post",
    baseUrlApi("settings/test-email"),
    {
      data: { to_email }
    }
  );
};
