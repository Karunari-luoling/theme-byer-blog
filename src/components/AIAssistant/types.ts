/**
 * AI 助手类型定义
 */

// 搜索结果
export interface SearchResult {
  title: string;
  summary: string;
  url?: string;
  source_id?: number;
}

// 加载阶段
export type LoadingStage =
  | "understanding" // 理解问题中...
  | "searching" // 搜索知识库中...
  | "generating" // 生成回答中...
  | "done"; // 完成

// 消息
export interface Message {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
  loadingStage?: LoadingStage; // 加载阶段
  searchResults?: SearchResult[];
  query?: string; // 搜索模式的原始查询
  mode?: ChatMode; // 消息所属模式
}

// 模式
export type ChatMode = "chat" | "search";

// AI 助手配置
export interface AIAssistantConfig {
  name?: string;
  welcome?: string;
  chatSuggestions?: string[]; // 聊天模式预设问题
  searchSuggestions?: string[]; // 搜索模式预设问题
}
