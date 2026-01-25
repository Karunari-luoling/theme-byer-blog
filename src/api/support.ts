/*
 * @Description: 售后工单 API
 * @Author: 安知鱼
 * @Date: 2025-01-04
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { BaseResponse } from "./post/type";

// ==================== 类型定义 ====================

/**
 * 工单状态类型
 */
export type TicketStatus = "OPEN" | "REPLIED" | "CLOSED";

/**
 * 发送者类型
 */
export type SenderType = "USER" | "ADMIN";

/**
 * 工单消息类型
 */
export interface TicketMessage {
  id: string;
  content: string;
  sender_type: SenderType;
  sender_id?: number;
  created_at: string;
}

/**
 * 工单数据类型
 */
export interface Ticket {
  id: string;
  ticket_no: string;
  trade_no: string;
  order_id?: number;
  user_id?: number;
  user_email?: string;
  subject: string;
  type?: string;
  status: TicketStatus;
  message_count?: number;
  last_reply_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 工单详情（包含消息列表）
 */
export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

/**
 * 创建工单请求
 */
export interface CreateTicketRequest {
  trade_no: string;
  user_email?: string;
  subject: string;
  content: string;
}

/**
 * 回复工单请求
 */
export interface ReplyTicketRequest {
  content: string;
}

/**
 * 工单列表请求
 */
export interface ListTicketsRequest {
  page: number;
  page_size: number;
  status?: string;
  type?: string;
  keyword?: string;
}

/**
 * 工单列表响应
 */
export interface ListTicketsResponse {
  list: Ticket[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 工单统计响应
 */
export interface TicketStatsResponse {
  pending: number;
  processing: number;
  closed: number;
  total: number;
}

// ==================== 用户端 API ====================

/**
 * 创建工单
 */
export const createTicketApi = (
  data: CreateTicketRequest
): Promise<BaseResponse<Ticket>> => {
  return http.request<BaseResponse<Ticket>>(
    "post",
    baseUrlApi("pro/support/tickets"),
    { data }
  );
};

/**
 * 获取工单详情
 */
export const getTicketApi = (
  id: string
): Promise<BaseResponse<TicketDetail>> => {
  return http.request<BaseResponse<TicketDetail>>(
    "get",
    baseUrlApi(`pro/support/tickets/${id}`)
  );
};

/**
 * 回复工单
 */
export const replyTicketApi = (
  id: string,
  data: ReplyTicketRequest
): Promise<BaseResponse<TicketMessage>> => {
  return http.request<BaseResponse<TicketMessage>>(
    "post",
    baseUrlApi(`pro/support/tickets/${id}/reply`),
    { data }
  );
};

/**
 * 获取我的工单列表
 */
export const listMyTicketsApi = (params: {
  page: number;
  page_size: number;
}): Promise<BaseResponse<ListTicketsResponse>> => {
  return http.request<BaseResponse<ListTicketsResponse>>(
    "get",
    baseUrlApi("pro/support/tickets/my"),
    { params }
  );
};

/**
 * 通过订单号获取工单
 * @param orderNo 订单号（第三方交易号）
 */
export const getTicketByOrderNoApi = (
  orderNo: string
): Promise<BaseResponse<TicketDetail>> => {
  return http.request<BaseResponse<TicketDetail>>(
    "get",
    baseUrlApi(`pro/support/tickets/order/${orderNo}`)
  );
};

// ==================== 管理端 API (需要管理员权限) ====================

/**
 * 获取工单列表（管理端）
 */
export const listTicketsAdminApi = (
  params: ListTicketsRequest
): Promise<BaseResponse<ListTicketsResponse>> => {
  return http.request<BaseResponse<ListTicketsResponse>>(
    "get",
    baseUrlApi("pro/admin/support/tickets"),
    { params }
  );
};

/**
 * 获取工单详情（管理端）
 */
export const getTicketAdminApi = (
  id: string
): Promise<BaseResponse<TicketDetail>> => {
  return http.request<BaseResponse<TicketDetail>>(
    "get",
    baseUrlApi(`pro/admin/support/tickets/${id}`)
  );
};

/**
 * 管理员回复工单
 */
export const replyTicketAdminApi = (
  id: string,
  data: ReplyTicketRequest
): Promise<BaseResponse<TicketMessage>> => {
  return http.request<BaseResponse<TicketMessage>>(
    "post",
    baseUrlApi(`pro/admin/support/tickets/${id}/reply`),
    { data }
  );
};

/**
 * 关闭工单
 */
export const closeTicketApi = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "post",
    baseUrlApi(`pro/admin/support/tickets/${id}/close`)
  );
};

/**
 * 更新工单状态
 */
export const updateTicketStatusApi = (
  id: string,
  status: string
): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "put",
    baseUrlApi(`pro/admin/support/tickets/${id}/status`),
    { data: { status } }
  );
};

/**
 * 获取工单统计
 */
export const getTicketStatsApi = (): Promise<
  BaseResponse<TicketStatsResponse>
> => {
  return http.request<BaseResponse<TicketStatsResponse>>(
    "get",
    baseUrlApi("pro/admin/support/tickets/stats")
  );
};

/**
 * 删除工单
 */
export const deleteTicketApi = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`pro/admin/support/tickets/${id}`)
  );
};
