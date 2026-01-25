import { nextTick, ref } from "vue";
import { simpleMarkdownParse, highlightCodeBlocks } from "@/utils/markdown";

/**
 * Markdown 解析 Hook - 复用评论区的解析逻辑
 */
export function useMarkdown() {
  // 内容容器 ref，用于代码高亮
  const contentRef = ref<HTMLElement | null>(null);

  /**
   * 解析 Markdown 内容
   */
  const parseMarkdown = (text: string): string => {
    return simpleMarkdownParse(text);
  };

  /**
   * 高亮容器内的代码块
   */
  const highlightCode = async () => {
    await nextTick();
    await highlightCodeBlocks(contentRef.value);
  };

  return {
    contentRef,
    parseMarkdown,
    highlightCode,
    // 保持兼容性的别名
    simpleMarkdownParse: parseMarkdown
  };
}
