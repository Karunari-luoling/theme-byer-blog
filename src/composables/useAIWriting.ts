/*
 * @Description: AI写作 composable
 * @Author: 安知鱼
 * @Date: 2025-12-12 00:00:00
 * @LastEditTime: 2025-12-16 14:41:24
 * @LastEditors: 安知鱼
 */

import { ref, type Ref } from "vue";
import { http } from "@/utils/http";
import { getToken, formatToken } from "@/utils/auth";
import { getSettingsApi } from "@/api/sys-settings";
import { constant } from "@/constant";

export interface AIWritingRequest {
  /** 写作主题或大纲 */
  topic: string;
  /** 写作风格 */
  style?: "professional" | "casual" | "academic" | "creative";
  /** 目标长度 */
  length?: "short" | "medium" | "long";
  /** 是否使用标签插件 */
  useTags?: boolean;
  /** 自定义提示词 */
  customPrompt?: string;
  /** 是否参考历史文章写作风格 */
  learnFromHistory?: boolean;
  /** 参考的历史文章数量 */
  historyArticleCount?: number;
  /** 历史文章样本内容 */
  historyArticleSamples?: string;
}

export interface AIWritingResponse {
  code: number;
  message: string;
  data: {
    content: string;
  };
}

export interface UseAIWritingOptions {
  /** 成功回调 */
  onSuccess?: (content: string) => void;
  /** 失败回调 */
  onError?: (error: Error) => void;
  /** 流式输出回调 */
  onStream?: (chunk: string) => void;
}

