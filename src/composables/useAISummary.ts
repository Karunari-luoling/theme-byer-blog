/*
 * @Description: AI摘要生成 composable
 * @Author: 安知鱼
 * @Date: 2025-09-15 00:00:00
 * @LastEditTime: 2025-09-15 00:00:00
 * @LastEditors: 安知鱼
 */

import { ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import { generateAISummary } from "@/api/post";
import { getSettingsApi } from "@/api/sys-settings";
import { constant } from "@/constant";

export interface UseAISummaryOptions {
  /** 最大摘要数量限制 */
  maxSummaryCount?: number;
  /** 成功回调 */
  onSuccess?: (summary: string) => void;
  /** 失败回调 */
  onError?: (error: Error) => void;
}

export const useAISummary = (options: UseAISummaryOptions = {}) => {
  const { maxSummaryCount = 3, onSuccess, onError } = options;

  const isGenerating = ref(false);

  /**
   * 从编辑器实例获取HTML内容
   * 兼容多种可能的HTML获取方法
   */
  const getHtmlFromEditor = (editorRef: Ref<any>): string => {
    if (!editorRef.value) {
      console.warn("[useAISummary] Editor ref is null");
      return "";
    }

    try {
      // 首先尝试我们自定义的getCurrentHtml方法（MarkdownEditor组件暴露的）
      if (
        editorRef.value.getCurrentHtml &&
        typeof editorRef.value.getCurrentHtml === "function"
      ) {
        const html = editorRef.value.getCurrentHtml();
        console.log("[useAISummary] 成功获取HTML内容，长度:", html.length);
        return html;
      }

      // 使用类型断言来访问可能存在的方法
      const editor = editorRef.value as any;

      // 尝试常见的HTML获取方法（向下兼容）
      if (editor.getHtmlValue && typeof editor.getHtmlValue === "function") {
        return editor.getHtmlValue();
      }
      if (editor.getHTML && typeof editor.getHTML === "function") {
        return editor.getHTML();
      }
      if (editor.getHtml && typeof editor.getHtml === "function") {
        return editor.getHtml();
      }
      // 如果有domToHtml方法
      if (editor.domToHtml && typeof editor.domToHtml === "function") {
        return editor.domToHtml();
      }
    } catch (error) {
      console.warn("从编辑器获取HTML内容失败:", error);
    }

    return "";
  };

  /**
   * 验证生成条件
   */
  const validateGenerationConditions = (
    htmlContent: string,
    summaries: string[],
    isGeneratingState: boolean
  ): { valid: boolean; message?: string } => {
    if (isGeneratingState) {
      return { valid: false, message: "正在生成中，请稍候..." };
    }

    if (!htmlContent || !htmlContent.trim()) {
      return { valid: false, message: "请先编写文章内容再生成摘要" };
    }

    if (summaries.length >= maxSummaryCount) {
      return { valid: false, message: `最多只能添加${maxSummaryCount}个摘要` };
    }

    return { valid: true };
  };

  /**
   * 检查 AI 配置是否已设置
   */
  const checkAIConfig = async (): Promise<{
    valid: boolean;
    message?: string;
  }> => {
    try {
      const result = await getSettingsApi([constant.KeyAISummaryApiKey]);
      if (result.code === 200) {
        const apiKey = result.data[constant.KeyAISummaryApiKey];
        if (!apiKey || apiKey.trim() === "") {
          return {
            valid: false,
            message:
              "请先在「系统设置 → AI 配置」中配置 API Key 后再使用 AI 摘要功能"
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
   * 生成AI摘要
   */
  const generate = async (
    htmlContent: string,
    summaries: string[]
  ): Promise<string | null> => {
    // 验证生成条件
    const validation = validateGenerationConditions(
      htmlContent,
      summaries,
      isGenerating.value
    );
    if (!validation.valid) {
      ElMessage.warning(validation.message!);
      return null;
    }

    isGenerating.value = true;

    try {
      // 检查 AI 配置是否已设置
      const configCheck = await checkAIConfig();
      if (!configCheck.valid) {
        ElMessage.warning(configCheck.message!);
        return null;
      }

      const result = await generateAISummary({
        complete_html: htmlContent
      });

      if (result.code === 200) {
        const aiSummary = result.data.summary;

        // 调用成功回调
        onSuccess?.(aiSummary);

        ElMessage.success("AI摘要生成成功");
        return aiSummary;
      } else {
        const errorMsg = result.message || "AI摘要生成失败";
        const error = new Error(errorMsg);

        // 调用错误回调
        onError?.(error);

        ElMessage.error(errorMsg);
        return null;
      }
    } catch (error: any) {
      console.error("生成AI摘要失败:", error);

      const errorMsg = error.message || "网络错误，请重试";
      const wrappedError = new Error(`生成AI摘要失败：${errorMsg}`);

      // 调用错误回调
      onError?.(wrappedError);

      ElMessage.error(wrappedError.message);
      return null;
    } finally {
      isGenerating.value = false;
    }
  };

  /**
   * 从编辑器生成AI摘要的便捷方法
   */
  const generateFromEditor = async (
    editorRef: Ref<any>,
    summaries: string[]
  ): Promise<string | null> => {
    const htmlContent = getHtmlFromEditor(editorRef);
    return generate(htmlContent, summaries);
  };

  /**
   * 检查是否可以生成摘要
   */
  const canGenerate = (htmlContent: string, summaries: string[]): boolean => {
    return validateGenerationConditions(
      htmlContent,
      summaries,
      isGenerating.value
    ).valid;
  };

  return {
    isGenerating: readonly(isGenerating),
    generate,
    generateFromEditor,
    getHtmlFromEditor,
    canGenerate,
    validateGenerationConditions
  };
};

// 只读响应式对象的辅助函数
function readonly<T>(source: Ref<T>): Readonly<Ref<T>> {
  return source as Readonly<Ref<T>>;
}