export const useAIWriting = (options: UseAIWritingOptions = {}) => {
  const { onSuccess, onError, onStream } = options;

  const isGenerating = ref(false);
  const generatedContent = ref("");
  let currentAbortController: AbortController | null = null;

  /**
   * 检查 AI 写作配置是否已设置
   */
  const checkAIConfig = async (): Promise<{
    valid: boolean;
    message?: string;
  }> => {
    try {
      const result = await getSettingsApi([
        constant.KeyAIWritingApiKey,
        constant.KeyAISummaryApiKey
      ]);
      if (result.code === 200) {
        // 优先使用 AI 写作配置，如果没有则使用 AI 摘要配置
        const writingApiKey = String(
          result.data[constant.KeyAIWritingApiKey] || ""
        );
        const summaryApiKey = String(
          result.data[constant.KeyAISummaryApiKey] || ""
        );

        if (
          (!writingApiKey || writingApiKey.trim() === "") &&
          (!summaryApiKey || summaryApiKey.trim() === "")
        ) {
          return {
            valid: false,
            message:
              "请先在「系统设置 → AI 配置」中配置 API Key 并点击「保存设置」按钮后再使用 AI 写作功能"
          };
        }
        return { valid: true };
      }
      return { valid: false, message: "获取 AI 配置失败，请稍后重试" };
    } catch (error) {
      console.error("检查 AI 配置失败:", error);
      return { valid: false, message: "获取 AI 配置失败，请稍后重试" };
    }
  };

  /**
   * 生成AI写作内容
   */
  const generate = async (
    request: AIWritingRequest
  ): Promise<string | null> => {
    if (isGenerating.value) {
      onError?.(new Error("正在生成中，请稍候..."));
      return null;
    }

    if (!request.topic || request.topic.trim() === "") {
      onError?.(new Error("请输入写作主题或大纲"));
      return null;
    }

    isGenerating.value = true;
    generatedContent.value = "";

    try {
      // 检查 AI 配置是否已设置
      const configCheck = await checkAIConfig();
      if (!configCheck.valid) {
        const error = new Error(configCheck.message!);
        onError?.(error);
        return null;
      }

      const response = await http.request<AIWritingResponse>(
        "post",
        "/api/pro/admin/ai/writing",
        {
          data: {
            topic: request.topic,
            style: request.style || "professional",
            length: request.length || "medium",
            use_tags: request.useTags !== false,
            custom_prompt: request.customPrompt || "",
            learn_from_history: request.learnFromHistory || false,
            history_article_count: request.historyArticleCount || 3,
            history_article_samples: request.historyArticleSamples || ""
          },
          timeout: 120000 // AI 写作需要较长时间，设置 120 秒超时
        }
      );

      if (response.code === 200 && response.data?.content) {
        const content = response.data.content;
        generatedContent.value = content;

        // 调用成功回调
        onSuccess?.(content);

        return content;
      } else {
        const errorMsg =
          response.message || "AI 写作生成失败，请检查配置后重试";
        const error = new Error(errorMsg);

        // 调用错误回调
        onError?.(error);

        return null;
      }
    } catch (error: any) {
      console.error("生成AI写作内容失败:", error);

      const errorMsg = error.message || "网络错误，请检查网络后重试";
      const wrappedError = new Error(errorMsg);

      // 调用错误回调
      onError?.(wrappedError);

      return null;
    } finally {
      isGenerating.value = false;
    }
  };

  /**
   * 流式生成AI写作内容
   */
  const generateStream = async (
    request: AIWritingRequest
  ): Promise<string | null> => {
    const totalStartTime = performance.now();
    console.log("[AI写作] ===== 开始流式生成 =====");
    console.log("[AI写作] 请求参数:", {
      topic:
        request.topic?.substring(0, 50) +
        (request.topic?.length > 50 ? "..." : ""),
      style: request.style,
      length: request.length,
      learnFromHistory: request.learnFromHistory
    });

    if (isGenerating.value) {
      onError?.(new Error("正在生成中，请稍候..."));
      return null;
    }

    if (!request.topic || request.topic.trim() === "") {
      onError?.(new Error("请输入写作主题或大纲"));
      return null;
    }

    isGenerating.value = true;
    generatedContent.value = "";

    try {
      // 检查 AI 配置是否已设置
      const configCheckStart = performance.now();
      const configCheck = await checkAIConfig();
      console.log(
        `[AI写作] 检查AI配置耗时: ${(performance.now() - configCheckStart).toFixed(0)}ms`
      );
      if (!configCheck.valid) {
        const error = new Error(configCheck.message!);
        onError?.(error);
        return null;
      }

      // 创建 AbortController 用于取消请求
      const controller = new AbortController();
      // 存储 controller 以便外部可以取消
      currentAbortController = controller;

      // 获取 token 用于认证
      const tokenData = getToken();
      const authHeader = tokenData?.accessToken
        ? formatToken(tokenData.accessToken)
        : "";

      const fetchStartTime = performance.now();
      console.log("[AI写作] 开始发起请求...");
      const response = await fetch("/api/pro/admin/ai/writing/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader
        },
        body: JSON.stringify({
          topic: request.topic,
          style: request.style || "professional",
          length: request.length || "medium",
          use_tags: request.useTags !== false,
          custom_prompt: request.customPrompt || "",
          learn_from_history: request.learnFromHistory || false,
          history_article_count: request.historyArticleCount || 3,
          history_article_samples: request.historyArticleSamples || ""
        }),
        signal: controller.signal
      });

      const responseTime = performance.now() - fetchStartTime;
      console.log(
        `[AI写作] 收到响应头耗时: ${responseTime.toFixed(0)}ms, 状态: ${response.status}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      let firstChunkTime: number | null = null;
      const streamStartTime = performance.now();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // 处理 SSE 格式的数据
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // 保留未完成的行

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // 处理事件类型
            if (trimmedLine.startsWith("event: ")) {
              const eventType = trimmedLine.slice(7);
              if (eventType === "done") {
                // 生成完成
                break;
              } else if (eventType === "error") {
                // 等待下一行的 data
                continue;
              }
            }

            // 处理数据
            if (trimmedLine.startsWith("data: ")) {
              const dataStr = trimmedLine.slice(6);
              try {
                const data = JSON.parse(dataStr);
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.content) {
                  if (firstChunkTime === null) {
                    firstChunkTime = performance.now();
                    console.log(
                      `[AI写作] 收到首个内容块耗时: ${(firstChunkTime - streamStartTime).toFixed(0)}ms (从响应头开始)`
                    );
                    console.log(
                      `[AI写作] 总等待时间(点击到首内容): ${(firstChunkTime - totalStartTime).toFixed(0)}ms`
                    );
                  }
                  fullContent += data.content;
                  generatedContent.value = fullContent;
                  // 调用流式输出回调
                  onStream?.(data.content);
                }
              } catch {
                // 忽略 JSON 解析错误，可能是空数据
              }
            }
          }
        }
      }

      currentAbortController = null;

      const totalTime = performance.now() - totalStartTime;
      console.log(`[AI写作] ===== 生成完成 =====`);
      console.log(
        `[AI写作] 总耗时: ${totalTime.toFixed(0)}ms, 生成字数: ${fullContent.length}`
      );

      // 调用成功回调
      onSuccess?.(fullContent);

      return fullContent;
    } catch (error: any) {
      console.error("流式生成AI写作内容失败:", error);

      // 如果是用户主动取消，不显示错误
      if (error.name === "AbortError") {
        return null;
      }

      const errorMsg = error.message || "网络错误，请重试";
      const wrappedError = new Error(errorMsg);

      // 调用错误回调
      onError?.(wrappedError);

      return null;
    } finally {
      isGenerating.value = false;
      currentAbortController = null;
    }
  };

  /**
   * 取消正在进行的生成
   */
  const cancelGeneration = () => {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
      isGenerating.value = false;
    }
  };

  /**
   * 检查是否可以生成内容
   */
  const canGenerate = (topic: string): boolean => {
    return !isGenerating.value && topic && topic.trim() !== "";
  };

  /**
   * 清除生成的内容
   */
  const clearContent = () => {
    generatedContent.value = "";
  };

  return {
    isGenerating: readonly(isGenerating),
    generatedContent: readonly(generatedContent),
    generate,
    generateStream,
    cancelGeneration,
    canGenerate,
    clearContent,
    checkAIConfig
  };
};

// 只读响应式对象的辅助函数
function readonly<T>(source: Ref<T>): Readonly<Ref<T>> {
  return source as Readonly<Ref<T>>;
}
